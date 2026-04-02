'use client'

import { useUserStore } from '@/lib/store/useUserStore'

export default function DashboardPage() {
  const { user } = useUserStore()

  // Retrieve part before @ symbol for minimal personalized greeting
  const displayName = user?.email ? user.email.split('@')[0] : 'Scholar'

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="text-muted-foreground">Here is an overview of your workspace today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-muted transition-transform hover:-translate-y-1 duration-300">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <span className="text-xl">📝</span>
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-2">Recent Notes</h3>
          <p className="text-sm text-muted-foreground">Create your first note to see it here. Start organizing your thoughts and lecture notes.</p>
        </div>
        
        <div className="glass p-6 rounded-2xl border border-muted transition-transform hover:-translate-y-1 duration-300">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mb-4">
            <span className="text-xl">✅</span>
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-2">Pending Tasks</h3>
          <p className="text-sm text-muted-foreground">You have 0 tasks left for today. Head over to the checklist layer to manage your action items.</p>
        </div>
        
        <div className="glass p-6 rounded-2xl border border-muted transition-transform hover:-translate-y-1 duration-300">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <span className="text-xl">📊</span>
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-2">Study Progress</h3>
          <p className="text-sm text-muted-foreground">Review flashcards to build your momentum and see your charts populate.</p>
        </div>
      </div>
    </div>
  )
}
