import { SiteHeader } from "./SiteHeader";

interface SiteShellProps {
  children: React.ReactNode;
  title?: string;
}

export function SiteShell({ children, title }: SiteShellProps) {
  return (
    <div className="site-shell flex min-h-full flex-1 flex-col">
      <SiteHeader title={title} />
      <main className="flex flex-1 flex-col items-center">{children}</main>
    </div>
  );
}
