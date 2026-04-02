'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, CheckSquare, BrainCircuit, Settings, LogOut, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store/useUserStore'

// Configuration for sidebar navigation links
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Notes & Speech', href: '/notes', icon: FileText },
  { name: 'Study Tools', href: '/study', icon: BrainCircuit },
  { name: 'Checklist', href: '/tasks', icon: CheckSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  // Fetch user role from globally managed state
  const { role } = useUserStore()
  const supabase = createClient()

  // This logs the user out and refreshes the page, which triggers middleware to redirect to /login
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="w-64 bg-card border-r border-muted h-full flex flex-col p-4 z-10 shrink-0">
      <div className="mb-8 px-2 flex flex-col pt-4">
        <h1 className="text-3xl font-extrabold text-primary-foreground tracking-tighter">FOCUS</h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium tracking-widest uppercase">Workspace</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
        {navItems.map((item) => {
          const Icon = item.icon
          // If the current URL starts with this item's relative path, we consider it "active"
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/20 text-primary-foreground font-semibold shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              {item.name}
            </Link>
          )
        })}

        {/* Render admin link strictly if the current global role state explicitly is admin */}
        {role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-muted/50">
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                pathname.startsWith('/admin')
                  ? 'bg-accent/20 text-accent-foreground font-semibold shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium'
              }`}
            >
              <Shield className={`w-5 h-5 ${pathname.startsWith('/admin') ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* Footer operations (logout) */}
      <div className="mt-auto pt-4 border-t border-muted">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-muted-foreground hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 opacity-80" />
          Logout
        </button>
      </div>
    </div>
  )
}
