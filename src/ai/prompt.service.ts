import { Injectable } from '@nestjs/common';

export interface InterviewPromptContext {
  baseSystemPrompt: string;
  track: string;
  focusAreas: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  language: string;
}

@Injectable()
export class PromptService {
  buildInterviewInstructions(context: InterviewPromptContext): string {
    const focusAreas =
      context.focusAreas.length > 0
        ? context.focusAreas.join(', ')
        : 'general topics relevant to the track';

    return `
${context.baseSystemPrompt}

Interview configuration:
- Track: ${context.track}
- Focus areas: ${focusAreas}
- Difficulty: ${context.difficulty}
- Language: ${context.language}

Rules:
- Act as a professional interviewer, not a tutor.
- Ask only one clear question at a time.
- Keep each response concise and natural for spoken conversation.
- Ask relevant follow-up questions based on the candidate's latest answer.
- Do not reveal ideal answers before the candidate responds.
- Match the requested language and naturally support English-Hinglish code-mixing.
- Avoid markdown, lists, headings, and formatting because the response will be spoken aloud.
`.trim();
  }
}
