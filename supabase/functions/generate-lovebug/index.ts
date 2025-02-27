
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  phoneNumber: string;
}

// Lovebug message templates with {name} placeholder
const loveMessages = [
  "Hey {name}, just wanted to send you a little love bug to brighten your day! 🐞❤️",
  "Consider yourself hugged from afar, {name}! 🤗💕",
  "Sending you a virtual lovebug cuddle, {name}! 🐞💝",
  "{name}, you make my heart flutter like a lovebug's wings! 💖✨",
  "Here's a little lovebug to remind you how special you are, {name}! 🐞💫",
  "Spreading some lovebug magic your way, {name}! ✨❤️",
  "{name}, a lovebug stopped by to say you're amazing! 🐞💕",
  "Let this lovebug remind you that you're loved, {name}! 💝✨",
  "Sending you lovebug kisses and warm wishes, {name}! 🐞💖",
  "This lovebug carries a message of joy just for you, {name}! ✨❤️"
];

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
    
    console.log('Generating love message...');
    
    // Get the phone number from the request body if it exists
    let name = "there";
    let phoneNumber = "";
    
    if (req.method === 'POST') {
      const body: RequestBody = await req.json();
      phoneNumber = body.phoneNumber;
      
      if (phoneNumber) {
        // Try to get the contact name from the database
        const { data: contactData } = await supabase
          .from('contacts')
          .select('name')
          .eq('phone_number', phoneNumber)
          .single();
          
        if (contactData && contactData.name) {
          name = contactData.name;
        }
      }
    }
    
    // Randomly select a love message
    const randomIndex = Math.floor(Math.random() * loveMessages.length);
    let message = loveMessages[randomIndex];
    
    // Replace {name} with the contact's name
    message = message.replace(/{name}/g, name);
    
    console.log('Generated message:', message);

    return new Response(
      JSON.stringify({
        message: message,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error in generate-lovebug function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
