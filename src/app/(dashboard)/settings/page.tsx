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
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your profile and application preferences.</p>
      </div>

      <div className="grid gap-8 mt-4">
        {/* Profile Card mapping Supabase User details */}
        <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-muted/50 p-8 md:p-10 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Profile Information</h3>
              <p className="text-base text-muted-foreground mt-1">Your account identity linked to Supabase.</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-extrabold text-muted-foreground mb-2">Email Identity</p>
              <div className="px-5 py-4 bg-muted/20 border border-muted/50 rounded-2xl text-foreground font-semibold text-lg w-full max-w-md shadow-inner">
                {user?.email || 'Loading authentication identity...'}
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings integrating next-themes */}
        <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-muted/50 p-8 md:p-10 shadow-sm transition-all hover:shadow-md">
          <div className="mb-8">
             <h3 className="text-2xl font-bold text-foreground">Aesthetic Appearance</h3>
             <p className="text-base text-muted-foreground mt-1">Configure interface color mode dynamics to match your preferences.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
             <button 
               onClick={() => setTheme('light')}
               className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all duration-300 ${
                 theme === 'light' ? 'border-primary bg-primary/10 scale-105 shadow-md shadow-primary/20' : 'border-muted/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm'
               }`}
             >
               <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-primary-foreground drop-shadow-md' : 'text-amber-500'}`} />
               <span className="font-bold text-base">Light Theme</span>
             </button>
             
             <button 
               onClick={() => setTheme('dark')}
               className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all duration-300 ${
                 theme === 'dark' ? 'border-accent bg-accent/10 scale-105 shadow-md shadow-accent/20' : 'border-muted/50 hover:border-accent/50 hover:bg-accent/5 hover:shadow-sm'
               }`}
             >
               <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-accent-foreground drop-shadow-md' : 'text-indigo-400'}`} />
               <span className="font-bold text-base">Dark Theme</span>
             </button>

             <button 
               onClick={() => setTheme('system')}
               className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all duration-300 ${
                 theme === 'system' ? 'border-foreground bg-foreground/5 scale-105 shadow-md shadow-foreground/10' : 'border-muted/50 hover:border-foreground/50 hover:bg-foreground/5 hover:shadow-sm'
               }`}
             >
               <Monitor className="w-8 h-8 text-foreground/70" />
               <span className="font-bold text-base">System Rules</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
