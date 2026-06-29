import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const ALL_COURSES = [
  // Product Management
  { id: 'pm-strategy', title: 'Product Strategy & Metrics Mastery', desc: 'Define OKRs, north star metrics, and frameworks that drive modern digital products.', category: 'pm', type: 'course', level: 'Advanced', lessons: 9, hours: '4h', color: 'bg-indigo-900', abbr: 'PM', badge: 'New' },
  { id: 'pm-interviews', title: 'Product Management Interview Prep', desc: 'Ace PM interviews from strategy cases to estimation problems and technical skills.', category: 'pm', type: 'course', level: 'Intermediate', lessons: 12, hours: '5h', color: 'bg-indigo-700', abbr: 'PM' },
  { id: 'pm-roadmap', title: 'Roadmapping & Prioritisation', desc: 'Learn RICE, MoSCoW, and impact-effort frameworks to build roadmaps execs love.', category: 'pm', type: 'course', level: 'Beginner', lessons: 8, hours: '3h', color: 'bg-indigo-800', abbr: 'PM' },

  // Engineering Management
  { id: 'em-leadership', title: 'Engineering Leadership Fundamentals', desc: 'Review key leadership and people management skills for first-time EMs.', category: 'em', type: 'course', level: 'Intermediate', lessons: 11, hours: '4.5h', color: 'bg-violet-900', abbr: 'EM' },
  { id: 'em-hiring', title: 'Hiring & Scaling Engineering Teams', desc: 'Build interview loops, evaluate candidates, and onboard engineers effectively.', category: 'em', type: 'course', level: 'Advanced', lessons: 7, hours: '3h', color: 'bg-violet-700', abbr: 'EM' },

  // Software Engineering
  { id: 'swe-interviews', title: 'Software Engineering Interview Prep', desc: 'Comprehensive preparation for technical interviews at top-tier tech companies.', category: 'swe', type: 'course', level: 'Intermediate', lessons: 15, hours: '8h', color: 'bg-blue-900', abbr: 'SWE' },
  { id: 'swe-patterns', title: 'Essential Coding Patterns', desc: 'Master sliding window, two-pointer, DFS/BFS, and dynamic programming patterns.', category: 'swe', type: 'coding', level: 'Advanced', lessons: 20, hours: '10h', color: 'bg-blue-700', abbr: 'SWE', badge: 'Popular' },

  // System Design
  { id: 'sd-fundamentals', title: 'Advanced System Design for PMs', desc: 'Navigate complex architectures and lead engineering teams with confidence.', category: 'sd', type: 'course', level: 'Mastery', lessons: 12, hours: '4.5h', color: 'bg-cyan-900', abbr: 'SD' },
  { id: 'sd-distributed', title: 'Distributed Systems & Scalability', desc: 'Define architectures, interfaces, and databases in a time crunch.', category: 'sd', type: 'course', level: 'Advanced', lessons: 10, hours: '5h', color: 'bg-cyan-700', abbr: 'SD' },

  // Data Science
  { id: 'ds-decision', title: 'Data-Driven Decision Making', desc: 'Analyze complex datasets and translate insights into actionable business strategies.', category: 'ds', type: 'course', level: 'Mastery', lessons: 10, hours: '5h', color: 'bg-teal-900', abbr: 'DS' },
  { id: 'ds-stats', title: 'Statistics for Data Science', desc: 'Execute statistical techniques and experimentation effectively in real-world data.', category: 'ds', type: 'course', level: 'Intermediate', lessons: 14, hours: '6h', color: 'bg-teal-700', abbr: 'DS' },

  // Machine Learning
  { id: 'ml-fundamentals', title: 'ML Model Building & Evaluation', desc: 'Review building, evaluating, and deploying AI/ML models at production scale.', category: 'ml', type: 'course', level: 'Advanced', lessons: 16, hours: '8h', color: 'bg-emerald-900', abbr: 'ML' },
  { id: 'ml-llms', title: 'Building with LLMs', desc: 'Prompt engineering, RAG pipelines, and fine-tuning for production AI apps.', category: 'ml', type: 'course', level: 'Advanced', lessons: 12, hours: '6h', color: 'bg-emerald-700', abbr: 'ML', badge: 'New' },

  // Data Engineering
  { id: 'de-pipelines', title: 'ETL Pipelines & Data Modeling', desc: 'Design complex data models and build scalable ETL pipelines with dbt and Airflow.', category: 'de', type: 'course', level: 'Intermediate', lessons: 11, hours: '5.5h', color: 'bg-amber-900', abbr: 'DE' },
  { id: 'de-warehousing', title: 'Data Warehousing & Lakehouse', desc: 'Master Snowflake, BigQuery, and Delta Lake for modern data infrastructure.', category: 'de', type: 'course', level: 'Advanced', lessons: 9, hours: '4h', color: 'bg-amber-700', abbr: 'DE' },

  // Data Analytics
  { id: 'da-insights', title: 'Translating Data into Business Decisions', desc: 'Translate data into actionable insights and compelling business narratives.', category: 'da', type: 'course', level: 'Intermediate', lessons: 10, hours: '4h', color: 'bg-orange-900', abbr: 'DA' },
  { id: 'da-sql', title: 'SQL for Data Analytics', desc: 'Window functions, CTEs, and complex query optimization for analytics workflows.', category: 'da', type: 'course', level: 'Beginner', lessons: 18, hours: '7h', color: 'bg-orange-700', abbr: 'DA', badge: 'Popular' },

  // More Courses
  { id: 'gen-ai', title: 'Generative AI for Professionals', desc: 'Leverage LLMs, image models, and AI agents to accelerate your work.', category: 'generative-ai', type: 'course', level: 'Beginner', lessons: 8, hours: '3h', color: 'bg-purple-900', abbr: 'AI', badge: 'New' },
  { id: 'security', title: 'Security Engineering Essentials', desc: 'Threat modeling, secure SDLC, and zero-trust architecture for engineers.', category: 'security-engineer', type: 'course', level: 'Intermediate', lessons: 10, hours: '5h', color: 'bg-red-900', abbr: 'SEC' },
  { id: 'eng-behavioral', title: 'Behavioral Interviews for Engineers', desc: 'Ace behavioral rounds with structured storytelling using the STAR framework.', category: 'eng-behavioral', type: 'course', level: 'Beginner', lessons: 24, hours: '6h', color: 'bg-slate-700', abbr: 'BEH' },
  { id: 'tpm', title: 'Technical Program Management', desc: 'Drive cross-functional programs, manage dependencies, and ship on time.', category: 'tpm', type: 'course', level: 'Intermediate', lessons: 9, hours: '4h', color: 'bg-sky-800', abbr: 'TPM' },
  { id: 'solutions-arch', title: 'Solutions Architecture', desc: 'Design end-to-end cloud solutions and communicate architecture to stakeholders.', category: 'solutions-architect', type: 'course', level: 'Advanced', lessons: 11, hours: '5h', color: 'bg-zinc-800', abbr: 'SA' },
  { id: 'ux-design', title: 'UX & Product Design Fundamentals', desc: 'User research, wireframing, prototyping, and usability testing for PMs and designers.', category: 'ux-/-product-design', type: 'course', level: 'Beginner', lessons: 13, hours: '5h', color: 'bg-pink-800', abbr: 'UX' },
  { id: 'bizops', title: 'BizOps & Strategy', desc: 'Frameworks for go-to-market strategy, OKR setting, and operational excellence.', category: 'bizops-&-strategy', type: 'course', level: 'Intermediate', lessons: 8, hours: '3.5h', color: 'bg-lime-900', abbr: 'BIZ' },
  { id: 'sql-interviews', title: 'SQL Interview Mastery', desc: 'Solve complex SQL problems under time pressure with a structured approach.', category: 'sql-interviews', type: 'course', level: 'Intermediate', lessons: 20, hours: '8h', color: 'bg-stone-700', abbr: 'SQL', badge: 'Popular' },

  // Simulations
  { id: 'da-job-sim', title: 'Junior Data Analyst Job Simulation', desc: 'Step into a real analyst role at Lumen Commerce — clean a 10k-row dataset, build KPI reports, run RFM segmentation, evaluate an A/B test, and brief the VP.', category: 'da', type: 'simulation', level: 'Beginner', lessons: 6, hours: '5–6h', color: 'bg-orange-800', abbr: 'DA', badge: 'New' },
]

const categoryMeta = {
  pm:   { label: 'Product Management', color: 'bg-indigo-100 text-indigo-700' },
  em:   { label: 'Eng. Management',    color: 'bg-violet-100 text-violet-700' },
  swe:  { label: 'Software Engineering', color: 'bg-blue-100 text-blue-700' },
  sd:   { label: 'System Design',      color: 'bg-cyan-100 text-cyan-700' },
  ds:   { label: 'Data Science',       color: 'bg-teal-100 text-teal-700' },
  ml:   { label: 'Machine Learning',   color: 'bg-emerald-100 text-emerald-700' },
  de:   { label: 'Data Engineering',   color: 'bg-amber-100 text-amber-700' },
  da:   { label: 'Data Analytics',     color: 'bg-orange-100 text-orange-700' },
  'generative-ai':      { label: 'Generative AI',      color: 'bg-purple-100 text-purple-700' },
  'security-engineer':  { label: 'Security Engineer',  color: 'bg-red-100 text-red-700' },
  'eng-behavioral':     { label: 'Eng Behavioral',     color: 'bg-slate-100 text-slate-700' },
  tpm:                  { label: 'TPM',                 color: 'bg-sky-100 text-sky-700' },
  'solutions-architect':{ label: 'Solutions Architect', color: 'bg-zinc-100 text-zinc-700' },
  'ux-/-product-design':{ label: 'UX / Product Design', color: 'bg-pink-100 text-pink-700' },
  'bizops-&-strategy':  { label: 'BizOps & Strategy',  color: 'bg-lime-100 text-lime-700' },
  'sql-interviews':     { label: 'SQL Interviews',     color: 'bg-stone-100 text-stone-700' },
}

const levelColors = {
  Beginner:     'text-green-700 bg-green-50',
  Intermediate: 'text-blue-700 bg-blue-50',
  Advanced:     'text-violet-700 bg-violet-50',
  Mastery:      'text-primary bg-primary/10',
}

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'course', label: 'Courses' },
  { key: 'simulation', label: 'Simulations' },
  { key: 'coding', label: 'Coding' },
]

export default function CourseCatalog() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') || ''
  const typeParam = searchParams.get('type') || ''

  const [typeFilter, setTypeFilter] = useState(typeParam || 'all')
  const [search, setSearch] = useState('')

  const activeCategoryLabel = categoryParam ? (categoryMeta[categoryParam]?.label || categoryParam) : ''

  const filtered = ALL_COURSES.filter(c => {
    const matchCat = !categoryParam || c.category === categoryParam
    const matchType = typeFilter === 'all' || c.type === typeFilter
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchType && matchSearch
  })

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-1">
            {activeCategoryLabel ? activeCategoryLabel : 'All Courses & Simulations'}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {activeCategoryLabel
              ? `${filtered.length} programs in ${activeCategoryLabel}`
              : 'Master critical workplace skills through immersive, career-focused learning.'}
          </p>
        </div>
        {activeCategoryLabel && (
          <button onClick={() => navigate('/courses')} className="btn-secondary text-xs px-4 py-2">← All Courses</button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex bg-surface-low border border-border rounded-lg p-0.5 gap-0.5">
          {filterTabs.map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${typeFilter === t.key ? 'bg-white text-primary shadow-sm border border-border' : 'text-on-surface-variant hover:text-on-surface'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="input text-xs pl-7 py-1.5 w-52" />
        </div>
        <span className="text-xs text-on-surface-variant ml-auto">{filtered.length} results</span>
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-on-surface-variant text-sm">No courses match your filters.</p>
          <button onClick={() => { setTypeFilter('all'); setSearch('') }} className="btn-secondary text-xs mt-3 px-4 py-2">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filtered.map(course => {
            const catMeta = categoryMeta[course.category]
            return (
              <div key={course.id}
                className="card p-0 overflow-hidden hover:border-primary transition-colors cursor-pointer group"
                onClick={() => navigate(`/courses/${course.id}`)}>
                {/* Thumbnail */}
                <div className={`${course.color} h-28 flex items-start justify-between p-3 relative`}>
                  <div className="flex flex-col gap-1.5">
                    {catMeta && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catMeta.color}`}>
                        {catMeta.label}
                      </span>
                    )}
                    {course.type === 'simulation' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">Simulation</span>
                    )}
                    {course.type === 'coding' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Coding</span>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{course.abbr}</span>
                  </div>
                  {course.badge && (
                    <span className={`absolute bottom-2 left-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${course.badge === 'New' ? 'bg-emerald-400 text-white' : 'bg-amber-400 text-white'}`}>
                      {course.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-on-surface text-sm leading-snug mb-1.5 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3 line-clamp-2">{course.desc}</p>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span>{course.lessons} lessons</span>
                      <span>·</span>
                      <span>{course.hours}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColors[course.level] || 'bg-gray-100 text-gray-600'}`}>
                      {course.level}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-on-surface-variant mt-10 pb-4">
        © 2025 WorkLearn Professional Education. All rights reserved.
      </p>
    </div>
  )
}
