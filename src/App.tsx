import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, CalendarDays, CheckCircle2, CloudOff, Egg, LayoutDashboard, ListChecks, Menu, Settings as SettingsIcon, Sprout, Wifi, X } from 'lucide-react';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Breeders from './pages/Breeders';
import Tasks from './pages/Tasks';
import Records from './pages/Records';
import Settings from './pages/Settings';
import { BreederForm, CycleForm, EventForm, TaskForm, type SaveHandler } from './components/Forms';
import { Modal } from './components/UI';
import { db, deleteBreeder, snapshot } from './lib/db';
import { initialize } from './lib/seed';
import { readable, isoToday } from './lib/dates';
import type { Page } from './lib/types';

type Dialog = {kind:'breeder'|'cycle'|'task'|'event';id?:string;breederId?:string;date?:string};
let startup:Promise<void>|null=null;
const nav: {page:Exclude<Page,'tasks'>;text:string;icon:typeof CalendarDays}[] = [
  {page:'home',text:'Home',icon:LayoutDashboard},
  {page:'calendar',text:'Calendar',icon:CalendarDays},
  {page:'breeders',text:'Breeders',icon:Sprout},
  {page:'records',text:'Records',icon:Activity},
  {page:'settings',text:'Settings',icon:SettingsIcon}
];
export default function App(){
  const [page,setPage]=useState<Page>('home');
  const [dialog,setDialog]=useState<Dialog|null>(null);
  const [booted,setBooted]=useState(false);
  const [error,setError]=useState('');
  const [toast,setToast]=useState('');
  const [online,setOnline]=useState(typeof navigator!=='undefined'?navigator.onLine:true);
  const [menuOpen,setMenuOpen]=useState(false);
  const data=useLiveQuery(()=>snapshot(),[],undefined);
  useEffect(()=>{
    startup??=initialize();
    startup.then(()=>setBooted(true)).catch(e=>{setError(String(e?.message||e));startup=null;});
    const onOnline=()=>setOnline(navigator.onLine);
    addEventListener('online',onOnline);addEventListener('offline',onOnline);
    return ()=>{removeEventListener('online',onOnline);removeEventListener('offline',onOnline);};
  },[]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(id);},[toast]);
  const notify=useCallback((message:string)=>setToast(message),[]);
  const save:SaveHandler=useCallback(async(action,success)=>{
    try{await action();notify(success);return true;}
    catch(e){notify(`Could not save: ${e instanceof Error?e.message:String(e)}`);return false;}
  },[notify]);
  const navigate=(next:Page)=>{setPage(next);setMenuOpen(false);window.scrollTo({top:0,behavior:'smooth'});};
  const deleteConfirm=async(kind:'breeder'|'cycle'|'task'|'event',id:string)=>{
    const messages={breeder:'Delete this breeder, its cycles, attached tasks and event notes? This cannot be undone.',cycle:'Delete this breeding cycle and associated tasks? This cannot be undone.',task:'Delete this task?',event:'Delete this event?'};
    if(!window.confirm(messages[kind]))return;
    const action=async()=>{
      if(kind==='breeder')await deleteBreeder(id);
      if(kind==='cycle')await db.transaction('rw',db.cycles,db.tasks,async()=>{await db.tasks.where('cycleId').equals(id).delete();await db.cycles.delete(id);});
      if(kind==='task')await db.tasks.delete(id);
      if(kind==='event')await db.events.delete(id);
    };
    const success=await save(action,`${kind[0].toUpperCase()+kind.slice(1)} deleted.`);
    if(success && dialog?.id===id)setDialog(null);
  };
  const toggleTask=async(id:string)=>{const task=await db.tasks.get(id);if(task)await save(()=>db.tasks.update(id,{status:task.status==='done'?'pending':'done',isDemo:false}),task.status==='done'?'Task marked pending.':'Task completed.');};
  const recentTasks=useMemo(()=>data?.tasks.filter(t=>t.status==='pending'&&t.dueOn<=isoToday()).length||0,[data]);
  if(error)return <main className="boot-screen"><div className="boot-brand"><Egg size={40}/>CrayCycle</div><h1>Could not open local storage</h1><p>{error}</p><p>Allow website storage in your browser and reload.</p></main>;
  if(!booted||!data)return <main className="boot-screen"><div className="boot-brand"><Egg size={42}/>CrayCycle</div><div className="loading-spinner"/><p>Opening your offline breeding records...</p></main>;
  const open=(kind:Dialog['kind'],id?:string,breederId?:string,date?:string)=>setDialog({kind,id,breederId,date});
  const existingBreeder=dialog?.kind==='breeder'?data.breeders.find(b=>b.id===dialog.id):undefined;
  const existingCycle=dialog?.kind==='cycle'?data.cycles.find(c=>c.id===dialog.id):undefined;
  const existingTask=dialog?.kind==='task'?data.tasks.find(t=>t.id===dialog.id):undefined;
  const existingEvent=dialog?.kind==='event'?data.events.find(e=>e.id===dialog.id):undefined;
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen?'mobile-menu-open':''}`}>
      <div className="brand"><span className="brand-icon"><Egg size={28}/></span><div><strong>Cray<span>Cycle</span></strong><small>BREEDING COMPANION</small></div></div>
      <div className="sidebar-section-title">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">{nav.map(item=><button key={item.page} onClick={()=>navigate(item.page)} className={`nav-item ${page===item.page?'active':''}`}><item.icon size={20}/><span>{item.text}</span>{page===item.page&&<span className="active-dot"/>}</button>)}
        <button className={`nav-item ${page==='tasks'?'active':''}`} onClick={()=>navigate('tasks')}><ListChecks size={20}/><span>Tasks & reminders</span>{recentTasks>0&&<span className="nav-count">{recentTasks}</span>}</button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-help"><div className="sidebar-help-icon"><CloudOff size={22}/></div><strong>Made for the farm.</strong><p>Your records stay right here on this device, even without internet.</p><button onClick={()=>navigate('settings')}>Back up my data</button></div><div className="sidebar-version">CRAYCYCLE v1.0 · OFFLINE-FIRST</div></div>
    </aside>
    {menuOpen&&<button className="mobile-scrim" aria-label="Close menu" onClick={()=>setMenuOpen(false)}/>}
    <div className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu-toggle" aria-label="Open menu" onClick={()=>setMenuOpen(true)}><Menu size={22}/></button><span className="topbar-label">Crayfish breeding management</span></div><div className="topbar-right"><span className={`connection-badge ${online?'':'offline'}`}>{online?<Wifi size={14}/>:<CloudOff size={14}/>} {online?'Online · saves locally':'Offline · working locally'}</span><span className="topbar-date">{readable(isoToday())}</span><span className="topbar-avatar">CC</span></div></header>
      <main className="main-container">
        {page==='home'&&<Home data={data} navigate={navigate} addBreeder={()=>open('breeder')} addCycle={()=>open('cycle')} editTask={id=>open('task',id)}/>}
        {page==='calendar'&&<Calendar data={data} addEvent={date=>open('event',undefined,undefined,date)} editEvent={id=>open('event',id)} addTask={date=>open('task',undefined,undefined,date)} editTask={id=>open('task',id)} editCycle={id=>open('cycle',id)} toggleTask={id=>{void toggleTask(id);}}/>}
        {page==='breeders'&&<Breeders data={data} openBreeder={id=>open('breeder',id)} openCycle={(breederId,cycleId)=>open('cycle',cycleId,breederId)} deleteBreeder={id=>{void deleteConfirm('breeder',id);}} deleteCycle={id=>{void deleteConfirm('cycle',id);}}/>}
        {page==='tasks'&&<Tasks data={data} addTask={()=>open('task')} editTask={id=>open('task',id)} toggleTask={id=>{void toggleTask(id);}} deleteTask={id=>{void deleteConfirm('task',id);}}/>}
        {page==='records'&&<Records data={data} editCycle={id=>open('cycle',id)}/>}
        {page==='settings'&&<Settings data={data} onSave={save}/>}
      </main>
      <footer className="main-footer">CrayCycle · Built for careful observations, not guaranteed predictions. <span>Records are stored locally in this browser.</span></footer>
    </div>
    <nav className="bottom-nav" aria-label="Mobile navigation">{nav.map(item=><button key={item.page} onClick={()=>navigate(item.page)} className={page===item.page?'active':''}><item.icon size={21}/><span>{item.text}</span></button>)}</nav>
    {dialog&&<Modal title={dialog.kind==='breeder'?dialog.id?'Edit breeder':'Register female breeder':dialog.kind==='cycle'?dialog.id?'Update breeding cycle':'Record a breeding cycle':dialog.kind==='task'?dialog.id?'Edit scheduled task':'Schedule a task':dialog.id?'Edit farm event':'New calendar event'}
      description={dialog.kind==='cycle'?'Record what you saw; estimated dates are calculated separately.':undefined} onClose={()=>setDialog(null)} wide={dialog.kind==='cycle'||dialog.kind==='breeder'}>
      {dialog.kind==='breeder'&&<BreederForm data={data} existing={existingBreeder} onSave={save} onDone={()=>setDialog(null)} onCancel={()=>setDialog(null)}/>}
      {dialog.kind==='cycle'&&<CycleForm data={data} existing={existingCycle} breederId={dialog.breederId} onSave={save} onDone={()=>setDialog(null)} onCancel={()=>setDialog(null)}/>}
      {dialog.kind==='task'&&<TaskForm data={data} existing={existingTask} defaultDate={dialog.date} onSave={save} onDone={()=>setDialog(null)} onCancel={()=>setDialog(null)}/>}
      {dialog.kind==='event'&&<EventForm data={data} existing={existingEvent} defaultDate={dialog.date} onSave={save} onDone={()=>setDialog(null)} onCancel={()=>setDialog(null)} onDelete={id=>{void deleteConfirm('event',id);}}/>}
    </Modal>}
    {toast&&<div role="status" className="toast"><CheckCircle2 size={19}/>{toast}<button aria-label="Dismiss message" onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>;
}
