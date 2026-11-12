import Link from "next/link";

export const REPO_URL = "https://github.com/kariakhyati-collab/product-prototypes";

export function GitHubMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function SiteHeader({ back = false, title }: { back?: boolean; title?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/85 backdrop-blur dark:border-stone-800/80 dark:bg-stone-950/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {back ? (
          <Link
            href="/"
            className="-ml-2 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12.5 15 7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">All prototypes</span>
            <span className="sm:hidden">Back</span>
          </Link>
        ) : null}
        <Link href="/" className="min-w-0 truncate text-sm font-semibold tracking-tight">
          Prototypes <span className="font-normal text-stone-500 dark:text-stone-400">· by Khyati Karia</span>
        </Link>
        {title ? (
          <span className="hidden min-w-0 truncate text-sm text-stone-500 md:inline dark:text-stone-400">/ {title}</span>
        ) : null}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-700 dark:hover:text-white"
        >
          <GitHubMark />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
