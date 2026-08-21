export const FEATURE_LABELS = {
  python_sandbox: 'Python Sandbox',
  model_solution: 'Model Solution',
  certificate: 'Certificate',
  all_courses: 'All Courses',
  download_dataset: 'Dataset Download',
}

export const GRANTABLE_FEATURES = ['python_sandbox', 'model_solution', 'certificate', 'download_dataset']

export const COURSES = [
  { id: 'da-job-sim', type: 'simulation', title: 'Junior DA Job Simulation', duration: '3–4 hrs', level: 'Beginner' },
  { id: 'advanced-sys-design', type: 'course', title: 'Advanced System Design', duration: '8 hrs', level: 'Advanced' },
  { id: 'sql-masterclass', type: 'course', title: 'SQL Masterclass', duration: '4 hrs', level: 'Beginner' },
  { id: 'python-for-data', type: 'course', title: 'Python for Data Analysis', duration: '6 hrs', level: 'Intermediate' },
  { id: 'ml-fundamentals', type: 'course', title: 'ML Fundamentals', duration: '10 hrs', level: 'Intermediate' },
]

export function overallProgress(student) {
  return student.tasks_done > 0 ? Math.round((student.tasks_done / 5) * 100) : 0
}

export function initials(name) {
  return (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function isActiveToday(lastActive) {
  if (!lastActive || lastActive === 'never') return false
  if (lastActive.includes('m ago') || lastActive === '1h ago') return true
  if (lastActive.includes('h ago')) {
    const hours = parseInt(lastActive, 10)
    return !Number.isNaN(hours) && hours <= 5
  }
  return false
}

export function needsAttention(student) {
  return !student.enrolled || student.tasks_done === 0
}
