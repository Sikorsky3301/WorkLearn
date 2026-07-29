import { useNavigate } from 'react-router-dom'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useAuth } from '../features/auth/AuthContext'
import notFoundLottie from '../assets/404-error.lottie'

/** Catch-all route (path="*") — shown for any URL that doesn't match a
 * known route, regardless of login state. */
export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
      <div className="w-64 h-64 sm:w-80 sm:h-80">
        <DotLottieReact src={notFoundLottie} loop autoplay style={{ width: '100%', height: '100%' }} />
      </div>
      <h1 className="text-2xl font-extrabold text-on-surface mt-2 mb-2">Page not found</h1>
      <p className="text-sm text-on-surface-variant max-w-sm mb-7">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <button
        onClick={() => navigate(user ? '/dashboard' : '/login')}
        className="btn-primary px-6 py-2.5 text-sm cursor-pointer"
      >
        {user ? 'Back to Dashboard' : 'Back to Login'}
      </button>
    </div>
  )
}
