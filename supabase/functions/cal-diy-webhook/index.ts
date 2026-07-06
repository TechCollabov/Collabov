// Receives Cal.diy's booking-confirmed webhook and turns it into a real
// pending_engagement row, so sweepPendingEngagementFollowups() (workflows.ts)
// can nudge both sides the day after the call — exactly the same downstream
// flow the old simulated "pick a slot in our own modal" button used to feed.
//
// Setup (once real Cal.diy credentials exist):
//   supabase secrets set CAL_DIY_WEBHOOK_SECRET=<the shared secret Cal.diy gives you>
//   Point Cal.diy's webhook config at this function's URL, with that same
//   secret configured on their side (sent back as the X-Cal-Diy-Signature
//   header on every request — swap the comparison below for HMAC verification
//   if Cal.diy signs the payload instead of sending the raw shared secret).
//
// Expected payload shape (adjust once real Cal.diy docs are available — this
// mirrors the common Cal.com-style webhook contract):
//   {
//     "triggerEvent": "BOOKING_CREATED",
//     "payload": {
//       "startTime": "2026-07-10T14:00:00.000Z",
//       "organizer": { "email": "vendor@example.com" },
//       "attendees": [{ "email": "buyer@example.com" }]
//     }
//   }
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cal-diy-signature',
}

interface CalDiyPayload {
  triggerEvent: string
  payload: {
    startTime: string
    organizer?: { email?: string }
    attendees?: { email?: string }[]
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const expectedSecret = Deno.env.get('CAL_DIY_WEBHOOK_SECRET')
  const providedSecret = req.headers.get('x-cal-diy-signature')
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Invalid or missing webhook signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: CalDiyPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Only booking-confirmed events create a pending_engagement — cancellations
  // and reschedules are out of scope for this MVP integration.
  if (body.triggerEvent !== 'BOOKING_CREATED') {
    return new Response(JSON.stringify({ ok: true, ignored: body.triggerEvent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const organizerEmail = body.payload.organizer?.email?.toLowerCase()
  const attendeeEmail = body.payload.attendees?.[0]?.email?.toLowerCase()
  const meetingDatetime = body.payload.startTime

  if (!organizerEmail || !attendeeEmail || !meetingDatetime) {
    return new Response(JSON.stringify({ ok: true, ignored: 'missing organizer/attendee/startTime' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name')
    .ilike('contact_email', organizerEmail)
    .maybeSingle()

  const { data: buyerProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('email', attendeeEmail)
    .maybeSingle()

  if (!vendor || !buyerProfile) {
    // Can't attribute this booking to a known vendor/buyer pair on the
    // platform — acknowledge receipt without creating a record.
    return new Response(JSON.stringify({ ok: true, ignored: 'vendor or buyer not found', vendorFound: !!vendor, buyerFound: !!buyerProfile }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { error: insertErr } = await supabase.from('pending_engagement').insert({
    buyer_id: buyerProfile.id,
    vendor_id: vendor.id,
    meeting_datetime: meetingDatetime,
    status: 'scheduled',
  })
  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  await supabase.from('notifications').insert({
    user_id: vendor.id,
    type: 'enquiry',
    title: 'Discovery call booked',
    message: `A buyer booked a call for ${new Date(meetingDatetime).toLocaleString('en-GB')} via your Cal.diy calendar.`,
    link_url: '/vendor/dashboard/enquiries',
  })

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
