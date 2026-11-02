import { daysAgo as ago, daysFromNow as ahead } from './util.js'

// Demo data. Every record here is clearly fictional (see README).
// "role" is a small addition to the StudentProfile contract so the
// demo moderator can be told apart from ordinary students.

export const demoUsers = [
  {
    id: 'stu_001', role: 'student', displayName: 'Aarav Nair', year: 3, branch: 'ECE',
    bio: 'Building a small line-following robot and looking for teammates.',
    skillsKnown: ['Embedded C', 'STM32', 'Soldering'], skillsLearning: ['PCB design', 'ROS'],
    topicsInterested: ['Robotics', 'Embedded Systems'], topicsCanTeach: ['STM32 basics'],
    availabilityHours: 6, participationModes: ['mentor', 'contributor']
  },
  {
    id: 'stu_002', role: 'student', displayName: 'Meera Iyer', year: 2, branch: 'CSE',
    bio: 'Second year, new to data analysis and keen to learn with peers.',
    skillsKnown: ['Python basics', 'HTML'], skillsLearning: ['Pandas', 'Data analysis'],
    topicsInterested: ['AI/ML', 'Data'], topicsCanTeach: [],
    availabilityHours: 8, participationModes: ['learner', 'peer learner']
  },
  {
    id: 'stu_003', role: 'student', displayName: 'Rohan Desai', year: 4, branch: 'CSE',
    bio: 'Final year. Happy to guide juniors on Python and web basics.',
    skillsKnown: ['Python', 'React', 'Git', 'SQL'], skillsLearning: ['System design'],
    topicsInterested: ['Web', 'AI/ML'], topicsCanTeach: ['Python', 'Git', 'React basics'],
    availabilityHours: 4, participationModes: ['mentor', 'contributor']
  },
  {
    id: 'stu_004', role: 'student', displayName: 'Sana Khan', year: 3, branch: 'ECE',
    bio: 'Interested in VLSI and design verification.',
    skillsKnown: ['Verilog', 'Digital design'], skillsLearning: ['SystemVerilog', 'UVM'],
    topicsInterested: ['VLSI', 'Research'], topicsCanTeach: ['Verilog basics'],
    availabilityHours: 5, participationModes: ['mentor', 'peer learner']
  },
  {
    id: 'stu_005', role: 'student', displayName: 'Dev Patil', year: 1, branch: 'Mechanical',
    bio: 'First year. Curious about robotics and happy to do any task.',
    skillsKnown: ['CAD basics'], skillsLearning: ['Arduino', 'Python'],
    topicsInterested: ['Robotics'], topicsCanTeach: [],
    availabilityHours: 10, participationModes: ['learner', 'contributor']
  },
  {
    id: 'mod_001', role: 'moderator', displayName: 'Campus Moderator (Demo Admin)', year: 4, branch: 'General',
    bio: 'Demo account that can pin announcements and review reports.',
    skillsKnown: [], skillsLearning: [], topicsInterested: [], topicsCanTeach: [],
    availabilityHours: 0, participationModes: []
  }
]

export const demoCommunities = [
  { id: 'com_001', name: 'General Campus', type: 'general', description: 'Events, hostel, clubs and campus-wide news.', memberIds: ['stu_001', 'stu_002', 'stu_003', 'stu_004', 'stu_005'] },
  { id: 'com_002', name: 'Third Year', type: 'batch', description: 'Year-specific academic questions and notices.', memberIds: ['stu_001', 'stu_004'] },
  { id: 'com_003', name: 'ECE', type: 'branch', description: 'Department questions, notices and resources.', memberIds: ['stu_001', 'stu_004'] },
  { id: 'com_004', name: 'CSE', type: 'branch', description: 'Department questions, notices and resources.', memberIds: ['stu_002', 'stu_003'] },
  { id: 'com_005', name: 'AI/ML', type: 'topic', description: 'Papers, tools and project ideas beyond your own batch.', memberIds: ['stu_002', 'stu_003'] },
  { id: 'com_006', name: 'Embedded Systems', type: 'topic', description: 'Microcontrollers, firmware and hardware projects.', memberIds: ['stu_001', 'stu_005'] },
  { id: 'com_007', name: 'VLSI', type: 'topic', description: 'Digital design, verification and chip-design learning.', memberIds: ['stu_004'] }
]

// ---- Collaboration ------------------------------------------------------------
const opportunities = [
  {
    id: 'opp_001', creatorId: 'stu_001', type: 'project', title: 'Line-following robot for the robotics showcase',
    description: 'We are building a small line-following robot on an STM32 board. We need someone to write the motor-control firmware and someone to design a light chassis.',
    nextStep: 'Kickoff call this weekend to split the firmware and chassis work.',
    category: 'Robotics', expectedOutcome: 'A working robot that completes the demo track at the showcase.',
    durationDays: 21, deadline: ahead(21), weeklyHours: 6, experience: 'mixed-level', status: 'forming',
    createdAt: ago(6), archivedAt: null, completedAt: null, outcomeSummary: '', sourcePostId: null
  },
  {
    id: 'opp_002', creatorId: 'stu_003', type: 'project', title: 'Campus bus timetable web app',
    description: 'A small web app that shows the campus bus timetable and the next departure. Good first project for anyone learning React or UI design.',
    nextStep: 'First meeting to agree the timetable data format.',
    category: 'Software', expectedOutcome: 'A deployed prototype that students can open on their phones.',
    durationDays: 28, deadline: ahead(30), weeklyHours: 4, experience: 'beginner-friendly', status: 'open',
    createdAt: ago(3), archivedAt: null, completedAt: null, outcomeSummary: '', sourcePostId: null
  },
  {
    id: 'opp_003', creatorId: 'stu_003', type: 'project', title: 'Git basics workshop notes',
    description: 'Write clear notes for the Git basics practice session and publish them as a one-page cheat sheet for juniors.',
    nextStep: 'Pick the ten Git commands that matter most for juniors.',
    category: 'Campus improvement', expectedOutcome: 'A one-page cheat sheet and a short practice session.',
    durationDays: 14, deadline: '', weeklyHours: 3, experience: 'beginner-friendly', status: 'archived',
    createdAt: ago(40), archivedAt: ago(18), completedAt: ago(20),
    outcomeSummary: 'Published a six-page Git cheat sheet and ran one practice session with eight students.', sourcePostId: null
  }
]

const roles = [
  { id: 'role_001', opportunityId: 'opp_001', title: 'Embedded C contributor', openings: 1, requiredSkills: ['C', 'Microcontrollers'], preferredSkills: ['STM32'], beginnerFriendly: false, deliverable: 'Motor driver and sensor reading firmware', learningResources: [] },
  { id: 'role_002', opportunityId: 'opp_001', title: 'Chassis designer (CAD)', openings: 1, requiredSkills: ['CAD basics'], preferredSkills: ['3D printing'], beginnerFriendly: true, deliverable: 'A chassis design ready to print', learningResources: ['https://www.freecodecamp.org/'] },
  { id: 'role_003', opportunityId: 'opp_002', title: 'UI designer', openings: 2, requiredSkills: [], preferredSkills: ['Figma'], beginnerFriendly: true, deliverable: 'Mobile-friendly screen designs', learningResources: [] },
  { id: 'role_004', opportunityId: 'opp_002', title: 'Frontend developer (React)', openings: 1, requiredSkills: ['JavaScript'], preferredSkills: ['React'], beginnerFriendly: false, deliverable: 'Working timetable and next-departure screens', learningResources: [] },
  { id: 'role_005', opportunityId: 'opp_003', title: 'Note taker', openings: 1, requiredSkills: [], preferredSkills: ['Git'], beginnerFriendly: true, deliverable: 'Cheat sheet draft', learningResources: [] }
]

const applications = [
  { id: 'app_001', opportunityId: 'opp_001', roleId: 'role_001', applicantId: 'stu_004', message: 'I know digital design well and want to move into firmware. I can start with the sensor code.', knownSkills: ['Verilog', 'Digital design'], skillsToLearn: ['STM32', 'Embedded C'], weeklyHours: 5, status: 'pending', createdAt: ago(2) },
  { id: 'app_002', opportunityId: 'opp_001', roleId: 'role_002', applicantId: 'stu_005', message: 'I have used CAD in my workshop course and can learn 3D printing on the way.', knownSkills: ['CAD basics'], skillsToLearn: ['3D printing'], weeklyHours: 8, status: 'accepted', createdAt: ago(5) },
  { id: 'app_003', opportunityId: 'opp_002', roleId: 'role_003', applicantId: 'stu_002', message: 'I am new to UI design but I like it and can give a few hours every week.', knownSkills: ['HTML'], skillsToLearn: ['Figma', 'UI design'], weeklyHours: 5, status: 'pending', createdAt: ago(1) },
  { id: 'app_004', opportunityId: 'opp_003', roleId: 'role_005', applicantId: 'stu_004', message: 'Happy to write and proofread the notes.', knownSkills: ['Git'], skillsToLearn: [], weeklyHours: 3, status: 'accepted', createdAt: ago(39) }
]

const tasks = [
  { id: 'task_001', opportunityId: 'opp_001', title: 'Sketch the chassis in CAD', description: 'Keep it under 20 cm long so it fits the demo track.', assigneeId: 'stu_005', dueDate: ahead(7), status: 'in_progress', learningResources: [], reviewNote: '' },
  { id: 'task_002', opportunityId: 'opp_001', title: 'Write motor driver test code', description: 'Spin both motors forward and backward.', assigneeId: 'stu_001', dueDate: ahead(10), status: 'not_started', learningResources: [], reviewNote: '' },
  { id: 'task_003', opportunityId: 'opp_003', title: 'Write the cheat sheet', description: '', assigneeId: 'stu_004', dueDate: ahead(-20), status: 'completed', learningResources: [], reviewNote: 'Clear and short. Thanks!' }
]

// ---- Learning & mentorship ----------------------------------------------------
const mentorOffers = [
  { id: 'offer_001', mentorId: 'stu_001', topic: 'STM32 guidance', description: 'Help with getting started on STM32: clocks, GPIO, timers. I cannot help with RTOS yet.', audienceLevel: 'complete beginner', format: 'one-to-one', availability: 'Weekend afternoons', status: 'open', createdAt: ago(4) },
  { id: 'offer_002', mentorId: 'stu_003', topic: 'Python for data analysis', description: 'Two guidance sessions a week on Python basics, Pandas and a small analysis task.', audienceLevel: 'some basics', format: 'small group', availability: 'Tuesday and Thursday evenings', status: 'open', createdAt: ago(7) },
  { id: 'offer_003', mentorId: 'stu_004', topic: 'Verilog basics', description: 'Walk through combinational and sequential design with small exercises.', audienceLevel: 'any level', format: 'async feedback', availability: 'Anytime, I reply within a day', status: 'open', createdAt: ago(10) }
]

const learningRequests = [
  { id: 'lreq_001', requesterId: 'stu_002', topic: 'Python for data analysis', currentLevel: 'some basics', targetOutcome: 'Load a CSV, clean it and make three charts in 14 days.', durationDays: 14, weeklyHours: 8, preferredFormat: 'either', status: 'open', createdAt: ago(5), outcome: '' },
  { id: 'lreq_002', requesterId: 'stu_005', topic: 'Arduino and basic electronics', currentLevel: 'complete beginner', targetOutcome: 'Build a blinking LED and a temperature display on my own.', durationDays: 21, weeklyHours: 6, preferredFormat: 'mentor support', status: 'open', createdAt: ago(2), outcome: '' }
]

const mentorshipRequests = [
  { id: 'mreq_001', kind: 'request', fromId: 'stu_002', toId: 'stu_003', offerId: 'offer_002', learningRequestId: null, topic: 'Python for data analysis', message: 'I would love to join the Tuesday sessions. I know Python basics.', status: 'accepted', createdAt: ago(4) },
  { id: 'mreq_002', kind: 'offer', fromId: 'stu_001', toId: 'stu_005', offerId: null, learningRequestId: 'lreq_002', topic: 'Arduino and basic electronics', message: 'I work with microcontrollers daily and can guide you through the first circuits.', status: 'pending', createdAt: ago(1) }
]

const circles = [
  { id: 'circle_001', creatorId: 'stu_002', topic: 'Python for data analysis', targetOutcome: 'Everyone finishes one small analysis project.', durationDays: 14, maxMembers: 6, memberIds: ['stu_002', 'stu_005'], status: 'open', createdAt: ago(4), summary: '' }
]

const milestones = [
  { id: 'ms_001', circleId: 'circle_001', title: 'Python basics', description: 'Variables, loops and functions.', resourceLinks: ['https://docs.python.org/3/tutorial/'], order: 1, status: 'open', completedBy: ['stu_002'] },
  { id: 'ms_002', circleId: 'circle_001', title: 'Data handling', description: 'Read a CSV and clean it with Pandas.', resourceLinks: ['https://pandas.pydata.org/docs/'], order: 2, status: 'open', completedBy: [] },
  { id: 'ms_003', circleId: 'circle_001', title: 'A small analysis task', description: 'Answer one question with a chart.', resourceLinks: [], order: 3, status: 'open', completedBy: [] }
]

// ---- Community ------------------------------------------------------------------
const posts = [
  { id: 'post_001', communityId: 'com_001', authorId: 'mod_001', postType: 'announcement', title: 'Be kind and be specific in posts', content: 'Demo notice: please say clearly what you need, report anything inappropriate, and keep personal contact details out of posts.', sourceUrl: '', pollOptions: [], pinned: true, status: 'published', createdAt: ago(8) },
  { id: 'post_002', communityId: 'com_005', authorId: 'stu_003', postType: 'question', title: 'Best beginner-friendly resource for transformers?', content: 'I understand basic neural networks. What should I read or watch first to understand transformers?', sourceUrl: '', pollOptions: [], pinned: false, status: 'published', createdAt: ago(3) },
  { id: 'post_003', communityId: 'com_001', authorId: 'stu_001', postType: 'poll', title: 'Should the library stay open later during exam weeks?', content: '', sourceUrl: '', pollOptions: [{ id: 'opt_1', text: 'Yes, until midnight' }, { id: 'opt_2', text: 'Yes, until 10 pm' }, { id: 'opt_3', text: 'No change needed' }], pinned: false, status: 'published', createdAt: ago(2) },
  { id: 'post_004', communityId: 'com_006', authorId: 'stu_001', postType: 'resource', title: 'STM32 documentation hub', content: 'Reference manuals and datasheets I use often.', sourceUrl: 'https://www.st.com/en/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus.html', pollOptions: [], pinned: false, status: 'published', createdAt: ago(5) },
  { id: 'post_005', communityId: 'com_001', authorId: 'stu_002', postType: 'discussion', title: 'The lost-and-found messages get buried in chats', content: 'Every week people post lost items in different groups and nobody sees them. Could we build one simple board for it?', sourceUrl: '', pollOptions: [], pinned: false, status: 'published', createdAt: ago(1) }
]

const comments = [
  { id: 'cmt_001', postId: 'post_002', authorId: 'stu_002', parentCommentId: null, content: 'I started with a short visual explainer and then read the original paper slowly.', createdAt: ago(2), status: 'published' },
  { id: 'cmt_002', postId: 'post_002', authorId: 'stu_003', parentCommentId: 'cmt_001', content: 'Thanks, that order makes sense. Do you remember which explainer?', createdAt: ago(1), status: 'published' },
  { id: 'cmt_003', postId: 'post_005', authorId: 'stu_004', parentCommentId: null, content: 'Strong yes. This could be a short project for a few of us.', createdAt: ago(1), status: 'published' }
]

const reactions = [
  { id: 'rx_001', postId: 'post_002', userId: 'stu_002', reactionType: 'helpful' },
  { id: 'rx_002', postId: 'post_005', userId: 'stu_004', reactionType: 'like' },
  { id: 'rx_003', postId: 'post_005', userId: 'stu_001', reactionType: 'insightful' },
  { id: 'rx_004', postId: 'post_004', userId: 'stu_005', reactionType: 'helpful' }
]

const votes = [
  { id: 'vote_001', postId: 'post_003', userId: 'stu_001', optionId: 'opt_1' },
  { id: 'vote_002', postId: 'post_003', userId: 'stu_002', optionId: 'opt_1' },
  { id: 'vote_003', postId: 'post_003', userId: 'stu_003', optionId: 'opt_3' }
]

// What a fresh browser starts with. Collections not listed start empty.
export const seed = {
  profiles: demoUsers,
  communities: demoCommunities,
  session: { userId: 'stu_001' },
  notifications: [],
  opportunities, roles, applications, tasks,
  mentorOffers, learningRequests, mentorshipRequests, circles, milestones,
  posts, comments, reactions, votes
}
