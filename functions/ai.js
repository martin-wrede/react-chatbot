// functions/ai.js

// This function handles requests sent to /api/ai
export async function onRequest(context) {
    const { request, env } = context;
  
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*", // Optionally, restrict to your domain
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
  
    try {
      // Parse the JSON payload
      const { prompt } = await request.json();
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Missing 'prompt' field." }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
  
      // Call OpenAI's image generation endpoint
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt,
          n: 1,                // Number of images to generate
          size: "1024x1024"    // Options: "256x256", "512x512", or "1024x1024"
        })
      });
  
      const json = await response.json();
  
      return new Response(JSON.stringify(json), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
  