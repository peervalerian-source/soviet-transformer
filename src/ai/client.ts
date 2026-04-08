const API_KEY_STORAGE = 'russfun_api_key';

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE);
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

export function removeApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Strip markdown code fences from Claude's response */
function extractJSON(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrapping
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Try to find raw JSON object/array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1];
  return text.trim();
}

export async function sendMessage(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Kein API-Key gesetzt. Bitte in den Einstellungen eintragen.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error('Ungueltiger API-Key. Bitte in den Einstellungen pruefen.');
    }
    throw new Error(`API Fehler: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const rawText = data.content[0].text;
  return extractJSON(rawText);
}
