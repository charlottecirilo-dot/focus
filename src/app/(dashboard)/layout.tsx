import { Sidebar } from '@/components/layout/Sidebar'

// This layout wraps all protected routes (Dashboard, Notes, Tasks) 
// to provide the global sidebar and consistent page structure.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/5 overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 overflow-x-hidden relative scroll-smooth flex flex-col min-w-0">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}

