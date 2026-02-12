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
 * Uses continuous mode — mic stays open until user explicitly stops.
 * Tracks processed result indices to prevent word duplication.
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const processedUpToRef = useRef(-1)

  onResultRef.current = onResult

  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(supported)
  }, [])

  const start = useCallback(() => {
    if (!isSupported || wantListeningRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          // Only process each result index once
          if (i > processedUpToRef.current) {
            processedUpToRef.current = i
            const text = result[0].transcript.trim()
            if (text) {
              setInterim('')
              onResultRef.current?.(text)
            }
          }
        } else {
          interimText += result[0].transcript
        }
      }

      if (interimText) {
        setInterim(interimText)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      wantListeningRef.current = false
      recognitionRef.current = null
      setIsListening(false)
      setInterim('')
    }

    recognition.onend = () => {
      // Browser may end the session despite continuous mode (e.g. prolonged silence).
      // Silently restart with a fresh instance if user hasn't clicked stop.
      if (wantListeningRef.current) {
        processedUpToRef.current = -1
        try {
          recognition.start()
        } catch {
          wantListeningRef.current = false
          recognitionRef.current = null
          setIsListening(false)
          setInterim('')
        }
      } else {
        recognitionRef.current = null
        setIsListening(false)
        setInterim('')
      }
    }

    recognitionRef.current = recognition
    processedUpToRef.current = -1
    wantListeningRef.current = true
    setIsListening(true)

    try {
      recognition.start()
    } catch {
      wantListeningRef.current = false
      recognitionRef.current = null
      setIsListening(false)
    }
  }, [isSupported, lang])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* already stopped */ }
      recognitionRef.current = null
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

  useEffect(() => {
    return () => {
      wantListeningRef.current = false
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch { /* already stopped */ }
      }
    }
  }, [])

  return { isListening, isSupported, interim, start, stop, toggle }
}
