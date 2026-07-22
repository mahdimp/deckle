const CLOZE_RE = /\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/gs;

/** Distinct cloze numbers referenced in a note's text, ascending. */
export function parseClozeNumbers(text: string): number[] {
  const nums = new Set<number>();
  for (const match of text.matchAll(CLOZE_RE)) {
    nums.add(Number(match[1]));
  }
  return [...nums].sort((a, b) => a - b);
}

/**
 * Renders cloze markup to plain markdown for one target deletion number.
 * The target deletion is hidden (or shown as its hint) unless revealTarget is set;
 * every other deletion number renders as its answer text.
 */
export function renderCloze(text: string, targetIndex: number, revealTarget: boolean): string {
  return text.replace(CLOZE_RE, (_match, numStr: string, answer: string, hint?: string) => {
    const num = Number(numStr);
    if (num === targetIndex && !revealTarget) {
      return hint ? `[${hint}]` : '[...]';
    }
    return answer;
  });
}
