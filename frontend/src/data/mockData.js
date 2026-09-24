export const notifications = [
  { title: 'New assignment assigned: Node.js REST API', time: '2 hours ago' },
  { title: 'Upcoming Live Class on Friday at 6:00 PM', time: '1 day ago' },
  { title: 'Certificate DS-2026-001 issued successfully!', time: '3 days ago' },
]

export const leaderboard = [
  { name: 'Rahul Mehta', xp: '980 XP' },
  { name: 'Sabeel Syed', xp: '920 XP' },
  { name: 'Anjali Verma', xp: '880 XP' },
]

export const enrolledCourses = [
  {
    id: 'fullstack',
    title: 'Full Stack Web Development',
    instructor: 'John Doe',
    level: 'Intermediate',
    progress: 72,
    lessons: '18/26 Lessons',
    gradient: 'linear-gradient(135deg,#0d3b66,#1e6091)',
  },
  {
    id: 'nodejs',
    title: 'Node.js Backend Masterclass',
    instructor: 'Rahul Sharma',
    level: 'Advanced',
    progress: 72,
    lessons: '8/12 Lessons',
    gradient: 'linear-gradient(135deg,#1b1b3a,#3a3a6a)',
  },
  {
    id: 'python-ai',
    title: 'Python for Data Science & AI',
    instructor: 'Anjali Verma',
    level: 'Beginner',
    progress: 45,
    lessons: '9/20 Lessons',
    gradient: 'linear-gradient(135deg,#0b3d24,#155c33)',
  },
]

export const upcomingSessions = [
  { title: 'JavaScript Assessment', time: 'Tomorrow · 10:00 AM', type: 'test' },
  { title: 'Live Node.js Session', time: 'Friday · 6:00 PM', type: 'session' },
]

export const adminStats = [
  { label: 'Total Users', value: '4,892', badge: '+14% YoY', icon: '👥', color: '#e8effe' },
  { label: 'Active Learners', value: '3,840', icon: '🎓', color: '#eef4ff' },
  { label: 'Trainers / Staff', value: '64', icon: '🛡️', color: '#f2eefe' },
  { label: 'Certificates Issued', value: '2,391', icon: '🏅', color: '#fdf2e0' },
  { label: 'Monthly Revenue', value: '₹6.4 L', badge: '+8.2%', icon: '💳', color: '#e7f8ee' },
]

export const trainerStats = [
  { label: 'Total Active Students', value: '342', badge: '+18 this week', icon: '👥' },
  { label: 'Active Courses', value: '3', sub: '3 Published', icon: '📘' },
  { label: 'Assigned Tasks', value: '2', icon: '📝' },
  { label: 'Pending Reviews', value: '14', icon: '⏱️', urgent: true },
]

export const learnerStats = [
  { label: 'Courses Enrolled', value: '3', badge: '+1 this month', icon: '📘', to: '/learner/my-learning' },
  { label: 'Learning Time', value: '32h 20m', badge: '+4.2h this week', icon: '⏱️' },
  { label: 'Certs Earned', value: '3 Certs', sub: 'DS-2026-001 Verified', icon: '🏅' },
  { label: 'Streak Record', value: '12 Days', badge: 'Active Streak', icon: '🔥' },
]

export const courseCurriculum = [
  {
    module: '01 Introduction & Setup',
    lessons: [
      { id: 'les-101', title: 'Course Welcome & Roadmap', dur: '12:40' },
      { id: 'les-102', title: 'Development Environment & Terminal Basics', dur: '18:05' },
    ],
  },
  {
    module: '02 Advanced React & Hooks',
    lessons: [
      { id: 'les-201', title: 'React Hooks — useState & useEffect Deep Dive', dur: '24:10' },
      { id: 'les-202', title: 'CSS Selectors & Responsive Design with Tailwind', dur: '19:32' },
    ],
  },
  {
    module: '03 Node.js & REST API Architecture',
    lessons: [
      { id: 'les-301', title: 'Express Server & Router Architecture', dur: '21:00' },
      { id: 'les-302', title: 'MongoDB Integration & Mongoose Schema', dur: '26:15' },
    ],
  },
]
