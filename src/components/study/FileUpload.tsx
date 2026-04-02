'use client'

import { useState } from 'react'
import { UploadCloud, FileText, CheckCircle2, ChevronRight } from 'lucide-react'

// Dedicated file upload interface with Dropzone behavior
export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Skeleton UI readiness for backend integration
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    simulateUpload() // Immediately trigger the UX animation pipeline hook
  }

  // Artificial latency to prove layout transitions
  const simulateUpload = () => {
    setIsUploading(true)
    setTimeout(() => {
      setIsUploading(false)
    }, 3000)
  }

  return (
    <div className="h-full p-12 flex flex-col items-center justify-center bg-background/50 rounded-3xl animate-in fade-in duration-300">
      <div className="max-w-xl w-full text-center mb-10">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <UploadCloud className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight">Upload Lecture Materials</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Upload PDFs or word documents. We will securely extract plain text and generate interactive flashcards out of the raw material.
        </p>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full max-w-3xl aspect-[21/9] border-[3px] border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8 transition-all duration-500 relative overflow-hidden group ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02] shadow-xl' 
            : 'border-muted-foreground/20 bg-card hover:border-primary/40 hover:bg-muted/5'
        }`}
      >
        {isUploading ? (
          <div className="text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative w-28 h-28 mx-auto mb-8">
              <svg className="animate-spin w-full h-full text-primary/10" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <FileText className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground mb-2">Analyzing File Metadata...</h3>
            <p className="text-base text-muted-foreground">Parsing text layout and indexing semantic terms.</p>
          </div>
        ) : (
          <div className="text-center pointer-events-none w-full flex flex-col items-center">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-300 shadow-sm ${
              isDragging ? 'bg-primary border-4 border-primary-foreground/20 scale-110' : 'bg-muted/50 group-hover:bg-primary/10'
            }`}>
              <UploadCloud className={`w-12 h-12 transition-colors duration-300 ${isDragging ? 'text-primary-foreground' : 'text-muted-foreground/50'}`} />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-3">Drag & Drop your files here</h3>
            <p className="text-lg text-muted-foreground mb-8">or click to browse from your device storage</p>
            
            <button 
              onClick={simulateUpload}
              className="px-8 flex items-center gap-3 py-4 rounded-2xl bg-foreground text-background font-extrabold pointer-events-auto hover:bg-primary hover:text-primary-foreground transition-all shadow-md active:scale-95"
            >
              Select Document <ChevronRight className="w-5 h-5" />
            </button>
            <p className="text-[11px] text-muted-foreground/50 mt-8 font-extrabold tracking-widest uppercase">Endpoint integration pending</p>
          </div>
        )}
      </div>
    </div>
  )
}
