import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit3, Egg, Plus, Search, Trash2, Waves } from 'lucide-react';
import { Button, Empty, PageTitle, Pill } from '../components/UI';
import { estimateHatching, readable } from '../lib/dates';
import type { Breeder, Cycle, FarmSnapshot } from '../lib/types';

interface Props {data:FarmSnapshot;openBreeder:(id?:string)=>void;openCycle:(breederId?:string,cycleId?:string)=>void;deleteBreeder:(id:string)=>void;deleteCycle:(id:string)=>void;}
export default function Breeders({data,openBreeder,openCycle,deleteBreeder,deleteCycle}:Props){
  const [search,setSearch]=useState('');const [tankFilter,setTankFilter]=useState('all');const [selectedId,setSelectedId]=useState<string|null>(null);
  useEffect(()=>{if(selectedId&&!data.breeders.find(b=>b.id===selectedId))setSelectedId(null);},[data.breeders,selectedId]);
  const results=useMemo(()=>data.breeders.filter(b=>(tankFilter==='all'||b.tankId===tankFilter)&&`${b.code} ${b.nickname} ${b.species}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.code.localeCompare(b.code)),[search,tankFilter,data.breeders]);
  const selected=data.breeders.find(b=>b.id===selectedId);
  const activeCycle=(breeder:Breeder)=>data.cycles.find(c=>c.breederId===breeder.id&&c.status==='active');
  const statusLabel=(cycle?:Cycle)=>!cycle?'Available':cycle.nurseryOn?'Nursery transfer':cycle.independentOn?'Independent juveniles':cycle.attachedOn?'Attached juveniles':cycle.hatchOn?'Hatched':cycle.eggsObservedOn?'Eggs observed':'Pairing recorded';
  return <div className="page-content"><PageTitle eyebrow="FARM REGISTRY" title="Female breeders" description="Keep each breeder's history, tank assignment, and brood observations organized." action={<Button onClick={()=>openBreeder()}><Plus size={17}/> Add breeder</Button>}/>
    {selected?<div className="breeder-detail"><button className="back-link" onClick={()=>setSelectedId(null)}><ArrowLeft size={17}/> All breeders</button>
      <div className="detail-hero"><div className="detail-avatar"><Egg size={38}/></div><div className="detail-hero-main"><span className="eyebrow">FEMALE BREEDER PROFILE</span><h2>{selected.code} <span>{selected.nickname}</span></h2><p>{selected.species} · {data.tanks.find(t=>t.id===selected.tankId)?.name||'No tank'}</p><Pill color={activeCycle(selected)?'yellow':'green'}>{statusLabel(activeCycle(selected))}</Pill> {selected.isDemo&&<Pill color="slate">Demo data</Pill>}</div><div className="detail-actions"><Button variant="secondary" onClick={()=>openBreeder(selected.id)}><Edit3 size={16}/> Edit</Button><Button variant="danger" onClick={()=>deleteBreeder(selected.id)}><Trash2 size={16}/> Delete</Button></div></div>
      <div className="detail-two-column"><section className="surface-card"><div className="section-heading"><div><h2>Breeding history</h2><p>{data.cycles.filter(c=>c.breederId===selected.id).length} recorded cycle(s)</p></div><Button onClick={()=>openCycle(selected.id)}><Plus size={16}/> New cycle</Button></div>
        {data.cycles.filter(c=>c.breederId===selected.id).length===0?<Empty title="No breeding cycle yet" description="Start a cycle after observing a pairing or egg-related event."/>:data.cycles.filter(c=>c.breederId===selected.id).map(c=>{
          const est=estimateHatching(c,selected.species,data.settings);
          return <div className="cycle-detail" key={c.id}><div className="cycle-detail-top"><Pill color={c.status==='active'?'teal':c.status==='completed'?'green':c.status==='failed'?'red':'slate'}>{c.status}</Pill><div className="actions-row"><button className="small-link" onClick={()=>openCycle(selected.id,c.id)}>Edit observations</button><button className="small-link danger-text" onClick={()=>deleteCycle(c.id)}>Delete</button></div></div><div className="cycle-dates"><div><small>Pairing</small><b>{readable(c.pairingOn)}</b></div><div><small>Eggs first seen</small><b>{readable(c.eggsObservedOn)}</b></div><div><small>Hatching observed</small><b>{readable(c.hatchOn)}</b></div></div>
              {!est && (c.eggsObservedOn || c.eggLayingOn) && !c.hatchOn && <div className="estimate-note">Set an incubation reference for this species in Settings to show a hatch window.</div>}
              {est&&<div className="estimate-note"><Egg size={16}/><span>Estimated hatch window: <b>{readable(est.earliest)} – {readable(est.latest)}</b> {est.provisional?'(provisional; egg-laying date unknown)':'(dated from known egg laying)'}</span></div>}
              {c.independentOn&&<p className="cycle-info">Juvenile independence: {readable(c.independentOn)}</p>}
              {typeof c.juvenileCount==='number'&&<p className="cycle-info">Counted juveniles: {c.juvenileCount}</p>}
              {c.notes&&<p className="cycle-note">{c.notes}</p>}
            </div>;
        })}</section><section className="surface-card"><h2>Breeder details</h2><div className="profile-facts"><div><span>Breeder ID</span><strong>{selected.code}</strong></div><div><span>Species</span><strong>{selected.species}</strong></div><div><span>Tank</span><strong>{data.tanks.find(t=>t.id===selected.tankId)?.name||'Unassigned'}</strong></div><div><span>Age</span><strong>{selected.ageMonths?`${selected.ageMonths} months`:'Unknown'}</strong></div><div><span>Registered</span><strong>{readable(selected.registeredOn)}</strong></div></div><h3 className="notes-title">Notes</h3><p className="muted-text">{selected.notes||'No notes added yet.'}</p></section></div>
    </div>:<>
      <div className="toolbar"><label className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by breeder ID, name or species"/></label><select aria-label="Filter by tank" value={tankFilter} onChange={e=>setTankFilter(e.target.value)}><option value="all">All tanks</option>{data.tanks.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></div>
      {!results.length?<Empty title="No breeders found" description="Try a different search or add your first female breeder." action={<Button onClick={()=>openBreeder()}><Plus size={16}/> Add breeder</Button>}/>:<div className="breeder-grid">{results.map(b=>{const cycle=activeCycle(b);return <button key={b.id} className="breeder-card" onClick={()=>setSelectedId(b.id)}><div className="breeder-card-top"><span className="breeder-avatar"><Egg size={26}/></span><Pill color={cycle?.eggsObservedOn&&!cycle.hatchOn?'yellow':'teal'}>{statusLabel(cycle)}</Pill></div><strong>{b.code}</strong><h3>{b.nickname||'Unnamed female'}</h3><p className="species-label">{b.species}</p><div className="breeder-card-bottom"><span><Waves size={15}/>{data.tanks.find(t=>t.id===b.tankId)?.name||'No tank'}</span>{b.isDemo&&<small>DEMO</small>}</div></button>})}</div>}
    </>}
  </div>;
}
