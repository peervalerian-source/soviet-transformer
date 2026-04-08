import type { VocabWord } from '../data/vocabulary';

function vocabContext(words: VocabWord[]): string {
  return words
    .map(w => `${w.russian} = ${w.german}`)
    .join('\n');
}

export function storyPrompt(words: VocabWord[], difficulty: 'easy' | 'medium' | 'hard'): string {
  const levels = {
    easy: 'Verwende sehr einfache Saetze (3-5 Woerter). Nutze nur Praesens.',
    medium: 'Verwende einfache bis mittlere Saetze. Praesens und Vergangenheit erlaubt.',
    hard: 'Verwende natuerliche, fliessende Saetze mit verschiedenen Zeitformen.',
  };

  return `Du bist ein kreativer Russisch-Lehrer. Erstelle eine kurze, interessante Geschichte (5-8 Saetze) auf Russisch.

WICHTIG: Baue diese Vokabeln des Schuelers ein:
${vocabContext(words)}

${levels[difficulty]}

Antwortformat (JSON):
{
  "title": "Titel der Geschichte auf Deutsch",
  "sentences": [
    {
      "russian": "Der vollstaendige russische Satz",
      "german": "Deutsche Uebersetzung",
      "blankWord": "Das Wort das als Luecke erscheint (aus der Vokabelliste)",
      "options": ["richtige Antwort", "falsche Option 1", "falsche Option 2", "falsche Option 3"]
    }
  ],
  "summary": "Kurze Zusammenfassung der Geschichte auf Deutsch"
}

Die "options" muessen gemischt sein (die richtige Antwort nicht immer an Position 0).
Antworte NUR mit dem JSON, kein anderer Text.`;
}

export function chatPrompt(scenario: string, words: VocabWord[]): string {
  return `Du bist ein freundlicher russischer Gespraechspartner in folgendem Szenario: ${scenario}

Vokabeln des Schuelers (versuche diese einzubauen):
${vocabContext(words)}

Regeln:
- Antworte auf Russisch, aber gib nach jeder Antwort eine kurze deutsche Uebersetzung in Klammern
- Halte deine Antworten kurz (1-3 Saetze)
- Wenn der Schueler Fehler macht, korrigiere freundlich
- Schlage am Ende jeder Antwort 2-3 moegliche Antworten vor, die der Schueler waehlen kann
- Passe dein Niveau dem Schueler an

Antwortformat (JSON):
{
  "response": "Deine russische Antwort",
  "translation": "Deutsche Uebersetzung",
  "correction": "Optionale Korrektur des letzten Schueler-Inputs, oder null",
  "suggestions": ["Vorschlag 1 auf Russisch", "Vorschlag 2 auf Russisch", "Vorschlag 3 auf Russisch"],
  "suggestionsTranslation": ["Uebersetzung 1", "Uebersetzung 2", "Uebersetzung 3"]
}

Antworte NUR mit dem JSON, kein anderer Text.`;
}

export const CHAT_SCENARIOS = [
  { id: 'cafe', name: 'Im Cafe', icon: '☕', description: 'Bestelle Getraenke und Snacks' },
  { id: 'supermarket', name: 'Im Supermarkt', icon: '🛒', description: 'Einkaufen und nach Produkten fragen' },
  { id: 'wegfragen', name: 'Nach dem Weg', icon: '🗺️', description: 'Frage nach dem Weg in der Stadt' },
  { id: 'uni', name: 'An der Uni', icon: '🎓', description: 'Gespraeche mit Kommilitonen' },
  { id: 'arzt', name: 'Beim Arzt', icon: '🏥', description: 'Symptome beschreiben und verstehen' },
  { id: 'reise', name: 'Auf Reisen', icon: '✈️', description: 'Hotel, Flughafen, Sehenswuerdigkeiten' },
];
