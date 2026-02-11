import type { ChapterGenerationResponse } from '@/types'

export async function generateChapter(
  systemPrompt: string,
  userPrompt: string
): Promise<ChapterGenerationResponse> {
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshotai/kimi-k2.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 1.0,
      top_p: 1.0,
      stream: false,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`NVIDIA API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  const text: string = data.choices?.[0]?.message?.content || ''

  // Parse JSON response, handling potential markdown code fences
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed: ChapterGenerationResponse = JSON.parse(jsonStr)

  return parsed
}
