type ClientMessage = {
  who?: string;
  text?: string;
};

type GroqChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const districtContext = `Trusted public entry points for this prototype:
- CCSD home: https://www.ccsd.net/
- Acceptable Use + AI: https://www.ccsd.net/legal/acceptable-use-policy
- Student Data Privacy / SAFE List: https://safe.ccsd.net/
- Canvas: https://canvas.ccsd.net/
- Canvas Help: https://canvashelp.ccsd.net/
- Infinite Campus: https://campusportal.ccsd.net/
- Clever: https://clever.ccsd.net/
- StuTech: https://stutech.ccsd.net/
- Transportation: https://transportation.ccsd.net/
Never claim access to private student records or that VEGA is an official CCSD product.`;

const groqModel =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";

export async function GET() {
  return Response.json({
    connected: Boolean(process.env.GROQ_API_KEY),
    provider: process.env.GROQ_API_KEY ? "Groq" : "local-demo",
    model: groqModel,
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Live model is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      role?: string;
      mode?: string;
      messages?: ClientMessage[];
    };

    const role = ["Student", "Teacher", "Family", "Staff"].includes(
      body.role || ""
    )
      ? body.role
      : "Student";

    const mode = ["Tutor", "Plan", "Translate", "Navigate"].includes(
      body.mode || ""
    )
      ? body.mode
      : "Tutor";

    const messages = (body.messages || [])
      .slice(-10)
      .filter(
        (item) =>
          typeof item.text === "string" &&
          item.text.trim()
      )
      .map((item) => ({
        role: item.who === "vega" ? "assistant" : "user",
        content: item.text!.slice(0, 4000),
      }));

    if (!messages.length) {
      return Response.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    const instructions = `You are VEGA, a warm, concise school assistant prototype for Clark County learners.

Current audience: ${role}
Current mode: ${mode}

Rules:
1. Protect learning: coach and ask questions; do not complete graded work or enable cheating.
2. Never request or repeat names, IDs, grades, contact information, medical details, disability records, passwords, addresses, or other private student data.
3. If private data appears, stop and ask for a fictionalized version.
4. Never claim to access Canvas, Infinite Campus, district systems, student records, or live CCSD data.
5. Treat all CCSD-specific policy claims cautiously. Refer users to an official link when relevant. Do not invent citations.
6. For threats, self-harm, abuse, or immediate danger, encourage contacting a trusted adult and emergency services; do not act as a counselor.
7. Match the audience and mode. Use plain language, short sections, and one useful next step.
8. State that VEGA is a concept when deployment or endorsement could be confused.

${districtContext}`;

    const upstream = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            {
              role: "system",
              content: instructions,
            },
            ...messages,
          ],
          max_tokens: 700,
        }),
        signal: AbortSignal.timeout(18000),
      }
    );

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error("Groq API error:", upstream.status, errorText);

      return Response.json(
        { error: "The live model is temporarily unavailable." },
        { status: 502 }
      );
    }

    const data =
      (await upstream.json()) as GroqChatCompletion;

    const text =
      data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return Response.json(
        { error: "The live model returned no text." },
        { status: 502 }
      );
    }

    return Response.json({
      text,
      provider: "Groq",
      model: groqModel,
    });
  } catch (error) {
    console.error("VEGA chat error:", error);

    const message =
      error instanceof Error &&
      error.name === "TimeoutError"
        ? "The live model timed out."
        : "The request could not be completed.";

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
