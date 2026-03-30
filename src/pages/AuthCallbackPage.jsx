import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Handles OAuth callback from Google
 * Exchanges the auth code for a session and stores calendar/email tokens
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The hash fragment contains the access token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken) {
          // Check if there's an error
          const errorParam = hashParams.get('error');
          if (errorParam) {
            setError(hashParams.get('error_description') || 'Authentication failed');
            return;
          }
          setError('No access token received');
          return;
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Failed to get session');
          return;
        }

        // Check if this was a Google OAuth with calendar/gmail scopes
        // Store tokens for calendar and email connections
        const providerToken = session.provider_token;
        const providerRefreshToken = session.provider_refresh_token;

        if (providerToken) {
          const tokenExpiry = new Date(Date.now() + 3600 * 1000).toISOString();

          // Store calendar connection
          await supabase.from('calendar_connections').upsert({
            user_id: session.user.id,
            provider: 'google',
            access_token: providerToken,
            refresh_token: providerRefreshToken,
            token_expiry: tokenExpiry,
            connected: true,
          }, { onConflict: 'user_id' });

          // Store email connection
          await supabase.from('email_connections').upsert({
            user_id: session.user.id,
            provider: 'gmail',
            access_token: providerToken,
            refresh_token: providerRefreshToken,
            token_expiry: tokenExpiry,
            connected: true,
          }, { onConflict: 'user_id' });
        }

        // Check onboarding status
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.onboarding_completed) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="text-danger text-lg font-medium mb-2">Authentication Error</div>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="text-primary hover:text-primary-light"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Connecting your account...</p>
      </div>
    </div>
  );
}
