import { create } from 'zustand'

interface WriteStore {
  selectedNovelId: string | null
  rawEntry: string
  entryDate: string
  isGenerating: boolean
  setSelectedNovelId: (id: string | null) => void
  setRawEntry: (text: string) => void
  setEntryDate: (date: string) => void
  setIsGenerating: (val: boolean) => void
  reset: () => void
}

export const useWriteStore = create<WriteStore>((set) => ({
  selectedNovelId: null,
  rawEntry: '',
  entryDate: new Date().toISOString().split('T')[0],
  isGenerating: false,
  setSelectedNovelId: (id) => set({ selectedNovelId: id }),
  setRawEntry: (text) => set({ rawEntry: text }),
  setEntryDate: (date) => set({ entryDate: date }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  reset: () => set({ rawEntry: '', entryDate: new Date().toISOString().split('T')[0], isGenerating: false }),
}))
