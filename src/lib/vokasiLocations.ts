// Koordinat gedung Sekolah Vokasi UGM, dikonversi dari derajat/menit/detik.
export const VOKASI_LOCATIONS = [
  { name: 'DTEDI', latitude: -7.7751166667, longitude: 110.3736611111 },
  { name: 'DTK', latitude: -7.7747805556, longitude: 110.3743777778 },
  { name: 'DLIKES', latitude: -7.7738361111, longitude: 110.3744027778 },
] as const;

// Keep legacy backend names compatible with the campus names used by the UI.
export function vokasiDisplayText(value: string): string {
  return value
    .replace(/\b(?:Tangki\s+)?(?:Atap\s+)?Gedung\s+Utama\b/gi, 'DTEDI')
    .replace(/\b(?:Tangki\s+)?Gedung\s+Rawat\s+Inap\b/gi, 'DTK')
    .replace(/\bTangki\s+(DTEDI|DTK|DLIKES)\b/gi, (_, name: string) => name.toUpperCase());
}

export function vokasiTankName(value: string): string {
  const text = vokasiDisplayText(value);
  return VOKASI_LOCATIONS.find(location => new RegExp(`\\b${location.name}\\b`, 'i').test(text))?.name ?? text;
}

const displayFields = new Set(['name', 'tankName', 'location', 'message', 'detail']);

export function normalizeVokasiDisplayData<T>(value: T): T {
  if (Array.isArray(value)) return value.map(normalizeVokasiDisplayData) as T;
  if (!value || typeof value !== 'object') return value;

  const normalized = Object.fromEntries(Object.entries(value).map(([key, field]) => [
    key,
    displayFields.has(key) && typeof field === 'string'
      ? vokasiDisplayText(field)
      : normalizeVokasiDisplayData(field),
  ]));
  // Tank locations follow the renamed building while readings keep their IDs.
  const hasLegacyName = 'name' in value && typeof value.name === 'string' &&
    /\b(?:Gedung\s+Rawat\s+Inap|(?:Atap\s+)?Gedung\s+Utama)\b/i.test(value.name);
  if (hasLegacyName && 'capacityLiters' in normalized && typeof normalized.name === 'string') {
    const location = VOKASI_LOCATIONS.find(location => location.name === normalized.name);
    if (location) normalized.location = `Gedung ${location.name}, Sekolah Vokasi UGM`;
  }
  return normalized as T;
}
