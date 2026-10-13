import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">회원가입</h1>
      <Suspense>
        <SignupForm />
      </Suspense>
    </>
  );
}
