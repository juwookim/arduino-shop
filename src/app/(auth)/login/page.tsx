import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">로그인</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
