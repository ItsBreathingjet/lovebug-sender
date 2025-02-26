
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const loveMessages = [
  "Just wanted to send you a little love bug to brighten your day! 🐞❤️",
  "Consider yourself hugged from afar! 🤗💕",
  "Sending you a virtual lovebug cuddle! 🐞💝",
  "You make my heart flutter like a lovebug's wings! 💖✨",
  "Here's a little lovebug to remind you how special you are! 🐞💫",
  "Spreading some lovebug magic your way! ✨❤️",
  "A lovebug stopped by to say you're amazing! 🐞💕",
  "Let this lovebug remind you that you're loved! 💝✨",
  "Sending you lovebug kisses and warm wishes! 🐞💖",
  "This lovebug carries a message of joy just for you! ✨❤️"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating love message...');
    
    // Randomly select a love message
    const randomIndex = Math.floor(Math.random() * loveMessages.length);
    const message = loveMessages[randomIndex];
    
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
