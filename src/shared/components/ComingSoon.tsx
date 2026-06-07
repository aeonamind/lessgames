import Link from "next/link";
import { DailyCountdown } from "./DailyCountdown";

interface ComingSoonProps {
  name: string;
  description: string;
}

export function ComingSoon({ name, description }: ComingSoonProps) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 px-4 py-12 text-center">
      <h1 className="text-[2rem] font-bold tracking-[0.2em]">{name.toUpperCase()}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
      <DailyCountdown nextLabel="Coming soon — next shuffle in" />
      <Link
        href="/"
        className="text-sm font-medium text-zinc-500 underline-offset-4 hover:underline"
      >
        ← Back to all games
      </Link>
    </div>
  );
}
