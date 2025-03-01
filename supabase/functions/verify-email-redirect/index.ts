
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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');
    
    // Get the redirect URL from the query params or use a default
    const redirectUrl = url.searchParams.get('redirect_to') || new URL(req.headers.get('origin') || '').origin;
    
    if (!token || !type) {
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

    // Create Supabase client with Deno server environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the verification based on the type
    if (type === 'signup' || type === 'email') {
      // Construct the client redirect URL with verification params
      const clientRedirectUrl = `${redirectUrl}?verification=true&token=${token}&type=${type}`;
      
      console.log("Redirecting to:", clientRedirectUrl);
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': clientRedirectUrl
        }
      });
    } else {
      // For other types (password reset, etc.), use similar logic
      return new Response(
        JSON.stringify({ 
          error: "Unsupported verification type"
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
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
