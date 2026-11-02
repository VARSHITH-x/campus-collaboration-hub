// Small helpers shared by the rule files and the pages.

// Every rule function returns one of these two shapes.
export const ok = (data = {}) => ({ ok: true, ...data })
export const fail = (error) => ({ ok: false, error, errors: {} })
export const failFields = (errors) => ({ ok: false, error: 'Please fix the highlighted fields.', errors })

export const clean = (v) => String(v ?? '').trim()
export const toInt = (v) => (/^\d+$/.test(clean(v)) ? parseInt(clean(v), 10) : NaN)
export const splitList = (v) => [...new Set(String(v ?? '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean))]
export const joinList = (a) => (a || []).join(', ')

export const isUrl = (s) => {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
export const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const localToday = () => ymd(new Date())
export const daysFromNow = (n) => ymd(new Date(Date.now() + n * 86400000))
export const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()
export const isoNow = () => new Date().toISOString()

export const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

// Checks a list of links; writes an error under `field` if any is not a web link.
export function checkLinks(list, errors, field) {
  if (list.some((x) => !isUrl(x))) errors[field] = 'Resources must be full web links starting with http:// or https://'
}
