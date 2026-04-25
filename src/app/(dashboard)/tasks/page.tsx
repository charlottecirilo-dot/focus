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
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Task Manager</h1>
        <p className="text-muted-foreground text-lg">Organize your academic goals and track your execution progress.</p>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-10 animate-pulse font-medium">Synchronizing objectives...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main List Area */}
          <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-muted/50 p-6 md:p-10 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="text-2xl font-bold mb-8 text-foreground flex items-center gap-3">
              <CheckCircle2 className="text-primary w-7 h-7" /> Your Checklist
            </h3>
            
            <form onSubmit={handleAdd} className="flex gap-4 mb-8">
              <input 
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-6 py-4 rounded-2xl bg-muted/20 border border-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-lg shadow-inner placeholder:text-muted-foreground/50 transition-shadow"
              />
              <button 
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-8 py-4 bg-foreground text-background font-bold rounded-2xl flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-5 h-5" /> Append
              </button>
            </form>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-20 px-4 border-2 border-dashed border-muted/50 rounded-[2rem]">
                   <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                   <p className="text-foreground font-bold text-xl">Your checklist is clear.</p>
                   <p className="text-base text-muted-foreground mt-2 max-w-sm mx-auto">Add a new task above to start tracking your completion progress.</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => toggleTask(task)}
                    className={`group flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                      task.is_completed 
                        ? 'bg-muted/10 border-muted/30 hover:border-muted/60 opacity-60' 
                        : 'bg-background border-muted/50 hover:border-primary/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
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
            <div className="bg-gradient-to-br from-primary/10 via-background/60 to-accent/10 backdrop-blur-xl border border-primary/20 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-2xl font-bold mb-2 text-foreground">Progress</h3>
              <p className="text-sm text-muted-foreground mb-10 font-medium">Daily execution metrics reflecting checklist resolution.</p>
              
              <div className="flex items-end justify-between mb-3">
                <span className="text-6xl font-extrabold text-foreground tracking-tighter">{progressPercentage}<span className="text-3xl text-muted-foreground">%</span></span>
                <span className="text-[10px] font-extrabold text-primary-foreground/50 mb-2 uppercase tracking-widest bg-primary/20 px-2 py-1 rounded-full">Output Rate</span>
              </div>
              
              <div className="w-full bg-background/50 h-4 rounded-full overflow-hidden border border-muted/30 shadow-inner">
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ transform: 'skewX(-45deg)' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                 <div className="bg-background/60 p-5 rounded-2xl border border-muted/20 shadow-sm text-center">
                   <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Resolved</p>
                   <p className="text-3xl font-extrabold text-foreground">{completedCount}</p>
                 </div>
                 <div className="bg-background/60 p-5 rounded-2xl border border-muted/20 shadow-sm text-center">
                   <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Pending</p>
                   <p className="text-3xl font-extrabold text-foreground">{tasks.length - completedCount}</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Checklist Deadline Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
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
