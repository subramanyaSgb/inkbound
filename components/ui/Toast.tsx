'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

const toastColors = {
  success: 'border-status-success bg-status-success/10',
  error: 'border-status-error bg-status-error/10',
  info: 'border-accent-primary bg-accent-primary/10',
}

export function Toast({ message, type = 'info', isVisible, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border p-4 font-ui text-sm text-text-primary shadow-lg ${toastColors[type]}`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
