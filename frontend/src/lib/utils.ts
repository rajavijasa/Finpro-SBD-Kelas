import { PORTRAITS } from "./constants";

export function getStudentAvatar(name: string): string {
  if (!name) return PORTRAITS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % PORTRAITS.length;
  return PORTRAITS[idx];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getStringProperty(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  const prop = value[key];
  return typeof prop === 'string' ? prop : null;
}

export function getBooleanProperty(value: unknown, key: string): boolean | null {
  if (!isRecord(value)) return null;
  const prop = value[key];
  return typeof prop === 'boolean' ? prop : null;
}

export function clampText(value: string, max = 64): string {
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function yearLabel(year?: number): string | null {
  if (year === undefined || year === null || !Number.isFinite(year)) return null;
  return `Year ${year}`;
}

export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const errMsg = getStringProperty(json, 'error') ?? `Request failed: ${res.status}`;
    throw new Error(errMsg);
  }

  return json as T;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
