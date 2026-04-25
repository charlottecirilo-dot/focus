'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, CheckSquare, BrainCircuit, Settings, LogOut, LayoutGrid } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store/useUserStore'

// Configuration for sidebar navigation links
const navItems = [
  { name: 'Workspace', href: '/workspace', icon: LayoutGrid },
  { name: 'Notes & Speech', href: '/notes', icon: FileText },
  { name: 'Study Tools', href: '/study', icon: BrainCircuit },
  { name: 'Checklist', href: '/tasks', icon: CheckSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // This logs the user out and refreshes the page, which triggers middleware to redirect to /login
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="hidden md:flex w-72 bg-card/60 backdrop-blur-xl border-r border-muted/50 h-full flex-col p-5 z-20 shrink-0 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      <div className="mb-10 px-2 flex flex-col pt-4">
        <h1 className="text-3xl font-extrabold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent tracking-tighter">FOCUS</h1>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-bold tracking-[0.2em] uppercase">Workspace</p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon
          // If the current URL starts with this item's relative path, we consider it "active"
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-primary/15 text-foreground font-bold shadow-sm border border-primary/20' 
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground font-semibold border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {item.name}
            </Link>
          )
        })}

      </nav>

      {/* Footer operations (logout) */}
      <div className="mt-auto pt-6 border-t border-muted/50">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-4 py-3 w-full rounded-2xl font-bold text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-all duration-300 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-5 h-5 opacity-90 transition-transform group-hover:-translate-x-1" />
          Logout
        </button>
      </div>
    </div>
  )
}
