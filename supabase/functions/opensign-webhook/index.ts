// Receives OpenSign's signature-completed webhook and is the ONLY thing that
// writes sow_documents.buyer_signed_at / vendor_signed_at and
// contracts.signed_by_customer / signed_by_vendor from here on — the old
// "Sign Contract" buttons used to set these directly on click, which was the
// simulated part. Once both are set, EngagementWorkspacePage's existing
// load() already activates the contract/engagement (see the
// signed_by_customer && signed_by_vendor && status === 'pending' check there)
// the next time either party loads the page, so this function doesn't need
// to duplicate that activation logic.
//
// Setup (once real OpenSign credentials exist):
//   supabase secrets set OPENSIGN_WEBHOOK_SECRET=<shared secret you also give OpenSign>
//   Point your OpenSign instance's webhook config at this function's URL.
//
// Expected payload shape (adjust to match your real OpenSign API version):
//   {
//     "event": "signer.completed",
//     "data": { "documentId": "...", "signerEmail": "...", "completedAt": "2026-07-10T12:00:00Z" }
//   }
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-opensign-signature',
}

interface OpenSignPayload {
  event: string
  data: { documentId: string; signerEmail: string; completedAt: string }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const expectedSecret = Deno.env.get('OPENSIGN_WEBHOOK_SECRET')
  const providedSecret = req.headers.get('x-opensign-signature')
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Invalid or missing webhook signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: OpenSignPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (body.event !== 'signer.completed') {
    return new Response(JSON.stringify({ ok: true, ignored: body.event }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { documentId, signerEmail, completedAt } = body.data
  if (!documentId || !signerEmail) {
    return new Response(JSON.stringify({ ok: true, ignored: 'missing documentId/signerEmail' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: sow } = await supabase
    .from('sow_documents')
    .select('id, contract_id, buyer_id, vendor_id')
    .eq('opensign_document_id', documentId)
    .maybeSingle()
  if (!sow) {
    return new Response(JSON.stringify({ ok: true, ignored: 'no SOW for this documentId' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const [{ data: buyer }, { data: vendor }] = await Promise.all([
    supabase.from('profiles').select('email').eq('id', sow.buyer_id).maybeSingle(),
    supabase.from('vendors').select('contact_email').eq('id', sow.vendor_id).maybeSingle(),
  ])

  const email = signerEmail.toLowerCase()
  const isBuyer = buyer?.email?.toLowerCase() === email
  const isVendor = vendor?.contact_email?.toLowerCase() === email
  const now = completedAt || new Date().toISOString()

  if (isBuyer) {
    await supabase.from('sow_documents').update({ buyer_signed_at: now }).eq('id', sow.id)
    if (sow.contract_id) await supabase.from('contracts').update({ signed_by_customer: true, customer_signature_date: now }).eq('id', sow.contract_id)
  } else if (isVendor) {
    await supabase.from('sow_documents').update({ vendor_signed_at: now }).eq('id', sow.id)
    if (sow.contract_id) await supabase.from('contracts').update({ signed_by_vendor: true, vendor_signature_date: now }).eq('id', sow.contract_id)
  } else {
    return new Response(JSON.stringify({ ok: true, ignored: 'signer email matches neither buyer nor vendor' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const otherPartyId = isBuyer ? sow.vendor_id : sow.buyer_id
  await supabase.from('notifications').insert({
    user_id: otherPartyId,
    type: 'contract',
    title: isBuyer ? 'Buyer signed the contract' : 'Vendor signed the contract',
    message: `${isBuyer ? 'The buyer' : 'The vendor'} signed via OpenSign. ${isBuyer ? 'Counter-sign' : 'Check'} from your Active Contracts screen.`,
    link_url: isBuyer ? '/vendor/dashboard/contracts' : '/customer/dashboard',
  })

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
