// Storage layer and page rendering. Run with: npm test
import { createServer } from 'vite'

// Minimal browser stand-ins so the app code can run under Node.
const makeStorage = (opts = {}) => {
  const m = new Map()
  return {
    getItem: (k) => (opts.broken ? (() => { throw new Error('blocked') })() : (m.has(k) ? m.get(k) : null)),
    setItem: (k, v) => { if (opts.broken) throw new Error('blocked'); m.set(k, String(v)) },
    removeItem: (k) => m.delete(k),
    key: (i) => [...m.keys()][i],
    get length() { return m.size },
    _m: m
  }
}
const setEnv = (ls, hash = '') => {
  globalThis.localStorage = ls
  globalThis.window = { location: { hash }, addEventListener() {}, removeEventListener() {} }
  Object.defineProperty(globalThis, 'Object', { value: Object })
}

let pass = 0, fail = 0
const check = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${ok ? '' : extra}`) }

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { createRequire } = await import('node:module')
  const req = createRequire(import.meta.url)
  const { renderToString } = req('react-dom/server')
  const React = req('react')
  const Page = (await vite.ssrLoadModule('/src/app.jsx')).default
  const store = await vite.ssrLoadModule('/src/store.js')
  const { demoUsers } = await vite.ssrLoadModule('/src/data.js')
  const render = () => renderToString(React.createElement(Page))

  // 1. Every route renders without throwing
  for (const p of ['', 'home', 'projects', 'learn', 'community', 'activity', 'profile', 'nonsense']) {
    setEnv(makeStorage(), p ? `#/${p}` : '')
    store.storage.resetDemoData()
    let html = ''
    try { html = render(); check(`route "${p || '(empty)'}" renders`, html.length > 500) }
    catch (e) { check(`route "${p}" renders`, false, e.message) }
  }

  // 2. Seed data and user switching
  setEnv(makeStorage(), '#/profile'); store.storage.resetDemoData()
  check('seed has 6 demo profiles', store.storage.get('profiles').length === 6)
  check('seed has 7 communities', store.storage.get('communities').length === 7)
  check('default user is Aarav Nair', render().includes('Aarav Nair'))
  store.switchUser('stu_003')
  check('switching user changes profile page', render().includes('Rohan Desai'))
  const persisted = JSON.parse(globalThis.localStorage.getItem('collabspace:session'))
  check('selected user persisted to storage', persisted.userId === 'stu_003')

  // 3. Storage API
  const s = store.storage
  s.insert('notifications', { id: 'n_001', message: 'hi' })
  check('insert adds a record', s.get('notifications').length === 1)
  s.update('notifications', 'n_001', { message: 'changed' })
  check('update patches a record', s.get('notifications')[0].message === 'changed')
  check('nextId continues numbering', store.nextId('n', 'notifications') === 'n_002')
  s.remove('notifications', 'n_001')
  check('remove deletes a record', s.get('notifications').length === 0)

  // 4. Persistence across a "refresh" (fresh module state, same localStorage)
  const ls = makeStorage(); setEnv(ls, '#/home'); store.storage.resetDemoData()
  store.storage.insert('notifications', { id: 'n_009', message: 'keep me' })
  const saved = ls.getItem('collabspace:notifications')
  check('data written to localStorage', saved && saved.includes('keep me'))
  const vite2Mod = await vite.ssrLoadModule('/src/store.js?refresh=1')
  setEnv(ls, '#/home')
  check('data survives a refresh', vite2Mod.storage.get('notifications').some((r) => r.id === 'n_009'))

  // 5. Corrupted JSON does not crash the app
  const bad = makeStorage(); bad.setItem('collabspace:profiles', '{not json'); setEnv(bad, '#/home')
  const badMod = await vite.ssrLoadModule('/src/store.js?bad=1')
  let ok = true; try { ok = badMod.storage.get('profiles').length === 6 } catch { ok = false }
  check('malformed JSON falls back to demo data', ok)

  // 6. Unavailable storage does not crash and shows a warning
  const broken = makeStorage({ broken: true }); setEnv(broken, '#/home')
  const brokenMod = await vite.ssrLoadModule('/src/store.js?broken=1')
  let html2 = ''; try { brokenMod.storage.get('profiles'); html2 = 'ok' } catch (e) { html2 = e.message }
  check('unavailable storage does not throw', html2 === 'ok', html2)

  // 7. Reset restores the demo data
  setEnv(makeStorage(), '#/home'); store.storage.resetDemoData()
  store.storage.remove('profiles', 'stu_001'); store.storage.resetDemoData()
  check('reset restores demo data', store.storage.get('profiles').length === 6)
} finally { await vite.close() }
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
