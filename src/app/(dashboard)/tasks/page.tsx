'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { Plus, Trash2, CheckCircle2, Circle, Target } from 'lucide-react'

type Task = {
  id: string
  title: string
  is_completed: boolean
  created_at: string
  deadline?: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Date Picker States
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pendingTaskTitle, setPendingTaskTitle] = useState('')
  const [appendedAt, setAppendedAt] = useState<Date | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate())
  
  const { user } = useUserStore()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (data) setTasks(data)
    setLoading(false)
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newTaskTitle.trim()) return
    
    // Step 5: Intercept to show Deadline Date Picker Modal
    setPendingTaskTitle(newTaskTitle.trim())
    setAppendedAt(new Date())
    setShowDatePicker(true)
  }

  const submitWithDeadline = async () => {
    if (!user) return
    
    console.log("Confirm button clicked. Selected Month:", selectedMonth, "Selected Day:", selectedDay)
    
    // Step 7 trigger: ask notification permission first time
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    }

    // Step 4 & 6: creation time captured exactly when 'Append' was pressed; inherited into deadline setup
    const creationDate = appendedAt || new Date()
    const deadlineDate = new Date()
    
    deadlineDate.setFullYear(creationDate.getFullYear())
    deadlineDate.setMonth(selectedMonth)
    deadlineDate.setDate(selectedDay)
    deadlineDate.setHours(creationDate.getHours(), creationDate.getMinutes(), 0, 0)
    
    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: pendingTaskTitle,
      is_completed: false,
      created_at: creationDate.toISOString(),
      deadline: deadlineDate.toISOString() 
    }).select().single()

    if (error) {
      console.error("Failed to insert task:", error)
      alert(`Error saving task: ${error.message}`)
      return
    }

    if (data) {
      setTasks([data, ...tasks])
      setNewTaskTitle('')
      setPendingTaskTitle('')
      setShowDatePicker(false)
    }
  }

  const toggleTask = async (task: Task) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t))
    
    // Server push
    await supabase.from('tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', task.id)
  }

  const deleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTasks(tasks.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const completedCount = tasks.filter(t => t.is_completed).length
  const progressPercentage = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto relative z-0">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen" />

      <div className="flex flex-col gap-2 mb-4 relative z-10">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Task Manager</h1>
        <p className="text-muted-foreground text-lg">Organize your academic goals and track your execution progress.</p>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-10 animate-pulse font-medium">Synchronizing objectives...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main List Area */}
          <div className="lg:col-span-2 bg-card/60 backdrop-blur-sm rounded-[2.5rem] border border-muted/50 p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 relative z-10 overflow-hidden">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            
            <h3 className="text-2xl font-bold mb-8 text-foreground flex items-center gap-3 drop-shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center shadow-inner">
                 <CheckCircle2 className="text-primary w-5 h-5 drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" /> 
              </div>
              Your Checklist
            </h3>
            
            <form onSubmit={handleAdd} className="flex gap-4 mb-10 group relative">
              <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10" />
              <input 
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-6 py-4 rounded-2xl bg-card border border-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-foreground text-lg shadow-sm placeholder:text-muted-foreground/50 transition-all hover:bg-card/80"
              />
              <button 
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-black rounded-2xl flex items-center gap-2 hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_4px_20px_rgba(var(--primary),0.2)] active:scale-[0.98] hover:shadow-[0_8px_25px_rgba(var(--primary),0.3)]"
              >
                <Plus className="w-5 h-5" /> Append
              </button>
            </form>

            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-20 px-4 border border-muted/50 rounded-[2rem] bg-background/30 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10">
                     <Target className="w-10 h-10 text-primary/40 drop-shadow-sm" />
                   </div>
                   <p className="text-foreground font-extrabold text-2xl mb-2 relative z-10 tracking-tight">Your checklist is clear</p>
                   <p className="text-base text-muted-foreground font-medium max-w-sm mx-auto relative z-10">Add a new task above to start tracking your completion progress.</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => toggleTask(task)}
                    className={`group flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                      task.is_completed 
                        ? 'bg-card/40 border-muted/30 opacity-60' 
                        : 'bg-card border-muted/50 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] hover:-translate-y-0.5'
                    }`}
                  >
                    {!task.is_completed && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
                    
                    <div className="flex flex-col min-w-0 flex-1 pl-2">
                      <span className={`text-lg font-semibold truncate transition-all duration-300 ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                      {/* Displaying Creation & Deadline Timestamps */}
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        <span>Created at {new Date(task.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        {task.deadline && (
                          <>
                            <span className="opacity-50">•</span>
                            <span className="text-primary/70">Deadline: {new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteTask(task.id, e)}
                      className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-4"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Progress Tracker Widget Component Area */}
          <div className="lg:col-span-1 space-y-6 sticky top-8 z-10">
            <div className="bg-card/80 backdrop-blur-md border border-muted/50 rounded-[2.5rem] p-8 shadow-[0_8px_40px_rgb(0,0,0,0.08)] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
              
              <h3 className="text-2xl font-bold mb-2 text-foreground relative z-10 tracking-tight">Progress</h3>
              <p className="text-sm text-muted-foreground mb-10 font-medium relative z-10">Daily execution metrics reflecting checklist resolution.</p>
              
              <div className="flex items-end justify-between mb-4 relative z-10">
                <span className="text-[4.5rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 tracking-tighter drop-shadow-sm">
                  {progressPercentage}<span className="text-3xl text-primary">%</span>
                </span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-3">Output Rate</span>
              </div>
              
              <div className="w-full bg-background/50 h-5 rounded-full overflow-hidden border border-muted/50 shadow-inner relative z-10">
                <div 
                  className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                  <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ transform: 'skewX(-45deg)' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-12 relative z-10">
                 <div className="bg-background/80 p-6 rounded-[2rem] border border-muted/30 shadow-sm text-center group-hover:border-primary/20 transition-colors">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Resolved</p>
                   <p className="text-4xl font-black text-foreground drop-shadow-sm">{completedCount}</p>
                 </div>
                 <div className="bg-background/80 p-6 rounded-[2rem] border border-muted/30 shadow-sm text-center group-hover:border-accent/20 transition-colors">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Pending</p>
                   <p className="text-4xl font-black text-foreground drop-shadow-sm">{tasks.length - completedCount}</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Checklist Deadline Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card border border-muted/50 shadow-2xl rounded-3xl p-8 w-[400px]">
            <h3 className="text-xl font-bold mb-4 text-foreground">Select Deadline</h3>
            <p className="text-sm text-muted-foreground mb-6 font-medium">
              Choose a deadline date for <span className="text-foreground tracking-tight">&quot;{pendingTaskTitle}&quot;</span>. The time will be automatically matched to creation.
            </p>
            
            <div className="flex gap-4">
              <select 
                title="Mon"
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="flex-1 px-4 py-3 rounded-xl bg-muted/20 border border-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold appearance-none"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}
                  </option>
                ))}
              </select>
              <select 
                title="Day"
                value={selectedDay}
                onChange={e => setSelectedDay(Number(e.target.value))}
                className="flex-1 px-4 py-3 rounded-xl bg-muted/20 border border-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold appearance-none"
              >
                {Array.from({ length: 31 }).map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowDatePicker(false)} 
                className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted/30 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitWithDeadline} 
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-extrabold shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Confirm Deadline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
