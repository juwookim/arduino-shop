"use client";

import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase/client";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isAdmin: boolean;
};

type AuthState = {
  user: CurrentUser | null;
  /** 세션 확인 중이면 true. 이때는 로그인 여부를 판단하지 않는다. */
  loading: boolean;
  refreshProfile: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

type Session = { id: string; email: string } | null;

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = 아직 세션을 확인하지 않음
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [profile, setProfile] = useState<{ userId: string; name: string | null; phone: string | null; isAdmin: boolean } | null>(null);
  const [profileNonce, setProfileNonce] = useState(0);

  useEffect(() => {
    const supabase = getSupabase();
    // onAuthStateChange는 구독 직후 현재 세션(INITIAL_SESSION)을 한 번 알려준다.
    // 이메일 인증 링크의 #access_token 도 여기서 처리된다.
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s?.user ? { id: s.user.id, email: s.user.email ?? "" } : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getSupabase()
      .from("profiles")
      .select("name, phone, role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile({ userId, name: data?.name ?? null, phone: data?.phone ?? null, isAdmin: data?.role === "admin" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, profileNonce]);

  const refreshProfile = useCallback(() => setProfileNonce((n) => n + 1), []);

  const profileReady = !session || profile?.userId === session.id;
  const value: AuthState = {
    loading: session === undefined || !profileReady,
    user:
      session && profile?.userId === session.id
        ? { id: session.id, email: session.email, name: profile.name, phone: profile.phone, isAdmin: profile.isAdmin }
        : null,
    refreshProfile,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서 써야 합니다.");
  return ctx;
}
