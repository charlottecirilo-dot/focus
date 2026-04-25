'use client'

import { useState } from 'react'
import Flashcards from '@/components/study/Flashcards'
import Summarizer from '@/components/study/Summarizer'
import { BrainCircuit, FileText } from 'lucide-react'

// Layout host for the Study module handling 2 embedded views via tabs
export default function StudyToolsPage() {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'summarizer'>('flashcards')

  const tabs = [
    { id: 'flashcards', name: 'Flashcards', icon: BrainCircuit },
    { id: 'summarizer', name: 'AI Summarizer', icon: FileText },
  ] as const

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Study Center</h1>
        <p className="text-muted-foreground text-lg">Boost your learning with spaced repetition and AI summaries.</p>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-2xl w-fit shadow-sm border border-muted/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-background shadow-md text-foreground scale-[1.02]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-card rounded-[2rem] border border-muted/50 overflow-hidden shadow-sm relative">
        {/* Render appropriate component conditionally based on active tab state */}
        {activeTab === 'flashcards' && <Flashcards />}
        {activeTab === 'summarizer' && <Summarizer />}
      </div>
    </div>
  )
}
