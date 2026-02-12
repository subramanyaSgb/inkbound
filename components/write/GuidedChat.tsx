'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import { useGuidedStore, type ChatMessage } from '@/stores/guided-store'
import { useWriteStore } from '@/stores/write-store'
import { Button } from '@/components/ui/Button'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'

export function GuidedChat() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  const {
    messages, isStreaming, streamingContent,
    addUserMessage, addAssistantMessage,
    setStreaming, appendStreamingContent,
    reset: resetChat,
  } = useGuidedStore()

  const { setRawEntry, setSelectedNovelId, setIsGenerating, isGenerating, reset: resetWrite } = useWriteStore()

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Send initial AI greeting on mount
  useEffect(() => {
    if (novelId && messages.length === 0) {
      setSelectedNovelId(novelId)
      // Send a hidden kickstart message so the API has a user message to respond to
      sendToAI([{ role: 'user', content: 'Hi, I want to write about my day.' }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId])

  async function sendToAI(currentMessages: ChatMessage[]) {
    setStreaming(true)

    try {
      const response = await fetch('/api/guided-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, messages: currentMessages }),
      })

      if (!response.ok) throw new Error('Chat failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content || ''
                if (delta) {
                  fullContent += delta
                  appendStreamingContent(delta)
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      }

      addAssistantMessage(fullContent)
    } catch {
      addAssistantMessage("Sorry, I had trouble connecting. Could you try again?")
    }

    setStreaming(false)
  }

  async function handleSend() {
    if (!input.trim() || isStreaming) return

    const userMsg = input.trim()
    setInput('')
    addUserMessage(userMsg)

    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }]
    await sendToAI(updatedMessages)
  }

  async function handleGenerate() {
    // Combine all user messages into raw entry
    const rawEntry = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n')

    setRawEntry(rawEntry)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          rawEntry,
          entryDate: new Date().toISOString().split('T')[0],
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const { chapterId } = await response.json()
      resetChat()
      resetWrite()
      router.push(`/novel/${novelId}/chapter/${chapterId}`)
    } catch {
      setIsGenerating(false)
    }
  }

  function handleBack() {
    resetChat()
    router.push(`/write?novelId=${novelId}`)
  }

  const userMessageCount = messages.filter(m => m.role === 'user').length

  if (isGenerating) return <GeneratingAnimation />

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-160px)]">
      {/* Header with back button */}
      <div className="flex items-center gap-3 pb-3 mb-2 border-b border-ink-border/50">
        <button
          onClick={handleBack}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h2 className="font-display text-base text-text-primary">Guided Chat</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-accent-primary/15 border border-accent-primary/20 text-text-primary rounded-br-sm'
                : 'glass-card text-text-secondary rounded-bl-sm'
            }`}>
              <p className="text-sm font-body leading-relaxed">{msg.content}</p>
            </div>
          </motion.div>
        ))}

        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] md:max-w-[70%] rounded-2xl rounded-bl-sm px-4 py-2.5 glass-card">
              <p className="text-sm font-body text-text-secondary leading-relaxed">{streamingContent}</p>
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 glass-card">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Generate button */}
      {userMessageCount >= 3 && !isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-2 text-center"
        >
          <Button onClick={handleGenerate} variant="glow" size="sm" className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            Generate Chapter
          </Button>
        </motion.div>
      )}

      {/* Input bar */}
      <div className="flex gap-2 pt-2 border-t border-ink-border/50">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Tell me about your day..."
          disabled={isStreaming}
          className="flex-1 bg-ink-glass backdrop-blur-sm border border-ink-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary/40 focus:shadow-glow-sm disabled:opacity-50 transition-all"
        />
        <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="icon" className="rounded-xl">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
