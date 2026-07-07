// Creates a real OpenSign signature request for a generated SOW, replacing
// the old flow where the buyer's "Sign Contract" button and the vendor's
// "Review & Sign Contract" button just flipped signed_by_buyer /
// signed_by_vendor directly in the DB with no actual signing ceremony.
//
// Setup (once real OpenSign credentials exist):
//   supabase secrets set OPENSIGN_API_URL=https://your-opensign-instance/api/v1
//   supabase secrets set OPENSIGN_API_KEY=<your OpenSign API key>
//   supabase secrets set OPENSIGN_WEBHOOK_SECRET=<shared secret, see opensign-webhook>
//   Configure that same webhook secret + this project's opensign-webhook URL
//   in your OpenSign instance's webhook settings so signature completion
//   flows back in real time (see opensign-webhook/index.ts).
//
// Called from SOWWizardPage.tsx right after the sow_documents row is created:
//   supabase.functions.invoke('opensign-create-envelope', { body: { sowId } })
//
// OpenSign's real REST API takes a base64 PDF + a signers array and returns a
// per-signer signing URL (https://opensignlabs.com/docs — adjust the request/
// response shape below to match your instance's exact API version). Since
// this build has no PDF-generation pipeline elsewhere, the PDF is assembled
// here from the SOW's own stored fields — the same content the buyer could
// already download as a plain-text file from the wizard.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SowRow {
  id: string
  contract_id: string | null
  buyer_id: string
  vendor_id: string
  project_title: string | null
  service_type: string | null
  total_budget: number | null
  payment_model: string | null
  ip_ownership: string | null
  obligations_summary: string | null
  milestones: { name?: string; amount?: number; due_date?: string }[] | null
}

async function buildSowPdf(sow: SowRow, buyerName: string, vendorName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  let y = 800
  const draw = (text: string, opts: { size?: number; f?: typeof font; gap?: number } = {}) => {
    page.drawText(text, { x: 50, y, size: opts.size ?? 10, font: opts.f ?? font, color: rgb(0.1, 0.1, 0.1) })
    y -= opts.gap ?? 16
  }

  draw('STATEMENT OF WORK', { size: 18, f: bold, gap: 28 })
  draw(`Project: ${sow.project_title ?? 'Untitled engagement'}`, { f: bold })
  draw(`Buyer: ${buyerName}`)
  draw(`Vendor: ${vendorName}`)
  draw(`Service type: ${sow.service_type ?? '—'}`)
  draw(`Total value: £${(sow.total_budget ?? 0).toLocaleString()}`)
  draw(`Payment model: ${sow.payment_model ?? '—'}`)
  draw(`IP ownership: ${sow.ip_ownership ?? '—'}`, { gap: 24 })

  if (sow.milestones?.length) {
    draw('MILESTONES', { f: bold, gap: 20 })
    for (const m of sow.milestones) {
      draw(`- ${m.name ?? 'Milestone'} — £${(m.amount ?? 0).toLocaleString()}${m.due_date ? ` (due ${m.due_date})` : ''}`)
    }
    y -= 8
  }

  if (sow.obligations_summary) {
    draw('OBLIGATIONS SUMMARY', { f: bold, gap: 20 })
    const words = sow.obligations_summary.split(' ')
    let line = ''
    for (const w of words) {
      if ((line + ' ' + w).length > 95) { draw(line); line = w } else { line = line ? `${line} ${w}` : w }
    }
    if (line) draw(line)
    y -= 8
  }

  draw('Governed by English law. Platform-standard contract template applies.', { gap: 30 })
  draw('Buyer signature: ____________________________', { gap: 24 })
  draw('Vendor signature: ____________________________')

  return doc.save()
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const openSignApiUrl = Deno.env.get('OPENSIGN_API_URL')
  const openSignApiKey = Deno.env.get('OPENSIGN_API_KEY')
  if (!openSignApiUrl || !openSignApiKey) {
    return new Response(JSON.stringify({ error: 'OpenSign is not configured yet — set OPENSIGN_API_URL and OPENSIGN_API_KEY.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sowId: string
  try {
    const body = await req.json()
    sowId = body.sowId
    if (!sowId) throw new Error('missing sowId')
  } catch {
    return new Response(JSON.stringify({ error: 'Expected JSON body: { sowId }' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: sow, error: sowErr } = await supabase
    .from('sow_documents')
    .select('id, contract_id, buyer_id, vendor_id, project_title, service_type, total_budget, payment_model, ip_ownership, obligations_summary, milestones')
    .eq('id', sowId)
    .maybeSingle()
  if (sowErr || !sow) {
    return new Response(JSON.stringify({ error: 'SOW not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const [{ data: buyer }, { data: vendor }] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', sow.buyer_id).maybeSingle(),
    supabase.from('vendors').select('company_name, contact_email').eq('id', sow.vendor_id).maybeSingle(),
  ])
  if (!buyer?.email || !vendor?.contact_email) {
    return new Response(JSON.stringify({ error: 'Could not resolve buyer or vendor email' }), {
      status: 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const pdfBytes = await buildSowPdf(sow as SowRow, buyer.full_name ?? 'Buyer', vendor.company_name ?? 'Vendor')
  const pdfBase64 = btoa(String.fromCharCode(...pdfBytes))

  // Adjust this request/response shape to match your real OpenSign API version.
  const openSignRes = await fetch(`${openSignApiUrl}/createdocument`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': openSignApiKey },
    body: JSON.stringify({
      title: `SOW — ${sow.project_title ?? 'Engagement'}`,
      file: `data:application/pdf;base64,${pdfBase64}`,
      signers: [
        { name: buyer.full_name ?? 'Buyer', email: buyer.email, role: 'Buyer' },
        { name: vendor.company_name ?? 'Vendor', email: vendor.contact_email, role: 'Vendor' },
      ],
      sendInOrder: false,
    }),
  })

  if (!openSignRes.ok) {
    const detail = await openSignRes.text()
    return new Response(JSON.stringify({ error: 'OpenSign request failed', detail }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const openSignData = await openSignRes.json()
  const documentId: string = openSignData.documentId ?? openSignData.id
  const signers: { email: string; signUrl: string }[] = openSignData.signers ?? []
  const buyerSignUrl = signers.find(s => s.email === buyer.email)?.signUrl ?? null
  const vendorSignUrl = signers.find(s => s.email === vendor.contact_email)?.signUrl ?? null

  await supabase.from('sow_documents').update({
    opensign_document_id: documentId,
    opensign_buyer_sign_url: buyerSignUrl,
    opensign_vendor_sign_url: vendorSignUrl,
  }).eq('id', sowId)

  return new Response(JSON.stringify({ documentId, buyerSignUrl, vendorSignUrl }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
