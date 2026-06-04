import { branchById, typeLabel } from "./constants";
import { textFromOpenAIResponse } from "./openai-text";
import type { Bike, BikeType } from "./types";

export type ListingDescriptionInput = {
  make: string;
  model: string;
  color: string;
  type: BikeType;
  frame_size?: string;
  selling_tags: string[];
  asking_price?: number | null;
  branch_id?: string | null;
};

export function bikeToListingInput(bike: Pick<
  Bike,
  "make" | "model" | "color" | "type" | "frame_size" | "selling_tags" | "asking_price" | "branch_id"
>): ListingDescriptionInput {
  return {
    make: bike.make ?? "",
    model: bike.model ?? "",
    color: bike.color ?? "",
    type: bike.type,
    frame_size: bike.frame_size,
    selling_tags: bike.selling_tags ?? [],
    asking_price: bike.asking_price,
    branch_id: bike.branch_id,
  };
}

function normalizeTags(tags: string[]): string[] {
  return tags
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean)
    .filter((t) => !/^kids?$/i.test(t) && !/^adult$/i.test(t) && !/^ready(\s|-)?to(\s|-)?ride$/i.test(t));
}

function buildPrompt(input: ListingDescriptionInput): string {
  const type = typeLabel(input.type);
  const branch = input.branch_id ? branchById(input.branch_id) : null;
  const tags = normalizeTags(input.selling_tags);
  const lines = [
    "Write 2–3 short sentences for a public bike listing at a friendly Auckland community bike hub (quality refurbished second-hand bikes).",
    "",
    `Make / brand: ${input.make || "Unknown"}`,
    `Model: ${input.model || "—"}`,
    `Bike type: ${type}`,
    `Colour: ${input.color || "—"}`,
  ];
  if (input.frame_size?.trim()) lines.push(`Frame size: ${input.frame_size.trim()}`);
  if (input.asking_price != null && input.asking_price > 0) {
    lines.push(`Asking price: $${input.asking_price}`);
  }
  if (branch) lines.push(`Hub: ${branch.name}`);
  if (tags.length) {
    lines.push(
      "",
      "Staff selling points (turn into fluent, grammatical prose — expand shorthand, fix grammar):",
      tags.map((t) => `- ${t}`).join("\n")
    );
  } else {
    lines.push("", "No specific selling points — describe it as a solid refurbished community-hub bike.");
  }
  lines.push(
    "",
    "Rules:",
    "- Correct grammar and natural English only.",
    "- Warm, persuasive, honest tone. No bullet points, no \"Highlights:\", no ALL CAPS.",
    "- Do NOT include address, phone, email, or test-ride invitations.",
    "- Keep the listing body under 320 characters.",
    "- Return ONLY the listing sentences, nothing else."
  );
  return lines.join("\n");
}

export async function generateListingDescriptionWithAI(
  input: ListingDescriptionInput
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: [{ role: "user", content: [{ type: "input_text", text: buildPrompt(input) }] }],
      max_output_tokens: 180,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const body = textFromOpenAIResponse(data)
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!body) throw new Error("OpenAI returned an empty description.");
  return body;
}
