/**
 * Lightweight client-side telemetry.
 * Events are stored in localStorage and viewable at /debug.
 * Max 200 events retained (oldest pruned).
 */

const STORAGE_KEY = 'pp_telemetry';
const MAX_EVENTS = 200;

export interface TelemetryEvent {
  ts: string;        // ISO timestamp
  cat: string;       // category: 'assistant', 'voice', 'color', 'nav', 'error'
  evt: string;       // event name
  data?: Record<string, unknown>;
}

function getEvents(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: TelemetryEvent[]) {
  try {
    // Keep only the latest MAX_EVENTS
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function track(cat: string, evt: string, data?: Record<string, unknown>) {
  const event: TelemetryEvent = {
    ts: new Date().toISOString(),
    cat,
    evt,
    data,
  };
  
  // Console log for live debugging
  console.log(`[${cat}] ${evt}`, data || '');
  
  const events = getEvents();
  events.push(event);
  saveEvents(events);
}

export function getAll(): TelemetryEvent[] {
  return getEvents();
}

export function clear() {
  localStorage.removeItem(STORAGE_KEY);
}

// Convenience helpers
export const telemetry = {
  track,
  getAll,
  clear,
  
  // Pre-categorized trackers
  assistant: (evt: string, data?: Record<string, unknown>) => track('assistant', evt, data),
  voice: (evt: string, data?: Record<string, unknown>) => track('voice', evt, data),
  color: (evt: string, data?: Record<string, unknown>) => track('color', evt, data),
  nav: (evt: string, data?: Record<string, unknown>) => track('nav', evt, data),
  error: (evt: string, data?: Record<string, unknown>) => track('error', evt, data),
};
