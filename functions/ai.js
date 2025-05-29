export async function onRequest(context) {
  const { request } = context;
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const userMessage = body.message;

    // You can replace this with your Claude/OpenAI API logic
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${YOUR_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await apiResponse.json();
    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
