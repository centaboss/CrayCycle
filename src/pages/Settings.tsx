import { useRef, useState, type FormEvent } from 'react';
import { CloudOff, DatabaseBackup, Download, HardDrive, Plus, RefreshCw, ShieldAlert, Smartphone, Upload, Waves } from 'lucide-react';
import { Button, Field, PageTitle, Pill } from '../components/UI';
import { db, newId, removeDemoData } from '../lib/db';
import { ensureSettings, seedDemoData } from '../lib/seed';
import { exportJSON, importJSON } from '../lib/backup';
import type { FarmSnapshot } from '../lib/types';
import type { SaveHandler } from '../components/Forms';
interface Props{data:FarmSnapshot;onSave:SaveHandler;}
export default function Settings({data,onSave}:Props){
  const [tankName,setTankName]=useState('');const [drafts,setDrafts]=useState<Record<string,[number,number]>>({});
  const [busy,setBusy]=useState(false);const importRef=useRef<HTMLInputElement>(null);
  const submitTank=async(e:FormEvent)=>{e.preventDefault();if(!tankName.trim())return;await onSave(()=>db.tanks.add({id:newId(),name:tankName.trim()}),'Tank added.');setTankName('');};
  const submitIncubation=async(species:string, min:number, max:number)=>{
    if(!Number.isInteger(min)||!Number.isInteger(max)||min<1||max>365||min>max)return alert('Enter a valid range of 1–365 days with minimum ≤ maximum.');
    await onSave(()=>db.settings.put({species,minDays:min,maxDays:max}),'Incubation reference saved.');
  };
  const restore=async(file?:File)=>{
    if(!file)return;
    if(!confirm('Restore this backup and REPLACE all records on this device? Export your current data first. This cannot be undone.')) {if(importRef.current)importRef.current.value='';return;}
    setBusy(true);
    try{await onSave(()=>importJSON(file),'Backup restored.');await ensureSettings();}
    finally{setBusy(false);if(importRef.current)importRef.current.value='';}
  };
  const reseed=async()=>{
    if(!confirm('Reset only the provided DEMO records? Your personal entries will be kept.'))return;
    setBusy(true);try{await onSave(async()=>{await removeDemoData();await seedDemoData();},'Demo data regenerated. Personal records preserved.');}finally{setBusy(false);}
  };
  return <div className="page-content"><PageTitle eyebrow="APPLICATION SETTINGS" title="Farm settings" description="Manage your reference ranges, tanks, local backups, and offline installation."/>
    <div className="settings-grid"><section className="surface-card"><div className="settings-section-head"><span className="settings-icon"><Waves size={20}/></span><div><h2>Tank & pond locations</h2><p>Assign breeders to their current tank.</p></div></div><div className="tank-list">{data.tanks.map(t=><div key={t.id} className="tank-row"><span><Waves size={16}/>{t.name}</span>{t.isDemo?<Pill color="slate">Demo</Pill>:<Pill color="green">Custom</Pill>}</div>)}</div><form onSubmit={submitTank} className="inline-form"><input placeholder="New tank name" value={tankName} onChange={e=>setTankName(e.target.value)} required maxLength={80}/><Button type="submit"><Plus size={16}/> Add</Button></form></section>
      <section className="surface-card"><div className="settings-section-head"><span className="settings-icon"><DatabaseBackup size={20}/></span><div><h2>Incubation reference</h2><p>Editable planning assumptions by species.</p></div></div><div className="info-strip">These ranges are approximate planning references. Actual conditions vary; never mark hatching automatically.</div>
      {data.settings.map(setting=>{const current=drafts[setting.species]||[setting.minDays,setting.maxDays];return <div key={setting.species} className="species-setting"><strong>{setting.species}</strong><div className="range-fields"><Field label="Earliest (days)"><input type="number" min={1} max={365} value={current[0]} onChange={e=>setDrafts(d=>({...d,[setting.species]:[Number(e.target.value),current[1]]}))}/></Field><Field label="Latest (days)"><input type="number" min={1} max={365} value={current[1]} onChange={e=>setDrafts(d=>({...d,[setting.species]:[current[0],Number(e.target.value)]}))}/></Field><Button variant="secondary" onClick={()=>{void submitIncubation(setting.species,...current);}}>Save</Button></div></div>})}
      <div className="species-setting"><strong>Add species-specific reference</strong><SpeciesAdder data={data} onSave={onSave}/></div></section>
      <section className="surface-card"><div className="settings-section-head"><span className="settings-icon"><HardDrive size={20}/></span><div><h2>Offline records & backups</h2><p>Everything is saved on this device's browser storage.</p></div></div><div className="offline-points"><div><CloudOff size={17}/> After installation, core screens and records work offline.</div><div><Smartphone size={17}/> Records do not automatically sync between devices.</div><div><ShieldAlert size={17}/> Clearing browser site data may permanently delete local records.</div></div><div className="actions-row wrap-actions"><Button onClick={()=>{void exportJSON();}}><Download size={16}/> Export backup</Button><Button variant="secondary" onClick={()=>importRef.current?.click()} disabled={busy}><Upload size={16}/> Restore JSON</Button><input aria-label="Select backup" hidden ref={importRef} type="file" accept=".json,application/json" onChange={e=>{void restore(e.target.files?.[0]);}}/></div><p className="hint-text">Restoring a JSON backup <b>replaces</b> all current local records. Export a backup before restoring.</p></section>
      <section className="surface-card"><div className="settings-section-head"><span className="settings-icon"><RefreshCw size={20}/></span><div><h2>Demo data</h2><p>Eight example females, three tanks, tasks and brood records.</p></div></div><p className="muted-text">Demo data is labeled throughout the app. Regenerating the demo removes and recreates only sample entries, preserving user-entered records.</p><Button variant="secondary" disabled={busy} onClick={()=>{void reseed();}}><RefreshCw size={16}/> Regenerate demo data</Button></section>
    </div>
  </div>;
}
function SpeciesAdder({data,onSave}:{data:FarmSnapshot;onSave:SaveHandler}){
  const [name,setName]=useState('');const [min,setMin]=useState(42);const [max,setMax]=useState(70);
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!name.trim()||data.settings.some(s=>s.species.toLowerCase()===name.trim().toLowerCase()))return alert('Enter a unique species name.');if(min<1||max>365||min>max)return alert('Enter a valid day range.');await onSave(()=>db.settings.add({species:name.trim(),minDays:min,maxDays:max}),'Species reference added.');setName('');};
  return <form onSubmit={submit} className="inline-form wrap-actions"><input placeholder="Scientific species name" value={name} required onChange={e=>setName(e.target.value)} maxLength={100}/><input className="small-number" type="number" min={1} max={365} aria-label="Minimum days" value={min} onChange={e=>setMin(Number(e.target.value))}/><input className="small-number" type="number" min={1} max={365} aria-label="Maximum days" value={max} onChange={e=>setMax(Number(e.target.value))}/><Button type="submit"><Plus size={16}/> Add</Button></form>;
}
