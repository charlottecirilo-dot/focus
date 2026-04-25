'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  // Create Supabase client in our client-side component to handle sign-in
  const supabase = createClient()

  // Handle standard form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Attempt authentication via Supabase standard signInWithPassword
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // If success, push the router to dashboard and refresh state
      router.push('/workspace')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 relative overflow-hidden">
      {/* Decorative background blobs matching pastel aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="glass max-w-md w-full p-8 rounded-2xl relative z-10 mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome to FOCUS</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to sync your study tools</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Email address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-muted-foreground/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-muted-foreground/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              required
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-foreground font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
