import { type ReactNode } from 'react'
import Navigation from '../Navigation'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 max-w-[430px] mx-auto relative">
      <main className="flex-1 pb-24">{children}</main>
      <Navigation />
    </div>
  )
}
