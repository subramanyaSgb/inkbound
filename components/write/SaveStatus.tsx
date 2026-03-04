'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, AlertCircle, Cloud, CloudOff } from 'lucide-react'
import { useEntryStore } from '@/stores/entry-store'

export function SaveStatus() {
  const { saveStatus, currentEntry, lastSyncedAt } = useEntryStore()

  if (!currentEntry) return null

  const isDirty = currentEntry.isDirty

  function getStatusDisplay() {
    if (saveStatus === 'saving') {
      return { icon: Loader2, text: 'Saving...', className: 'text-text-muted', spin: true }
    }
    if (saveStatus === 'error') {
      return { icon: AlertCircle, text: 'Save failed', className: 'text-status-error', spin: false }
    }
    if (saveStatus === 'saved' && !isDirty) {
      return { icon: Check, text: formatSavedTime(lastSyncedAt), className: 'text-status-success', spin: false }
    }
    if (isDirty) {
      return { icon: CloudOff, text: 'Unsaved changes', className: 'text-text-muted', spin: false }
    }
    if (lastSyncedAt) {
      return { icon: Cloud, text: formatSavedTime(lastSyncedAt), className: 'text-text-muted/60', spin: false }
    }
    return null
  }

  const status = getStatusDisplay()
  if (!status) return null

  const Icon = status.icon

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.text}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className={`flex items-center gap-1.5 text-xs font-ui ${status.className}`}
      >
        <Icon className={`w-3 h-3 ${status.spin ? 'animate-spin' : ''}`} />
        <span>{status.text}</span>
      </motion.div>
    </AnimatePresence>
  )
}

function formatSavedTime(iso: string | null): string {
  if (!iso) return 'Saved'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 10000) return 'Just saved'
  if (diff < 60000) return `Saved ${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`
  return 'Saved'
}
