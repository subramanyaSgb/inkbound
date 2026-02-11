import OpenAI from 'openai'
import type { ChapterGenerationResponse } from '@/types'

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

export async function generateChapter(
  systemPrompt: string,
  userPrompt: string
): Promise<ChapterGenerationResponse> {
  const response = await client.chat.completions.create({
    model: 'moonshotai/kimi-k2.5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 4096,
    temperature: 1.0,
    top_p: 1.0,
    stream: false,
  })

  const text = response.choices[0]?.message?.content || ''

  // Parse JSON response, handling potential markdown code fences
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed: ChapterGenerationResponse = JSON.parse(jsonStr)

  return parsed
}
