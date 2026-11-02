// Campus Community rules (Member C's module): posts, comments, reactions,
// polls, announcements, saving, reporting and moderation.
import { storage, nextId } from './store.js'
import { notify, nameOf } from './notify.js'
import { ok, fail, failFields, clean, isUrl, isoNow } from './util.js'

export const POST_TYPES = ['discussion', 'question', 'resource', 'poll', 'announcement']
export const REACTIONS = ['like', 'helpful', 'insightful']
const VISIBLE = ['published', 'reported']

const all = (c) => storage.get(c)
const one = (c, id) => all(c).find((r) => r.id === id)

export const isVisible = (item) => VISIBLE.includes(item.status)
export const isModerator = (userId) => one('profiles', userId)?.role === 'moderator'
const needMod = (userId) => (isModerator(userId) ? null : fail('Only a moderator can do that.'))

// ---- Membership ---------------------------------------------------------------
export function joinCommunity(userId, communityId) {
  const c = one('communities', communityId)
  if (!c) return fail('That community no longer exists.')
  if (c.memberIds.includes(userId)) return fail('You are already a member.')
  storage.update('communities', communityId, { memberIds: [...c.memberIds, userId] })
  return ok()
}

export function leaveCommunity(userId, communityId) {
  const c = one('communities', communityId)
  if (!c) return fail('That community no longer exists.')
  if (!c.memberIds.includes(userId)) return fail('You are not a member.')
  storage.update('communities', communityId, { memberIds: c.memberIds.filter((id) => id !== userId) })
  return ok()
}

// ---- Posts --------------------------------------------------------------------
function checkPost(f) {
  const e = {}
  const v = { postType: f.postType, title: clean(f.title), content: clean(f.content), sourceUrl: clean(f.sourceUrl), pollOptions: [] }
  if (!POST_TYPES.includes(v.postType)) e.postType = 'Choose a post type.'
  if (v.title.length < 3 || v.title.length > 120) e.title = 'Give the post a title of 3 to 120 characters.'
  if (v.content.length > 5000) e.content = 'Keep the post under 5000 characters.'

  if (['discussion', 'question', 'announcement'].includes(v.postType) && v.content.length < 5)
    e.content = 'Write at least a few words of content.'

  if (v.postType === 'resource') {
    if (!isUrl(v.sourceUrl)) e.sourceUrl = 'Enter a full web link starting with http:// or https://'
  } else {
    v.sourceUrl = ''
  }

  if (v.postType === 'poll') {
    const lines = String(f.pollOptions ?? '').split('\n').map(clean).filter(Boolean)
    const unique = [...new Map(lines.map((l) => [l.toLowerCase(), l])).values()]
    if (unique.length < 2 || unique.length > 6) e.pollOptions = 'Give 2 to 6 different options, one per line.'
    else if (unique.some((o) => o.length > 60)) e.pollOptions = 'Keep each option under 60 characters.'
    else v.pollOptions = unique.map((text, i) => ({ id: `opt_${i + 1}`, text }))
  }
  return { errors: e, value: v }
}

export function createPost(userId, communityId, f) {
  const c = one('communities', communityId)
  if (!c) return fail('That community no longer exists.')
  if (!c.memberIds.includes(userId) && !isModerator(userId)) return fail('Join this community before posting.')
  const { errors, value } = checkPost(f)
  if (Object.keys(errors).length) return failFields(errors)
  const id = nextId('post', 'posts')
  storage.insert('posts', { id, communityId, authorId: userId, ...value, pinned: false, status: 'published', createdAt: isoNow() })
  return ok({ id })
}

export function deletePost(userId, postId) {
  const p = one('posts', postId)
  if (!p) return fail('That post no longer exists.')
  if (p.authorId !== userId && !isModerator(userId)) return fail('Only the author or a moderator can delete a post.')
  storage.update('posts', postId, { status: 'removed', pinned: false })
  return ok()
}

export function pinPost(userId, postId, pinned) {
  const denied = needMod(userId)
  if (denied) return denied
  const p = one('posts', postId)
  if (!p || !isVisible(p)) return fail('That post is not available.')
  storage.update('posts', postId, { pinned: !!pinned })
  if (pinned && p.authorId !== userId) notify(p.authorId, 'post', `A moderator pinned your post "${p.title}".`, `community/${p.communityId}`)
  return ok()
}

// ---- Comments, reactions, polls, saved posts -----------------------------------
export function addComment(userId, postId, content, parentId = null) {
  const p = one('posts', postId)
  if (!p || !isVisible(p)) return fail('That post is not available.')
  const text = clean(content)
  if (!text) return failFields({ content: 'Write something before posting.' })
  if (text.length > 1000) return failFields({ content: 'Keep comments under 1000 characters.' })
  if (parentId) {
    const parent = one('comments', parentId)
    if (!parent || parent.postId !== postId || !isVisible(parent)) return fail('You cannot reply to that comment.')
  }
  storage.insert('comments', {
    id: nextId('cmt', 'comments'), postId, authorId: userId, parentCommentId: parentId, content: text, createdAt: isoNow(), status: 'published'
  })
  const link = `community/${p.communityId}`
  const parentAuthor = parentId ? one('comments', parentId).authorId : null
  if (parentAuthor && parentAuthor !== userId) notify(parentAuthor, 'comment', `${nameOf(userId)} replied to your comment on "${p.title}".`, link)
  if (p.authorId !== userId && p.authorId !== parentAuthor) notify(p.authorId, 'comment', `${nameOf(userId)} commented on "${p.title}".`, link)
  return ok()
}

export function toggleReaction(userId, postId, type) {
  const p = one('posts', postId)
  if (!p || !isVisible(p)) return fail('That post is not available.')
  if (!REACTIONS.includes(type)) return fail('Unknown reaction.')
  const existing = all('reactions').find((r) => r.postId === postId && r.userId === userId && r.reactionType === type)
  if (existing) storage.remove('reactions', existing.id)
  else storage.insert('reactions', { id: nextId('rx', 'reactions'), postId, userId, reactionType: type })
  return ok()
}

export function votePoll(userId, postId, optionId) {
  const p = one('posts', postId)
  if (!p || !isVisible(p) || p.postType !== 'poll') return fail('That poll is not available.')
  if (!p.pollOptions.some((o) => o.id === optionId)) return fail('Choose one of the options.')
  if (all('votes').some((v) => v.postId === postId && v.userId === userId)) return fail('You have already voted in this poll.')
  storage.insert('votes', { id: nextId('vote', 'votes'), postId, userId, optionId })
  return ok()
}

export function toggleSave(userId, postId) {
  const p = one('posts', postId)
  if (!p || !isVisible(p)) return fail('That post is not available.')
  const existing = all('saved').find((s) => s.postId === postId && s.userId === userId)
  if (existing) storage.remove('saved', existing.id)
  else storage.insert('saved', { id: nextId('save', 'saved'), postId, userId })
  return ok()
}

// ---- Reporting and moderation ----------------------------------------------------
const COLLECTION = { post: 'posts', comment: 'comments', opportunity: 'opportunities' }
const ownerOf = (item) => item.authorId ?? item.creatorId
const reportable = (type, item) => (type === 'opportunity' ? item.status !== 'archived' : isVisible(item))

export function reportEntity(userId, entityType, entityId, reason) {
  const col = COLLECTION[entityType]
  const item = col && one(col, entityId)
  if (!item || !reportable(entityType, item)) return fail('That item is not available.')
  if (ownerOf(item) === userId) return fail('You cannot report your own content.')
  const text = clean(reason)
  if (text.length < 5 || text.length > 300) return failFields({ reason: 'Explain the problem in 5 to 300 characters.' })
  if (all('reports').some((r) => r.entityType === entityType && r.entityId === entityId && r.reporterId === userId && r.status === 'open'))
    return fail('You have already reported this.')
  storage.insert('reports', {
    id: nextId('rep', 'reports'), entityType, entityId, reporterId: userId, reason: text, status: 'open', createdAt: isoNow()
  })
  if (entityType !== 'opportunity' && item.status === 'published') storage.update(col, entityId, { status: 'reported' })
  all('profiles').filter((u) => u.role === 'moderator').forEach((m) => notify(m.id, 'report', `New report to review: ${text}`, 'community/moderation'))
  return ok()
}

// action: "reviewed" (looked at, keep visible), "dismissed" (report was wrong), "actioned" (remove the content)
export function resolveReport(userId, reportId, action) {
  const denied = needMod(userId)
  if (denied) return denied
  const r = one('reports', reportId)
  if (!r) return fail('That report no longer exists.')
  if (r.status !== 'open') return fail('This report has already been handled.')
  if (!['reviewed', 'dismissed', 'actioned'].includes(action)) return fail('Unknown action.')
  const col = COLLECTION[r.entityType]
  storage.update('reports', reportId, { status: action })
  if (action === 'actioned' && r.entityType === 'opportunity') {
    // A project is archived, not deleted, so its record stays viewable.
    storage.save('applications', all('applications').map((a) => (a.opportunityId === r.entityId && a.status === 'pending' ? { ...a, status: 'declined' } : a)))
    storage.update(col, r.entityId, { status: 'archived', archivedAt: isoNow(), outcomeSummary: 'Archived by a moderator after a report.' })
  } else if (action === 'actioned') {
    storage.update(col, r.entityId, { status: 'removed', pinned: false })
  } else {
    const stillOpen = all('reports').some((x) => x.id !== reportId && x.entityType === r.entityType && x.entityId === r.entityId && x.status === 'open')
    const item = one(col, r.entityId)
    if (item && item.status === 'reported' && !stillOpen) storage.update(col, r.entityId, { status: 'published' })
  }
  notify(r.reporterId, 'report', action === 'actioned' ? 'Thanks. A moderator removed the content you reported.' : 'A moderator reviewed your report. No removal was needed.', '')
  if (action === 'actioned') {
    const item = one(col, r.entityId)
    if (item) notify(ownerOf(item), 'post', r.entityType === 'opportunity' ? `A moderator archived your project "${item.title}" after a report.` : 'A moderator removed one of your posts or comments for breaking the community guidelines.', '')
  }
  return ok()
}
