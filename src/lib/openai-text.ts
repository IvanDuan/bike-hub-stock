/** Extract assistant text from OpenAI Responses API payload. */
export function textFromOpenAIResponse(data: unknown): string {
  const d = data as {
    output_text?: string;
    output?: { content?: { text?: string }[] }[];
  };
  if (typeof d?.output_text === "string" && d.output_text.trim()) {
    return d.output_text.trim();
  }
  if (Array.isArray(d?.output)) {
    return d.output
      .flatMap((o) => o?.content ?? [])
      .map((c) => c?.text)
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return "";
}
