'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'

// This provider wraps the application and syncs the current Supabase session inside the Zustand store
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useUserStore()
  const supabase = createClient()

  useEffect(() => {
    // Fetches the current logged-in user
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        clearUser()
      }
    }

    loadUser()

    // Listen to ongoing authentication state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        clearUser()
      }
    })

    // Clean up subscription upon component unmounting
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setUser, clearUser])

  return <>{children}</>
}
