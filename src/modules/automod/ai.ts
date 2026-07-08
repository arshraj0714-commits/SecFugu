import Groq from 'groq-sdk';
import { Message } from 'discord.js';
import { logger } from '../../core/logger';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export type AiModerationResult = 'safe' | 'unsafe' | 'unknown';

export async function moderateWithAi(message: Message): Promise<AiModerationResult> {
  if (!process.env.GROQ_API_KEY) {
    return 'unknown';
  }

  const prompt = `
You are a Discord moderation assistant. Classify the following message as:
- "safe" if it's normal chat.
- "unsafe" if it contains harassment, hate speech, explicit content, or scam/phishing.
- "unknown" if unsure.

Message: "${message.content}"
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      max_tokens: 10,
      temperature: 0.1,
    });

    const result = completion.choices[0]?.message?.content?.trim().toLowerCase();
    if (result?.includes('unsafe')) return 'unsafe';
    if (result?.includes('safe')) return 'safe';
    return 'unknown';
  } catch (err) {
    logger.warn('Groq moderation failed:', err);
    return 'unknown';
  }
}
