
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface RequestBody {
  subscription: PushSubscription;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // For POST requests, handle the push notification
    if (req.method === 'POST') {
      const { subscription, message } = await req.json() as RequestBody;
      
      console.log('Received push notification request:');
      console.log('Subscription:', subscription);
      console.log('Message:', message);

      // Here we would use the Web Push library to send the notification
      // For now, we'll just save the subscription to the database
      
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({ 
          endpoint: subscription.endpoint,
          subscription_data: subscription 
        })
        .select();

      if (error) {
        console.error('Error saving subscription:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to save subscription' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Subscription saved successfully:', data);
      
      // In a production app, we would send the actual push notification here
      // using the web-push library, but for now we'll just return a success response
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Push notification request received' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
