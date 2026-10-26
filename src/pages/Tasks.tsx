import { useMemo, useState } from 'react';
import { Check, CircleCheck, Clock3, Edit3, Plus, Trash2 } from 'lucide-react';
import { Button, Empty, PageTitle, Pill, getBreederLabel } from '../components/UI';
import { isoToday, readable } from '../lib/dates';
import type { FarmSnapshot, FarmTask } from '../lib/types';
interface Props{data:FarmSnapshot;addTask:()=>void;editTask:(id:string)=>void;toggleTask:(id:string)=>void;deleteTask:(id:string)=>void;}
export default function Tasks({data,addTask,editTask,toggleTask,deleteTask}:Props){
  const [filter,setFilter]=useState<'all'|'overdue'|'pending'|'done'>('all');
  const today=isoToday();
  const tasks=useMemo(()=>data.tasks.filter(t=>filter==='all'||(filter==='overdue'?t.status==='pending'&&t.dueOn<today:t.status===filter)).sort((a,b)=>a.status.localeCompare(b.status)||a.dueOn.localeCompare(b.dueOn)),[data.tasks,filter,today]);
  const stats={pending:data.tasks.filter(t=>t.status==='pending').length,overdue:data.tasks.filter(t=>t.status==='pending'&&t.dueOn<today).length,done:data.tasks.filter(t=>t.status==='done').length};
  const taskClass=(t:FarmTask)=>t.status==='done'?'done':t.dueOn<today?'late':'';
  return <div className="page-content"><PageTitle eyebrow="CARE CHECKLIST" title="Tasks & reminders" description="Offline in-app reminders for inspecting broods and caring for juveniles." action={<Button onClick={addTask}><Plus size={17}/> Schedule task</Button>}/>
    <div className="task-summary"><div><Clock3 size={19}/><strong>{stats.pending}</strong><span>Pending</span></div><div><span className="red-ink"><Clock3 size={19}/></span><strong>{stats.overdue}</strong><span>Overdue</span></div><div><CircleCheck size={19}/><strong>{stats.done}</strong><span>Completed</span></div></div>
    <div className="surface-card"><div className="filter-pills">{(['all','pending','overdue','done'] as const).map(f=><button key={f} className={filter===f?'filter-pill active':'filter-pill'} onClick={()=>setFilter(f)}>{f==='done'?'Completed':f[0].toUpperCase()+f.slice(1)}</button>)}</div>
      {!tasks.length?<Empty title="No matching tasks" description="Add a task or switch the filter to see other reminders."/>:<div className="tasks-list">{tasks.map(t=><div key={t.id} className={`task-row ${taskClass(t)}`}><button className={`task-complete ${t.status==='done'?'checked':''}`} aria-label={`Mark ${t.title} ${t.status==='done'?'pending':'done'}`} onClick={()=>toggleTask(t.id)}>{t.status==='done'&&<Check size={15}/>}</button><div className="task-row-content"><div className="task-title-line"><strong>{t.title}</strong>{t.priority==='high'&&<Pill color="red">High priority</Pill>}</div><p>{getBreederLabel(data,t.breederId)}{t.isDemo?' · DEMO':''}{t.notes&&` · ${t.notes}`}</p></div><div className="task-row-side"><span>{readable(t.dueOn)} {t.dueTime||''}</span>{t.status==='pending'&&t.dueOn<today&&<Pill color="red">Overdue</Pill>}</div><div className="inline-buttons"><button aria-label="Edit task" onClick={()=>editTask(t.id)}><Edit3 size={17}/></button><button aria-label="Delete task" onClick={()=>deleteTask(t.id)}><Trash2 size={17}/></button></div></div>)}</div>}
    </div><p className="hint-text">Reminders appear inside CrayCycle when you open it. Background push alerts are not guaranteed while your browser is closed.</p>
  </div>;
}
