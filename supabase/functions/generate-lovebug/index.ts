
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
    // Get the sender and recipient IDs from the request
    const { recipientId } = await req.json();

    // Create Supabase client with Deno server environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recipient profile details
    const { data: recipientData, error: recipientError } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', recipientId)
      .single();

    if (recipientError) {
      console.error('Error fetching recipient:', recipientError);
      throw new Error('Failed to fetch recipient details');
    }

    const recipientName = recipientData.display_name || recipientData.username || 'special someone';

    // OpenAI integration for generating the love message
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing OpenAI API key');
    }

    // Construct a prompt for OpenAI
    const prompt = `Generate a short, sweet, and personalized love note or message to send to ${recipientName}. 
    Make it creative, heartfelt, and suitable for the LoveBug app. 
    Keep it between 2-4 sentences. No hashtags or emojis.`;

    // Call OpenAI API to generate message
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a romantic assistant that creates heartfelt, personal messages.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 150
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error('Failed to generate message with OpenAI');
    }

    const generatedMessage = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ 
        message: generatedMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in generate-lovebug function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
