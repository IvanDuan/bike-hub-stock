import { NextResponse } from "next/server";

type BikeType = "road" | "mtb" | "hybrid" | "kids" | "bmx" | "cruiser" | "other";

function toBikeType(raw: string | null | undefined): BikeType {
  const t = (raw ?? "").toLowerCase();
  if (t.includes("mountain") || t === "mtb") return "mtb";
  if (t.includes("road")) return "road";
  if (t.includes("hybrid") || t.includes("commuter")) return "hybrid";
  if (t.includes("kid") || t.includes("child") || t.includes("youth")) return "kids";
  if (t.includes("bmx")) return "bmx";
  if (t.includes("cruiser")) return "cruiser";
  return "other";
}

function safeJsonFromText(text: string): any | null {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting first JSON object in the output
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const maybe = text.slice(start, end + 1);
      try {
        return JSON.parse(maybe);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });
  }

  let body: { imageDataUrl?: string } | null = null;
  try {
    body = (await req.json()) as { imageDataUrl?: string };
  } catch {
    body = null;
  }

  const imageDataUrl = body?.imageDataUrl;
  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return NextResponse.json({ error: "Missing imageDataUrl." }, { status: 400 });
  }

  const prompt = [
    "You are a bike photo classifier for a community bike shop.",
    "From the photo, extract the bike brand (if visible), a simple type, and the primary color.",
    "If the bike is for a child (small frame/wheels, kids styling), classify it as type \"kids\".",
    "Return ONLY valid JSON with keys:",
    '  brand: string | null (e.g. "Avanti")',
    '  type: one of ["road","mtb","hybrid","kids","bmx","cruiser","other"]',
    '  color: string | null (e.g. "black")',
    '  title: string (short title like "Avanti black road bike" or "Black hybrid bike")',
    "If brand is unknown, omit brand from title.",
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageDataUrl },
          ],
        },
      ],
      // Keep output short/cost low
      max_output_tokens: 120,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const retryAfter = res.headers.get("retry-after");

    // Bubble up the upstream status where it’s useful to the client UI.
    // - 401/403: bad/disabled key
    // - 429: rate limited or quota/billing issue
    // - 400: invalid input (image too large/invalid)
    const status = [400, 401, 403, 429].includes(res.status) ? res.status : 502;

    let hint: string | undefined;
    if (res.status === 429) {
      hint =
        "Rate limited or quota exceeded. Wait a bit, then try again. If it keeps happening, check your OpenAI billing/usage limits for this API key.";
    } else if (res.status === 401 || res.status === 403) {
      hint = "Your OpenAI API key is missing, invalid, or not permitted to use this model.";
    } else if (res.status === 400) {
      hint = "The photo could not be processed. Try a different image or retake the photo.";
    }

    return NextResponse.json(
      {
        error: `OpenAI error (${res.status})`,
        hint,
        retry_after_seconds: retryAfter ? Number(retryAfter) : undefined,
        detail: text.slice(0, 500),
      },
      { status }
    );
  }

  const data = (await res.json()) as any;
  const outText =
    (data?.output_text as string | undefined) ??
    (Array.isArray(data?.output)
      ? data.output
          .flatMap((o: any) => o?.content ?? [])
          .map((c: any) => c?.text)
          .filter(Boolean)
          .join("\n")
      : "");

  const parsed = safeJsonFromText(outText || "");
  const brand = typeof parsed?.brand === "string" ? parsed.brand.trim() : null;
  const color = typeof parsed?.color === "string" ? parsed.color.trim() : null;
  let type = toBikeType(parsed?.type);
  const title =
    typeof parsed?.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : [brand, color, type !== "other" ? `${type} bike` : "bike"]
          .filter(Boolean)
          .join(" ");

  // If the model didn't set type but the title implies it, recover here.
  if (type === "other") {
    const t = title.toLowerCase();
    if (t.includes("kid") || t.includes("kids") || t.includes("child") || t.includes("youth")) {
      type = "kids";
    } else if (t.includes("bmx")) {
      type = "bmx";
    } else if (t.includes("cruiser")) {
      type = "cruiser";
    } else if (t.includes("mountain") || t.includes(" mtb")) {
      type = "mtb";
    } else if (t.includes("road")) {
      type = "road";
    } else if (t.includes("hybrid") || t.includes("commuter")) {
      type = "hybrid";
    }
  }

  return NextResponse.json({ brand, color, type, title });
}

