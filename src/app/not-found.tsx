import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <h1 className="mt-3 text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted">주소가 바뀌었거나 판매가 끝난 상품일 수 있어요.</p>
      <Link href="/" className="btn-primary mt-6">
        홈으로
      </Link>
    </main>
  );
}
