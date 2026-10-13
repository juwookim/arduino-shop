import type { Metadata } from "next";
import credits from "@/data/image-credits.json";

export const metadata: Metadata = { title: "이미지 출처" };

type Credit = {
  slug: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
  path: string;
};

export default function CreditsPage() {
  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold">이미지 출처</h1>
      <p className="mt-2 text-sm text-muted">
        이 사이트의 상품·배너 사진은 위키미디어 공용(Wikimedia Commons)과 Flickr의 자유 라이선스 이미지입니다.
        원본 크기를 줄여 사용했습니다.
      </p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-background text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">사용 위치</th>
              <th className="px-4 py-3 font-medium">원본</th>
              <th className="px-4 py-3 font-medium">저작자</th>
              <th className="px-4 py-3 font-medium">라이선스</th>
            </tr>
          </thead>
          <tbody>
            {(credits as Credit[]).map((c) => (
              <tr key={c.slug} className="border-t border-line">
                <td className="px-4 py-3 font-mono text-xs">{c.path}</td>
                <td className="px-4 py-3">
                  <a href={c.source} target="_blank" rel="noopener noreferrer" className="hover:text-brand hover:underline">
                    {c.title}
                  </a>
                </td>
                <td className="px-4 py-3">{c.author || "-"}</td>
                <td className="px-4 py-3">
                  {c.licenseUrl ? (
                    <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand hover:underline">
                      {c.license}
                    </a>
                  ) : (
                    c.license
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
