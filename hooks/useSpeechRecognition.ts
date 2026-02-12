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
  continuous?: boolean
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
  continuous = true,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null)
  const onResultRef = useRef(onResult)
  const onInterimRef = useRef(onInterim)

  onResultRef.current = onResult
  onInterimRef.current = onInterim

  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(supported)
  }, [])

  const start = useCallback(() => {
    if (!isSupported || isListening) return

    const SpeechRecognition = (window as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any).SpeechRecognition ||
      (window as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any).webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        setInterim('')
        onResultRef.current?.(finalTranscript)
      } else if (interimTranscript) {
        setInterim(interimTranscript)
        onInterimRef.current?.(interimTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setIsListening(false)
        setInterim('')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterim('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isSupported, isListening, lang, continuous])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
    setInterim('')
  }, [])

  const toggle = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }, [isListening, start, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  return { isListening, isSupported, interim, start, stop, toggle }
}

function createRecognition() {
  const SpeechRecognition = (window as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any).SpeechRecognition ||
    (window as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any).webkitSpeechRecognition
  return new SpeechRecognition()
}
