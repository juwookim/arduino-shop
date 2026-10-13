import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/paths";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image src={asset("/images/banners/hero-uno.jpg")} alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
        <p className="absolute bottom-10 left-10 max-w-sm text-2xl font-bold leading-snug text-white">
          아이디어를 회로로,
          <br />
          회로를 작품으로.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-sm text-white">MP</span>
          <span className="text-xl">메이커파츠</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
