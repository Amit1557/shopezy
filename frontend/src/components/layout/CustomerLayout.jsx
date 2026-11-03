import { Outlet } from 'react-router-dom'
import CustomerHeader from './CustomerHeader'
import CustomerFooter from './CustomerFooter'
import CustomerAuthModal from '../customer/CustomerAuthModal'

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CustomerHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <CustomerFooter />
      <CustomerAuthModal />
    </div>
  )
}
