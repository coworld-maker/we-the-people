'use client'

import { useEffect, useState } from 'react'
import { Download, Trash2, Cookie, Loader2, Check, AlertCircle } from 'lucide-react'

const COOKIE_CONSENT_KEY = 'cookie-consent-v1'

export default function PrivacyControlsClient() {
  // ── Cookie consent state ─────────────────────────────────────────────────
  const [functional, setFunctional] = useState(false)
  const [consentSet, setConsentSet] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setFunctional(!!parsed.functional)
        setConsentSet(true)
      }
    } catch {}
  }, [])

  function updateConsent(allow: boolean) {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        decided: true, functional: allow, ts: new Date().toISOString(),
      }))
      setFunctional(allow)
      setConsentSet(true)
      window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { functional: allow } }))
    } catch {}
  }

  // ── Data export ──────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  async function exportData() {
    setExporting(true); setExportError('')
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Export failed — please try again or email privacy@democracyunlocked.com')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `democracy-unlocked-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setExportError(e.message)
    } finally {
      setExporting(false)
    }
  }

  // ── Account deletion ─────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function confirmDelete() {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE exactly to confirm.')
      return
    }
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Deletion failed')
      }
      // Send the user to a friendly farewell + sign them out
      window.location.href = '/?account-deleted=1'
    } catch (e: any) {
      setDeleteError(e.message)
      setDeleting(false)
    }
  }

  return (
    <>
      {/* ── Cookie preferences ───────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
          <Cookie className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-sm font-bold text-[--text]">Cookie preferences</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[--surface-secondary]">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[--text]">Strictly necessary</p>
              <p className="text-xs text-[--text-muted]">Authentication, security. Can't be disabled — the site won't work without them.</p>
            </div>
            <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-wider mt-1">Always on</span>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-[--border] cursor-pointer hover:bg-[--surface-secondary] transition-colors">
            <input
              type="checkbox"
              checked={functional}
              onChange={e => updateConsent(e.target.checked)}
              className="mt-1 accent-[--accent] cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[--text]">Functional</p>
              <p className="text-xs text-[--text-muted]">Remembers your selected state, interests, and reading position. Improves UX but not required.</p>
            </div>
          </label>

          {consentSet && (
            <p className="text-[11px] text-[--text-muted] flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              Preferences saved on this device.
            </p>
          )}
        </div>
      </div>

      {/* ── Export your data ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
          <Download className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-sm font-bold text-[--text]">Export your data</h2>
        </div>
        <div className="p-5">
          <p className="text-xs text-[--text-secondary] mb-4 leading-relaxed">
            Download a JSON file containing every piece of personal data we hold
            about you — your profile, votes, discussions, tracked bills, and
            audit logs. Fulfills your right to data portability under GDPR Art. 20
            and your right to know under the CCPA.
          </p>
          <button
            onClick={exportData}
            disabled={exporting}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-60"
          >
            {exporting ? (
              <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Preparing…</span>
            ) : (
              <span className="flex items-center gap-1.5"><Download className="w-3 h-3" /> Download my data</span>
            )}
          </button>
          {exportError && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {exportError}
            </p>
          )}
        </div>
      </div>

      {/* ── Delete account ───────────────────────────────────────────────── */}
      <div className="card overflow-hidden border-red-200">
        <div className="px-5 py-3.5 border-b border-red-200 bg-red-50/50 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-600" />
          <h2 className="font-display text-sm font-bold text-red-900">Delete account</h2>
        </div>
        <div className="p-5">
          <p className="text-xs text-[--text-secondary] mb-4 leading-relaxed">
            Permanently delete your account and all associated personal data
            (votes, discussions, preferences, audit logs). Aggregate, anonymized
            sentiment counts are retained for civic transparency but can no
            longer be linked back to you. Cannot be undone.
          </p>

          {!deleteOpen ? (
            <button
              onClick={() => setDeleteOpen(true)}
              className="text-xs px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" /> Delete my account
            </button>
          ) : (
            <div className="space-y-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs font-semibold text-red-900">
                This is permanent. Type <code className="font-mono bg-white px-1 rounded text-[11px]">DELETE</code> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-sm rounded-lg border border-red-300 bg-white text-[--text] focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteConfirm !== 'DELETE'}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Permanently delete'}
                </button>
                <button
                  onClick={() => { setDeleteOpen(false); setDeleteConfirm(''); setDeleteError('') }}
                  disabled={deleting}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[--surface] text-[--text-secondary] hover:bg-[--surface-secondary] transition-colors border border-[--border]"
                >
                  Cancel
                </button>
              </div>
              {deleteError && (
                <p className="text-xs text-red-700 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {deleteError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
