import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import type { Cycle, IncubationSetting } from './types';

export const isoToday = () => format(new Date(), 'yyyy-MM-dd');
export const localISO = (date: Date) => format(date, 'yyyy-MM-dd');
export const readable = (date?: string) => date && isValid(parseISO(date)) ? format(parseISO(date), 'MMM d, yyyy') : 'Not recorded';
export const shortDate = (date?: string) => date && isValid(parseISO(date)) ? format(parseISO(date), 'MMM d') : '—';
export const offsetISO = (origin: string, days: number) => localISO(addDays(parseISO(origin), days));
export const daysBetween = (start: string, end: string) => differenceInCalendarDays(parseISO(end), parseISO(start));
export const isISODate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value)) && localISO(parseISO(value)) === value;
export const DEFAULT_SETTINGS: IncubationSetting[] = [
  { species: 'Cherax quadricarinatus', minDays: 42, maxDays: 70 }
];
export function estimateHatching(cycle: Cycle, species: string, settings: IncubationSetting[]) {
  if (!cycle.eggsObservedOn && !cycle.eggLayingOn) return null;
  const anchor = cycle.eggLayingOn || cycle.eggsObservedOn!;
  const configured = settings.find(s => s.species.toLowerCase() === species.toLowerCase());
  if (!configured || !isISODate(anchor) || configured.minDays < 1 || configured.maxDays < configured.minDays) return null;
  return {
    earliest: offsetISO(anchor, configured.minDays), latest: offsetISO(anchor, configured.maxDays),
    provisional: !cycle.eggLayingOn, anchor,
    range: `${configured.minDays}–${configured.maxDays} days`
  };
}
