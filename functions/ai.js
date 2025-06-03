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
    console.log("Raw request body length:", body.length);
    
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

    console.log("Request contains files:", parsedBody.files?.length || 0);
    console.log("Message length:", parsedBody.message?.length || 0);
    
    const { message, messages = [], files = [] } = parsedBody;

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

    // ✅ Enhanced system prompt for file handling
    let systemPrompt = "Du bist ein hilfsreicher AI-Assistent. Antworte höflich und informativ auf Deutsch.";
    
    if (files.length > 0) {
      systemPrompt += ` 
      
WICHTIG: Der Benutzer hat ${files.length} Textdatei(en) hochgeladen. Diese Dateien sind im Nachrichteninhalt unter "[Uploaded Files Context:]" zu finden. 
- Lies und analysiere den Inhalt dieser Dateien sorgfältig
- Beziehe dich direkt auf den Dateiinhalt in deinen Antworten
- Wenn der Benutzer Fragen zu den Dateien stellt, zitiere relevante Teile daraus
- Bestätige explizit, dass du die Dateien gelesen hast`;
    }

    // ✅ Prepare messages for OpenAI Chat API
    const chatMessages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation history (excluding the current message to avoid duplication)
    if (messages.length > 0) {
      // Only add messages that aren't the current one
      const historyMessages = messages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      chatMessages.push(...historyMessages);
    }

    // Add the current message (which includes file content)
    chatMessages.push({
      role: "user",
      content: message
    });

    console.log("=== DEBUG: Final message to OpenAI ===");
    console.log("System prompt:", systemPrompt);
    console.log("Total messages:", chatMessages.length);
    console.log("Current message preview:", message.substring(0, 500) + "...");
    console.log("=====================================");

    // ✅ Send request to OpenAI Chat API with increased max_tokens for file responses
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_APP_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: chatMessages,
        max_tokens: files.length > 0 ? 2000 : 1000, // More tokens when files are involved
        temperature: 0.7,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("OpenAI API Error:", apiResponse.status, errorText);
      
      // Check for context length error
      if (errorText.includes("context_length_exceeded")) {
        return new Response(JSON.stringify({ 
          error: "Die hochgeladenen Dateien sind zu groß. Bitte verwende kleinere Dateien oder teile sie auf.",
          choices: [{
            message: {
              content: "Entschuldigung, die hochgeladenen Dateien sind zu groß für die Verarbeitung. Bitte verwende kleinere Dateien oder teile sie in mehrere kleinere Dateien auf."
            }
          }]
        }), {
          status: 200, // Return 200 so frontend handles it normally
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      
      throw new Error(`OpenAI API Error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    console.log("OpenAI Response received successfully");
    
    // Log if the response mentions files
    const responseContent = data.choices?.[0]?.message?.content || "";
    console.log("Response mentions files:", responseContent.toLowerCase().includes("datei"));

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