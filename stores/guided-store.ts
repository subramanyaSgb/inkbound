import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GuidedStore {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
  addUserMessage: (content: string) => void
  addAssistantMessage: (content: string) => void
  setStreaming: (val: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  reset: () => void
}

export const useGuidedStore = create<GuidedStore>((set) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  addUserMessage: (content) => set((state) => ({
    messages: [...state.messages, { role: 'user', content }],
  })),
  addAssistantMessage: (content) => set((state) => ({
    messages: [...state.messages, { role: 'assistant', content }],
    streamingContent: '',
  })),
  setStreaming: (val) => set({ isStreaming: val }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) => set((state) => ({
    streamingContent: state.streamingContent + chunk,
  })),
  reset: () => set({ messages: [], isStreaming: false, streamingContent: '' }),
}))
