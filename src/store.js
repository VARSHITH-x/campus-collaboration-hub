// Shared storage + tiny hash router.
// All modules read and write data ONLY through this file.
import { useSyncExternalStore } from 'react'
import { seed } from './data.js'

const PREFIX = 'collabspace:'
const listeners = new Set()
const cache = {}
const status = { error: '' }

const clone = (x) => JSON.parse(JSON.stringify(x))
const emit = () => listeners.forEach((fn) => fn())
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

function persist(name, value) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value))
  } catch {
    status.error = 'Browser storage is unavailable, so changes will be lost when you close this tab.'
  }
}

function load(name) {
  let value
  try {
    const raw = localStorage.getItem(PREFIX + name)
    if (raw !== null) value = JSON.parse(raw)
  } catch {
    status.error = `Saved "${name}" data was damaged, so the demo data was restored.`
  }
  if (value === undefined) {
    value = clone(seed[name] ?? [])
    persist(name, value)
  }
  return value
}

export const storage = {
  get(name) {
    if (!(name in cache)) cache[name] = load(name)
    return cache[name]
  },
  save(name, records) {
    cache[name] = records
    persist(name, records)
    emit()
  },
  insert(name, record) {
    this.save(name, [...this.get(name), record])
    return record
  },
  update(name, id, patch) {
    this.save(name, this.get(name).map((r) => (r.id === id ? { ...r, ...patch } : r)))
  },
  remove(name, id) {
    this.save(name, this.get(name).filter((r) => r.id !== id))
  },
  resetDemoData() {
    try {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
      keys.filter((k) => k && k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k))
    } catch { /* storage unavailable: nothing to clear */ }
    Object.keys(cache).forEach((k) => delete cache[k])
    status.error = ''
    emit()
  }
}

// React hooks ---------------------------------------------------------
export const useCollection = (name) =>
  useSyncExternalStore(subscribe, () => storage.get(name), () => storage.get(name))

export const useStorageError = () =>
  useSyncExternalStore(subscribe, () => status.error, () => '')

export function useCurrentUser() {
  const profiles = useCollection('profiles')
  const session = useCollection('session')
  return profiles.find((p) => p.id === session.userId) || profiles[0]
}

// Demo user switching. This is NOT authentication.
export const switchUser = (userId) => storage.save('session', { userId })

// Simple ids like opp_001: prefix + next number in that collection.
export function nextId(prefix, collection) {
  const nums = storage.get(collection).map((r) => parseInt(String(r.id).split('_')[1], 10) || 0)
  return `${prefix}_${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
}

// Router: the page is the first part of the URL hash, e.g. #/projects/opp_001
const getHash = () => window.location.hash.replace(/^#\/?/, '')
const subHash = (fn) => {
  window.addEventListener('hashchange', fn)
  return () => window.removeEventListener('hashchange', fn)
}

export function useRoute() {
  const hash = useSyncExternalStore(subHash, getHash, () => '')
  const [page = 'home', ...rest] = hash.split('/')
  return { page: page || 'home', rest }
}

export const go = (path) => { window.location.hash = '#/' + path }
