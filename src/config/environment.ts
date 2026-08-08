export const ENV = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
} as const;

export type Environment = (typeof ENV)[keyof typeof ENV];

const env =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_ENVIRONMENT
    ? (process.env.EXPO_PUBLIC_ENVIRONMENT as Environment)
    : ENV.DEVELOPMENT; // Changed default to DEVELOPMENT

export const CONFIG = {
  [ENV.DEVELOPMENT]: {
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL || "http://localhost:54321",
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "dev-anon-key",
    sentryDsn: "",
    analyticsEndpoint: "http://localhost:9090",
    apiTimeout: 10000,
  },
  [ENV.STAGING]: {
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      "https://staging-focusvault.supabase.co",
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "staging-anon-key",
    sentryDsn: "",
    analyticsEndpoint: "https://staging-api.focusvault.app",
    apiTimeout: 15000,
  },
  [ENV.PRODUCTION]: {
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL || "https://focusvault.supabase.co",
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "prod-anon-key",
    sentryDsn: "",
    analyticsEndpoint: "https://api.focusvault.app",
    apiTimeout: 15000,
  },
} as const;

export function getEnvConfig(): (typeof CONFIG)[Environment] {
  return CONFIG[env] || CONFIG[ENV.PRODUCTION];
}

export const APP_CONFIG = {
  name: "FocusVault",
  version: "1.0.0",
  buildNumber: 1,
  minimumSessionDuration: 5,
  maximumSessionDuration: 480,
  defaultSessionDuration: 25,
  hardcoreUnlockDelay: 24,
  xpPerMinute: 10,
  xpBonusMultiplier: 1.5,
  streakBonusXp: 100,
  maxDailySessions: 3,
  analyticsFlushInterval: 30000,
  offlineSyncInterval: 60000,
} as const;

export const FEATURE_FLAGS = {
  ENABLE_HARDCORE_MODE: true,
  ENABLE_QR_UNLOCK: true,
  ENABLE_BEHAVIORAL_INSIGHTS: true,
  ENABLE_MICRO_BLOCKING: false,
  ENABLE_ADVANCED_ANALYTICS: false,
  ENABLE_XP_GAMIFICATION: true,
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_SUBSCRIPTION: true,
} as const;
