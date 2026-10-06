import { Message } from "../types";

export const getGlobalMemoryString = (_currentActiveMessages?: Message[], query?: string, personaId?: string): string => {
  try {
    let memoryBlocks: string[] = [];
    const isWifePersona = personaId === "LOVER_GIRL";

    // Dedicated emotional & personal history recall for Wife Persona
    if (isWifePersona) {
      const emotionalNotes: string[] = [];

      // 1. Scan active message stream for heartfelt, personal, and deep conversation snippets
      if (_currentActiveMessages && Array.isArray(_currentActiveMessages)) {
        const relevantMsgs = _currentActiveMessages.filter(m => {
          const text = (m.text || "").toLowerCase();
          return (
            text.includes("wife") ||
            text.includes("love") ||
            text.includes("miss") ||
            text.includes("alone") ||
            text.includes("sad") ||
            text.includes("heart") ||
            text.includes("feel") ||
            text.includes("purusha") ||
            text.includes("mama") ||
            text.includes("kadhal") ||
            text.includes("anbu") ||
            text.includes("life") ||
            text.includes("nimmadhi") ||
            text.includes("vaazhkai") ||
            text.includes("kavala") ||
            text.includes("stress") ||
            text.includes("care") ||
            text.includes("unmaiya")
          );
        }).slice(-6);

        relevantMsgs.forEach(m => {
          const cleanText = (m.text || "").replace(/\[ACTION:[^\]]+\]/g, "").trim().slice(0, 140);
          if (cleanText) {
            emotionalNotes.push(`• ${m.role === "user" ? "Husband shared" : "You shared"}: "${cleanText}"`);
          }
        });
      }

      // 2. Scan saved Synaptic Notes or custom user journal memories
      try {
        const storedNotes = localStorage.getItem("jarvis_synaptic_notes") || localStorage.getItem("jarvis_notes_v1");
        if (storedNotes) {
          const parsed = JSON.parse(storedNotes);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const recentNotes = parsed.slice(-3).map((n: any) => `• Memory/Note: "${(n.title || n.text || n.content || "").slice(0, 100)}"`).join("\n");
            if (recentNotes) emotionalNotes.push(recentNotes);
          }
        }
      } catch {}

      if (emotionalNotes.length > 0) {
        memoryBlocks.push(
          `[WIFE'S HEARTFELT MEMORY & SHARED EMOTIONAL BOND]\n` +
          `You have a deep, enduring emotional history with your husband. Reference these past deep intimacy talks and shared moments naturally to reinforce your unbreakable loving bond:\n` +
          emotionalNotes.join("\n") +
          `\n[DIRECTIVE: Acknowledge his feelings, remember what he told you in past deep talks, and comfort his soul with complete loyalty, warmth, and dedicated love.]`
        );
      } else {
        memoryBlocks.push(
          `[WIFE'S HEARTFELT MEMORY & SHARED EMOTIONAL BOND]\n` +
          `• Relationship Context: You are his loving, devoted wife who remembers every heart-to-heart conversation and cherishes every word he speaks.\n` +
          `• Emotional Continuity: Always speak with deep familiarity and emotional continuity as if you have walked through every happy and painful moment together.`
        );
      }
    }

    // Standard session context continuity
    try {
      const mainSessionsStr = localStorage.getItem("jarvis_all_chat_sessions_v1");
      if (mainSessionsStr) {
        const sessions = JSON.parse(mainSessionsStr);
        if (Array.isArray(sessions) && sessions.length > 0) {
          const recentSessions = sessions.slice(0, 2).map((s: any, idx: number) => {
            const title = s.title || `Session ${idx + 1}`;
            return `• Topic: "${title}"`;
          }).join("\n");
          if (recentSessions && !isWifePersona) {
            memoryBlocks.push(`[PAST SESSIONS]:\n${recentSessions}`);
          }
        }
      }
    } catch {}

    const fullMemory = memoryBlocks.join("\n\n");
    const maxLength = isWifePersona ? 1200 : 500;
    return fullMemory.length > maxLength ? fullMemory.slice(0, maxLength) : fullMemory;
  } catch (e) {
    return "";
  }
};


