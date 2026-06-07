import Link from "next/link";
import { DailyCountdown } from "./DailyCountdown";

interface ComingSoonProps {
  name: string;
  description: string;
}

export function ComingSoon({ name, description }: ComingSoonProps) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 px-4 py-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-site-accent">
        Coming soon
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-site-text">
        {name}
      </h1>
      <p className="text-site-muted">{description}</p>
      <div className="w-full rounded-2xl border border-site-border bg-site-surface px-4 py-3 shadow-sm">
        <DailyCountdown nextLabel="Next shuffle in" />
      </div>
      <Link
        href="/"
        className="text-sm font-medium text-site-accent underline-offset-4 hover:underline"
      >
        ← All games
      </Link>
    </div>
  );
}
