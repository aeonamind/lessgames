interface GameShellProps {
  children: React.ReactNode;
}

export function GameShell({ children }: GameShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-white dark:bg-zinc-950">
      {children}
    </div>
  );
}
