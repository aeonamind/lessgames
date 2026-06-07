import { GAMES } from "@/games/registry";
import { SiteShell } from "@/shared/components/SiteShell";
import { SITE_NAME } from "@/shared/config/site";
import Link from "next/link";

export default function HomePage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 border-b border-site-border pb-4">
          <h1 className="text-2xl font-semibold text-site-text">{SITE_NAME}</h1>
          <p className="mt-1 text-sm text-site-muted">
            Daily puzzle games · shuffle at 3:00 AM GMT+7
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {GAMES.map((game) => {
            const isLive = game.status === "live";

            return (
              <li key={game.id}>
                <Link
                  href={game.href}
                  className="gh-box group block p-4 transition hover:border-site-accent/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-site-accent group-hover:underline">
                          {game.name}
                        </h2>
                        <span
                          className={`gh-label ${isLive ? "gh-label-open" : "gh-label-neutral"}`}
                        >
                          {isLive ? "Live" : "Coming soon"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-site-muted">
                        {game.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-site-muted">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </SiteShell>
  );
}
