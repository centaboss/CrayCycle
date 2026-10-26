import { useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Egg, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { Button, Empty, PageTitle, Pill, getBreederLabel } from '../components/UI';
import { readable } from '../lib/dates';
import { exportCSV, exportJSON } from '../lib/backup';
import type { FarmSnapshot } from '../lib/types';
interface Props{data:FarmSnapshot;editCycle:(id:string)=>void;}
export default function Records({data,editCycle}:Props){
  const total=data.cycles.length;
  const active=data.cycles.filter(c=>c.status==='active').length;
  const confirmed=data.cycles.filter(c=>Boolean(c.hatchOn)).length;
  const failed=data.cycles.filter(c=>c.status==='failed'||c.status==='cancelled').length;
  const juveniles=data.cycles.reduce((sum,c)=>sum+(c.juvenileCount||0),0);
  const chart=useMemo(()=>Array.from({length:6},(_,i)=>{
    const date=subMonths(new Date(),5-i),key=format(date,'yyyy-MM');
    return { month:format(date,'MMM'), 'Eggs observed':data.cycles.filter(c=>c.eggsObservedOn?.startsWith(key)).length, 'Confirmed hatches':data.cycles.filter(c=>c.hatchOn?.startsWith(key)).length };
  }),[data.cycles]);
  return <div className="page-content"><PageTitle eyebrow="FARM INSIGHTS" title="Breeding records" description="Observations-based activity and outcomes, never inflated by predicted dates." action={<div className="actions-row"><Button variant="secondary" onClick={()=>{void exportCSV();}}><FileSpreadsheet size={16}/> CSV</Button><Button onClick={()=>{void exportJSON();}}><Download size={16}/> Backup JSON</Button></div>}/>
    <div className="report-summary"><div><span>Total cycles</span><strong>{total}</strong><Egg size={19}/></div><div><span>Active broods</span><strong>{active}</strong><TrendingUp size={19}/></div><div><span>Confirmed hatches</span><strong>{confirmed}</strong><Egg size={19}/></div><div><span>Failed / cancelled</span><strong>{failed}</strong><TrendingUp size={19}/></div><div><span>Counted juveniles</span><strong>{juveniles}</strong><Egg size={19}/></div></div>
    <div className="dashboard-grid"><section className="surface-card chart-card"><div className="section-heading"><div><h2>Breeding activity</h2><p>Monthly observations · past 6 months</p></div><Pill color="teal">Recorded only</Pill></div>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} barSize={18} barGap={7}><CartesianGrid stroke="#e8f0ef" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#819493',fontSize:12}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:'#819493',fontSize:12}}/><Tooltip contentStyle={{borderRadius:12,border:'1px solid #e2eeeb'}}/><Bar dataKey="Eggs observed" fill="#38b9ac" radius={[5,5,0,0]}/><Bar dataKey="Confirmed hatches" fill="#fac985" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div><div className="chart-legend"><span><i className="chart-dot mint-dot"/>Eggs observed</span><span><i className="chart-dot amber-dot"/>Confirmed hatches</span></div>
    </section><section className="surface-card"><div className="section-heading"><div><h2>Recent outcomes</h2><p>Confirmed, unsuccessful and in-progress cycles</p></div></div>{!data.cycles.length?<Empty title="No results yet" description="Breeding cycles will appear after they are recorded."/>:<div className="outcome-list">{[...data.cycles].reverse().slice(0,6).map(c=><button key={c.id} className="outcome-row" onClick={()=>editCycle(c.id)}><div><strong>{getBreederLabel(data,c.breederId)} {c.isDemo?'· DEMO':''}</strong><span>{c.hatchOn?`Hatching: ${readable(c.hatchOn)}`:c.eggsObservedOn?`Eggs observed: ${readable(c.eggsObservedOn)}`:c.pairingOn?`Paired: ${readable(c.pairingOn)}`:'No dated observation'}</span></div><Pill color={c.status==='completed'?'green':c.status==='failed'?'red':c.status==='active'?'teal':'slate'}>{c.status}</Pill></button>)}</div>}</section></div>
    <section className="surface-card"><h2>Complete cycle register</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Breeder</th><th>Eggs first observed</th><th>Confirmed hatch</th><th>Recorded juveniles</th><th>Outcome</th><th></th></tr></thead><tbody>{data.cycles.map(c=><tr key={c.id}><td>{getBreederLabel(data,c.breederId)}</td><td>{readable(c.eggsObservedOn)}</td><td>{readable(c.hatchOn)}</td><td>{c.juvenileCount??'—'}</td><td><Pill color={c.status==='completed'?'green':c.status==='failed'?'red':'teal'}>{c.status}</Pill></td><td><button className="small-link" onClick={()=>editCycle(c.id)}>Open</button></td></tr>)}</tbody></table>{!data.cycles.length&&<Empty title="No cycles" description="New breeding records will appear here."/>}</div></section>
  </div>;
}
