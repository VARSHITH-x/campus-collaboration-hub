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

// What a fresh browser starts with. Collections not listed start empty.
export const seed = {
  profiles: demoUsers,
  communities: demoCommunities,
  session: { userId: 'stu_001' },
  notifications: []
}
