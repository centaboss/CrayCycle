import type { FarmSnapshot, CalendarEvent, EventType } from './types';
import { estimateHatching } from './dates';

const stages = [
  ['pairingOn', 'pairing', 'Pairing recorded'],
  ['eggsObservedOn', 'eggs', 'Eggs first observed'],
  ['hatchOn', 'hatching', 'Hatching confirmed'],
  ['attachedOn', 'juvenile', 'Attached juveniles observed'],
  ['independentOn', 'juvenile', 'Juvenile independence observed'],
  ['nurseryOn', 'juvenile', 'Nursery transfer recorded']
] as const;

export function calendarEvents(data: FarmSnapshot): CalendarEvent[] {
  const breederById = new Map(data.breeders.map(b => [b.id, b]));
  const all: CalendarEvent[] = [];
  for (const cycle of data.cycles) {
    const breeder = breederById.get(cycle.breederId);
    if (!breeder) continue;
    for (const [field, type, title] of stages) {
      const date = cycle[field];
      if (date) all.push({ id: `${cycle.id}-${field}`, date, type, title, subtitle: breeder.code,
        cycleId: cycle.id, breederId: breeder.id, isDemo: cycle.isDemo });
    }
    if (cycle.status === 'active' && !cycle.hatchOn) {
      const est = estimateHatching(cycle, breeder.species, data.settings);
      if (est) all.push({ id: `${cycle.id}-window`, date: est.earliest, endDate: est.latest,
        type: 'hatch-window', title: 'Estimated hatch window', subtitle: `${breeder.code} · ${est.provisional ? 'Provisional' : 'Egg-laying date known'}`,
        cycleId: cycle.id, breederId: breeder.id, provisional: est.provisional, isDemo: cycle.isDemo });
    }
  }
  for (const task of data.tasks) {
    all.push({ id: `task-${task.id}`, date: task.dueOn, type: 'inspection', title: task.title,
      subtitle: `${task.breederId ? breederById.get(task.breederId)?.code || 'Breeder' : 'Farm-wide'} · ${task.status === 'done' ? 'Done' : 'Pending'}`,
      taskId: task.id, breederId: task.breederId, isDemo: task.isDemo });
  }
  for (const event of data.events) {
    all.push({ id: `event-${event.id}`, date: event.date, type: event.type as EventType,
      title: event.title, subtitle: event.breederId ? breederById.get(event.breederId)?.code || 'Breeder' : event.tankId ? data.tanks.find(t=>t.id===event.tankId)?.name || 'Tank' : 'Farm-wide',
      breederId: event.breederId, tankId: event.tankId, manualEventId: event.id, isDemo: event.isDemo });
  }
  return all.sort((a, b) => a.date.localeCompare(b.date));
}
export function eventsForDate(events: CalendarEvent[], date: string) {
  return events.filter(e => e.endDate ? e.date <= date && date <= e.endDate : e.date === date);
}
