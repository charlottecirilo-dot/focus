'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { usePathname } from 'next/navigation'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useUserStore()
  const [supabase] = useState(() => createClient())
  const pathname = usePathname()
  const isMounted = useRef(true)
  const isLoading = useRef(false)

  useEffect(() => {
    isMounted.current = true

    const loadUser = async () => {
      // Prevent concurrent requests
      if (isLoading.current) return

      isLoading.current = true

      try {
        // First check if we have a session to avoid AuthSessionMissingError logs
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          if (isMounted.current) {
            clearUser()
          }
          return
        }

        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          // Only log if it's not a missing session error
          if (error.name !== 'AuthSessionMissingError') {
            console.error('Error loading user:', error)
          }
          if (isMounted.current) {
            clearUser()
          }
          return
        }

        if (isMounted.current) {
          if (user) {
            setUser(user)
          } else {
            clearUser()
          }
        }
      } catch (error) {
        console.error('Auth error:', error)
        if (isMounted.current) {
          clearUser()
        }
      } finally {
        isLoading.current = false
      }
    }

    loadUser()

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return

      if (session?.user) {
        setUser(session.user)
      } else {
        clearUser()
      }
    })

    return () => {
      isMounted.current = false
      isLoading.current = false
      subscription.unsubscribe()
    }
  }, [supabase, setUser, clearUser])

  return <>{children}</>
}