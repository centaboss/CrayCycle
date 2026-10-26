import { describe, it, expect } from 'vitest';
import { estimateHatching, isISODate } from '../src/lib/dates';
import { calendarEvents, eventsForDate } from '../src/lib/events';
import type { Cycle, FarmSnapshot } from '../src/lib/types';
const species='Cherax quadricarinatus';
const settings=[{species,minDays:42,maxDays:70},{species:'Other / Unknown',minDays:50,maxDays:60}];
const cycle:Cycle={id:'c1',breederId:'b1',status:'active',eggsObservedOn:'2026-10-01',notes:''};
const data:FarmSnapshot={breeders:[{id:'b1',code:'BR-001',nickname:'',species,tankId:'t1',registeredOn:'2026-09-01',notes:''}],tanks:[{id:'t1',name:'Tank 1'}],cycles:[cycle],tasks:[],events:[],settings};
describe('date estimation and careful observation labels',()=>{
  it('computes October 1 + 42–70 calendar days',()=>{
    const result=estimateHatching(cycle,species,settings);
    expect(result?.earliest).toBe('2026-11-12');
    expect(result?.latest).toBe('2026-12-10');
    expect(result?.provisional).toBe(true);
  });
  it('uses known actual egg-laying date before first observation',()=>{
    const result=estimateHatching({...cycle,eggLayingOn:'2026-09-29'},species,settings);
    expect(result?.earliest).toBe('2026-11-10');
    expect(result?.provisional).toBe(false);
  });
  it('does not predict anything without an egg-related date',()=>{
    expect(estimateHatching({...cycle,eggsObservedOn:undefined},species,settings)).toBeNull();
  });
  it('marks estimate as a range, not as a confirmed hatching event',()=>{
    const events=calendarEvents(data);
    expect(events.some(e=>e.type==='hatch-window')).toBe(true);
    expect(events.some(e=>e.type==='hatching')).toBe(false);
    expect(eventsForDate(events,'2026-11-19').some(e=>e.type==='hatch-window')).toBe(true);
    expect(eventsForDate(events,'2026-12-11').some(e=>e.type==='hatch-window')).toBe(false);
  });
  it('disables active hatch ranges after a recorded confirmation',()=>{
    const events=calendarEvents({...data,cycles:[{...cycle,hatchOn:'2026-11-13'}]});
    expect(events.some(e=>e.type==='hatch-window')).toBe(false);
    expect(events.some(e=>e.type==='hatching')).toBe(true);
  });
  it('accepts proper ISO dates only',()=>{
    expect(isISODate('2026-02-29')).toBe(false);
    expect(isISODate('2028-02-29')).toBe(true);
  });
});
