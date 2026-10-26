import Dexie, { type Table } from 'dexie';
import type { Breeder, Cycle, FarmTask, IncubationSetting, ManualEvent, Tank, FarmSnapshot } from './types';

class CrayCycleDatabase extends Dexie {
  breeders!: Table<Breeder, string>;
  tanks!: Table<Tank, string>;
  cycles!: Table<Cycle, string>;
  tasks!: Table<FarmTask, string>;
  events!: Table<ManualEvent, string>;
  settings!: Table<IncubationSetting, string>;
  constructor() {
    super('CrayCycleOfflineV1');
    this.version(1).stores({
      breeders: 'id, &code, species, tankId, isDemo',
      tanks: 'id, name, isDemo',
      cycles: 'id, breederId, status, eggsObservedOn, hatchOn, isDemo',
      tasks: 'id, breederId, cycleId, dueOn, status, isDemo',
      events: 'id, date, breederId, tankId, type, isDemo',
      settings: 'species'
    });
  }
}
export const db = new CrayCycleDatabase();
export const newId = (): string => crypto.randomUUID();
export async function snapshot(): Promise<FarmSnapshot> {
  const [tanks, breeders, cycles, tasks, events, settings] = await Promise.all([
    db.tanks.toArray(), db.breeders.toArray(), db.cycles.toArray(),
    db.tasks.toArray(), db.events.toArray(), db.settings.toArray()
  ]);
  return { tanks, breeders, cycles, tasks, events, settings };
}
export async function deleteBreeder(id: string) {
  await db.transaction('rw', db.breeders, db.cycles, db.tasks, db.events, async () => {
    const broodIds = (await db.cycles.where('breederId').equals(id).toArray()).map(c => c.id);
    await db.cycles.where('breederId').equals(id).delete();
    await db.tasks.where('breederId').equals(id).delete();
    if (broodIds.length) await db.tasks.where('cycleId').anyOf(broodIds).delete();
    await db.events.where('breederId').equals(id).delete();
    await db.breeders.delete(id);
  });
}
export async function removeDemoData() {
  await db.transaction('rw', db.breeders, db.tanks, db.cycles, db.tasks, db.events, async () => {
    const [breeders, tanks, cycles, tasks, events] = await Promise.all([
      db.breeders.toArray(), db.tanks.toArray(), db.cycles.toArray(), db.tasks.toArray(), db.events.toArray()
    ]);
    // Protect any sample parent record needed by user-created or edited records.
    const protectedCycleIds = new Set(tasks.filter(t => !t.isDemo && t.cycleId).map(t => t.cycleId!));
    const protectedBreederIds = new Set([
      ...cycles.filter(c => !c.isDemo || protectedCycleIds.has(c.id)).map(c => c.breederId),
      ...tasks.filter(t => !t.isDemo && t.breederId).map(t => t.breederId!),
      ...events.filter(e => !e.isDemo && e.breederId).map(e => e.breederId!)
    ]);
    const protectedTankIds = new Set([
      ...breeders.filter(b => !b.isDemo || protectedBreederIds.has(b.id)).map(b => b.tankId),
      ...events.filter(e => !e.isDemo && e.tankId).map(e => e.tankId!)
    ]);
    await db.events.bulkDelete(events.filter(e => e.isDemo).map(e => e.id));
    await db.tasks.bulkDelete(tasks.filter(t => t.isDemo).map(t => t.id));
    await db.cycles.bulkDelete(cycles.filter(c => c.isDemo && !protectedCycleIds.has(c.id)).map(c => c.id));
    await db.breeders.bulkDelete(breeders.filter(b => b.isDemo && !protectedBreederIds.has(b.id)).map(b => b.id));
    await db.tanks.bulkDelete(tanks.filter(t => t.isDemo && !protectedTankIds.has(t.id)).map(t => t.id));
  });
}
