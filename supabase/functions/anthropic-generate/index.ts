// Proxies text-generation requests to Anthropic so the API key never ships to
// the browser. Previously SOWWizardPage (milestone suggestions),
// ManageListings (case study keyword extraction) and ProposalForm (AI-drafted
// proposal approach) each called https://api.anthropic.com directly from
// client code with `import.meta.env.VITE_ANTHROPIC_API_KEY` — any Vite env
// var prefixed VITE_ is bundled into the shipped JS, so that key was visible
// to anyone who opened devtools. All three now call this function instead.
//
// Setup (once a real Anthropic key exists):
//   supabase secrets set ANTHROPIC_API_KEY=<your Anthropic API key>
// Until that secret is set, this function returns 503 and callers fall back
// to their existing non-AI defaults (the same behaviour as an unset
// VITE_ANTHROPIC_API_KEY before this change).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  prompt: string
  maxTokens?: number
  model?: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Anthropic is not configured yet — set ANTHROPIC_API_KEY.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: GenerateRequest
  try {
    body = await req.json()
    if (!body.prompt) throw new Error('missing prompt')
  } catch {
    return new Response(JSON.stringify({ error: 'Expected JSON body: { prompt, maxTokens?, model? }' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model ?? 'claude-sonnet-4-20250514',
        max_tokens: body.maxTokens ?? 500,
        messages: [{ role: 'user', content: body.prompt }],
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const detail = await res.text()
      return new Response(JSON.stringify({ error: 'Anthropic request failed', detail }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    const text: string = data.content?.[0]?.text ?? ''
    return new Response(JSON.stringify({ text, usage: data.usage ?? null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    clearTimeout(timer)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Request failed' }), {
      status: 504,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
