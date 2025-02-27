
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NativeToken {
  token: string;
  platform: 'ios' | 'android';
}

interface RequestBody {
  subscription: WebPushSubscription | NativeToken;
  message: string;
  platform?: 'web' | 'ios' | 'android';
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
      const { subscription, message, platform = 'web' } = await req.json() as RequestBody;
      
      console.log('Received push notification request:');
      console.log('Subscription:', subscription);
      console.log('Message:', message);
      console.log('Platform:', platform);

      // Save the subscription based on platform type
      if (platform === 'web') {
        const webSubscription = subscription as WebPushSubscription;
        const { data, error } = await supabase
          .from('push_subscriptions')
          .upsert({ 
            endpoint: webSubscription.endpoint,
            subscription_data: webSubscription,
            platform: 'web'
          })
          .select();

        if (error) {
          console.error('Error saving web subscription:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to save web subscription' }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        console.log('Web subscription saved successfully:', data);
      } else {
        // Handle native device token
        const nativeToken = subscription as NativeToken;
        const { data, error } = await supabase
          .from('push_subscriptions')
          .upsert({ 
            endpoint: nativeToken.token,
            subscription_data: nativeToken,
            platform: nativeToken.platform
          })
          .select();

        if (error) {
          console.error('Error saving native token:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to save native token' }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        console.log('Native token saved successfully:', data);
        
        // In a production environment, you would send the notification to FCM or APNS here
        // Example for Firebase Cloud Messaging (FCM):
        // This part is commented out because it requires actual Firebase credentials
        /*
        if (nativeToken.platform === 'android') {
          // Android FCM notification
          const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`
            },
            body: JSON.stringify({
              to: nativeToken.token,
              notification: {
                title: 'LoveBug',
                body: message,
                sound: 'default'
              }
            })
          });
          
          console.log('FCM response:', await fcmResponse.json());
        } else if (nativeToken.platform === 'ios') {
          // iOS APNS notification would be implemented here
          // This requires a more complex setup with Apple's push notification service
        }
        */
      }
      
      // For now, we'll just return a success response
      // In a production environment, you'd actually send the notification
      
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
