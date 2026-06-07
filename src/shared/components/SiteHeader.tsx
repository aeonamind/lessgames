import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { SITE_NAME } from "@/shared/config/site";
import Image from "next/image";
import Link from "next/link";

interface SiteHeaderProps {
  title?: string;
}

export function SiteHeader({ title }: SiteHeaderProps) {
  return (
    <header className="gh-header w-full">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-site-text hover:text-site-accent"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={24}
            height={24}
            className="rounded-sm"
            priority
          />
          {SITE_NAME}
        </Link>
        {title && (
          <>
            <span className="text-site-muted">/</span>
            <span className="text-sm font-semibold text-site-text">{title}</span>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
