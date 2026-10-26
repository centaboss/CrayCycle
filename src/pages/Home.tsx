import { addDays, isWithinInterval, parseISO } from 'date-fns';
import { ArrowRight, CalendarCheck2, CalendarDays, ChevronRight, CircleAlert, ClipboardList, Egg, Plus, Sprout } from 'lucide-react';
import { Button, Empty, PageTitle, Pill, getBreederLabel } from '../components/UI';
import { estimateHatching, isoToday, readable, shortDate } from '../lib/dates';
import type { FarmSnapshot, Page } from '../lib/types';

interface Props { data:FarmSnapshot; navigate:(page:Page)=>void; addBreeder:()=>void; addCycle:()=>void; editTask:(id:string)=>void; }
export default function Home({data,navigate,addBreeder,addCycle,editTask}:Props) {
  const today=isoToday();
  const active=data.cycles.filter(c=>c.status==='active');
  const eggBearing=active.filter(c=>Boolean(c.eggsObservedOn || c.eggLayingOn) && !c.hatchOn);
  const windows=eggBearing.map(c=>({cycle:c,breeder:data.breeders.find(b=>b.id===c.breederId)}))
    .map(o=>({...o,est:o.breeder?estimateHatching(o.cycle,o.breeder.species,data.settings):null}))
    .filter(o=>o.est && o.est.latest>=today).sort((a,b)=>(a.est!.earliest).localeCompare(b.est!.earliest));
  const dueToday=data.tasks.filter(t=>t.status==='pending'&&t.dueOn===today);
  const overdue=data.tasks.filter(t=>t.status==='pending'&&t.dueOn<today);
  const recent=data.cycles.filter(c=>c.status==='completed').length;
  const coming=windows.filter(w=>isWithinInterval(parseISO(w.est!.earliest),{start:parseISO(today),end:addDays(parseISO(today),30)}) || (w.est!.earliest<today && w.est!.latest>=today)).length;
  const upcoming=[...data.tasks.filter(t=>t.status==='pending'&&t.dueOn>=today)].sort((a,b)=>a.dueOn.localeCompare(b.dueOn)).slice(0,4);
  return <div className="page-content">
    <PageTitle eyebrow="FARM OVERVIEW" title="Good day, grower!" description="Your breeding records and today's priorities, all in one place." action={<div className="actions-row"><Button variant="secondary" onClick={addBreeder}><Plus size={17}/> Add breeder</Button><Button onClick={addCycle}><Egg size={17}/> Record breeding</Button></div>}/>
    {data.breeders.some(b=>b.isDemo) && <div className="demo-notice"><strong>DEMO DATA</strong> Sample breeders and breeding cycles are preloaded for testing. New entries are saved separately.</div>}
    <div className="welcome-banner"><div><div className="welcome-kicker">YOUR FARM AT A GLANCE</div><h2>Every clutch has a story.</h2><p>Stay on top of egg observations, hatch windows, and daily care — even when you're offline.</p><button onClick={()=>navigate('calendar')} className="banner-link">Open breeding calendar <ArrowRight size={16}/></button></div><div className="banner-mark" aria-hidden="true"><CalendarDays size={87} strokeWidth={1.3}/><span className="banner-orbit">✦</span></div></div>
    <div className="stats-grid">
      <div className="stat-card"><span className="stat-icon mint"><Sprout size={21}/></span><span className="stat-number">{data.breeders.length}</span><span className="stat-label">Registered females</span><small>Total breeder profiles</small></div>
      <div className="stat-card"><span className="stat-icon amber"><Egg size={21}/></span><span className="stat-number">{eggBearing.length}</span><span className="stat-label">Egg-bearing females</span><small>Observed, not estimated</small></div>
      <div className="stat-card"><span className="stat-icon sky"><CalendarCheck2 size={21}/></span><span className="stat-number">{coming}</span><span className="stat-label">Hatch windows</span><small>Overlapping next 30 days</small></div>
      <div className="stat-card"><span className="stat-icon coral"><CircleAlert size={21}/></span><span className="stat-number">{overdue.length}</span><span className="stat-label">Overdue tasks</span><small>{dueToday.length} task(s) due today</small></div>
    </div>
    <div className="dashboard-grid">
      <section className="surface-card"><div className="section-heading"><div><h2>Upcoming hatch windows</h2><p>Planning estimates based on observed records</p></div><button className="text-link" onClick={()=>navigate('calendar')}>Calendar <ChevronRight size={16}/></button></div>
        {!windows.length?<Empty title="No upcoming estimates" description="Record eggs for an active breeder to calculate a hatch window."/>:
          <div className="event-list">{windows.slice(0,4).map(({cycle,breeder,est})=><div className="hatch-row" key={cycle.id}><span className="row-icon teal"><Egg size={19}/></span><div className="row-main"><strong>{breeder?.code} <span className="muted-text">{breeder?.nickname||''}</span></strong><span>{data.tanks.find(t=>t.id===breeder?.tankId)?.name||'Unassigned'} · {est?.provisional?'Provisional window':'Egg-laying date known'} {cycle.isDemo?'· DEMO':''}</span></div><div className="row-date"><b>{shortDate(est?.earliest)} – {shortDate(est?.latest)}</b><small>Estimated only</small></div></div>)}</div>}
        <div className="section-footnote">Incubation estimates are not confirmation that hatching occurred.</div>
      </section>
      <section className="surface-card"><div className="section-heading"><div><h2>Tasks to keep an eye on</h2><p>{dueToday.length} due today · {overdue.length} overdue</p></div><button className="text-link" onClick={()=>navigate('tasks')}>All tasks <ChevronRight size={16}/></button></div>
        {!(overdue.length||upcoming.length)?<Empty title="All caught up" description="Schedule an inspection to see it here."/>:<div className="event-list">{[...overdue.sort((a,b)=>a.dueOn.localeCompare(b.dueOn)).slice(0,2),...upcoming].slice(0,5).map(t=><button className="task-preview" key={t.id} onClick={()=>editTask(t.id)}><span className={`task-checkbox ${t.dueOn<today?'overdue':''}`}></span><span className="task-content"><strong>{t.title}</strong><small>{getBreederLabel(data,t.breederId)} {t.isDemo?'· DEMO':''}</small></span><span className="task-preview-date">{t.dueOn<today?<Pill color="red">Overdue</Pill>:<span>{readable(t.dueOn)}</span>}</span></button>)}</div>}
        <button className="mini-action" onClick={()=>navigate('tasks')}><ClipboardList size={16}/> Manage all tasks <ArrowRight size={14}/></button>
      </section>
    </div>
    <div className="insight-bar"><div><strong>{recent}</strong><span>Completed breeding cycles</span></div><div><strong>{data.cycles.filter(c=>c.hatchOn).length}</strong><span>Observed confirmed hatchings</span></div><div><strong>{data.cycles.reduce((sum,c)=>sum+(c.juvenileCount||0),0)}</strong><span>Recorded juveniles</span></div></div>
  </div>;
}
