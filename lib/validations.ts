import { z } from 'zod'

export const createNovelSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  characterName: z.string().min(1, 'Character name is required').max(50, 'Name too long'),
  genre: z.string().min(1, 'Genre is required'),
  pov: z.string().min(1, 'POV is required'),
  writingStyle: z.string().min(1, 'Writing style is required'),
  description: z.string().max(500, 'Description too long').optional(),
})

export const updateNovelSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  characterName: z.string().min(1, 'Character name is required').max(50, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})

export const entrySchema = z.object({
  rawEntry: z.string().min(10, 'Write at least a few sentences').max(50000, 'Entry too long'),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  novelId: z.string().uuid('Invalid novel'),
})

export const storyProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  relationship: z.string().max(100).optional(),
  nickname: z.string().max(50).optional(),
  details: z.record(z.string(), z.string().max(200)).optional(),
})

export const profileSchema = z.object({
  displayName: z.string().min(1, 'Name is required').max(50, 'Name too long'),
})

export type CreateNovelInput = z.infer<typeof createNovelSchema>
export type UpdateNovelInput = z.infer<typeof updateNovelSchema>
export type EntryInput = z.infer<typeof entrySchema>
export type StoryProfileInput = z.infer<typeof storyProfileSchema>
export type ProfileInput = z.infer<typeof profileSchema>
