export const SARVAM_TTS_MODEL = 'bulbul:v3';
export const SARVAM_TTS_CODEC = 'linear16';

export const INTERVIEW_SPEAKERS = ['shreya', 'ritu', 'rohan'] as const;

export type InterviewSpeaker = (typeof INTERVIEW_SPEAKERS)[number];

export function pickInterviewSpeaker(): InterviewSpeaker {
  const index = Math.floor(Math.random() * INTERVIEW_SPEAKERS.length);
  return INTERVIEW_SPEAKERS[index];
}
