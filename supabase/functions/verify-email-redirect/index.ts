
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Email verification request received");
    
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');
    const redirectTo = url.searchParams.get('redirect_to');
    
    console.log("Parameters:", { token, type, redirectTo });
    
    if (!token || !type) {
      console.error("Missing token or type");
      return new Response(
        JSON.stringify({ 
          error: "Missing token or verification type"
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the origin or use a default
    let origin = '';
    
    try {
      if (redirectTo) {
        origin = new URL(redirectTo).origin;
      } else if (req.headers.get('origin')) {
        origin = req.headers.get('origin') || '';
      } else if (req.headers.get('referer')) {
        origin = new URL(req.headers.get('referer') || '').origin;
      }
    } catch (error) {
      console.error("Error parsing origin:", error);
    }
    
    // Default to the Supabase project URL if no origin could be determined
    if (!origin) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      origin = supabaseUrl.replace('.supabase.co', '.vercel.app');
    }
    
    console.log("Using origin:", origin);

    // Construct the redirect URL with the verification token
    const clientRedirectUrl = `${origin}/auth?verification=true&token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
    
    console.log("Redirecting to:", clientRedirectUrl);
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': clientRedirectUrl
      }
    });
  } catch (error) {
    console.error('Error in verify-email-redirect function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
