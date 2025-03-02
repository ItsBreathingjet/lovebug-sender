
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  console.log("Verification redirect function called with:", url.search);

  try {
    // These are the token type/access token parameters that Supabase Auth includes in the redirect URL
    const token_hash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');
    const redirectTo = url.searchParams.get('redirect_to') || '/';

    if (!token_hash || !type) {
      console.error("Missing required parameters", { token_hash, type });
      return Response.redirect(`${url.origin}/auth?error=missing_parameters`, 302);
    }

    // Initialize Supabase client with Admin key to be able to verify tokens
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify email confirmation
    if (type === 'email_change' || type === 'signup') {
      const redirectURL = new URL(redirectTo.startsWith('http') ? redirectTo : `${url.origin}${redirectTo}`);
      redirectURL.searchParams.set('verification', 'true');
      
      console.log("Redirecting to:", redirectURL.toString());
      return Response.redirect(redirectURL.toString(), 302);
    }

    console.log("Unhandled verification type:", type);
    return Response.redirect(`${url.origin}/auth?error=unhandled_type&type=${type}`, 302);
    
  } catch (error) {
    console.error("Error in verification redirect:", error);
    return Response.redirect(`${url.origin}/auth?error=verification_error`, 302);
  }
});
