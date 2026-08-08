import { createClient } from "@supabase/supabase-js";
import { getEnvConfig } from "../config/environment";

const envConfig = getEnvConfig();

export const supabase = createClient(
  envConfig.supabaseUrl,
  envConfig.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);

// Admin client should only be used in backend/server code, not in mobile app
// If you need admin privileges, implement them in a backend API
export const supabaseAdmin = null as any; // Placeholder to prevent breaking existing code
