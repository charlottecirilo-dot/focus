'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { Users, Shield, Activity, Trash2, Search, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

type Stats = {
  totalUsers: number
  totalNotes: number
  totalTasks: number
}

// Strictly protected route governing all user interactions and privileged statistics
export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalNotes: 0, totalTasks: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'activity' | 'users' | 'admins'>('activity')
  
  const { role } = useUserStore()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Middleware already blocks non-admins primarily, but client validation serves as an immediate visual fallback
    if (role && role !== 'admin') {
      router.push('/dashboard')
      return
    }
    if (role === 'admin') {
      fetchAdminData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, router])

  const fetchAdminData = async () => {
    setLoading(true)
    // Fetch all profiles using RLS Admin Policies
    const { data: profileData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    
    // Fetch counts for platform stats
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: notesCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
    const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true })

    if (profileData) setProfiles(profileData)
    setStats({
      totalUsers: usersCount || 0,
      totalNotes: notesCount || 0,
      totalTasks: tasksCount || 0
    })
    setLoading(false)
  }

  // Deleting user from Profiles revokes their application access instantly due to table joins
  const handleDeleteUser = async (id: string, currentEmail: string) => {
    if (!confirm(`Are you certain you want to revoke access and delete profile for ${currentEmail}?`)) return
    
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) {
      setProfiles(profiles.filter(p => p.id !== id))
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
    } else {
      alert(`Role Enforcement Error: ${error.message}`)
    }
  }

  // Elevate or demote user authority dynamically
  const handleToggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    
    if (currentRole === 'admin' && !confirm('Demoting an admin removes their dashboard access entirely. Proceed?')) return

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    if (!error) {
      setProfiles(profiles.map(p => p.id === id ? { ...p, role: newRole } : p))
    }
  }

  const filteredUsers = profiles.filter(p => p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  const adminUsers = filteredUsers.filter(p => p.role === 'admin')
  const regularUsers = filteredUsers.filter(p => p.role === 'user')

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse font-bold text-xl tracking-wide flex flex-col items-center gap-4">
      <Shield className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
      Syncing Secure Administration Matrix...
    </div>
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <Shield className="w-10 h-10 text-accent drop-shadow-sm" /> Control Center
        </h1>
        <p className="text-muted-foreground text-lg">System operations, user governance, and real-time platform analytics.</p>
      </div>

      {/* Control Tabs */}
      <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-2xl w-fit xl:w-full max-w-2xl shadow-sm border border-muted/50">
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 flex justify-center items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            activeTab === 'activity' ? 'bg-background shadow-md text-foreground scale-[1.02]' : 'text-muted-foreground hover:bg-muted/60'
          }`}
        >
          <Activity className="w-5 h-5" /> Analytics Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex justify-center items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            activeTab === 'users' ? 'bg-background shadow-md text-foreground scale-[1.02]' : 'text-muted-foreground hover:bg-muted/60'
          }`}
        >
          <Users className="w-5 h-5" /> Accounts
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex-1 flex justify-center items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            activeTab === 'admins' ? 'bg-background shadow-md text-foreground scale-[1.02]' : 'text-muted-foreground hover:bg-muted/60'
          }`}
        >
          <Shield className="w-5 h-5" /> Admins
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-card rounded-[2rem] border border-muted/50 overflow-hidden shadow-sm relative p-8 md:p-10 min-h-[500px]">
        
        {/* ACTIVITY OVERVIEW TAB */}
        {activeTab === 'activity' && (
          <div className="animate-in fade-in duration-500">
            <h3 className="text-2xl font-bold mb-10 text-foreground">Global Platform Telemetry</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 rounded-3xl transition-transform hover:-translate-y-1 duration-300">
                <p className="text-[11px] font-extrabold text-primary mb-2 uppercase tracking-widest flex items-center justify-between">Total Registered <ArrowUpRight className="w-4 h-4 opacity-50"/></p>
                <div className="flex items-end gap-3 mt-6">
                  <span className="text-6xl font-extrabold text-foreground">{stats.totalUsers}</span>
                  <span className="text-muted-foreground font-bold mb-1 tracking-wider uppercase text-xs">Users</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-muted/50 p-8 rounded-3xl transition-transform hover:-translate-y-1 duration-300">
                <p className="text-[11px] font-extrabold text-muted-foreground mb-2 uppercase tracking-widest flex items-center justify-between">Documents Written <ArrowUpRight className="w-4 h-4 opacity-50"/></p>
                <div className="flex items-end gap-3 mt-6">
                  <span className="text-6xl font-extrabold text-foreground">{stats.totalNotes}</span>
                  <span className="text-muted-foreground font-bold mb-1 tracking-wider uppercase text-xs">Notes</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 p-8 rounded-3xl transition-transform hover:-translate-y-1 duration-300">
                <p className="text-[11px] font-extrabold text-accent-foreground mb-2 uppercase tracking-widest flex items-center justify-between">Objectives Tracked <ArrowUpRight className="w-4 h-4 opacity-50"/></p>
                <div className="flex items-end gap-3 mt-6">
                  <span className="text-6xl font-extrabold text-foreground">{stats.totalTasks}</span>
                  <span className="text-muted-foreground font-bold mb-1 tracking-wider uppercase text-xs">Tasks</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS / ADMIN DIRECTORIES TAB */}
        {(activeTab === 'users' || activeTab === 'admins') && (
          <div className="animate-in fade-in flex flex-col h-full duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="text-2xl font-bold text-foreground">
                {activeTab === 'users' ? 'User Directory' : 'Privileged Administrators'}
                <span className="text-base text-muted-foreground ml-3 font-medium">({activeTab === 'users' ? regularUsers.length : adminUsers.length})</span>
              </h3>
              <div className="relative">
                 <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <input 
                   type="text" 
                   placeholder={`Search by identity...`}
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="pl-12 pr-4 py-3.5 bg-muted/20 border border-muted/50 rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base shadow-inner w-full md:w-80 transition-shadow"
                 />
              </div>
            </div>

            <div className="overflow-x-auto border border-muted/30 rounded-[1.5rem] flex-1 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/20 border-b border-muted/30">
                    <th className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Identity Info</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Account Bound</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Role Matrix</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/20">
                  { (activeTab === 'admins' ? adminUsers : regularUsers).map((profile) => (
                    <tr key={profile.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-8 py-6 font-bold text-foreground text-base">
                        {profile.email}
                      </td>
                      <td className="px-8 py-6 text-muted-foreground text-sm font-semibold tracking-wide">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-lg inline-flex border shadow-sm ${
                          profile.role === 'admin' 
                            ? 'bg-accent/15 text-accent-foreground border-accent/20' 
                            : 'bg-primary/15 text-primary-foreground border-primary/20'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleToggleRole(profile.id, profile.role)}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-foreground"
                          >
                            {profile.role === 'admin' ? 'Revoke Protocol' : 'Elevate Privilege'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(profile.id, profile.email)}
                            className="p-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-colors shadow-sm"
                            title="Delete user profile permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {((activeTab === 'admins' ? adminUsers : regularUsers).length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-muted-foreground font-bold text-lg">
                        No active sector items match your directive.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
