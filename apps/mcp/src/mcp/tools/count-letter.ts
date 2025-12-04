import { z } from "zod";

export const countLetterTool = {
  name: "count_letters",
  config: {
    description: "Counts occurrences of specific letters in a given word",
    inputSchema: {
      word: z.string().describe("The word to analyze"),
      letters: z
        .string()
        .describe("The letters to count (e.g., 'aeiou' for vowels)"),
    },
  },
  handler: async ({ word, letters }: { word: string; letters: string }) => {
    const counts = new Map<string, number>();
    let total = 0;
    const wordLower = word.toLowerCase();

    for (const letter of letters.toLowerCase()) {
      const count = [...wordLower].filter((c) => c === letter).length;
      counts.set(letter, count);
      total += count;
    }

    const breakdown = [...counts.entries()]
      .map(([l, c]) => `'${l}': ${c}`)
      .join(", ");

    return {
      content: [
        {
          type: "text" as const,
          text: `Word: "${word}"\nLetters: "${letters}"\n\nResults: ${breakdown}\nTotal: ${total}`,
        },
      ],
    };
  },
};
