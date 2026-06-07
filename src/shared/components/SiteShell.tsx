interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="site-shell flex min-h-full flex-1 flex-col items-center">
      {children}
    </div>
  );
}
