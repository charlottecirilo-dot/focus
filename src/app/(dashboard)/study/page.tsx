'use client'

import { useState } from 'react'
import Flashcards from '@/components/study/Flashcards'
import Summarizer from '@/components/study/Summarizer'
import { BrainCircuit, FileText } from 'lucide-react'

export default function StudyToolsPage() {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'summarizer'>('flashcards')

  const tabs = [
    { id: 'flashcards', name: 'Flashcards', icon: BrainCircuit },
    { id: 'summarizer', name: 'AI Summarizer', icon: FileText },
  ] as const

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Study Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Accelerate your learning with AI-generated flashcards and document summaries.</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm relative min-h-0">
        {activeTab === 'flashcards' && <Flashcards />}
        {activeTab === 'summarizer' && <Summarizer />}
      </div>
    </div>
  )
}
