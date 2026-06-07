import { GAMES } from "@/games/registry";
import { SiteShell } from "@/shared/components/SiteShell";
import { SITE_NAME } from "@/shared/config/site";
import Link from "next/link";

export default function HomePage() {
  return (
    <SiteShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-14 sm:py-20">
        <header className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-site-accent">
            Daily puzzles
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-site-text sm:text-5xl">
            {SITE_NAME}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-site-muted">
            Six fresh challenges every day. New words shuffle at 3:00 AM GMT+7.
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {GAMES.map((game) => {
            const isLive = game.status === "live";

            return (
              <li key={game.id}>
                <Link
                  href={game.href}
                  className={`group block rounded-2xl border bg-site-surface p-5 shadow-sm transition-all duration-200 ${
                    isLive
                      ? "border-site-border hover:-translate-y-0.5 hover:border-site-accent/40 hover:shadow-md"
                      : "border-site-border/80 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-site-text group-hover:text-site-accent">
                        {game.name}
                      </h2>
                      <p className="mt-1 text-sm text-site-muted">
                        {game.description}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        isLive
                          ? "bg-site-accent-soft text-site-accent"
                          : "bg-stone-100 text-site-muted"
                      }`}
                    >
                      {isLive ? "Play" : "Soon"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <footer className="text-center text-xs text-site-muted">
          Pick a game above to start today&apos;s puzzle.
        </footer>
      </div>
    </SiteShell>
  );
}
