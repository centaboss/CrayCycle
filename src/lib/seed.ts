import { db } from './db';
import { isoToday, offsetISO, DEFAULT_SETTINGS } from './dates';
import type { Breeder, Cycle, FarmTask, Tank } from './types';
const species = 'Cherax quadricarinatus';
const at = (days: number) => offsetISO(isoToday(), days);
export async function ensureSettings() {
  for (const setting of DEFAULT_SETTINGS) if (!await db.settings.get(setting.species)) await db.settings.add(setting);
}
export async function seedDemoData() {
  const tanks: Tank[] = ['Tank A-01', 'Tank B-02', 'Nursery C-03'].map((name, i) => ({ id: `demo-tank-${i + 1}`, name, isDemo: true }));
  const breeders: Breeder[] = Array.from({length:8}, (_, i) => ({
    id: `demo-breeder-${i+1}`, code: `BR-${String(i+1).padStart(3, '0')}`,
    nickname: ['Pearl','Coral','Marina','Ruby','Bubbles','Sunny','Indigo','Luna'][i],
    species, tankId: tanks[i % 3].id, registeredOn: at(-80 + i * 4),
    notes: i === 0 ? 'Observe eggs closely during the next check.' : '', isDemo: true
  }));
  const cycles: Cycle[] = [
    { id:'demo-cycle-1',breederId:breeders[0].id,status:'active',pairingOn:at(-35),eggsObservedOn:at(-25),notes:'Healthy egg clutch seen at first check.',isDemo:true },
    { id:'demo-cycle-2',breederId:breeders[1].id,status:'active',pairingOn:at(-48),eggsObservedOn:at(-42),notes:'Eggs present, exact laying date unknown.',isDemo:true },
    { id:'demo-cycle-3',breederId:breeders[2].id,status:'active',pairingOn:at(-24),eggsObservedOn:at(-10),notes:'Early incubation.',isDemo:true },
    { id:'demo-cycle-4',breederId:breeders[3].id,status:'completed',pairingOn:at(-94),eggsObservedOn:at(-82),hatchOn:at(-19),attachedOn:at(-18),independentOn:at(-7),nurseryOn:at(-5),juvenileCount:27,notes:'Hatching confirmed by farm staff; juvenile count observed.',isDemo:true },
    { id:'demo-cycle-5',breederId:breeders[4].id,status:'failed',pairingOn:at(-62),eggsObservedOn:at(-55),notes:'Eggs lost during monitoring.',isDemo:true },
    { id:'demo-cycle-6',breederId:breeders[5].id,status:'active',pairingOn:at(-16),eggsObservedOn:at(-3),notes:'Recently observed eggs.',isDemo:true },
    { id:'demo-cycle-7',breederId:breeders[6].id,status:'active',pairingOn:at(-8),notes:'Awaiting egg observation.',isDemo:true }
  ];
  const tasks: FarmTask[] = [
    {id:'demo-task-1',breederId:breeders[0].id,cycleId:'demo-cycle-1',title:'Inspect egg clutch',dueOn:at(0),priority:'high',status:'pending',notes:'Avoid unnecessary handling.',isDemo:true},
    {id:'demo-task-2',breederId:breeders[1].id,cycleId:'demo-cycle-2',title:'Check for hatching',dueOn:at(1),priority:'high',status:'pending',notes:'Record actual date only if seen.',isDemo:true},
    {id:'demo-task-3',breederId:breeders[2].id,cycleId:'demo-cycle-3',title:'Observe female behavior',dueOn:at(3),priority:'normal',status:'pending',notes:'',isDemo:true},
    {id:'demo-task-4',breederId:breeders[5].id,cycleId:'demo-cycle-6',title:'Photograph egg development',dueOn:at(-2),priority:'normal',status:'pending',notes:'Example overdue task.',isDemo:true},
    {id:'demo-task-5',breederId:breeders[3].id,cycleId:'demo-cycle-4',title:'Record nursery juvenile count',dueOn:at(-5),priority:'normal',status:'done',notes:'27 juveniles seen.',isDemo:true},
    {id:'demo-task-6',title:'Clean observation tools',dueOn:at(5),priority:'low',status:'pending',notes:'General farm task.',isDemo:true}
  ];
  await db.transaction('rw', db.tanks, db.breeders, db.cycles, db.tasks, db.events, async () => {
    for (const tank of tanks) if (!await db.tanks.get(tank.id)) await db.tanks.add(tank);
    for (const breeder of breeders) if (!await db.breeders.get(breeder.id)) {
      const codeOwner = await db.breeders.where('code').equals(breeder.code).first();
      await db.breeders.add(codeOwner ? {...breeder, code:`DEMO-${breeder.code}`} : breeder);
    }
    for (const cycle of cycles) if (!await db.cycles.get(cycle.id)) await db.cycles.add(cycle);
    for (const task of tasks) if (!await db.tasks.get(task.id)) await db.tasks.add(task);
  });
}
export async function initialize() {
  await ensureSettings();
  // Seed the very first installation only; returning users are never reset automatically.
  const hasMarker = await db.tanks.get('demo-tank-1');
  const hasAnyBreeder = await db.breeders.count();
  const hasAnyTank = await db.tanks.count();
  if (!hasMarker && hasAnyBreeder === 0 && hasAnyTank === 0) await seedDemoData();
}
