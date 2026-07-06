// Proxies text-generation requests to Anthropic so the API key never ships to
// the browser. Previously SOWWizardPage (milestone suggestions and the
// obligations summary), ManageListings (case study keyword extraction) and
// ProposalForm (AI-drafted proposal approach) each called
// https://api.anthropic.com directly from client code with
// `import.meta.env.VITE_ANTHROPIC_API_KEY` — any Vite env var prefixed
// VITE_ is bundled into the shipped JS, so that key was visible to anyone
// who opened devtools. All four now call this function instead.
//
// Every call is also logged to ai_usage_log (token counts + an estimated
// USD cost from Anthropic's published per-model pricing) — previously the
// Anthropic response's `usage` field was returned to the caller and never
// looked at again, so there was no way to see how much these features cost
// to run.
//
// Setup (once a real Anthropic key exists):
//   supabase secrets set ANTHROPIC_API_KEY=<your Anthropic API key>
// Until that secret is set, this function returns 503 and callers fall back
// to their existing non-AI defaults (the same behaviour as an unset
// VITE_ANTHROPIC_API_KEY before this change).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  prompt: string
  maxTokens?: number
  model?: string
  feature?: string
}

// Published per-model rates, USD per million tokens (input, output). Update
// this table if Anthropic changes pricing or a new model is passed in.
const PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
}
const DEFAULT_PRICING = { input: 3, output: 15 }

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
    return new Response(JSON.stringify({ error: 'Expected JSON body: { prompt, maxTokens?, model?, feature? }' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const model = body.model ?? 'claude-sonnet-4-20250514'
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
        model,
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
    const usage = data.usage ?? null

    await logUsage(req, {
      feature: body.feature ?? 'unspecified',
      model,
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
    })

    return new Response(JSON.stringify({ text, usage }), {
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

async function logUsage(req: Request, params: { feature: string; model: string; inputTokens: number; outputTokens: number }) {
  try {
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await anonClient.auth.getUser()

    const pricing = PRICING_PER_MILLION_TOKENS[params.model] ?? DEFAULT_PRICING
    const estimatedCostUsd =
      (params.inputTokens / 1_000_000) * pricing.input +
      (params.outputTokens / 1_000_000) * pricing.output

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    await serviceClient.from('ai_usage_log').insert({
      user_id: user?.id ?? null,
      feature: params.feature,
      model: params.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      estimated_cost_usd: estimatedCostUsd,
    })
  } catch (err) {
    // Usage logging is best-effort — never let it fail the actual AI request.
    console.error('[anthropic-generate] usage logging failed:', err)
  }
}
