import { Sidebar } from '@/components/layout/Sidebar'

// This layout wraps all protected routes (Dashboard, Notes, Tasks) 
// to provide the global sidebar and consistent page structure.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/20">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
