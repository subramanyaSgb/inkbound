import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { novelId, messages } = await request.json()

  if (!novelId || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch novel for context
  const { data: novel } = await supabase
    .from('novels')
    .select('title, character_name, genre')
    .eq('id', novelId)
    .single()

  const systemPrompt = `You are a warm, curious, and empathetic interviewer helping someone journal about their day. Your goal is to extract rich, detailed stories from their daily life that can be turned into a novel chapter.

CONTEXT:
- Their novel is called "${novel?.title || 'My Novel'}"
- Protagonist name: "${novel?.character_name || 'the author'}"
- Genre: ${novel?.genre || 'literary fiction'}

RULES:
1. Ask ONE question at a time. Never ask multiple questions in one message.
2. Keep messages short (1-3 sentences max).
3. Be warm and conversational, like a friend catching up.
4. ADAPT based on their response:
   - If SHORT/VAGUE: Ask for specifics — who, what, where, how did it feel?
   - If RICH/DETAILED: Acknowledge what they shared, then ask about a different part of their day.
5. After 4-6 good exchanges, gently ask "Anything else you want to include?" to wrap up.
6. Never use emojis. Keep a literary, warm tone.
7. Start with a simple, open question about their day.`

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: apiMessages,
        max_tokens: 256,
        temperature: 0.9,
        stream: false,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('NVIDIA API error:', err)
      return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Return as SSE so the client streaming parser still works
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const chunk = JSON.stringify({
          choices: [{ delta: { content } }],
        })
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Guided chat error:', err)
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 })
  }
}
