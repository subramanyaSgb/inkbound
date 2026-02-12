'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void
  onInterim?: (transcript: string) => void
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

export function useSpeechRecognition({
  onResult,
  onInterim,
  lang = 'en-US',
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [interim, setInterim] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const onResultRef = useRef(onResult)
  const onInterimRef = useRef(onInterim)
  const wantListeningRef = useRef(false)
  const lastProcessedRef = useRef(-1)

  onResultRef.current = onResult
  onInterimRef.current = onInterim

  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(supported)
  }, [])

  const createAndStart = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          // Only process each final result once (by index)
          if (i > lastProcessedRef.current) {
            lastProcessedRef.current = i
            const text = result[0].transcript.trim()
            if (text) {
              setInterim('')
              onResultRef.current?.(text)
            }
          }
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (interimTranscript) {
        setInterim(interimTranscript)
        onInterimRef.current?.(interimTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are expected when restarting or during silence
      if (event.error === 'no-speech' || event.error === 'aborted') return
      wantListeningRef.current = false
      setIsListening(false)
      setInterim('')
    }

    recognition.onend = () => {
      // Auto-restart if user hasn't explicitly stopped
      if (wantListeningRef.current) {
        try {
          // Reset the processed index for the new session
          lastProcessedRef.current = -1
          recognition.start()
        } catch {
          // If restart fails, stop gracefully
          wantListeningRef.current = false
          setIsListening(false)
          setInterim('')
        }
      } else {
        setIsListening(false)
        setInterim('')
      }
    }

    recognitionRef.current = recognition
    lastProcessedRef.current = -1

    try {
      recognition.start()
      wantListeningRef.current = true
      setIsListening(true)
    } catch {
      wantListeningRef.current = false
      setIsListening(false)
    }
  }, [lang])

  const start = useCallback(() => {
    if (!isSupported || wantListeningRef.current) return
    createAndStart()
  }, [isSupported, createAndStart])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    try {
      recognitionRef.current?.stop()
    } catch {
      // Already stopped
    }
    recognitionRef.current = null
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
      try {
        recognitionRef.current?.stop()
      } catch {
        // Already stopped
      }
    }
  }, [])

  return { isListening, isSupported, interim, start, stop, toggle }
}
