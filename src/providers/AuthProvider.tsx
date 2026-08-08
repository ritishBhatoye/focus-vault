import React, { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores";
import type { User } from "@/types";
import { View, ActivityIndicator } from "react-native";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { setUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await syncProfile(session.user.id);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          await syncProfile(session.user.id);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const syncProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setUser(profile as User);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to minimal user if profile fetch fails
      setUser({
        id: userId,
        email: "", // Requires fetching from auth.user, but kept simple for fallback
        display_name: null,
        avatar_url: null,
        subscription_tier: "free",
        subscription_status: "active",
        xp_total: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_session_at: null,
      } as User);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!isAuthenticated && !inAuthGroup && !inOnboarding) {
      // Redirect to login if unauthenticated and not in auth/onboarding
      router.replace("/(auth)/login");
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      // Redirect to main if authenticated and in auth/onboarding
      router.replace("/(main)");
    }
  }, [isAuthenticated, isInitialized, segments]);

  if (!isInitialized) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#FAFAFA" />
      </View>
    );
  }

  return <>{children}</>;
}
