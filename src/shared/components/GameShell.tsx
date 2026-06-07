import { SiteShell } from "./SiteShell";

interface GameShellProps {
  children: React.ReactNode;
  title?: string;
}

export function GameShell({ children, title }: GameShellProps) {
  return <SiteShell title={title}>{children}</SiteShell>;
}
