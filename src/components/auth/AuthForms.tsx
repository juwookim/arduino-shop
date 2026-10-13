"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { login, signup } from "@/lib/actions";
import { useAuth } from "./AuthProvider";

type Message = { error?: string; message?: string };

function MessageBox({ state }: { state: Message }) {
  if (state.error) {
    return <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>;
  }
  if (state.message) {
    return <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-strong" role="status">{state.message}</p>;
  }
  return null;
}

/** 외부 사이트로 튀는 오픈 리다이렉트를 막는다 */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** 이미 로그인한 상태로 로그인/회원가입 화면에 오면 원래 가려던 곳으로 보낸다 */
function useRedirectIfLoggedIn(next: string) {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);
}

export function LoginForm() {
  const next = safeNext(useSearchParams().get("next"));
  const [state, setState] = useState<Message>({});
  const [pending, setPending] = useState(false);
  useRedirectIfLoggedIn(next);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const result = await login(String(form.get("email") ?? "").trim(), String(form.get("password") ?? ""));
    if (!result.ok) {
      setState({ error: result.error });
      setPending(false);
    }
    // 성공하면 AuthProvider가 세션을 받아 useRedirectIfLoggedIn이 이동시킨다
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">이메일</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">비밀번호</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <MessageBox state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? "로그인 중…" : "로그인"}
      </button>
      <p className="text-center text-sm text-muted">
        처음이신가요?{" "}
        <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand">
          회원가입
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const next = safeNext(useSearchParams().get("next"));
  const [state, setState] = useState<Message>({});
  const [pending, setPending] = useState(false);
  useRedirectIfLoggedIn(next);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "");
    setPending(true);
    const result = await signup({
      name: get("name").trim(),
      email: get("email").trim(),
      password: get("password"),
      passwordConfirm: get("passwordConfirm"),
    });
    setPending(false);
    if (!result.ok) setState({ error: result.error });
    else if (result.data.needsConfirm) {
      setState({ message: `${get("email").trim()} 으로 인증 메일을 보냈습니다. 메일의 링크를 누르면 가입이 완료됩니다.` });
    }
  }

  if (state.message) {
    return (
      <div className="space-y-4">
        <MessageBox state={state} />
        <Link href="/login" className="btn-outline w-full">로그인 화면으로</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">이름</label>
        <input id="name" name="name" required autoComplete="name" className="input" />
      </div>
      <div>
        <label htmlFor="email" className="label">이메일</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">비밀번호 (8자 이상)</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div>
        <label htmlFor="passwordConfirm" className="label">비밀번호 확인</label>
        <input id="passwordConfirm" name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <MessageBox state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? "가입 중…" : "가입하기"}
      </button>
      <p className="text-center text-sm text-muted">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-semibold text-brand">로그인</Link>
      </p>
    </form>
  );
}
