// route.ts
import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const API_URL = "https://openrouter.ai/api/v1/chat/completions"

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not defined in environment variables')
}

export async function POST(req: Request) {
  try {
    const { description } = await req.json()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    }

    // Only add HTTP-Referer if NEXT_PUBLIC_URL is defined
    if (process.env.NEXT_PUBLIC_URL) {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_URL
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: "openrouter/cypher-alpha:free",
        messages: [{
          role: "system",
          content: "You are a professional resume writer. Enhance the given description to be more impactful and professional while maintaining truthfulness."
        }, {
          role: "user",
          content: `Please enhance this description to be more professional and impactful: ${description} . important: must only use bold(**) and bullet point(-) markdown only where ever necessary and dont use phrases like "here are..." or anything, just give the straight message. strictly under 450 characters.`
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenRouter API')
    }

    return NextResponse.json({ 
      enhanced: data.choices[0].message.content 
    })
  } catch (error) {
    console.error('Error in enhance API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enhance description' },
      { status: 500 }
    )
  }
}