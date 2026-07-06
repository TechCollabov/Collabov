-- Tracks real token usage/cost for every anthropic-generate call, so AI spend
-- is visible instead of the Anthropic API responses' usage data being
-- received and silently discarded. The Edge Function is the only writer
-- (service role); admins can read it via AdminAnalytics.
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10,6) NOT NULL DEFAULT 0
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_log_admin_read"
  ON public.ai_usage_log FOR SELECT
  USING (is_admin());
