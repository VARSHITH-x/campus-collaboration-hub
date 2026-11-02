// In-app notifications, in the shared format from the work plan:
// { id, recipientId, eventType, message, relatedEntityType, relatedEntityId, createdAt, read }
// Rule functions call notify() after a successful action, never as filler.
import { storage, nextId } from './store.js'
import { isoNow } from './util.js'

export const nameOf = (id) => storage.get('profiles').find((p) => p.id === id)?.displayName || 'Someone'

// A router path such as "projects/opp_001" becomes a related entity, and back.
function entityFromRoute(route) {
  const [page, id = ''] = route.split('/')
  if (page === 'projects' && id) return ['opportunity', id]
  if (page === 'learn') return id ? ['circle', id] : ['learning', '']
  if (page === 'community') return id === 'moderation' ? ['report', ''] : id ? ['community', id] : ['', '']
  return ['', '']
}

export function routeFor(n) {
  const id = n.relatedEntityId
  if (n.relatedEntityType === 'opportunity') return `projects/${id}`
  if (n.relatedEntityType === 'circle') return `learn/${id}`
  if (n.relatedEntityType === 'learning') return 'learn'
  if (n.relatedEntityType === 'community') return `community/${id}`
  if (n.relatedEntityType === 'report') return 'community/moderation'
  return ''
}

export function notify(recipientId, eventType, message, route = '') {
  if (!recipientId) return
  const [relatedEntityType, relatedEntityId] = entityFromRoute(route)
  storage.insert('notifications', {
    id: nextId('notif', 'notifications'), recipientId, eventType, message,
    relatedEntityType, relatedEntityId, createdAt: isoNow(), read: false
  })
}

export function notifyAll(recipientIds, eventType, message, route = '', exceptId = null) {
  ;[...new Set(recipientIds)].filter((id) => id !== exceptId).forEach((id) => notify(id, eventType, message, route))
}

export const unreadCount = (userId) =>
  storage.get('notifications').filter((n) => n.recipientId === userId && !n.read).length

export function markRead(id, userId) {
  const n = storage.get('notifications').find((x) => x.id === id)
  if (n && n.recipientId === userId && !n.read) storage.update('notifications', id, { read: true })
}

export function markAllRead(userId) {
  const rows = storage.get('notifications')
  if (!rows.some((n) => n.recipientId === userId && !n.read)) return
  storage.save('notifications', rows.map((n) => (n.recipientId === userId ? { ...n, read: true } : n)))
}
