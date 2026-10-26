import { useMemo, useState } from 'react';
import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Edit3, Plus } from 'lucide-react';
import { Button, Empty, EVENT_COLORS, EVENT_LABELS, PageTitle, Pill, StageIcon } from '../components/UI';
import { calendarEvents, eventsForDate } from '../lib/events';
import { isoToday, localISO, readable } from '../lib/dates';
import type { CalendarEvent, EventType, FarmSnapshot } from '../lib/types';
interface Props { data:FarmSnapshot;addEvent:(date:string)=>void;editEvent:(id:string)=>void;addTask:(date:string)=>void;editTask:(id:string)=>void;editCycle:(id:string)=>void;toggleTask:(id:string)=>void;}
type View='month'|'week'|'day';
export default function Calendar({data,addEvent,editEvent,addTask,editTask,editCycle,toggleTask}:Props) {
  const [view,setView]=useState<View>('month');
  const [cursor,setCursor]=useState(parseISO(isoToday()));
  const [selected,setSelected]=useState(isoToday());
  const [breeder,setBreeder]=useState('all');
  const [tank,setTank]=useState('all');
  const [type,setType]=useState('all');
  const all=useMemo(()=>calendarEvents(data),[data]);
  const breederTanks=useMemo(()=>new Map(data.breeders.map(b=>[b.id,b.tankId])),[data.breeders]);
  const filtered=useMemo(()=>all.filter(e=>(breeder==='all'||e.breederId===breeder)&&(tank==='all'||(e.breederId?breederTanks.get(e.breederId)===tank:e.tankId===tank))&&(type==='all'||e.type===type)),[all,breeder,tank,type,breederTanks]);
  const monthDays=useMemo(()=>eachDayOfInterval({start:startOfWeek(startOfMonth(cursor),{weekStartsOn:1}),end:endOfWeek(endOfMonth(cursor),{weekStartsOn:1})}),[cursor]);
  const weekDays=useMemo(()=>eachDayOfInterval({start:startOfWeek(cursor,{weekStartsOn:1}),end:endOfWeek(cursor,{weekStartsOn:1})}),[cursor]);
  const selectDate=(date:string)=>{setSelected(date);setCursor(parseISO(date));};
  const shift=(delta:number)=>{const next=view==='month'?addMonths(cursor,delta):view==='week'?addWeeks(cursor,delta):addDays(cursor,delta);setCursor(next);setSelected(localISO(next));};
  const today=()=>selectDate(isoToday());
  const dayEvents=eventsForDate(filtered,selected).sort((a,b)=>{
    const rank=(e:CalendarEvent)=>e.type==='inspection'?1:0;return rank(a)-rank(b);
  });
  const title=view==='month'?format(cursor,'MMMM yyyy'):view==='week'?`${format(weekDays[0],'MMM d')} – ${format(weekDays[6],'MMM d, yyyy')}`:format(cursor,'MMMM d, yyyy');
  const renderDay=(date:Date,isMonth:boolean)=>{
    const key=localISO(date);const events=eventsForDate(filtered,key);const windowExists=events.some(e=>e.type==='hatch-window');
    return <button key={key} className={`calendar-cell ${isMonth&&!isSameMonth(date,cursor)?'out-month':''} ${key===selected?'selected':''} ${key===isoToday()?'is-today':''}`} onClick={()=>selectDate(key)} aria-label={`${readable(key)}, ${events.length} events`}>
      <span className="calendar-date">{format(date,'d')}{key===isoToday()&&<span className="today-mark"/>}</span>
      <div className="calendar-pills">{events.slice(0,isMonth?2:4).map(e=><span className={`calendar-event-label cal-${EVENT_COLORS[e.type]}`} key={e.id} title={`${e.title}: ${e.subtitle}`}>{e.type==='hatch-window'?'↔ ':''}{e.title}</span>)}{events.length>(isMonth?2:4)&&<span className="more-events">+{events.length-(isMonth?2:4)} more</span>}</div>
      {windowExists&&<span className="window-line"/>}
    </button>;
  };
  const eventAction=(e:CalendarEvent)=>{
    if(e.taskId) editTask(e.taskId);
    else if(e.manualEventId)editEvent(e.manualEventId);
    else if(e.cycleId)editCycle(e.cycleId);
  };
  return <div className="page-content calendar-page"><PageTitle eyebrow="BREEDING PLANNER" title="Breeding calendar" description="A clear timeline of observed stages, scheduled care, and estimated hatch windows." action={<div className="actions-row"><Button variant="secondary" onClick={()=>addTask(selected)}><Plus size={16}/> Task</Button><Button onClick={()=>addEvent(selected)}><Plus size={16}/> Event</Button></div>}/>
    <div className="calendar-toolbar"><div className="calendar-navigation"><span className="calendar-navigation-icon"><CalendarDays size={20}/></span><h2>{title}</h2><button className="icon-button" aria-label="Previous" onClick={()=>shift(-1)}><ChevronLeft size={19}/></button><button className="icon-button" aria-label="Next" onClick={()=>shift(1)}><ChevronRight size={19}/></button><button className="today-button" onClick={today}>Today</button></div>
      <div className="segmented">{(['month','week','day'] as const).map(v=><button key={v} onClick={()=>setView(v)} className={view===v?'active':''}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div>
    </div>
    <div className="calendar-filters"><select aria-label="Filter by breeder" value={breeder} onChange={e=>setBreeder(e.target.value)}><option value="all">All breeders</option>{data.breeders.map(b=><option key={b.id} value={b.id}>{b.code} · {b.nickname}</option>)}</select><select aria-label="Filter by tank" value={tank} onChange={e=>setTank(e.target.value)}><option value="all">All tanks</option>{data.tanks.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select aria-label="Filter by event type" value={type} onChange={e=>setType(e.target.value)}><option value="all">All event types</option>{Object.entries(EVENT_LABELS).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></div>
    <div className="calendar-layout"><section className="calendar-shell">
      {view==='month'?<><div className="weekday-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><div key={day}>{day}</div>)}</div><div className="month-grid">{monthDays.map(d=>renderDay(d,true))}</div></>:
      view==='week'?<><div className="weekday-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><div key={day}>{day}</div>)}</div><div className="week-grid">{weekDays.map(d=>renderDay(d,false))}</div></>:
      <div className="day-view"><div className="day-view-heading">{format(cursor,'EEEE, MMMM d')}<Pill color="teal">{eventsForDate(filtered,selected).length} items</Pill></div>{dayEvents.length?<div className="large-day-events">{dayEvents.map(e=><button className={`large-event cal-border-${EVENT_COLORS[e.type]}`} onClick={()=>eventAction(e)} key={e.id}><StageIcon type={e.type}/><span><strong>{e.title}</strong><small>{e.subtitle}</small></span><ChevronRight size={16}/></button>)}</div>:<Empty title="Nothing on this day" description="Add a farm event or inspection task."/>}</div>}
      <div className="legend">{(Object.keys(EVENT_LABELS) as EventType[]).filter(t=>t!=='other').map(t=><span key={t}><i className={`legend-dot cal-${EVENT_COLORS[t]}`}></i>{EVENT_LABELS[t]}</span>)}</div>
    </section><aside className="agenda-panel"><div className="agenda-head"><div><span className="eyebrow">SELECTED DATE</span><h2>{format(parseISO(selected),'EEEE, MMM d')}</h2></div><Pill color="slate">{dayEvents.length} items</Pill></div>
      {dayEvents.length?<div className="agenda-list">{dayEvents.map(e=><div key={e.id} className={`agenda-item agenda-${EVENT_COLORS[e.type]}`}><span className={`agenda-dot cal-${EVENT_COLORS[e.type]}`}></span><div className="agenda-item-body"><strong>{e.title}</strong><small>{e.subtitle}</small>{e.type==='hatch-window'&&<p>Estimated through {readable(e.endDate)}. {e.provisional?'Provisional: only first egg observation is known.':'Based on the recorded egg-laying date.'}</p>}{e.isDemo&&<span className="tiny-demo">DEMO</span>}<div className="agenda-actions">{e.taskId&&<button onClick={()=>toggleTask(e.taskId!)}>Toggle complete</button>}<button onClick={()=>eventAction(e)}><Edit3 size={13}/> {e.type==='hatch-window'?'Open brood':e.taskId?'Edit task':'View / edit'}</button></div></div></div>)}</div>:<Empty title="No events yet" description="Select another date or add a record for this day."/>}
      <div className="agenda-bottom"><Button variant="secondary" onClick={()=>addEvent(selected)}><Plus size={15}/> Add event</Button><Button variant="secondary" onClick={()=>addTask(selected)}><Plus size={15}/> Add task</Button></div>
    </aside></div>
    <p className="hint-text">Teal ranges indicate planning estimates, not confirmed biological events. Only green hatching records reflect observed confirmations.</p>
  </div>;
}
