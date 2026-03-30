const JBIN_BASE = 'https://api.jsonbin.io/v3/b';
let JBIN_API_KEY = '$2a$10$Alz.zxKunWzSWO8j/X71SOXX1mGL8/OQIc4g0yZ4wZ128PgRv/pD6';
let JBIN_TEAMS_BIN = '69b30d14b7ec241ddc62df91';
let JBIN_Q_BIN = '69b30dbbb7ec241ddc62e1c3';

export function loadJBinConfig() {
  try {
    const c = JSON.parse(localStorage.getItem('rmJBin') || '{}');
    if (c.apiKey) JBIN_API_KEY = c.apiKey;
    if (c.teamsBin) JBIN_TEAMS_BIN = c.teamsBin;
    if (c.qBin) JBIN_Q_BIN = c.qBin;
  } catch {}
}

export function saveJBinToLS(k: string, tb: string, qb: string) {
  if (k) JBIN_API_KEY = k;
  if (tb) JBIN_TEAMS_BIN = tb;
  if (qb) JBIN_Q_BIN = qb;
  localStorage.setItem('rmJBin', JSON.stringify({ apiKey: k, teamsBin: tb, qBin: qb }));
}

export async function jbGet(bin: string): Promise<any> {
  if (!JBIN_API_KEY || !bin) return null;
  try {
    const r = await fetch(`${JBIN_BASE}/${bin}/latest`, {
      headers: { 'X-Master-Key': JBIN_API_KEY, 'X-Bin-Meta': 'false' }
    });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

export async function jbPut(bin: string, data: any): Promise<boolean> {
  if (!JBIN_API_KEY || !bin) return false;
  try {
    const r = await fetch(`${JBIN_BASE}/${bin}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': JBIN_API_KEY },
      body: JSON.stringify(data)
    });
    return r.ok;
  } catch { return false; }
}

export function getTeamsBinId() { return JBIN_TEAMS_BIN; }
export function getQBinId() { return JBIN_Q_BIN; }
export function getJBinConfig() {
  const c = JSON.parse(localStorage.getItem('rmJBin') || '{}');
  return { apiKey: c.apiKey || '', teamsBin: c.teamsBin || '', qBin: c.qBin || '' };
}

// Initialize on import
loadJBinConfig();
