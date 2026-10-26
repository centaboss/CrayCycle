import { db, snapshot } from './db';
import { isISODate } from './dates';
import type { FarmSnapshot } from './types';
export function downloadFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export async function exportJSON() {
  const data = await snapshot();
  downloadFile(`craycycle-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ format:'CrayCycle', version:1, exportedAt:new Date().toISOString(), data }, null, 2), 'application/json');
}
function csvEscape(value: unknown) {
  const content = String(value ?? ''); return `"${content.replaceAll('"', '""')}"`;
}
export async function exportCSV() {
  const data = await snapshot();
  const breeders = new Map(data.breeders.map(b => [b.id, b]));
  const rows = [['Breeder ID','Species','Status','Pairing','Eggs observed','Egg laying known','Hatched','Juveniles','Notes'],
    ...data.cycles.map(c => [breeders.get(c.breederId)?.code || c.breederId, breeders.get(c.breederId)?.species || '',
      c.status, c.pairingOn || '', c.eggsObservedOn || '', c.eggLayingOn || '', c.hatchOn || '', String(c.juvenileCount ?? ''), c.notes])];
  downloadFile('craycycle-breeding-records.csv', rows.map(row => row.map(csvEscape).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}
const arrays = ['tanks','breeders','cycles','tasks','events','settings'] as const;
export function validateBackup(payload: unknown): FarmSnapshot {
  if (!payload || typeof payload !== 'object') throw new Error('This is not a CrayCycle backup.');
  const wrapper = payload as {format?:unknown;version?:unknown;data?:unknown};
  if (wrapper.format !== 'CrayCycle' || wrapper.version !== 1 || !wrapper.data || typeof wrapper.data !== 'object') throw new Error('Unsupported backup format or version.');
  const data = wrapper.data as Record<string, unknown>;
  for (const key of arrays) {
    if (!Array.isArray(data[key]) || data[key].length > 100000) throw new Error(`Invalid ${key} data.`);
    for (const entry of data[key] as unknown[]) if (!entry || typeof entry !== 'object') throw new Error(`Invalid ${key} record.`);
  }
  const typed = data as unknown as FarmSnapshot;
  for (const t of typed.tanks) if (typeof t.id !== 'string' || typeof t.name !== 'string') throw new Error('Invalid tank.');
  for (const b of typed.breeders) if (typeof b.id !== 'string' || typeof b.code !== 'string' || !isISODate(b.registeredOn) || typeof b.species !== 'string' || typeof b.tankId !== 'string' || typeof b.nickname !== 'string' || typeof b.notes !== 'string') throw new Error('Invalid breeder.');
  for (const c of typed.cycles) if (typeof c.id !== 'string' || typeof c.breederId !== 'string' || !['active','completed','failed','cancelled'].includes(c.status) || typeof c.notes !== 'string') throw new Error('Invalid breeding cycle.');
  for (const t of typed.tasks) if (typeof t.id !== 'string' || !isISODate(t.dueOn) || typeof t.title !== 'string' || !['pending','done'].includes(t.status) || !['low','normal','high'].includes(t.priority) || typeof t.notes !== 'string') throw new Error('Invalid task.');
  for (const e of typed.events) if (typeof e.id !== 'string' || !isISODate(e.date) || typeof e.title !== 'string' || typeof e.type !== 'string' || typeof e.notes !== 'string') throw new Error('Invalid event.');
  for (const s of typed.settings) if (typeof s.species !== 'string' || !Number.isInteger(s.minDays) || !Number.isInteger(s.maxDays) || s.minDays < 1 || s.maxDays > 365 || s.minDays > s.maxDays) throw new Error('Invalid incubation settings.');
  const distinct = (ids: string[]) => new Set(ids).size === ids.length;
  for (const key of arrays) if (!distinct((typed[key] as {id?:string;species?:string}[]).map(o => (o.id || o.species || '')))) throw new Error(`Duplicate ${key} identifiers.`);
  const tankIds = new Set(typed.tanks.map(t=>t.id));
  const breederIds = new Set(typed.breeders.map(b=>b.id));
  const cycleIds = new Set(typed.cycles.map(c=>c.id));
  if (typed.breeders.some(b=>!tankIds.has(b.tankId)) || typed.cycles.some(c=>!breederIds.has(c.breederId)) || typed.tasks.some(t=>(t.breederId && !breederIds.has(t.breederId)) || (t.cycleId && !cycleIds.has(t.cycleId))) || typed.events.some(e=>e.breederId && !breederIds.has(e.breederId))) throw new Error('Backup contains missing relationships.');
  if (!distinct(typed.breeders.map(b=>b.code))) throw new Error('Duplicate breeder codes.');
  return typed;
}
export async function importJSON(file: File) {
  if (file.size > 20_000_000) throw new Error('Backup is too large (20 MB maximum).');
  const imported = validateBackup(JSON.parse(await file.text()) as unknown);
  // Explicit restore action replaces the database; recommend exporting the previous data first.
  await db.transaction('rw', db.tanks, db.breeders, db.cycles, db.tasks, db.events, db.settings, async () => {
    await Promise.all([db.tanks.clear(), db.breeders.clear(), db.cycles.clear(), db.tasks.clear(), db.events.clear(), db.settings.clear()]);
    await db.tanks.bulkAdd(imported.tanks);
    await db.breeders.bulkAdd(imported.breeders);
    await db.cycles.bulkAdd(imported.cycles);
    await db.tasks.bulkAdd(imported.tasks);
    await db.events.bulkAdd(imported.events);
    await db.settings.bulkAdd(imported.settings);
  });
}
