"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateProfile } from "@/lib/actions";

export function ProfileForm() {
  const { user, refreshProfile } = useAuth();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ error?: string; message?: string }>({});
  if (!user) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const result = await updateProfile(
      user!.id,
      String(form.get("name") ?? "").trim(),
      String(form.get("phone") ?? "").trim(),
    );
    setPending(false);
    if (result.ok) {
      refreshProfile();
      setState({ message: "저장했습니다." });
    } else {
      setState({ error: result.error });
    }
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-lg space-y-4 p-5">
      <div>
        <label htmlFor="email" className="label">이메일</label>
        <input id="email" value={user.email} disabled className="input bg-background text-muted" />
      </div>
      <div>
        <label htmlFor="name" className="label">이름</label>
        <input id="name" name="name" required defaultValue={user.name ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="phone" className="label">연락처</label>
        <input id="phone" name="phone" defaultValue={user.phone ?? ""} placeholder="010-0000-0000" className="input" inputMode="tel" />
        <p className="mt-1 text-xs text-muted">주문서에 자동으로 채워집니다.</p>
      </div>
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      {state.message && <p className="text-sm text-brand" role="status">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
