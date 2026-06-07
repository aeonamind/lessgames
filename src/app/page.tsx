import { GAMES } from "@/games/registry";
import { SITE_NAME } from "@/shared/config/site";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-16">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{SITE_NAME}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Daily puzzles. New challenges shuffle at 3:00 AM GMT+7.
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {GAMES.map((game) => (
          <li key={game.id}>
            <Link
              href={game.href}
              className={`block rounded-xl border p-5 transition hover:border-zinc-400 dark:hover:border-zinc-600 ${
                game.status === "coming_soon"
                  ? "opacity-70"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{game.name}</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {game.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {game.status === "live" ? "Play →" : "Soon"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
