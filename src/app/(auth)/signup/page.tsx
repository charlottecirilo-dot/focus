'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Create new account
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Show success state if Supabase creates account
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="glass max-w-md w-full p-8 rounded-2xl relative z-10 mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Join FOCUS</h1>
          <p className="text-muted-foreground mt-2 text-sm">Create an account to start studying effectively.</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-4">
            <h3 className="text-xl font-bold text-emerald-700">Account Created!</h3>
            <p className="text-muted-foreground text-sm">Please check your email to verify your account or sign in directly if verification is optional.</p>
            <Link href="/login" className="inline-block mt-4 py-2.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
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
                minLength={6}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-foreground font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
