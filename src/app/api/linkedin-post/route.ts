import { NextResponse } from 'next/server';
import { openai, DEFAULT_MODEL } from '@/lib/openaiClient';

export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function safeParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const topic = String(body?.topic || '').trim();
    if (!topic) return jsonError('Topic is required.');

    const achievement = String(body?.achievement || '').trim();
    const audience = String(body?.audience || 'Recruiters').trim();
    const tone = String(body?.tone || 'Professional').trim();
    const length = String(body?.length || 'medium').trim();

    if (!process.env.OPENAI_API_KEY) {
      return jsonError('Server configuration error: OPENAI_API_KEY is missing.', 500);
    }

    const maxChars = length === 'short' ? 1100 : length === 'long' ? 2600 : 1800;

    const system = `You write high-performing LinkedIn posts.
Return ONLY JSON with this shape:
{ "variants": [ {"title": string, "post": string, "hashtags": string[]} , ... ] }
Rules:
- Provide exactly 3 variants.
- Keep each post <= ${maxChars} characters.
- Add short hook, story/value, clear takeaway, soft CTA.
- Hashtags: 8-12, relevant, no spam.
- No markdown formatting.`;

    const user = `Topic: ${topic}
Audience: ${audience}
Tone: ${tone}
Details: ${achievement || '(none)'}

Generate 3 variants.`;

    const r = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.8,
    });

    const text = r.choices?.[0]?.message?.content || '';
    const parsed = safeParseJSON(text);
    if (!parsed?.variants || !Array.isArray(parsed.variants)) {
      return jsonError('Model returned unexpected output. Please try again.', 502);
    }

    // sanitize
    const variants = parsed.variants.slice(0, 3).map((v: any, i: number) => ({
      title: String(v?.title || `Variant ${i + 1}`),
      post: String(v?.post || '').trim(),
      hashtags: Array.isArray(v?.hashtags)
        ? v.hashtags.map((h: any) => String(h)).slice(0, 12)
        : [],
    }));

    return NextResponse.json({ ok: true, variants });
  } catch (e: any) {
    return jsonError(e?.message || 'Failed to generate LinkedIn posts.', 500);
  }
}
