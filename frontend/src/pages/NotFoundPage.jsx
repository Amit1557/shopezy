import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black text-brand-200 mb-2">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-xs text-gray-500 mb-6">
          The page or product you were looking for doesn't exist or has moved.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/" className="btn-primary inline-flex items-center gap-2 text-xs">
            <Home className="w-4 h-4" /> Go to Homepage
          </Link>
          <Link to="/products" className="btn-secondary inline-flex items-center gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" /> Browse Catalog
          </Link>
        </div>
      </div>
    </div>
  )
}

