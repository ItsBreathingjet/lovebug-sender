
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function handles the redirect after a user clicks the email verification link
serve(async (req) => {
  console.log('Processing verification request')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get URL and extract token
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const type = url.searchParams.get('type')
    const redirectTo = url.searchParams.get('redirect_to') || '/'
    
    if (!token || !type) {
      console.error('Missing token or type parameters')
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Process the verification
    console.log(`Processing ${type} with token`)
    let verificationResult

    if (type === 'signup') {
      // Handle signup verification
      verificationResult = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      })
    } else if (type === 'recovery' || type === 'email_change') {
      // Handle password reset or email change
      verificationResult = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type === 'recovery' ? 'recovery' : 'email_change',
      })
    } else {
      console.error('Unsupported verification type:', type)
      return new Response(
        JSON.stringify({ error: 'Unsupported verification type' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    if (verificationResult.error) {
      console.error('Verification error:', verificationResult.error)
      return new Response(
        JSON.stringify({ error: verificationResult.error.message }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Add verification=true to the redirect URL so the frontend knows verification was successful
    let finalRedirectUrl = redirectTo
    const redirectUrl = new URL(redirectTo, url.origin)
    redirectUrl.searchParams.set('verification', 'true')
    finalRedirectUrl = redirectUrl.toString()

    console.log(`Verification successful, redirecting to: ${finalRedirectUrl}`)
    
    // Redirect to frontend with verification flag
    return new Response(null, {
      status: 303, // 303 See Other
      headers: {
        Location: finalRedirectUrl,
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Error in verification redirect:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})
