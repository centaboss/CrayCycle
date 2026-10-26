export type CycleStatus = 'active' | 'completed' | 'failed' | 'cancelled';
export type TaskStatus = 'pending' | 'done';
export type EventType = 'pairing' | 'eggs' | 'inspection' | 'hatch-window' | 'hatching' | 'juvenile' | 'issue' | 'other';
export type Priority = 'low' | 'normal' | 'high';
export type Page = 'home' | 'calendar' | 'breeders' | 'records' | 'settings' | 'tasks';
export interface Tank { id: string; name: string; isDemo?: boolean; }
export interface Breeder {
  id: string; code: string; nickname: string; species: string; tankId: string;
  ageMonths?: number; registeredOn: string; notes: string; isDemo?: boolean;
}
export interface Cycle {
  id: string; breederId: string; status: CycleStatus; pairingOn?: string;
  eggsObservedOn?: string; eggLayingOn?: string; hatchOn?: string;
  attachedOn?: string; independentOn?: string; nurseryOn?: string;
  juvenileCount?: number; notes: string; isDemo?: boolean;
}
export interface FarmTask {
  id: string; breederId?: string; cycleId?: string; title: string;
  dueOn: string; dueTime?: string; priority: Priority; status: TaskStatus;
  notes: string; isDemo?: boolean;
}
export interface ManualEvent {
  id: string; title: string; type: Exclude<EventType,'hatch-window'>;
  date: string; breederId?: string; tankId?: string; notes: string; isDemo?: boolean;
}
export interface IncubationSetting { species: string; minDays: number; maxDays: number; }
export interface CalendarEvent {
  id: string; date: string; endDate?: string; type: EventType; title: string;
  subtitle: string; breederId?: string; cycleId?: string; taskId?: string;
  manualEventId?: string; tankId?: string; provisional?: boolean; isDemo?: boolean;
}
export interface FarmSnapshot {
  tanks: Tank[]; breeders: Breeder[]; cycles: Cycle[]; tasks: FarmTask[];
  events: ManualEvent[]; settings: IncubationSetting[];
}
