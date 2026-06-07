import Link from "next/link";
import { DailyCountdown } from "./DailyCountdown";

interface ComingSoonProps {
  name: string;
  description: string;
}

export function ComingSoon({ name, description }: ComingSoonProps) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5 px-4 py-10 text-center">
      <div className="w-full border-b border-site-border pb-4">
        <h1 className="text-xl font-semibold text-site-text">{name}</h1>
        <p className="mt-1 text-sm text-site-muted">{description}</p>
      </div>
      <span className="gh-label gh-label-neutral">Coming soon</span>
      <div className="gh-box w-full px-4 py-3">
        <DailyCountdown nextLabel="Next shuffle in" />
      </div>
      <Link href="/" className="text-sm text-site-accent hover:underline">
        ← All games
      </Link>
    </div>
  );
}
