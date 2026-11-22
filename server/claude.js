import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
let client = null;

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function modelName() {
  return MODEL;
}

function getClient() {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 2,
      timeout: 120_000,
    });
  }
  return client;
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model did not return JSON');
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * Ask Claude for JSON that matches `schema`.
 * Uses structured outputs; if the model or account does not support them,
 * falls back to a plain prompt with the schema inlined and parses the JSON.
 */
export async function askJson({ system, user, schema, maxTokens = 4000 }) {
  const anthropic = getClient();
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { format: { type: 'json_schema', schema } },
    });
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    if (res.stop_reason === 'max_tokens') throw new Error('Response was cut off. Try fewer questions.');
    return extractJson(text);
  } catch (err) {
    const unsupported =
      err?.status === 400 && /output_config|json_schema|format|structured/i.test(err?.message || '');
    if (!unsupported) throw err;

    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: `${system}\n\nRespond with only a JSON object matching this JSON schema, no prose:\n${JSON.stringify(schema)}`,
      messages: [{ role: 'user', content: user }],
    });
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return extractJson(text);
  }
}
