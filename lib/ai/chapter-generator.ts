import Anthropic from '@anthropic-ai/sdk'
import type { ChapterGenerationResponse } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateChapter(
  systemPrompt: string,
  userPrompt: string
): Promise<ChapterGenerationResponse> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Parse JSON response, handling potential markdown code fences
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed: ChapterGenerationResponse = JSON.parse(jsonStr)

  return parsed
}
