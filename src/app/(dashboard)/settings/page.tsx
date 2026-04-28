'use client'

import { useUserStore } from '@/lib/store/useUserStore'
import { User, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const { user } = useUserStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting for component mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto relative z-0">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10 mix-blend-screen" />

      <div className="flex flex-col gap-2 mb-4 relative z-10">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight drop-shadow-sm">Settings</h1>
        <p className="text-muted-foreground text-lg font-medium">Manage your profile and application preferences.</p>
      </div>

      <div className="grid gap-8 mt-4 relative z-10">
        {/* Profile Card mapping Supabase User details */}
        <div className="bg-card/60 rounded-[2.5rem] border border-muted/50 p-8 md:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_15px_50px_rgb(0,0,0,0.08)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="flex items-center gap-5 mb-10 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-inner border border-primary/20">
              <User className="w-8 h-8 text-primary drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight mb-1">Profile Information</h3>
              <p className="text-sm font-medium text-muted-foreground">Your account identity linked to Supabase authentication.</p>
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="group/field">
              <div className="text-[11px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-3 flex items-center gap-2">
                 <div className="w-1 h-3 rounded-full bg-primary/60" /> Email Identity
              </div>
              <div className="px-5 py-4 bg-muted/10 border border-muted/50 rounded-2xl text-foreground font-bold text-lg w-full max-w-md shadow-sm transition-all group-hover/field:border-primary/30 group-hover/field:bg-muted/20">
                {user?.email || 'Loading authentication identity...'}
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings integrating next-themes */}
        <div className="bg-card/60 rounded-[2.5rem] border border-muted/50 p-8 md:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_15px_50px_rgb(0,0,0,0.08)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          
          <div className="mb-10 relative z-10">
             <h3 className="text-2xl font-extrabold text-foreground tracking-tight mb-1">Aesthetic Appearance</h3>
             <p className="text-sm font-medium text-muted-foreground">Configure interface color mode dynamics to match your preferences.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl relative z-10">
             <button 
               onClick={() => setTheme('light')}
               className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden ${
                 theme === 'light' ? 'border-primary bg-primary/10 scale-[1.02] shadow-[0_8px_30px_rgba(var(--primary),0.15)]' : 'border-muted/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm grayscale hover:grayscale-0'
               }`}
             >
               {theme === 'light' && <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />}
               <Sun className={`w-10 h-10 transition-all ${theme === 'light' ? 'text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.8)] scale-110' : 'text-primary/40'}`} />
               <span className={`font-black text-sm tracking-wide ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`}>Light Theme</span>
             </button>
             
             <button 
               onClick={() => setTheme('dark')}
               className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden ${
                 theme === 'dark' ? 'border-accent bg-accent/10 scale-[1.02] shadow-[0_8px_30px_rgba(var(--accent),0.15)]' : 'border-muted/50 hover:border-accent/50 hover:bg-accent/5 hover:shadow-sm grayscale hover:grayscale-0'
               }`}
             >
               {theme === 'dark' && <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />}
               <Moon className={`w-10 h-10 transition-all ${theme === 'dark' ? 'text-accent drop-shadow-[0_0_15px_rgba(var(--accent),0.8)] scale-110' : 'text-accent/40'}`} />
               <span className={`font-black text-sm tracking-wide ${theme === 'dark' ? 'text-accent' : 'text-muted-foreground'}`}>Dark Theme</span>
             </button>

             <button 
               onClick={() => setTheme('system')}
               className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden ${
                 theme === 'system' ? 'border-foreground bg-foreground/5 scale-[1.02] shadow-[0_8px_30px_rgba(var(--foreground),0.1)]' : 'border-muted/50 hover:border-foreground/50 hover:bg-foreground/5 hover:shadow-sm grayscale hover:grayscale-0'
               }`}
             >
               {theme === 'system' && <div className="absolute inset-0 bg-gradient-to-t from-foreground/5 to-transparent pointer-events-none" />}
               <Monitor className={`w-10 h-10 transition-all ${theme === 'system' ? 'text-foreground drop-shadow-[0_0_15px_rgba(var(--foreground),0.3)] scale-110' : 'text-foreground/40'}`} />
               <span className={`font-black text-sm tracking-wide ${theme === 'system' ? 'text-foreground' : 'text-muted-foreground'}`}>System Rules</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
