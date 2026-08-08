import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { 
  User, 
  SessionState, 
  FocusMode,
  AnalyticsData,
  SubscriptionTier 
} from '@/types';

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await AsyncStorage.getItem(name);
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  setUser: (user: User | null) => void;
  setSessionId: (id: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sessionId: null,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      setSessionId: (sessionId) => set({ sessionId }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        sessionId: null 
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

interface FocusSessionStore {
  sessionState: SessionState;
  remainingSeconds: number;
  setSessionState: (state: Partial<SessionState>) => void;
  startSession: (mode: FocusMode, duration: number, hardcore: boolean) => void;
  endSession: () => void;
  updateRemainingTime: (seconds: number) => void;
  setLocked: (locked: boolean) => void;
  reset: () => void;
}

const initialSessionState: SessionState = {
  isActive: false,
  sessionId: null,
  mode: 'shallow',
  startTime: null,
  endTime: null,
  duration: 25,
  hardcore: false,
  isLocked: false,
};

export const useFocusSessionStore = create<FocusSessionStore>()(
  persist(
    (set) => ({
      sessionState: initialSessionState,
      remainingSeconds: 0,
      setSessionState: (updates) => 
        set((state) => ({ 
          sessionState: { ...state.sessionState, ...updates } 
        })),
      startSession: (mode, duration, hardcore) => {
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
        
        set({
          sessionState: {
            isActive: true,
            sessionId: Crypto.randomUUID(),
            mode,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration,
            hardcore,
            isLocked: true,
          },
          remainingSeconds: duration * 60,
        });
      },
      endSession: () => set({ sessionState: initialSessionState, remainingSeconds: 0 }),
      updateRemainingTime: (seconds) => set({ remainingSeconds: seconds }),
      setLocked: (locked) => set((state) => ({
        sessionState: { ...state.sessionState, isLocked: locked }
      })),
      reset: () => set({ sessionState: initialSessionState, remainingSeconds: 0 }),
    }),
    {
      name: 'focus-session-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

interface AnalyticsStore {
  analytics: AnalyticsData;
  todaySessions: number;
  setAnalytics: (data: Partial<AnalyticsData>) => void;
  incrementTodaySessions: () => void;
  resetDaily: () => void;
}

const initialAnalytics: AnalyticsData = {
  totalFocusTime: 0,
  weeklyFocusTime: 0,
  dailyFocusTime: 0,
  sessionsCompleted: 0,
  sessionsAbandoned: 0,
  currentStreak: 0,
  longestStreak: 0,
  attentionScore: 0,
  xpEarned: 0,
  level: 1,
  xpToNextLevel: 1000,
};

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set) => ({
      analytics: initialAnalytics,
      todaySessions: 0,
      setAnalytics: (data) => set((state) => ({ 
        analytics: { ...state.analytics, ...data } 
      })),
      incrementTodaySessions: () => set((state) => ({ 
        todaySessions: state.todaySessions + 1 
      })),
      resetDaily: () => set({ todaySessions: 0 }),
    }),
    {
      name: 'analytics-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

interface AppBlockStore {
  blockedApps: string[];
  setBlockedApps: (apps: string[]) => void;
  addBlockedApp: (bundleId: string) => void;
  removeBlockedApp: (bundleId: string) => void;
}

export const useAppBlockStore = create<AppBlockStore>()(
  persist(
    (set) => ({
      blockedApps: [],
      setBlockedApps: (blockedApps) => set({ blockedApps }),
      addBlockedApp: (bundleId) => 
        set((state) => ({ 
          blockedApps: [...state.blockedApps, bundleId] 
        })),
      removeBlockedApp: (bundleId) => 
        set((state) => ({ 
          blockedApps: state.blockedApps.filter(id => id !== bundleId) 
        })),
    }),
    {
      name: 'app-block-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

interface FeatureFlagStore {
  flags: Record<string, boolean>;
  setFlag: (name: string, value: boolean) => void;
  setFlags: (flags: Record<string, boolean>) => void;
}

export const useFeatureFlagStore = create<FeatureFlagStore>()(
  persist(
    (set) => ({
      flags: {},
      setFlag: (name, value) => set((state) => ({ 
        flags: { ...state.flags, [name]: value } 
      })),
      setFlags: (flags) => set({ flags }),
    }),
    {
      name: 'feature-flags-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
