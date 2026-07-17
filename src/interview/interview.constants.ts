export const ALLOWED_DURATION_MINUTES = [30, 60, 90, 120] as const;

export type AllowedDurationMinutes = (typeof ALLOWED_DURATION_MINUTES)[number];
