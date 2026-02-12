'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void
  lang?: string
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  interim: string
  start: () => void
  stop: () => void
  toggle: () => void
}

/**
 * Speech-to-text hook using Web Speech API.
 *
 * Uses single-utterance mode (continuous=false) with auto-restart.
 * Each pause in speech produces one clean final result — no duplication.
 * Auto-restarts after each utterance so the mic stays active until the user stops it.
 */
export function useSpeechRecognition({
  onResult,
  lang = 'en-US',
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [interim, setInterim] = useState('')
  const onResultRef = useRef(onResult)
  const wantListeningRef = useRef(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  onResultRef.current = onResult

  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(supported)
  }, [])

  const startSession = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = false      // Single utterance per session — prevents duplication
    recognition.interimResults = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''

      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript
        } else {
          interimText += event.results[i][0].transcript
        }
      }

      if (finalText) {
        const trimmed = finalText.trim()
        if (trimmed) {
          setInterim('')
          onResultRef.current?.(trimmed)
        }
      } else if (interimText) {
        setInterim(interimText)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // 'no-speech' happens during silence — just let it restart
      // 'aborted' happens when we call stop() — expected
      if (event.error === 'no-speech' || event.error === 'aborted') return

      // Real error — stop everything
      wantListeningRef.current = false
      setIsListening(false)
      setInterim('')
    }

    recognition.onend = () => {
      setInterim('')
      // Auto-restart with a fresh instance if user hasn't clicked stop
      if (wantListeningRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (wantListeningRef.current) {
            startSession()
          }
        }, 100)
      } else {
        setIsListening(false)
      }
    }

    try {
      recognition.start()
    } catch {
      wantListeningRef.current = false
      setIsListening(false)
    }
  }, [lang])

  const start = useCallback(() => {
    if (!isSupported || wantListeningRef.current) return
    wantListeningRef.current = true
    setIsListening(true)
    startSession()
  }, [isSupported, startSession])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    setIsListening(false)
    setInterim('')
  }, [])

  const toggle = useCallback(() => {
    if (wantListeningRef.current) {
      stop()
    } else {
      start()
    }
  }, [start, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantListeningRef.current = false
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
      }
    }
  }, [])

  return { isListening, isSupported, interim, start, stop, toggle }
}
