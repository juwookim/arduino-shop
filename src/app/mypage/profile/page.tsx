import type { Metadata } from "next";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "회원 정보" };

export default function ProfilePage() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">회원 정보</h2>
      <ProfileForm />
    </div>
  );
}
