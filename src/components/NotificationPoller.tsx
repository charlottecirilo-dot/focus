'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'

export default function NotificationPoller() {
  const { user } = useUserStore()
  const supabase = createClient()
  const hasRequestedPermission = useRef(false)

  useEffect(() => {
    // Passively request if available and not yet asked
    if (typeof window !== 'undefined' && 'Notification' in window && !hasRequestedPermission.current) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
      hasRequestedPermission.current = true
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const checkDeadlines = async () => {
      // Fetch incomplete tasks with a deadline constraint 
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .not('deadline', 'is', null)

      if (!tasks) return

      const now = new Date()
      const THIRTY_MINUTES = 30 * 60 * 1000

      tasks.forEach(task => {
        const deadline = new Date(task.deadline)
        const timeRemaining = deadline.getTime() - now.getTime()
        
        // Skip over already exhausted tasks completely
        if (timeRemaining < -60000) return 

        const thirtyMinKey = `notified_30_${task.id}`
        const finalKey = `notified_final_${task.id}`

        // 30 MINUTE WARNING CONDITION
        // Trigger if time remaining is less/equal to 30 mins, but hasn't gone past 29 mins
        if (timeRemaining <= THIRTY_MINUTES && timeRemaining > (THIRTY_MINUTES - 60000)) {
           if (!localStorage.getItem(thirtyMinKey)) {
             localStorage.setItem(thirtyMinKey, 'true')
             
             // Browser Push
             if (Notification.permission === 'granted') {
               new Notification('Approaching Deadline', {
                 body: `Your task "${task.title}" is due in less than 30 minutes!`,
               })
             }
             
             // Email Push
             fetch('/api/cron/tasks', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 taskTitle: task.title,
                 createdAt: task.created_at,
                 deadline: task.deadline,
                 type: '30_MIN',
                 userEmail: user?.email || 'placeholder@example.com'
               })
             }).catch(e => console.error("Could not dispatch 30-min email reminder", e))
           }
        }

        // EXACT DEADLINE REACHED CONDITION
        if (timeRemaining <= 0 && timeRemaining > -60000) {
           if (!localStorage.getItem(finalKey)) {
             localStorage.setItem(finalKey, 'true')
             
             // Browser Push
             if (Notification.permission === 'granted') {
               new Notification('Deadline Reached!', {
                 body: `Your task "${task.title}" is due right now. Mark it as resolved in FOCUS!`,
               })
             }
             
             // Email Push
             fetch('/api/cron/tasks', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 taskTitle: task.title,
                 createdAt: task.created_at,
                 deadline: task.deadline,
                 type: 'FINAL',
                 userEmail: user?.email || 'placeholder@example.com'
               })
             }).catch(e => console.error("Could not dispatch final email reminder", e))
           }
        }
      })
    }

    // Execute immediately and then poll every 30 seconds
    checkDeadlines()
    const interval = setInterval(checkDeadlines, 30000)
    
    return () => clearInterval(interval)
  }, [user, supabase])

  return null
}
