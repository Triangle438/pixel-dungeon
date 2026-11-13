/** Reads `?seed=123` from a URL query string. Returns null if it is missing or not a valid whole number. */
export function parseSeed(search: string): number | null {
  const raw = new URLSearchParams(search).get('seed')
  if (raw === null || !/^\d{1,10}$/.test(raw)) return null
  const n = Number(raw)
  return n <= 0xffffffff ? n : null
}
