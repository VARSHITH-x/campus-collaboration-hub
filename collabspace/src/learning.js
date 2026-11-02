// Learning & Mentorship rules (Member B's module): profiles, offers, requests,
// mentorship matches, learning circles and milestones.
import { storage, nextId } from './store.js'
import { notify, notifyAll, nameOf } from './notify.js'
import { ok, fail, failFields, clean, toInt, splitList, isoNow, checkLinks } from './util.js'

export const LEVELS = ['complete beginner', 'some basics', 'intermediate', 'any level']
export const OFFER_FORMATS = ['one-to-one', 'small group', 'async feedback']
export const REQUEST_FORMATS = ['peer group', 'mentor support', 'either']
export const MODES = ['mentor', 'learner', 'peer learner', 'contributor']
export const STALE_DAYS = 30
const OPEN_MATCH = ['pending', 'accepted']

const all = (c) => storage.get(c)
const one = (c, id) => all(c).find((r) => r.id === id)

export const getStudentProfile = (id) => one('profiles', id)

// ---- Profiles ---------------------------------------------------------------
export function updateProfile(userId, targetId, f) {
  if (userId !== targetId) return fail('You can only edit your own profile.')
  const e = {}
  const v = {
    displayName: clean(f.displayName),
    year: toInt(f.year),
    branch: clean(f.branch),
    bio: clean(f.bio),
    skillsKnown: splitList(f.skillsKnown),
    skillsLearning: splitList(f.skillsLearning),
    topicsInterested: splitList(f.topicsInterested),
    topicsCanTeach: splitList(f.topicsCanTeach),
    availabilityHours: toInt(f.availabilityHours),
    participationModes: (f.participationModes || []).filter((m) => MODES.includes(m))
  }
  if (v.displayName.length < 2 || v.displayName.length > 60) e.displayName = 'Use a name of 2 to 60 characters.'
  if (!(v.year >= 1 && v.year <= 6)) e.year = 'Year must be a whole number from 1 to 6.'
  if (v.branch.length < 2 || v.branch.length > 40) e.branch = 'Enter your branch (2 to 40 characters).'
  if (v.bio.length > 300) e.bio = 'Keep your introduction under 300 characters.'
  if (!(v.availabilityHours >= 0 && v.availabilityHours <= 60)) e.availabilityHours = 'Hours per week must be from 0 to 60.'
  if (Object.keys(e).length) return failFields(e)
  storage.update('profiles', targetId, v)
  return ok()
}

// ---- Mentor offers ----------------------------------------------------------
export function createOffer(userId, f) {
  const e = {}
  const v = {
    topic: clean(f.topic),
    description: clean(f.description),
    audienceLevel: f.audienceLevel,
    format: f.format,
    availability: clean(f.availability)
  }
  if (v.topic.length < 3 || v.topic.length > 80) e.topic = 'Name the topic (3 to 80 characters).'
  if (v.description.length < 15 || v.description.length > 500) e.description = 'Explain what you can help with and its limits (15 to 500 characters).'
  if (!LEVELS.includes(v.audienceLevel)) e.audienceLevel = 'Choose who this is for.'
  if (!OFFER_FORMATS.includes(v.format)) e.format = 'Choose a format.'
  if (v.availability.length < 3 || v.availability.length > 100) e.availability = 'Say when you are available (3 to 100 characters).'
  if (Object.keys(e).length) return failFields(e)
  storage.insert('mentorOffers', { id: nextId('offer', 'mentorOffers'), mentorId: userId, ...v, status: 'open', createdAt: isoNow() })
  return ok()
}

export function closeOffer(offerId, userId) {
  const offer = one('mentorOffers', offerId)
  if (!offer) return fail('That offer no longer exists.')
  if (offer.mentorId !== userId) return fail('Only the mentor can close this offer.')
  if (offer.status !== 'open') return fail('This offer is already closed.')
  storage.update('mentorOffers', offerId, { status: 'completed' })
  return ok()
}

// ---- Learning requests --------------------------------------------------------
export function createLearningRequest(userId, f) {
  const e = {}
  const v = {
    topic: clean(f.topic),
    currentLevel: f.currentLevel,
    targetOutcome: clean(f.targetOutcome),
    durationDays: toInt(f.durationDays),
    weeklyHours: toInt(f.weeklyHours),
    preferredFormat: f.preferredFormat
  }
  if (v.topic.length < 3 || v.topic.length > 80) e.topic = 'Name the topic (3 to 80 characters).'
  if (!LEVELS.includes(v.currentLevel) || v.currentLevel === 'any level') e.currentLevel = 'Choose your current level.'
  if (v.targetOutcome.length < 10 || v.targetOutcome.length > 300) e.targetOutcome = 'Describe what you want to be able to do (10 to 300 characters).'
  if (!(v.durationDays >= 1 && v.durationDays <= 180)) e.durationDays = 'Duration must be 1 to 180 days.'
  if (!(v.weeklyHours >= 1 && v.weeklyHours <= 40)) e.weeklyHours = 'Weekly hours must be 1 to 40.'
  if (!REQUEST_FORMATS.includes(v.preferredFormat)) e.preferredFormat = 'Choose the help you prefer.'
  if (Object.keys(e).length) return failFields(e)
  storage.insert('learningRequests', { id: nextId('lreq', 'learningRequests'), requesterId: userId, ...v, status: 'open', createdAt: isoNow(), outcome: '' })
  return ok()
}

export function finishRequest(reqId, userId, outcome) {
  const req = one('learningRequests', reqId)
  if (!req) return fail('That request no longer exists.')
  if (req.requesterId !== userId) return fail('Only the person who posted this request can finish it.')
  if (req.status !== 'open') return fail('This request is not open.')
  if (clean(outcome).length < 10) return failFields({ outcome: 'Write a short learning outcome (at least 10 characters).' })
  storage.update('learningRequests', reqId, { status: 'completed', outcome: clean(outcome) })
  return ok()
}

export function cancelRequest(reqId, userId) {
  const req = one('learningRequests', reqId)
  if (!req) return fail('That request no longer exists.')
  if (req.requesterId !== userId) return fail('Only the person who posted this request can cancel it.')
  if (req.status !== 'open') return fail('This request is not open.')
  storage.update('learningRequests', reqId, { status: 'withdrawn' })
  return ok()
}

// ---- Mentorship matches -------------------------------------------------------
// kind "request": a learner asks a mentor, through one of the mentor's offers.
// kind "offer":   a mentor or peer responds to someone's learning request.
function createMatch(userId, toId, target, topic, message, kind) {
  const m = clean(message)
  if (m.length < 10 || m.length > 400) return failFields({ message: 'Write a short note (10 to 400 characters).' })
  if (all('mentorshipRequests').some((r) => r.fromId === userId && r.toId === toId && r.offerId === target.offerId &&
      r.learningRequestId === target.learningRequestId && OPEN_MATCH.includes(r.status)))
    return fail('You already have an active message for this.')
  storage.insert('mentorshipRequests', {
    id: nextId('mreq', 'mentorshipRequests'), kind, fromId: userId, toId, ...target, topic, message: m, status: 'pending', createdAt: isoNow()
  })
  notify(toId, 'mentorship', kind === 'request'
    ? `${nameOf(userId)} asked you to mentor them in ${topic}.` : `${nameOf(userId)} offered help with ${topic}.`, 'learn')
  return ok()
}

export function requestMentorship(userId, offerId, message) {
  const offer = one('mentorOffers', offerId)
  if (!offer) return fail('That offer no longer exists.')
  if (offer.status !== 'open') return fail('This offer is no longer open.')
  if (offer.mentorId === userId) return fail('You cannot request your own offer.')
  return createMatch(userId, offer.mentorId, { offerId, learningRequestId: null }, offer.topic, message, 'request')
}

export function offerHelp(userId, requestId, message) {
  const req = one('learningRequests', requestId)
  if (!req) return fail('That request no longer exists.')
  if (req.status !== 'open') return fail('This request is no longer open.')
  if (req.requesterId === userId) return fail('You cannot respond to your own request.')
  return createMatch(userId, req.requesterId, { offerId: null, learningRequestId: requestId }, req.topic, message, 'offer')
}

export function respondMentorship(id, userId, decision) {
  const r = one('mentorshipRequests', id)
  if (!r) return fail('That message no longer exists.')
  if (r.toId !== userId) return fail('Only the person it was sent to can answer.')
  if (r.status !== 'pending') return fail('This has already been answered.')
  if (decision !== 'accepted' && decision !== 'declined') return fail('Unknown decision.')
  storage.update('mentorshipRequests', id, { status: decision })
  notify(r.fromId, 'mentorship', `${nameOf(userId)} ${decision} your message about ${r.topic}.`, 'learn')
  return ok()
}

export function withdrawMentorship(id, userId) {
  const r = one('mentorshipRequests', id)
  if (!r) return fail('That message no longer exists.')
  if (r.fromId !== userId) return fail('You can only withdraw your own messages.')
  if (r.status !== 'pending') return fail('Only pending messages can be withdrawn.')
  storage.update('mentorshipRequests', id, { status: 'withdrawn' })
  return ok()
}

// ---- Learning circles ---------------------------------------------------------
export function createCircle(userId, f) {
  const e = {}
  const v = {
    topic: clean(f.topic),
    targetOutcome: clean(f.targetOutcome),
    durationDays: toInt(f.durationDays),
    maxMembers: toInt(f.maxMembers)
  }
  if (v.topic.length < 3 || v.topic.length > 80) e.topic = 'Name the topic (3 to 80 characters).'
  if (v.targetOutcome.length < 10 || v.targetOutcome.length > 300) e.targetOutcome = 'Describe the target outcome (10 to 300 characters).'
  if (!(v.durationDays >= 1 && v.durationDays <= 180)) e.durationDays = 'Duration must be 1 to 180 days.'
  if (!(v.maxMembers >= 2 && v.maxMembers <= 12)) e.maxMembers = 'A circle needs 2 to 12 members.'
  if (Object.keys(e).length) return failFields(e)
  const id = nextId('circle', 'circles')
  storage.insert('circles', { id, creatorId: userId, ...v, memberIds: [userId], status: 'open', createdAt: isoNow(), summary: '' })
  return ok({ id })
}

// A milestone is "completed" only when every current member has ticked it.
function refreshMilestones(circleId) {
  const circle = one('circles', circleId)
  storage.save('milestones', all('milestones').map((m) => {
    if (m.circleId !== circleId) return m
    const done = circle.memberIds.length > 0 && circle.memberIds.every((id) => m.completedBy.includes(id))
    return { ...m, status: done ? 'completed' : 'open' }
  }))
}

export function joinCircle(circleId, userId) {
  const c = one('circles', circleId)
  if (!c) return fail('That circle no longer exists.')
  if (c.status !== 'open') return fail('This circle is closed.')
  if (c.memberIds.includes(userId)) return fail('You are already in this circle.')
  if (c.memberIds.length >= c.maxMembers) return fail('This circle is full.')
  storage.update('circles', circleId, { memberIds: [...c.memberIds, userId] })
  refreshMilestones(circleId)
  notify(c.creatorId, 'circle', `${nameOf(userId)} joined your ${c.topic} circle.`, `learn/${circleId}`)
  return ok()
}

export function leaveCircle(circleId, userId) {
  const c = one('circles', circleId)
  if (!c) return fail('That circle no longer exists.')
  if (!c.memberIds.includes(userId)) return fail('You are not in this circle.')
  if (c.creatorId === userId) return fail('The creator cannot leave. Finish the circle instead.')
  if (c.status !== 'open') return fail('This circle is closed.')
  storage.update('circles', circleId, { memberIds: c.memberIds.filter((id) => id !== userId) })
  refreshMilestones(circleId)
  return ok()
}

export function completeCircle(circleId, userId, summary) {
  const c = one('circles', circleId)
  if (!c) return fail('That circle no longer exists.')
  if (c.creatorId !== userId) return fail('Only the creator can finish the circle.')
  if (c.status !== 'open') return fail('This circle is already closed.')
  if (clean(summary).length < 10) return failFields({ summary: 'Write a short learning outcome (at least 10 characters).' })
  storage.update('circles', circleId, { status: 'completed', summary: clean(summary) })
  notifyAll(c.memberIds, 'circle', `The ${c.topic} circle was finished.`, `learn/${circleId}`, userId)
  return ok()
}

export const milestonesOf = (circleId) =>
  all('milestones').filter((m) => m.circleId === circleId).sort((a, b) => a.order - b.order)

export function addMilestone(circleId, userId, f) {
  const c = one('circles', circleId)
  if (!c) return fail('That circle no longer exists.')
  if (c.creatorId !== userId) return fail('Only the creator can edit the pathway.')
  if (c.status !== 'open') return fail('This circle is closed.')
  const e = {}
  const v = { title: clean(f.title), description: clean(f.description), resourceLinks: splitList(f.resourceLinks) }
  if (v.title.length < 3 || v.title.length > 80) e.title = 'Give the milestone a title of 3 to 80 characters.'
  if (v.description.length > 300) e.description = 'Keep the description under 300 characters.'
  checkLinks(v.resourceLinks, e, 'resourceLinks')
  if (Object.keys(e).length) return failFields(e)
  const order = Math.max(0, ...milestonesOf(circleId).map((m) => m.order)) + 1
  storage.insert('milestones', { id: nextId('ms', 'milestones'), circleId, ...v, order, status: 'open', completedBy: [] })
  return ok()
}

export function removeMilestone(id, userId) {
  const m = one('milestones', id)
  if (!m) return fail('That milestone no longer exists.')
  const c = one('circles', m.circleId)
  if (c.creatorId !== userId) return fail('Only the creator can edit the pathway.')
  if (c.status !== 'open') return fail('This circle is closed.')
  storage.remove('milestones', id)
  return ok()
}

export function toggleMilestone(id, userId) {
  const m = one('milestones', id)
  if (!m) return fail('That milestone no longer exists.')
  const c = one('circles', m.circleId)
  if (!c.memberIds.includes(userId)) return fail('Only circle members can update progress.')
  if (c.status !== 'open') return fail('This circle is closed.')
  const has = m.completedBy.includes(userId)
  storage.update('milestones', id, { completedBy: has ? m.completedBy.filter((x) => x !== userId) : [...m.completedBy, userId] })
  refreshMilestones(c.id)
  return ok()
}

// ---- Stale items --------------------------------------------------------------
// Open offers, open requests and unanswered messages older than STALE_DAYS expire,
// so old opportunities never look active forever.
export function expireStale(now = Date.now()) {
  const limit = now - STALE_DAYS * 86400000
  const stale = (r) => Date.parse(r.createdAt) < limit
  let changed = 0
  const sweep = (name, from) => {
    const rows = all(name)
    if (!rows.some((r) => r.status === from && stale(r))) return
    storage.save(name, rows.map((r) => {
      if (r.status === from && stale(r)) { changed++; return { ...r, status: 'expired' } }
      return r
    }))
  }
  sweep('mentorOffers', 'open')
  sweep('learningRequests', 'open')
  sweep('mentorshipRequests', 'pending')
  return changed
}
