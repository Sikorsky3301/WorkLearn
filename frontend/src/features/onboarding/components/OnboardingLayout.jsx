/** Full-screen wizard shell — no Navbar/Footer (mounted outside MainLayout
 * in App.jsx), so nothing competes for attention while a new user sets up
 * their profile. A dot-strip up top tracks step progress. */
export default function OnboardingLayout({ step, totalSteps, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-low via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/40' : 'w-4 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="mb-7">
            <h1 className="text-xl font-bold text-on-surface">{title}</h1>
            {subtitle && <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
