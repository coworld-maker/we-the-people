'use client'

import { useState, useRef, useEffect } from 'react'
import {
  BookOpen, ChevronDown, ChevronRight, Lightbulb, Scroll,
  FileText, Scale, X, Loader2, Sparkles, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { FOUNDING_DOCUMENTS, type FoundingDocument, type DocumentSection } from '@/lib/data/founding-documents'

export default function DocumentViewer() {
  const [activeDoc, setActiveDoc] = useState('declaration')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showPlainEnglish, setShowPlainEnglish] = useState(false)
  const [aiExplaining, setAiExplaining] = useState<string | null>(null)
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [selectedText, setSelectedText] = useState<{ sectionId: string; text: string } | null>(null)

  const doc = FOUNDING_DOCUMENTS.find(d => d.id === activeDoc)!

  const docIcons: Record<string, typeof BookOpen> = {
    declaration: Scroll,
    constitution: Scale,
    'bill-of-rights': FileText,
  }

  function toggleSection(id: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setExpandedSections(new Set(doc.sections.map(s => s.id)))
  }

  function collapseAll() {
    setExpandedSections(new Set())
  }

  async function explainSection(section: DocumentSection) {
    const key = `${section.id}-full`
    if (aiExplanations[key]) return // already loaded

    setAiExplaining(key)
    try {
      const res = await fetch('/api/explain-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionTitle: section.title,
          documentTitle: doc.title,
          text: section.text.substring(0, 2000), // limit input size
        }),
      })
      const data = await res.json()
      setAiExplanations(prev => ({ ...prev, [key]: data.explanation }))
    } catch {
      setAiExplanations(prev => ({ ...prev, [key]: 'Unable to load explanation. Please try again.' }))
    } finally {
      setAiExplaining(null)
    }
  }

  async function explainSelection() {
    if (!selectedText) return
    const key = `${selectedText.sectionId}-sel-${selectedText.text.substring(0, 30)}`
    if (aiExplanations[key]) return

    setAiExplaining(key)
    try {
      const section = doc.sections.find(s => s.id === selectedText.sectionId)
      const res = await fetch('/api/explain-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionTitle: section?.title || '',
          documentTitle: doc.title,
          text: selectedText.text,
          isSelection: true,
        }),
      })
      const data = await res.json()
      setAiExplanations(prev => ({ ...prev, [key]: data.explanation }))
    } catch {
      setAiExplanations(prev => ({ ...prev, [key]: 'Unable to load explanation. Please try again.' }))
    } finally {
      setAiExplaining(null)
      setSelectedText(null)
    }
  }

  function handleTextSelect(sectionId: string) {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (text && text.length > 10 && text.length < 1000) {
      setSelectedText({ sectionId, text })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[--text] mb-2">
          Founding Documents
        </h1>
        <p className="text-[--text-secondary] text-sm">
          Read the original texts that established American democracy. Select any passage to explore its meaning.
        </p>
      </div>

      {/* Document Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {FOUNDING_DOCUMENTS.map(d => {
          const Icon = docIcons[d.id]
          const isActive = activeDoc === d.id
          return (
            <button
              key={d.id}
              onClick={() => {
                setActiveDoc(d.id)
                setExpandedSections(new Set())
                setSelectedText(null)
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[--accent] text-white shadow-md shadow-[--accent]/20'
                  : 'bg-[--surface-secondary] text-[--text-secondary] hover:bg-[--surface-tertiary] hover:text-[--text]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {d.title}
            </button>
          )
        })}
      </div>

      {/* Document Info Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[--text] mb-1">{doc.title}</h2>
            <p className="text-xs font-semibold text-[--accent] mb-2">{doc.subtitle}</p>
            <p className="text-sm text-[--text-secondary] leading-relaxed">{doc.description}</p>
          </div>
          <span className="shrink-0 font-display text-3xl font-extrabold text-[--surface-tertiary]">
            {doc.year}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[--border]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPlainEnglish(!showPlainEnglish)}
              className="flex items-center gap-2 text-sm font-medium text-[--text-secondary] hover:text-[--accent] transition-colors"
            >
              {showPlainEnglish ? (
                <ToggleRight className="w-5 h-5 text-[--accent]" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              Plain English
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="text-xs font-medium text-[--text-muted] hover:text-[--accent] transition-colors">
              Expand all
            </button>
            <span className="text-[--text-muted]">·</span>
            <button onClick={collapseAll} className="text-xs font-medium text-[--text-muted] hover:text-[--accent] transition-colors">
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {/* Selection Tooltip */}
      {selectedText && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[--dark] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in">
          <Sparkles className="w-4 h-4 text-[--accent] shrink-0" />
          <span className="text-sm font-medium truncate max-w-[200px]">
            &ldquo;{selectedText.text.substring(0, 40)}...&rdquo;
          </span>
          <button
            onClick={explainSelection}
            className="px-3 py-1.5 bg-[--accent] text-white text-xs font-semibold rounded-lg hover:bg-[--accent-hover] transition-colors whitespace-nowrap"
          >
            Explain this
          </button>
          <button
            onClick={() => setSelectedText(null)}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {doc.sections.map((section, idx) => {
          const isExpanded = expandedSections.has(section.id)
          const fullKey = `${section.id}-full`
          const hasAiExplanation = !!aiExplanations[fullKey]
          const isLoadingAi = aiExplaining === fullKey

          return (
            <div key={section.id} className="card overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[--surface-secondary]/50 transition-colors"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[--accent-light] text-[--accent] text-xs font-bold font-display shrink-0">
                  {idx + 1}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[--text-muted] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[--text-muted] shrink-0" />
                )}
                <span className="font-display text-sm font-bold text-[--text]">
                  {section.title}
                </span>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 pb-5">
                  {/* Plain English Summary */}
                  {showPlainEnglish && section.plainEnglish && (
                    <div className="mb-4 p-4 bg-[--accent-light] rounded-lg border border-[--accent]/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-3.5 h-3.5 text-[--accent]" />
                        <span className="text-xs font-bold text-[--accent] uppercase tracking-wider">
                          Plain English
                        </span>
                      </div>
                      <p className="text-sm text-[--text] leading-relaxed">
                        {section.plainEnglish}
                      </p>
                    </div>
                  )}

                  {/* Original Text */}
                  <div
                    className="text-sm text-[--text-secondary] leading-[1.85] whitespace-pre-line font-body selection:bg-[--accent]/20"
                    onMouseUp={() => handleTextSelect(section.id)}
                  >
                    {section.text}
                  </div>

                  {/* AI Dig Deeper */}
                  <div className="mt-4 pt-3 border-t border-[--border]">
                    {!hasAiExplanation && !isLoadingAi && (
                      <button
                        onClick={() => explainSection(section)}
                        className="flex items-center gap-2 text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Dig deeper — AI analysis of this section
                      </button>
                    )}

                    {isLoadingAi && (
                      <div className="flex items-center gap-2 text-xs text-[--text-muted]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing...
                      </div>
                    )}

                    {hasAiExplanation && (
                      <div className="p-4 bg-[--surface-secondary] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-[--accent]" />
                          <span className="text-xs font-bold text-[--accent] uppercase tracking-wider">
                            AI Analysis
                          </span>
                        </div>
                        <div className="text-sm text-[--text] leading-relaxed whitespace-pre-line">
                          {aiExplanations[fullKey]}
                        </div>
                      </div>
                    )}

                    {/* Inline selection explanations */}
                    {Object.entries(aiExplanations)
                      .filter(([k]) => k.startsWith(`${section.id}-sel-`))
                      .map(([key, explanation]) => (
                        <div key={key} className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                              Selected Passage
                            </span>
                          </div>
                          <div className="text-sm text-[--text] leading-relaxed whitespace-pre-line">
                            {explanation}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tip */}
      <div className="mt-8 text-center text-xs text-[--text-muted]">
        <Lightbulb className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
        Highlight any passage to get an AI-powered explanation of its meaning and historical context.
      </div>
    </div>
  )
}
