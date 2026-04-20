'use client'

import { useUserStore } from '@/lib/store/useUserStore'

export default function DashboardPage() {
  const { user } = useUserStore()

  // Retrieve part before @ symbol for minimal personalized greeting
  const displayName = user?.email ? user.email.split('@')[0] : 'Scholar'

  return (
    <div className="h-full flex flex-col space-y-10 animate-in fade-in duration-500 pb-10">
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-10 rounded-[2.5rem] border border-primary/20 shadow-sm isolation-auto">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl -z-10" />
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-3">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">Here is an overview of your workspace today. Maintain your momentum.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card/60 backdrop-blur-xl p-8 rounded-[2rem] border border-muted/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 duration-300 group">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="font-bold text-xl text-foreground mb-3">Recent Notes</h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">Create your first note to see it here. Start organizing your thoughts and lecture notes.</p>
        </div>
        
        <div className="bg-card/60 backdrop-blur-xl p-8 rounded-[2rem] border border-muted/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-accent/30 duration-300 group">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="font-bold text-xl text-foreground mb-3">Pending Tasks</h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">You have 0 tasks left for today. Head over to the checklist layer to manage your action items.</p>
        </div>
        
        <div className="bg-card/60 backdrop-blur-xl p-8 rounded-[2rem] border border-muted/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 duration-300 group">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-bold text-xl text-foreground mb-3">Study Progress</h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">Review flashcards to build your momentum and see your charts populate.</p>
        </div>
      </div>
    </div>
  )
}
