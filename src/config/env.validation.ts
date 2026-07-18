const REQUIRED_ENV = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRY',
  'JWT_REFRESH_EXPIRY',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'SARVAM_API_KEY',
] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED_ENV.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  return config;
}
