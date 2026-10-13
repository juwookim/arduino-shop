"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// 정적 사이트에서는 서버 redirect를 쓸 수 없어 브라우저에서 이동한다
export default function MyPage() {
  const router = useRouter();
  useEffect(() => router.replace("/mypage/orders"), [router]);
  return null;
}
