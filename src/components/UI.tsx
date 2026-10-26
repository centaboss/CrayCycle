import type { ReactNode } from 'react';
import { X, AlertTriangle, CalendarDays, CheckCircle2, Clock3, Egg, HeartHandshake, Baby, CircleHelp } from 'lucide-react';
import type { EventType, FarmSnapshot } from '../lib/types';

export const EVENT_COLORS: Record<EventType, string> = {
  pairing:'pink', eggs:'yellow', inspection:'blue', 'hatch-window':'teal',
  hatching:'green', juvenile:'purple', issue:'red', other:'slate'
};
export const EVENT_LABELS: Record<EventType, string> = {
  pairing:'Pairing', eggs:'Eggs observed', inspection:'Inspection', 'hatch-window':'Hatch estimate',
  hatching:'Confirmed hatch', juvenile:'Juvenile follow-up', issue:'Issue', other:'Other'
};
export function Pill({children, color='teal'}:{children:ReactNode;color?:string}) {
  return <span className={`pill pill-${color}`}>{children}</span>;
}
export function Button({children,onClick,variant='primary',type='button',disabled=false,className=''}:{children:ReactNode;onClick?:()=>void;variant?:'primary'|'secondary'|'ghost'|'danger';type?:'button'|'submit';disabled?:boolean;className?:string}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className}`}>{children}</button>;
}
export function Modal({title,description,children,onClose,wide=false}:{title:string;description?:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section className={`modal-panel ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint&&<small>{hint}</small>}</label>;
}
export function Empty({title,description,action}:{title:string;description:string;action?:ReactNode}) {
  return <div className="empty-state"><div className="empty-icon"><CircleHelp size={23}/></div><b>{title}</b><p>{description}</p>{action}</div>;
}
export function PageTitle({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:ReactNode}) {
  return <header className="page-header"><div>{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{action&&<div className="page-actions">{action}</div>}</header>;
}
export function getBreederLabel(data: FarmSnapshot, breederId?: string) {
  if (!breederId) return 'Farm-wide';
  const breeder = data.breeders.find(b=>b.id===breederId);
  return breeder ? `${breeder.code}${breeder.nickname ? ` · ${breeder.nickname}` : ''}` : 'Unknown breeder';
}
export function StageIcon({type,size=17}:{type:EventType;size?:number}) {
  if (type==='pairing') return <HeartHandshake size={size}/>;
  if(type==='eggs') return <Egg size={size}/>;
  if(type==='hatching') return <CheckCircle2 size={size}/>;
  if(type==='juvenile') return <Baby size={size}/>;
  if(type==='issue') return <AlertTriangle size={size}/>;
  if(type==='inspection') return <Clock3 size={size}/>;
  return <CalendarDays size={size}/>;
}
