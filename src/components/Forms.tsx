import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Field } from './UI';
import { db, newId } from '../lib/db';
import { isoToday, isISODate } from '../lib/dates';
import type { Breeder, Cycle, FarmSnapshot, FarmTask, ManualEvent, Priority, EventType, CycleStatus } from '../lib/types';

export type SaveHandler = (action:()=>Promise<unknown>, success:string)=>Promise<boolean>;
export function BreederForm({data,existing,onDone,onCancel,onSave}:{data:FarmSnapshot;existing?:Breeder;onDone:()=>void;onCancel:()=>void;onSave:SaveHandler}) {
  const [code,setCode]=useState(existing?.code || `BR-${String(data.breeders.length+1).padStart(3,'0')}`);
  const [nickname,setNickname]=useState(existing?.nickname || '');
  const [species,setSpecies]=useState(existing?.species || 'Cherax quadricarinatus');
  const [tankId,setTankId]=useState(existing?.tankId || data.tanks[0]?.id || '');
  const [ageMonths,setAgeMonths]=useState(existing?.ageMonths?.toString() || '');
  const [registeredOn,setRegisteredOn]=useState(existing?.registeredOn || isoToday());
  const [notes,setNotes]=useState(existing?.notes || '');
  const [busy,setBusy]=useState(false);
  const submit=async(e:FormEvent)=>{
    e.preventDefault(); if(busy)return;
    const normalized=code.trim().toUpperCase();
    if(!normalized || !tankId || !isISODate(registeredOn)) return alert('Please complete the required fields.');
    if(data.breeders.some(b=>b.code.toUpperCase()===normalized && b.id!==existing?.id))return alert('This breeder ID is already in use.');
    setBusy(true);
    try {if(await onSave(()=>db.breeders.put({id:existing?.id || newId(),code:normalized,nickname:nickname.trim(),species:species.trim(),tankId,ageMonths:ageMonths?Number(ageMonths):undefined,registeredOn,notes:notes.trim(),isDemo: false}),existing?'Breeder updated.':'Breeder registered.'))onDone();}
    finally {setBusy(false);}
  };
  return <form onSubmit={submit} className="form-stack"><div className="form-grid">
    <Field label="Breeder ID *"><input value={code} required onChange={e=>setCode(e.target.value)} maxLength={30}/></Field>
    <Field label="Nickname"><input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="e.g. Pearl" maxLength={60}/></Field>
    <Field label="Species *"><input required value={species} onChange={e=>setSpecies(e.target.value)} list="species-options" maxLength={100}/><datalist id="species-options"><option value="Cherax quadricarinatus"/><option value="Other / Unknown"/></datalist></Field>
    <Field label="Tank / pond *"><select value={tankId} required onChange={e=>setTankId(e.target.value)}><option value="">Choose tank</option>{data.tanks.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
    <Field label="Approx. age (months)"><input type="number" min="0" max="300" value={ageMonths} onChange={e=>setAgeMonths(e.target.value)} placeholder="Optional"/></Field>
    <Field label="Registered on *"><input type="date" value={registeredOn} onChange={e=>setRegisteredOn(e.target.value)} required/></Field>
  </div><Field label="Notes"><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Identification or observations"/></Field>
  <div className="form-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy || !data.tanks.length}>{existing?'Save changes':'Register breeder'}</Button></div></form>;
}
const dateFields: [keyof Cycle,string][] = [
  ['pairingOn','Pairing / breeding recorded'],['eggsObservedOn','Eggs first observed'],['eggLayingOn','Actual egg-laying date (only if known)'],
  ['hatchOn','Hatching confirmed'],['attachedOn','Juveniles attached observed'],['independentOn','Juvenile independence confirmed'],['nurseryOn','Nursery transfer']
];
export function CycleForm({data,breederId,existing,onDone,onCancel,onSave}:{data:FarmSnapshot;breederId?:string;existing?:Cycle;onDone:()=>void;onCancel:()=>void;onSave:SaveHandler}) {
  const [selected,setSelected]=useState(existing?.breederId||breederId||data.breeders[0]?.id||'');
  const [status,setStatus]=useState<CycleStatus>(existing?.status||'active');
  const [dates,setDates]=useState<Record<string,string>>(()=>Object.fromEntries(dateFields.map(([key])=>[key, String(existing?.[key]||'')])));
  const [juvenileCount,setJuvenileCount]=useState(existing?.juvenileCount?.toString()||'');
  const [notes,setNotes]=useState(existing?.notes||'');
  const [busy,setBusy]=useState(false);
  const submit=async(e:FormEvent)=>{
    e.preventDefault();if(busy)return;
    if(!selected)return alert('Choose a breeder.');
    const otherActive=data.cycles.find(c=>c.breederId===selected && c.status==='active' && c.id!==existing?.id);
    if(status==='active' && otherActive) return alert('This breeder already has an active brood. Edit or close the existing cycle before starting another.');
    if(!Object.values(dates).some(Boolean)) return alert('Record at least one observed date.');
    if(Object.values(dates).some(v=>v&&!isISODate(v))) return alert('Invalid date.');
    setBusy(true);
    try {
      const parsed=Object.fromEntries(Object.entries(dates).map(([k,v])=>[k,v||undefined]));
      if(await onSave(()=>db.cycles.put({id:existing?.id||newId(),breederId:selected,status,...parsed,juvenileCount:juvenileCount?Number(juvenileCount):undefined,notes:notes.trim(),isDemo: false} as Cycle),existing?'Breeding cycle updated.':'Breeding cycle started.'))onDone();
    } finally {setBusy(false);}
  };
  return <form onSubmit={submit} className="form-stack">
    <div className="info-strip">Only record biological stages you have personally observed. Estimates never count as confirmed hatchings.</div>
    <div className="form-grid">
      <Field label="Female breeder *"><select value={selected} onChange={e=>setSelected(e.target.value)} disabled={Boolean(existing)} required>{data.breeders.map(b=><option key={b.id} value={b.id}>{b.code} · {b.nickname||b.species}</option>)}</select></Field>
      <Field label="Cycle outcome"><select value={status} onChange={e=>setStatus(e.target.value as CycleStatus)}><option value="active">Active</option><option value="completed">Completed</option><option value="failed">Failed / egg loss</option><option value="cancelled">Cancelled / unknown</option></select></Field>
    </div><div className="form-grid">{dateFields.map(([key,label])=><Field key={key} label={label}><input type="date" value={dates[key]} onChange={e=>setDates(s=>({...s,[key]:e.target.value}))}/></Field>)}</div>
    <Field label="Observed juvenile count"><input type="number" value={juvenileCount} min="0" max="100000" onChange={e=>setJuvenileCount(e.target.value)} placeholder="Enter only after counting"/></Field>
    <Field label="Notes / reason for failed cycle"><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What did the farmer actually observe?"/></Field>
    <div className="form-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button disabled={busy} type="submit">{existing?'Save observations':'Save breeding cycle'}</Button></div>
  </form>;
}
export function TaskForm({data,existing,defaultDate,breederId,onDone,onCancel,onSave}:{data:FarmSnapshot;existing?:FarmTask;defaultDate?:string;breederId?:string;onDone:()=>void;onCancel:()=>void;onSave:SaveHandler}) {
  const [title,setTitle]=useState(existing?.title||'Inspect eggs');
  const [dueOn,setDueOn]=useState(existing?.dueOn||defaultDate||isoToday());
  const [dueTime,setDueTime]=useState(existing?.dueTime||'');
  const [assigned,setAssigned]=useState(existing?.breederId||breederId||'');
  const [priority,setPriority]=useState<Priority>(existing?.priority||'normal');
  const [status,setStatus]=useState(existing?.status||'pending');
  const [notes,setNotes]=useState(existing?.notes||'');
  const [busy,setBusy]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();if(busy)return;if(!title.trim()||!isISODate(dueOn))return alert('Enter a title and valid due date.');setBusy(true);
    try{if(await onSave(()=>db.tasks.put({id:existing?.id||newId(),title:title.trim(),dueOn,dueTime:dueTime||undefined,breederId:assigned||undefined,cycleId:existing?.cycleId,priority,status,notes:notes.trim(),isDemo: false}),existing?'Task updated.':'Task scheduled.'))onDone();}finally{setBusy(false);}
  };
  return <form onSubmit={submit} className="form-stack">
    <Field label="Task title *"><input required value={title} onChange={e=>setTitle(e.target.value)} maxLength={100}/></Field>
    <div className="form-grid"><Field label="Due date *"><input type="date" required value={dueOn} onChange={e=>setDueOn(e.target.value)}/></Field><Field label="Time (optional)"><input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}/></Field>
    <Field label="Assigned breeder"><select value={assigned} onChange={e=>setAssigned(e.target.value)}><option value="">Farm-wide task</option>{data.breeders.map(b=><option key={b.id} value={b.id}>{b.code} · {b.nickname}</option>)}</select></Field>
    <Field label="Priority"><select value={priority} onChange={e=>setPriority(e.target.value as Priority)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></Field>
    <Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value as FarmTask['status'])}><option value="pending">Pending</option><option value="done">Completed</option></select></Field></div>
    <Field label="Notes"><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/></Field>
    <div className="form-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button disabled={busy} type="submit">{existing?'Save task':'Schedule task'}</Button></div>
  </form>;
}
export function EventForm({data,existing,defaultDate,onDone,onCancel,onSave,onDelete}:{data:FarmSnapshot;existing?:ManualEvent;defaultDate?:string;onDone:()=>void;onCancel:()=>void;onSave:SaveHandler;onDelete?:(id:string)=>void}) {
  const [title,setTitle]=useState(existing?.title||'Farm observation');
  const [date,setDate]=useState(existing?.date||defaultDate||isoToday());
  const [type,setType]=useState<ManualEvent['type']>(existing?.type||'other');
  const [assigned,setAssigned]=useState(existing?.breederId||'');
  const [tank,setTank]=useState(existing?.tankId||'');
  const [notes,setNotes]=useState(existing?.notes||'');
  const [busy,setBusy]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();if(busy)return;if(!title.trim()||!isISODate(date))return alert('Enter a valid event.');setBusy(true);
    try{if(await onSave(()=>db.events.put({id:existing?.id||newId(),title:title.trim(),date,type,breederId:assigned||undefined,tankId:assigned?undefined:(tank||undefined),notes:notes.trim(),isDemo: false}),existing?'Event updated.':'Event added.'))onDone();}finally{setBusy(false);}
  };
  return <form onSubmit={submit} className="form-stack"><div className="form-grid"><Field label="Event title *"><input required value={title} onChange={e=>setTitle(e.target.value)}/></Field><Field label="Date *"><input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></Field>
    <Field label="Event type"><select value={type} onChange={e=>setType(e.target.value as Exclude<EventType,'hatch-window'>)}><option value="other">Other farm event</option><option value="inspection">Inspection</option><option value="pairing">Pairing log</option><option value="eggs">Egg observation note (not a cycle stage)</option><option value="juvenile">Juvenile follow-up</option><option value="issue">Problem / concern</option></select></Field>
    <Field label="Breeder"><select value={assigned} onChange={e=>setAssigned(e.target.value)}><option value="">General farm event</option>{data.breeders.map(b=><option key={b.id} value={b.id}>{b.code} · {b.nickname}</option>)}</select></Field>
    <Field label="Tank for general event"><select disabled={Boolean(assigned)} value={assigned?'':tank} onChange={e=>setTank(e.target.value)}><option value="">Farm-wide</option>{data.tanks.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field></div>
    <Field label="Notes"><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/></Field>
    <div className="form-actions space-between">{existing&&onDelete?<Button variant="danger" onClick={()=>onDelete(existing.id)}><Trash2 size={15}/> Delete</Button>:<span/>}<div className="actions-row"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button disabled={busy} type="submit">Save event</Button></div></div></form>;
}
