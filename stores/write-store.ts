import { create } from 'zustand'

interface WriteStore {
  selectedNovelId: string | null
  rawEntry: string
  entryDate: string
  isGenerating: boolean
  editingChapterId: string | null
  setSelectedNovelId: (id: string | null) => void
  setRawEntry: (text: string) => void
  appendRawEntry: (text: string) => void
  setEntryDate: (date: string) => void
  setIsGenerating: (val: boolean) => void
  setEditingChapterId: (id: string | null) => void
  reset: () => void
  initDate: () => void
}

export const useWriteStore = create<WriteStore>((set) => ({
  selectedNovelId: null,
  rawEntry: '',
  entryDate: '',
  isGenerating: false,
  editingChapterId: null,
  setSelectedNovelId: (id) => set({ selectedNovelId: id }),
  setRawEntry: (text) => set({ rawEntry: text }),
  appendRawEntry: (text) => set((state) => {
    const sep = state.rawEntry && !state.rawEntry.endsWith(' ') && !state.rawEntry.endsWith('\n') ? ' ' : ''
    return { rawEntry: state.rawEntry + sep + text }
  }),
  setEntryDate: (date) => set({ entryDate: date }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  setEditingChapterId: (id) => set({ editingChapterId: id }),
  reset: () => set({ rawEntry: '', entryDate: new Date().toISOString().split('T')[0], isGenerating: false, editingChapterId: null }),
  initDate: () => set((state) => ({ entryDate: state.entryDate || new Date().toISOString().split('T')[0] })),
}))
