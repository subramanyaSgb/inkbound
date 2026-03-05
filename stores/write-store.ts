import { create } from 'zustand'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface WriteStore {
  selectedNovelId: string | null
  rawEntry: string
  entryDate: string
  isGenerating: boolean
  editingChapterId: string | null
  setSelectedNovelId: (id: string | null) => void
  setRawEntry: (text: string) => void
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
  setEntryDate: (date) => set({ entryDate: date }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  setEditingChapterId: (id) => set({ editingChapterId: id }),
  reset: () => set({ rawEntry: '', entryDate: todayLocal(), isGenerating: false, editingChapterId: null }),
  initDate: () => set((state) => ({ entryDate: state.entryDate || todayLocal() })),
}))
