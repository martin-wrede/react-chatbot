
// functions/ai.js

export async function onRequest(context) {
  const { request, env } = context;
  
  console.log("=== AI Function Called ===");
  console.log("Method:", request.method);
  
  // ✅ CORS Preflight Handling
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // ✅ Only accept POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: `Method ${request.method} not allowed` }), { 
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }

  try {
    const body = await request.text();
    console.log("Raw request body:", body);
    
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }

    console.log("Parsed request body:", parsedBody);
    const { message, messages = [] } = parsedBody;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing 'message' field" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }

    // ✅ Prepare messages for OpenAI Chat API
    const chatMessages = [
      {
        role: "system",
        content: "Du bist ein hilfsreicher AI-Assistent. Antworte höflich und informativ auf Deutsch."
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    console.log("Sending to OpenAI:", { model: "gpt-3.5-turbo", messageCount: chatMessages.length });

    // ✅ Send request to OpenAI Chat API
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_APP_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: chatMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("OpenAI API Error:", apiResponse.status, errorText);
      throw new Error(`OpenAI API Error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    console.log("OpenAI Response received successfully");

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in AI function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      choices: [{
        message: {
          content: "Entschuldigung, es gab einen technischen Fehler. Bitte versuche es erneut."
        }
      }]
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}