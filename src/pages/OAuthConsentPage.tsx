import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ConsentRequest {
  client_id: string;
  client_name?: string;
  scopes: string[];
  redirect_uri?: string;
}

const OAuthConsentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const consentChallenge = searchParams.get('consent_challenge');

  const [consentRequest, setConsentRequest] = useState<ConsentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConsentRequest() {
      if (!consentChallenge) {
        setError('Missing consent challenge. This link may be invalid.');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(`/signin?redirect=${encodeURIComponent(window.location.href)}`, { replace: true });
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/oauth/consent?consent_challenge=${encodeURIComponent(consentChallenge)}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );

        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `Request failed (${res.status})`);
        }

        const data = await res.json();
        setConsentRequest({
          client_id: data.client_id ?? 'Unknown',
          client_name: data.client_name,
          scopes: data.requested_scope ?? [],
          redirect_uri: data.redirect_uri,
        });
      } catch (err: any) {
        setError(err.message ?? 'Failed to load consent request.');
      } finally {
        setLoading(false);
      }
    }

    fetchConsentRequest();
  }, [consentChallenge, navigate]);

  async function handleDecision(accept: boolean) {
    if (!consentChallenge) return;
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/signin', { replace: true });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/oauth/consent`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            consent_challenge: consentChallenge,
            accept,
            ...(accept && consentRequest ? { grant_scopes: consentRequest.scopes } : {}),
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Request failed (${res.status})`);
      }

      const { redirect_to } = await res.json();
      if (redirect_to) {
        window.location.href = redirect_to;
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authorization Error</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Authorize Access</h1>
          <p className="text-gray-500 text-sm mt-1">
            <span className="font-medium text-gray-800">
              {consentRequest?.client_name ?? consentRequest?.client_id}
            </span>{' '}
            is requesting access to your Collabov account.
          </p>
        </div>

        {consentRequest && consentRequest.scopes.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Requested permissions
            </p>
            <ul className="space-y-1">
              {consentRequest.scopes.map(scope => (
                <li key={scope} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {scope}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mb-6">
          By approving, you allow this application to access your account data as listed above.
          You can revoke access at any time from your account settings.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => handleDecision(false)}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition disabled:opacity-50"
          >
            Deny
          </button>
          <button
            onClick={() => handleDecision(true)}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Approve
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OAuthConsentPage;
