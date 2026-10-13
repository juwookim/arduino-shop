/** GitHub Pages 저장소 하위 경로 (예: /arduino-shop). 로컬 개발에서는 빈 문자열. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * next/image 와 <img>는 basePath를 자동으로 붙이지 않는다.
 * "/images/..." 같은 사이트 내부 경로에만 붙이고, 외부 URL(Supabase Storage)은 그대로 둔다.
 */
export function asset(src: string) {
  return src.startsWith("/") ? `${BASE_PATH}${src}` : src;
}

/** 결제창·인증 메일에서 돌아올 절대 주소 */
export function absoluteUrl(path: string) {
  return `${window.location.origin}${BASE_PATH}${path}`;
}
