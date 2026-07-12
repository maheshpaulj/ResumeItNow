import { NextResponse } from 'next/server'
import { openRouterChat } from '@/lib/openrouter'

export async function POST(req: Request) {
  try {
    const { description } = await req.json()

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'No description provided' }, { status: 400 })
    }

    const enhanced = await openRouterChat([
      {
        role: 'system',
        content:
          'You are a professional resume writer. Rewrite the text the user gives you to be more impactful and professional while staying truthful. Use strong action verbs and quantify impact where the original text supports it. Formatting: only bold (**) and bullet points (-) markdown, and only where it helps. Reply with the rewritten text only — no preamble, no explanations. Keep it strictly under 450 characters.',
      },
      {
        role: 'user',
        content: description,
      },
    ])

    return NextResponse.json({ enhanced: enhanced.trim() })
  } catch (error) {
    console.error('Error in enhance API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enhance description' },
      { status: 500 }
    )
  }
}
