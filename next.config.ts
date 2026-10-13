import type { NextConfig } from "next";

// GitHub Pages(정적 호스팅) 배포용 설정.
// 저장소 페이지 주소가 /arduino-shop 아래이므로 빌드 시 NEXT_PUBLIC_BASE_PATH=/arduino-shop 을 넣는다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // /mypage/orders -> /mypage/orders/index.html 로 만들어 정적 호스팅에서 그대로 열리게 한다
  trailingSlash: true,
  images: {
    // 정적 내보내기에서는 이미지 최적화 서버를 쓸 수 없다
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
