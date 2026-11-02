// Cross-module behavior: notifications, the idea-to-project bridge, dashboard. Run with: npm test
import { createServer } from 'vite'
import { createRequire } from 'node:module'
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i], get length() { return m.size } } }
const env = (hash = '') => { globalThis.localStorage = mem(); globalThis.window = { location: { hash }, addEventListener() {}, removeEventListener() {} } }
let pass = 0, fail = 0
const t = (n, ok, x = '') => { ok ? pass++ : fail++; if (!ok) console.log('FAIL', n, x) }
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const req = createRequire(import.meta.url)
  const { renderToString } = req('react-dom/server'); const React = req('react')
  const L = (p) => vite.ssrLoadModule(p)
  const store = await L('/src/store.js'); const C = await L('/src/collab.js'); const Lr = await L('/src/learning.js'); const Cm = await L('/src/community.js'); const N = await L('/src/notify.js')
  const App = (await L('/src/app.jsx')).default; const S = store.storage
  const reset = () => { env(); S.resetDemoData() }
  const notes = (uid, type) => S.get('notifications').filter((n) => n.recipientId === uid && (!type || n.eventType === type))
  const has = (uid, text) => notes(uid).some((n) => n.message.includes(text))
  const soon = (await L('/src/util.js')).daysFromNow(5)
  const roleForm = { roleTitle: 'Tester', openings: '1', requiredSkills: '', preferredSkills: '', beginnerFriendly: true, deliverable: 'Test report', learningResources: '' }

  // Applications -> owner / applicant notified
  reset()
  C.applyToRole('stu_004', 'role_004', { message: 'I know JavaScript well enough.', weeklyHours: '4' })
  t('owner told about new application', has('stu_003', 'Sana Khan applied for "Frontend developer (React)"'))
  t('notification stores the shared format', (() => { const n = notes('stu_003')[0]; return n.recipientId === 'stu_003' && n.eventType === 'application' && n.relatedEntityType === 'opportunity' && n.relatedEntityId === 'opp_002' && n.read === false && !!n.createdAt && !('link' in n) })())
  t('notification maps back to a route', N.routeFor(notes('stu_003')[0]) === 'projects/opp_002')
  const ap = S.get('applications').find((a) => a.applicantId === 'stu_004' && a.roleId === 'role_004')
  C.respondToApplication(ap.id, 'stu_003', 'accepted')
  t('applicant told they were accepted', has('stu_004', 'accepted into Campus bus timetable web app'))
  C.respondToApplication('app_003', 'stu_003', 'declined')
  t('applicant told they were declined', has('stu_002', 'was declined'))
  t('no self-notification for actor', notes('stu_003').length === 1)

  // Tasks
  C.createTask('opp_002', 'stu_003', { title: 'Build timetable screen', assigneeId: 'stu_004', dueDate: soon })
  t('assignee told about new task', has('stu_004', 'New task in Campus bus timetable web app: Build timetable screen'))
  const tk = S.get('tasks').find((x) => x.title === 'Build timetable screen')
  C.updateTaskStatus(tk.id, 'stu_004', 'in_progress'); C.updateTaskStatus(tk.id, 'stu_004', 'submitted')
  t('owner told about submitted task', has('stu_003', 'submitted "Build timetable screen"'))
  C.updateTaskStatus(tk.id, 'stu_003', 'in_progress', 'Handle empty timetable')
  t('assignee told changes requested with note', has('stu_004', 'Changes requested') && has('stu_004', 'Handle empty timetable'))
  C.updateTaskStatus(tk.id, 'stu_004', 'submitted'); C.updateTaskStatus(tk.id, 'stu_003', 'completed')
  t('assignee told task accepted', has('stu_004', 'was accepted'))

  // Lifecycle -> team + waiting applicants
  C.applyToRole('stu_005', 'role_003', { message: 'Happy to help with screens.', weeklyHours: '3' })
  C.transitionOpportunity('opp_002', 'stu_003', 'active')
  t('team told project under way', has('stu_004', 'is now under way'))
  t('waiting applicant told recruitment closed', has('stu_005', 'closed recruitment'))
  t('owner not notified of own action', !has('stu_003', 'is now under way'))
  C.transitionOpportunity('opp_002', 'stu_003', 'completed', 'Shipped the timetable app.')
  t('team told project completed', has('stu_004', 'was completed'))

  // Leaving a project tells the owner
  reset()
  C.withdrawApplication('app_002', 'stu_005')
  t('owner told member left', has('stu_001', 'Dev Patil left'))

  // Mentorship
  reset()
  Lr.requestMentorship('stu_005', 'offer_001', 'I want to learn STM32 from scratch.')
  t('mentor told about request', has('stu_001', 'asked you to mentor them in STM32 guidance'))
  const mr = S.get('mentorshipRequests').find((m) => m.fromId === 'stu_005' && m.offerId === 'offer_001')
  Lr.respondMentorship(mr.id, 'stu_001', 'accepted')
  t('learner told it was accepted', has('stu_005', 'accepted your message about STM32 guidance'))
  Lr.offerHelp('stu_003', 'lreq_002', 'I can guide you through Arduino basics.')
  t('requester told about offer of help', has('stu_005', 'offered help with Arduino'))
  Lr.joinCircle('circle_001', 'stu_004')
  t('circle creator told about new member', has('stu_002', 'Sana Khan joined your Python for data analysis circle'))
  Lr.completeCircle('circle_001', 'stu_002', 'Everyone finished a small analysis.')
  t('members told circle finished', has('stu_004', 'circle was finished') && has('stu_005', 'circle was finished'))
  t('creator not told about own action', !has('stu_002', 'circle was finished'))

  // Community
  reset()
  Cm.addComment('stu_001', 'post_002', 'Great question, I would read the paper after a video.')
  t('post author told about comment', has('stu_003', 'Aarav Nair commented on'))
  const cm = S.get('comments').find((c) => c.authorId === 'stu_001' && c.postId === 'post_002')
  Cm.addComment('stu_003', 'post_002', 'Thanks, will try.', cm.id)
  t('comment author told about reply', has('stu_001', 'replied to your comment'))
  const before = notes('stu_003').length
  Cm.addComment('stu_003', 'post_002', 'Adding my own follow-up note.')
  t('no notification for commenting on own post', notes('stu_003').length === before)
  Cm.pinPost('mod_001', 'post_002', true)
  t('author told post pinned', has('stu_003', 'pinned your post'))
  Cm.reportEntity('stu_001', 'post', 'post_005', 'This looks like spam content')
  t('moderator told about report', notes('mod_001', 'report').length === 1)
  const rep = S.get('reports')[0]
  Cm.resolveReport('mod_001', rep.id, 'actioned')
  t('reporter told content removed', has('stu_001', 'removed the content you reported'))
  t('author told content removed', has('stu_002', 'removed one of your posts'))

  // Read / unread
  reset()
  C.applyToRole('stu_004', 'role_004', { message: 'I know JavaScript well enough.', weeklyHours: '4' })
  C.applyToRole('stu_005', 'role_004', { message: 'I am learning JavaScript now.', weeklyHours: '4' })
  t('unread count', N.unreadCount('stu_003') === 2)
  const first = notes('stu_003')[0]
  N.markRead(first.id, 'stu_001')
  t('other user cannot mark as read', N.unreadCount('stu_003') === 2)
  N.markRead(first.id, 'stu_003')
  t('mark one read', N.unreadCount('stu_003') === 1)
  N.markAllRead('stu_003')
  t('mark all read', N.unreadCount('stu_003') === 0)
  t('other users unaffected', N.unreadCount('stu_001') === 0)

  // Bridge: community idea -> project
  reset()
  const oppForm = { title: 'Lost and found board', description: 'A simple board where students post lost items with photos and contact.', expectedOutcome: 'A deployed board used by the hostel.', category: 'Campus improvement', experience: 'beginner-friendly', durationDays: '21', weeklyHours: '3', deadline: '', nextStep: 'Meet the hostel reps this week.', sourcePostId: 'post_005' }
  const res = C.createOpportunity('stu_004', oppForm, roleForm)
  t('bridge: project created', res.ok)
  t('bridge: source post stored', S.get('opportunities').find((o) => o.id === res.id).sourcePostId === 'post_005')
  t('bridge: post author told', has('stu_002', 'turned your post "The lost-and-found messages get buried in chats" into a project'))
  const own = C.createOpportunity('stu_002', { ...oppForm, title: 'Lost and found board v2' }, roleForm)
  t('bridge: no self-notification', notes('stu_002').filter((n) => n.eventType === 'bridge').length === 1)
  const bogus = C.createOpportunity('stu_004', { ...oppForm, title: 'Another board idea', sourcePostId: 'post_999' }, roleForm)
  t('bridge: unknown post ignored safely', bogus.ok && S.get('opportunities').find((o) => o.id === bogus.id).sourcePostId === null)


  // Report a project -> moderator reviews / archives
  reset()
  const rp = Cm.reportEntity('stu_002', 'opportunity', 'opp_002', 'Description is misleading')
  t('report project: recorded', rp.ok && S.get('reports')[0].entityType === 'opportunity' && S.get('reports')[0].entityId === 'opp_002')
  t('report project: status stays valid (not "reported")', S.get('opportunities').find((o) => o.id === 'opp_002').status === 'open')
  t('report project: owner cannot report own', Cm.reportEntity('stu_003', 'opportunity', 'opp_002', 'Reporting myself here').ok === false)
  t('report project: duplicate blocked', Cm.reportEntity('stu_002', 'opportunity', 'opp_002', 'Description is misleading').ok === false)
  t('report project: archived cannot be reported', Cm.reportEntity('stu_002', 'opportunity', 'opp_003', 'Old project report').ok === false)
  t('report project: moderator told', notes('mod_001', 'report').length === 1 && N.routeFor(notes('mod_001', 'report')[0]) === 'community/moderation')
  const prep = S.get('reports')[0]
  t('report project: student cannot resolve', Cm.resolveReport('stu_001', prep.id, 'actioned').ok === false)
  t('report project: moderator archives it', Cm.resolveReport('mod_001', prep.id, 'actioned').ok === true)
  const parch = S.get('opportunities').find((o) => o.id === 'opp_002')
  t('report project: archived with record kept', parch.status === 'archived' && parch.outcomeSummary.includes('moderator') && !!parch.archivedAt)
  t('report project: pending applicants declined', S.get('applications').find((a) => a.id === 'app_003').status === 'declined')
  t('report project: owner told', has('stu_003', 'archived your project'))
  Cm.reportEntity('stu_002', 'opportunity', 'opp_001', 'Looks fine but checking')
  Cm.resolveReport('mod_001', S.get('reports').find((r) => r.entityId === 'opp_001').id, 'dismissed')
  t('report project: dismissed leaves project untouched', S.get('opportunities').find((o) => o.id === 'opp_001').status === 'forming')

  // Dashboard + pages render with real data
  for (const uid of ['stu_001', 'stu_002', 'stu_003', 'stu_004', 'stu_005', 'mod_001']) {
    for (const r of ['home', 'activity', 'projects/opp_002', 'community/com_001']) {
      env('#/' + r); S.resetDemoData(); store.switchUser(uid)
      C.applyToRole('stu_004', 'role_004', { message: 'I know JavaScript well enough.', weeklyHours: '4' })
      try { t(`render ${uid} ${r}`, renderToString(React.createElement(App)).length > 500) } catch (e) { t(`render ${uid} ${r}`, false, e.message) }
    }
  }
  env('#/home'); S.resetDemoData(); store.switchUser('stu_003')
  C.applyToRole('stu_004', 'role_004', { message: 'I know JavaScript well enough.', weeklyHours: '4' })
  let html = renderToString(React.createElement(App))
  t('dashboard: pending application surfaced', html.includes('pending application') && html.includes('Campus bus timetable web app'))
  store.switchUser('stu_002'); html = renderToString(React.createElement(App))
  t('dashboard: role match for known skill', html.includes('Matches:') || html.includes('Roles that match'))
  t('dashboard: mentor match for learning topic', html.includes('Python for data analysis'))
  store.switchUser('mod_001'); S.insert('reports', { id: 'rep_x', entityType: 'post', entityId: 'post_002', reporterId: 'stu_001', reason: 'spam spam', status: 'open', createdAt: new Date().toISOString() })
  html = renderToString(React.createElement(App))
  t('dashboard: moderator sees open report', html.includes('open report'))
  env('#/activity'); S.resetDemoData(); store.switchUser('stu_003')
  C.applyToRole('stu_004', 'role_004', { message: 'I know JavaScript well enough.', weeklyHours: '4' })
  html = renderToString(React.createElement(App))
  t('nav shows unread badge', html.includes('class="count"'))
  t('activity lists notification', html.includes('Sana Khan applied for'))
} finally { await vite.close() }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
