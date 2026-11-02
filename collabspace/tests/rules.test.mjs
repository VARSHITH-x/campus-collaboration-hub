// Business rules for all three modules (validation, permissions, lifecycles). Run with: npm test
import { createServer } from 'vite'
import { createRequire } from 'node:module'

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i], get length() { return m.size } } }
const env = (hash = '') => { globalThis.localStorage = mem(); globalThis.window = { location: { hash }, addEventListener() {}, removeEventListener() {} } }
let pass = 0, fail = 0
const t = (name, ok, extra = '') => { ok ? pass++ : fail++; if (!ok) console.log(`FAIL  ${name} ${extra}`) }
const bad = (name, r, text) => t(name, r.ok === false && (!text || (r.error + JSON.stringify(r.errors)).toLowerCase().includes(text.toLowerCase())), JSON.stringify(r))
const good = (name, r) => t(name, r.ok === true, JSON.stringify(r))

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const req = createRequire(import.meta.url)
  const { renderToString } = req('react-dom/server'); const React = req('react')
  const L = (p) => vite.ssrLoadModule(p)
  const store = await L('/src/store.js'); const C = await L('/src/collab.js'); const Lr = await L('/src/learning.js'); const Cm = await L('/src/community.js')
  const App = (await L('/src/app.jsx')).default
  const S = store.storage
  const reset = () => { env(); S.resetDemoData() }
  const tomorrow = (await L('/src/util.js')).daysFromNow(5)
  const oppForm = { title: 'Smart plant monitor', description: 'Build a soil moisture monitor for the hostel garden.', expectedOutcome: 'A working sensor with a small dashboard.', nextStep: 'Order the sensor and meet on Saturday.', category: 'Hardware', experience: 'mixed-level', durationDays: '14', weeklyHours: '4', deadline: tomorrow }
  const roleForm = { roleTitle: 'Firmware dev', openings: '1', requiredSkills: 'C, ADC', preferredSkills: '', beginnerFriendly: false, deliverable: 'Sensor driver', learningResources: '' }

  // ---------- Render every page as every user ----------
  for (const u of S.get('profiles') ?? []) { /* warm */ }
  reset()
  const routes = ['', 'home', 'projects', 'projects/opp_001', 'projects/opp_003', 'projects/nope', 'learn', 'learn/circle_001', 'learn/nope', 'community', 'community/com_001', 'community/com_005', 'community/moderation', 'community/nope', 'profile', 'profile/stu_003', 'profile/nope', 'activity']
  for (const uid of ['stu_001', 'stu_002', 'stu_003', 'stu_004', 'stu_005', 'mod_001']) {
    for (const r of routes) {
      env(r ? `#/${r}` : ''); S.resetDemoData(); store.switchUser(uid)
      try { const h = renderToString(React.createElement(App)); t(`render ${uid} ${r}`, h.length > 400) } catch (e) { t(`render ${uid} ${r}`, false, e.message) }
    }
  }

  // ---------- Collaborate ----------
  reset()
  bad('create: empty form rejected', C.createOpportunity('stu_001', {}, {}), 'title')
  bad('create: short description', C.createOpportunity('stu_001', { ...oppForm, description: 'short' }, roleForm), 'description')
  bad('create: past deadline', C.createOpportunity('stu_001', { ...oppForm, deadline: '2020-01-01' }, roleForm), 'past')
  bad('create: bad hours', C.createOpportunity('stu_001', { ...oppForm, weeklyHours: '99' }, roleForm), 'hours')
  bad('create: fractional duration', C.createOpportunity('stu_001', { ...oppForm, durationDays: '2.5' }, roleForm), 'duration')
  bad('create: needs a role', C.createOpportunity('stu_001', oppForm, { ...roleForm, roleTitle: '' }), 'roleTitle')
  bad('create: bad resource link', C.createOpportunity('stu_001', oppForm, { ...roleForm, learningResources: 'not a link' }), 'links')
  const before = S.get('opportunities').length
  const made = C.createOpportunity('stu_001', oppForm, roleForm)
  good('create: valid project', made)
  t('create: stored + role created', S.get('opportunities').length === before + 1 && C.rolesOf(made.id).length === 1)
  t('create: starts open', S.get('opportunities').find((o) => o.id === made.id).status === 'open')

  const rid = C.rolesOf(made.id)[0].id
  bad('edit: non-owner blocked', C.updateOpportunity(made.id, 'stu_002', oppForm), 'owner')
  good('edit: owner can edit', C.updateOpportunity(made.id, 'stu_001', { ...oppForm, title: 'Smart plant monitor v2' }))
  t('edit: saved', S.get('opportunities').find((o) => o.id === made.id).title.endsWith('v2'))

  bad('apply: own project', C.applyToRole('stu_001', rid, { message: 'I would like to help.', weeklyHours: '4' }), 'own')
  bad('apply: too short', C.applyToRole('stu_002', rid, { message: 'hi', weeklyHours: '4' }), 'message')
  bad('apply: bad hours', C.applyToRole('stu_002', rid, { message: 'I can write the driver code.', weeklyHours: '0' }), 'hours')
  good('apply: valid', C.applyToRole('stu_002', rid, { message: 'I can write the driver code.', weeklyHours: '4', knownSkills: 'C, Python' }))
  bad('apply: duplicate active blocked', C.applyToRole('stu_002', rid, { message: 'Applying again please.', weeklyHours: '4' }), 'already')
  good('apply: other student ok', C.applyToRole('stu_003', rid, { message: 'I also want this role please.', weeklyHours: '3' }))

  const a2 = S.get('applications').find((a) => a.roleId === rid && a.applicantId === 'stu_002')
  const a3 = S.get('applications').find((a) => a.roleId === rid && a.applicantId === 'stu_003')
  bad('accept: non-owner blocked', C.respondToApplication(a2.id, 'stu_002', 'accepted'), 'owner')
  good('accept: owner accepts', C.respondToApplication(a2.id, 'stu_001', 'accepted'))
  t('accept: project becomes forming', S.get('opportunities').find((o) => o.id === made.id).status === 'forming')
  t('accept: team has applicant', C.teamIds(S.get('opportunities').find((o) => o.id === made.id)).includes('stu_002'))
  bad('accept: full role blocks second accept', C.respondToApplication(a3.id, 'stu_001', 'accepted'), 'full')
  bad('accept: already answered', C.respondToApplication(a2.id, 'stu_001', 'declined'), 'already')
  good('decline: owner declines', C.respondToApplication(a3.id, 'stu_001', 'declined'))
  bad('reapply to a now-full role is blocked', C.applyToRole('stu_003', rid, { message: 'Trying again with more detail.', weeklyHours: '3' }), 'full')
  bad('apply: full role blocked', C.applyToRole('stu_004', rid, { message: 'Can I still join this one?', weeklyHours: '3' }), 'full')

  bad('role remove: has applicants', C.removeRole(rid, 'stu_001'), 'applicants')
  bad('task: assignee must be on team', C.createTask(made.id, 'stu_001', { title: 'Wire the sensor', assigneeId: 'stu_004', dueDate: tomorrow }), 'team')
  bad('task: past due date', C.createTask(made.id, 'stu_001', { title: 'Wire the sensor', assigneeId: 'stu_002', dueDate: '2020-01-01' }), 'past')
  bad('task: non-owner blocked', C.createTask(made.id, 'stu_002', { title: 'Wire the sensor', assigneeId: 'stu_002', dueDate: tomorrow }), 'owner')
  good('task: valid', C.createTask(made.id, 'stu_001', { title: 'Wire the sensor', assigneeId: 'stu_002', dueDate: tomorrow }))
  const task = S.get('tasks').find((x) => x.title === 'Wire the sensor')
  bad('task: owner cannot skip to completed', C.updateTaskStatus(task.id, 'stu_001', 'completed'), 'cannot')
  bad('task: wrong user cannot start', C.updateTaskStatus(task.id, 'stu_004', 'in_progress'), 'cannot')
  good('task: assignee starts', C.updateTaskStatus(task.id, 'stu_002', 'in_progress'))
  good('task: assignee submits', C.updateTaskStatus(task.id, 'stu_002', 'submitted'))
  bad('task: change request needs note', C.updateTaskStatus(task.id, 'stu_001', 'in_progress', ''), 'note')
  good('task: owner requests changes', C.updateTaskStatus(task.id, 'stu_001', 'in_progress', 'Add a calibration step'))
  t('task: review note stored', S.get('tasks').find((x) => x.id === task.id).reviewNote === 'Add a calibration step')
  C.updateTaskStatus(task.id, 'stu_002', 'submitted')
  good('task: owner accepts work', C.updateTaskStatus(task.id, 'stu_001', 'completed'))

  bad('complete: forming cannot jump to completed', C.transitionOpportunity(made.id, 'stu_001', 'completed', 'All done now.'), 'cannot')
  bad('activate: non-owner blocked', C.transitionOpportunity(made.id, 'stu_002', 'active'), 'owner')
  good('activate: owner closes recruitment', C.transitionOpportunity(made.id, 'stu_001', 'active'))
  bad('apply after closing', C.applyToRole('stu_004', rid, { message: 'Late application here.', weeklyHours: '3' }), 'recruiting')
  t('pending applicants declined on close', S.get('applications').filter((a) => a.opportunityId === made.id && a.status === 'pending').length === 0)
  bad('complete: needs summary', C.transitionOpportunity(made.id, 'stu_001', 'completed', 'x'), 'summary')
  good('complete: with summary', C.transitionOpportunity(made.id, 'stu_001', 'completed', 'Built and demoed the sensor.'))
  bad('edit: completed locked', C.updateOpportunity(made.id, 'stu_001', oppForm), 'cannot')
  bad('task: locked after completion', C.createTask(made.id, 'stu_001', { title: 'Another task', assigneeId: 'stu_002', dueDate: tomorrow }), 'forming or active')
  good('archive: completed -> archived', C.transitionOpportunity(made.id, 'stu_001', 'archived'))
  bad('archive: cannot move again', C.transitionOpportunity(made.id, 'stu_001', 'active'), 'cannot')

  // decline then reapply on a role that still has room
  reset()
  good('seed: decline pending app', C.respondToApplication('app_003', 'stu_003', 'declined'))
  good('reapply after decline allowed', C.applyToRole('stu_002', 'role_003', { message: 'Trying again with more detail.', weeklyHours: '3' }))
  // withdraw + unassign
  reset()
  const w = C.applyToRole('stu_004', 'role_003', { message: 'I would like to help design.', weeklyHours: '3' })
  good('withdraw setup', w)
  const wa = S.get('applications').find((a) => a.applicantId === 'stu_004' && a.roleId === 'role_003')
  bad('withdraw: only applicant', C.withdrawApplication(wa.id, 'stu_003'), 'own')
  good('withdraw: applicant', C.withdrawApplication(wa.id, 'stu_004'))
  good('reapply after withdraw', C.applyToRole('stu_004', 'role_003', { message: 'Changed my mind, I can help.', weeklyHours: '3' }))
  // Aarav's seed project: Dev (accepted) has an in-progress task; leaving unassigns it
  const devApp = S.get('applications').find((a) => a.id === 'app_002')
  good('leave project (accepted)', C.withdrawApplication(devApp.id, 'stu_005'))
  t('leave: task unassigned', S.get('tasks').find((x) => x.id === 'task_001').assigneeId === null)
  t('leave: status reset', S.get('tasks').find((x) => x.id === 'task_001').status === 'not_started')
  t('leave: forming reverts to open', S.get('opportunities').find((o) => o.id === 'opp_001').status === 'open')
  good('add role to project', C.addRole('opp_002', 'stu_003', roleForm))
  bad('add role: non-owner', C.addRole('opp_002', 'stu_001', roleForm), 'owner')

  // ---------- Learning ----------
  reset()
  bad('profile: others blocked', Lr.updateProfile('stu_001', 'stu_002', {}), 'own')
  bad('profile: empty rejected', Lr.updateProfile('stu_001', 'stu_001', { displayName: '', year: '3', branch: 'ECE', availabilityHours: '5' }), 'name')
  bad('profile: bad year', Lr.updateProfile('stu_001', 'stu_001', { displayName: 'Aarav', year: '9', branch: 'ECE', availabilityHours: '5' }), 'year')
  good('profile: valid update', Lr.updateProfile('stu_001', 'stu_001', { displayName: 'Aarav Nair', year: '3', branch: 'ECE', bio: 'Updated bio', skillsKnown: 'C, Rust, C', skillsLearning: '', topicsInterested: 'Robotics', topicsCanTeach: '', availabilityHours: '7', participationModes: ['mentor', 'bogus'] }))
  const p1 = S.get('profiles').find((p) => p.id === 'stu_001')
  t('profile: lists deduped + trimmed', JSON.stringify(p1.skillsKnown) === '["C","Rust"]')
  t('profile: invalid mode dropped', JSON.stringify(p1.participationModes) === '["mentor"]')
  t('profile: role preserved', p1.role === 'student')

  bad('offer: empty', Lr.createOffer('stu_001', {}), 'topic')
  good('offer: valid', Lr.createOffer('stu_004', { topic: 'SystemVerilog help', description: 'Help with testbenches and assertions.', audienceLevel: 'some basics', format: 'one-to-one', availability: 'Weekends' }))
  bad('mentorship: own offer', Lr.requestMentorship('stu_001', 'offer_001', 'I would like to learn this.'), 'own')
  bad('mentorship: short note', Lr.requestMentorship('stu_005', 'offer_001', 'hi'), 'note')
  good('mentorship: request', Lr.requestMentorship('stu_005', 'offer_001', 'I am a beginner who wants to learn STM32.'))
  bad('mentorship: duplicate blocked', Lr.requestMentorship('stu_005', 'offer_001', 'Sending the same request again.'), 'already')
  const mr = S.get('mentorshipRequests').find((m) => m.fromId === 'stu_005' && m.offerId === 'offer_001')
  bad('mentorship: wrong person answers', Lr.respondMentorship(mr.id, 'stu_002', 'accepted'), 'sent to')
  good('mentorship: mentor accepts', Lr.respondMentorship(mr.id, 'stu_001', 'accepted'))
  bad('mentorship: already answered', Lr.respondMentorship(mr.id, 'stu_001', 'declined'), 'already')
  bad('mentorship: withdraw only pending', Lr.withdrawMentorship(mr.id, 'stu_005'), 'pending')
  good('mentorship: decline other', Lr.respondMentorship('mreq_002', 'stu_005', 'declined'))
  good('offer help: valid', Lr.offerHelp('stu_003', 'lreq_002', 'I can run a three-session Arduino start.'))
  bad('offer help: own request', Lr.offerHelp('stu_005', 'lreq_002', 'Helping myself should fail here.'), 'own')
  const om = S.get('mentorshipRequests').find((m) => m.fromId === 'stu_003' && m.learningRequestId === 'lreq_002')
  good('withdraw pending', Lr.withdrawMentorship(om.id, 'stu_003'))
  bad('request: invalid', Lr.createLearningRequest('stu_002', { topic: 'x' }), 'topic')
  good('request: valid', Lr.createLearningRequest('stu_002', { topic: 'Signal processing', currentLevel: 'some basics', targetOutcome: 'Understand FFT well enough to explain it.', durationDays: '21', weeklyHours: '5', preferredFormat: 'either' }))
  bad('request: finish by other user', Lr.finishRequest('lreq_001', 'stu_003', 'Learned a great deal here.'), 'posted')
  bad('request: finish needs outcome', Lr.finishRequest('lreq_001', 'stu_002', 'ok'), 'outcome')
  good('request: finish', Lr.finishRequest('lreq_001', 'stu_002', 'Cleaned a CSV and made three charts.'))
  bad('request: finish twice', Lr.finishRequest('lreq_001', 'stu_002', 'Cleaned a CSV and made three charts.'), 'not open')
  good('request: cancel', Lr.cancelRequest('lreq_002', 'stu_005'))

  // circles
  bad('circle: invalid', Lr.createCircle('stu_001', { topic: 'x' }), 'topic')
  const cc = Lr.createCircle('stu_001', { topic: 'Embedded basics', targetOutcome: 'Everyone blinks an LED from scratch.', durationDays: '14', maxMembers: '2' })
  good('circle: create', cc)
  bad('circle: already member', Lr.joinCircle(cc.id, 'stu_001'), 'already')
  good('circle: join', Lr.joinCircle(cc.id, 'stu_002'))
  bad('circle: full', Lr.joinCircle(cc.id, 'stu_003'), 'full')
  bad('circle: creator cannot leave', Lr.leaveCircle(cc.id, 'stu_001'), 'creator')
  bad('milestone: non-creator', Lr.addMilestone(cc.id, 'stu_002', { title: 'Blink an LED' }), 'creator')
  bad('milestone: bad link', Lr.addMilestone(cc.id, 'stu_001', { title: 'Blink an LED', resourceLinks: 'nope' }), 'links')
  good('milestone 1', Lr.addMilestone(cc.id, 'stu_001', { title: 'Blink an LED', resourceLinks: 'https://example.com/led' }))
  good('milestone 2', Lr.addMilestone(cc.id, 'stu_001', { title: 'Read a sensor' }))
  const ms = Lr.milestonesOf(cc.id)
  t('milestones ordered', ms[0].order === 1 && ms[1].order === 2)
  bad('toggle: non-member', Lr.toggleMilestone(ms[0].id, 'stu_004'), 'members')
  Lr.toggleMilestone(ms[0].id, 'stu_001')
  t('milestone not complete until all members done', Lr.milestonesOf(cc.id)[0].status === 'open')
  Lr.toggleMilestone(ms[0].id, 'stu_002')
  t('milestone completes when all done', Lr.milestonesOf(cc.id)[0].status === 'completed')
  good('member leaves', Lr.leaveCircle(cc.id, 'stu_002'))
  Lr.toggleMilestone(ms[0].id, 'stu_001')
  Lr.toggleMilestone(ms[0].id, 'stu_001')
  good('untick works', Lr.toggleMilestone(ms[0].id, 'stu_001'))
  bad('circle: finish non-creator', Lr.completeCircle(cc.id, 'stu_002', 'We learned LED blinking well.'), 'creator')
  bad('circle: finish needs summary', Lr.completeCircle(cc.id, 'stu_001', 'x'), 'summary')
  good('circle: finish', Lr.completeCircle(cc.id, 'stu_001', 'We learned LED blinking well.'))
  bad('circle: closed cannot join', Lr.joinCircle(cc.id, 'stu_004'), 'closed')
  bad('circle: closed locks milestones', Lr.toggleMilestone(ms[0].id, 'stu_001'), 'closed')

  // stale expiry
  reset()
  const future = Date.now() + 40 * 86400000
  t('expire: nothing fresh expires', Lr.expireStale() === 0)
  t('expire: old items expire', Lr.expireStale(future) > 0)
  t('expire: statuses set', S.get('mentorOffers').every((o) => o.status === 'expired'))

  // ---------- Community ----------
  reset()
  bad('post: not a member', Cm.createPost('stu_004', 'com_005', { postType: 'discussion', title: 'Hello there', content: 'Some content here.' }), 'join')
  good('join community', Cm.joinCommunity('stu_004', 'com_005'))
  bad('join twice', Cm.joinCommunity('stu_004', 'com_005'), 'already')
  bad('post: empty title', Cm.createPost('stu_004', 'com_005', { postType: 'discussion', title: '', content: 'Some content here.' }), 'title')
  bad('post: resource needs link', Cm.createPost('stu_004', 'com_005', { postType: 'resource', title: 'Good paper', sourceUrl: 'javascript:alert(1)' }), 'link')
  bad('post: poll needs two options', Cm.createPost('stu_004', 'com_005', { postType: 'poll', title: 'Pick one', pollOptions: 'only one' }), 'options')
  bad('post: duplicate poll options', Cm.createPost('stu_004', 'com_005', { postType: 'poll', title: 'Pick one', pollOptions: 'Same\nsame' }), 'options')
  good('post: discussion', Cm.createPost('stu_004', 'com_005', { postType: 'discussion', title: 'Hello there', content: 'Some content here.' }))
  good('post: resource', Cm.createPost('stu_004', 'com_005', { postType: 'resource', title: 'Good paper', sourceUrl: 'https://arxiv.org/abs/1706.03762' }))
  const poll = Cm.createPost('stu_004', 'com_005', { postType: 'poll', title: 'Best framework?', pollOptions: 'PyTorch\nJAX\n TensorFlow ' })
  good('post: poll', poll)
  const pp = S.get('posts').find((p) => p.id === poll.id)
  t('poll options parsed', pp.pollOptions.length === 3 && pp.pollOptions[2].text === 'TensorFlow')
  bad('vote: invalid option', Cm.votePoll('stu_002', poll.id, 'opt_9'), 'options')
  good('vote: first', Cm.votePoll('stu_002', poll.id, 'opt_1'))
  bad('vote: only one per user', Cm.votePoll('stu_002', poll.id, 'opt_2'), 'already')
  t('vote: counted once', S.get('votes').filter((v) => v.postId === poll.id).length === 1)
  bad('vote: not a poll', Cm.votePoll('stu_002', 'post_002', 'opt_1'), 'poll')

  bad('comment: empty', Cm.addComment('stu_002', 'post_002', '   '), 'content')
  good('comment: valid', Cm.addComment('stu_001', 'post_002', 'Try the original paper after a visual guide.'))
  const c1 = S.get('comments').find((c) => c.authorId === 'stu_001')
  good('comment: reply', Cm.addComment('stu_002', 'post_002', 'Thanks for the tip!', c1.id))
  bad('comment: reply to wrong post', Cm.addComment('stu_002', 'post_003', 'Wrong thread reply here.', c1.id), 'cannot')
  good('react: add', Cm.toggleReaction('stu_001', 'post_002', 'like'))
  t('react: stored', S.get('reactions').some((r) => r.postId === 'post_002' && r.userId === 'stu_001' && r.reactionType === 'like'))
  good('react: toggle off', Cm.toggleReaction('stu_001', 'post_002', 'like'))
  t('react: removed', !S.get('reactions').some((r) => r.postId === 'post_002' && r.userId === 'stu_001' && r.reactionType === 'like'))
  bad('react: unknown type', Cm.toggleReaction('stu_001', 'post_002', 'angry'), 'unknown')
  good('save', Cm.toggleSave('stu_001', 'post_002')); good('unsave', Cm.toggleSave('stu_001', 'post_002'))
  t('save toggled off', S.get('saved').length === 0)

  bad('pin: student blocked', Cm.pinPost('stu_001', 'post_002', true), 'moderator')
  good('pin: moderator', Cm.pinPost('mod_001', 'post_002', true))
  bad('report: own content', Cm.reportEntity('stu_003', 'post', 'post_002', 'This is wrong somehow'), 'own')
  bad('report: reason too short', Cm.reportEntity('stu_001', 'post', 'post_002', 'bad'), 'reason')
  good('report: valid', Cm.reportEntity('stu_001', 'post', 'post_002', 'Looks like spam to me'))
  t('report: post flagged', S.get('posts').find((p) => p.id === 'post_002').status === 'reported')
  t('report: reported posts stay visible', Cm.isVisible(S.get('posts').find((p) => p.id === 'post_002')))
  bad('report: duplicate', Cm.reportEntity('stu_001', 'post', 'post_002', 'Looks like spam to me'), 'already')
  const rep = S.get('reports')[0]
  bad('resolve: student blocked', Cm.resolveReport('stu_001', rep.id, 'dismissed'), 'moderator')
  good('resolve: dismissed restores post', Cm.resolveReport('mod_001', rep.id, 'dismissed'))
  t('dismissed -> published again', S.get('posts').find((p) => p.id === 'post_002').status === 'published')
  bad('resolve: twice', Cm.resolveReport('mod_001', rep.id, 'dismissed'), 'already')
  Cm.reportEntity('stu_002', 'comment', c1.id, 'Off topic and rude')
  const rep2 = S.get('reports').find((r) => r.entityType === 'comment')
  good('resolve: remove content', Cm.resolveReport('mod_001', rep2.id, 'actioned'))
  t('comment removed', S.get('comments').find((c) => c.id === c1.id).status === 'removed')
  bad('delete: other student blocked', Cm.deletePost('stu_002', poll.id), 'author')
  good('delete: author', Cm.deletePost('stu_004', poll.id))
  bad('removed post unavailable', Cm.toggleReaction('stu_001', poll.id, 'like'), 'not available')
  good('delete: moderator', Cm.deletePost('mod_001', 'post_005'))
  good('leave community', Cm.leaveCommunity('stu_004', 'com_005'))


  // ---------- Opportunity must state a first step; stale open projects expire ----------
  reset()
  bad('create: first step required', C.createOpportunity('stu_001', { ...oppForm, nextStep: '' }, roleForm), 'nextStep')
  bad('create: first step too long', C.createOpportunity('stu_001', { ...oppForm, nextStep: 'x'.repeat(201) }, roleForm), 'nextStep')
  const old = C.createOpportunity('stu_001', { ...oppForm, deadline: tomorrow }, roleForm)
  good('expire: setup project', old)
  const oldRole = C.rolesOf(old.id)[0].id
  C.applyToRole('stu_002', oldRole, { message: 'I would like to help with this.', weeklyHours: '3' })
  t('expire: nothing expires before the deadline', C.expireOpportunities() === 0)
  t('expire: past-deadline open project archived', C.expireOpportunities('2999-01-01') >= 1)
  const arch = S.get('opportunities').find((o) => o.id === old.id)
  t('expire: status archived with note', arch.status === 'archived' && arch.outcomeSummary.includes('deadline passed') && !!arch.archivedAt)
  t('expire: waiting applicant declined', S.get('applications').find((a) => a.opportunityId === old.id).status === 'declined')
  t('expire: owner and applicant told', S.get('notifications').filter((n) => n.eventType === 'project' || n.eventType === 'application').length >= 2)
  t('expire: running again changes nothing', C.expireOpportunities('2999-01-01') === 0)
  reset()
  C.respondToApplication('app_003', 'stu_003', 'accepted')
  const formingOnes = S.get('opportunities').filter((o) => o.status === 'forming').length
  C.expireOpportunities('2999-01-01')
  t('expire: forming projects are not auto-archived', S.get('opportunities').filter((o) => o.status === 'forming').length === formingOnes)

  // ---------- Persistence ----------
  reset(); C.createOpportunity('stu_001', oppForm, roleForm)
  const ls = globalThis.localStorage
  const fresh = await L('/src/store.js?p=1'); globalThis.localStorage = ls
  t('persist: project survives refresh', fresh.storage.get('opportunities').some((o) => o.title === 'Smart plant monitor'))
} finally { await vite.close() }
console.log(`${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
