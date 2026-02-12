'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

const toastConfig = {
  success: {
    classes: 'border-status-success/30',
    Icon: CheckCircle,
    iconColor: 'text-status-success',
  },
  error: {
    classes: 'border-status-error/30',
    Icon: XCircle,
    iconColor: 'text-status-error',
  },
  info: {
    classes: 'border-accent-primary/30',
    Icon: Info,
    iconColor: 'text-accent-primary',
  },
}

export function Toast({ message, type = 'info', isVisible, onClose, duration = 4000 }: ToastProps) {
  const [progress, setProgress] = useState(100)
  const config = toastConfig[type]

  useEffect(() => {
    if (!isVisible || duration <= 0) return

    const timer = setTimeout(onClose, duration)
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100))
    }, 50)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      setProgress(100)
    }
  }, [isVisible, duration, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className={`fixed bottom-6 right-4 left-4 md:left-auto md:right-6 z-50 md:max-w-sm glass-card rounded-xl border p-4 shadow-glass overflow-hidden ${config.classes}`}
        >
          <div className="flex items-start gap-3">
            <config.Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            <p className="font-ui text-sm text-text-primary flex-1">{message}</p>
          </div>
          {duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-border/30">
              <div
                className="h-full bg-accent-primary/40 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
