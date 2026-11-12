import Link from "next/link";
import { SiteHeader, REPO_URL } from "@/components/SiteHeader";
import { FieldSalesThumb, OrderBotThumb } from "@/components/Thumbnails";

const PROTOTYPES = [
  {
    href: "/order-bot",
    number: "01",
    title: "Chat ordering bot for a distributor",
    company: "Sundar Distributors · FMCG · Pune",
    problem: "Kirana stores order by phoning a salesman. Orders are retyped, misheard and promised without checking stock or credit.",
    forWho: "Kirana retailers ordering over chat, and the distributor's order desk.",
    tags: ["Conversational UI", "Hinglish parsing", "Ops console"],
    Thumb: OrderBotThumb,
    accent: "group-hover:text-teal-700 dark:group-hover:text-teal-300",
  },
  {
    href: "/field-sales",
    number: "02",
    title: "Field-sales app for shop visits",
    company: "Voltline · Mobile accessories · Bengaluru",
    problem: "Reps book orders on paper, note payments in a diary and lose signal in market lanes. Managers find out the next day.",
    forWho: "Field reps on a daily beat, and their sales managers.",
    tags: ["Mobile app", "Offline sync", "Schemes & collections"],
    Thumb: FieldSalesThumb,
    accent: "group-hover:text-violet-700 dark:group-hover:text-violet-300",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Product prototypes · Khyati Karia</h1>
        <p className="mt-3 max-w-2xl text-base text-stone-600 dark:text-stone-400">
          Fast, clickable prototypes I build to test product ideas with real users before anyone writes production code.
        </p>

        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {PROTOTYPES.map(({ Thumb, ...p }) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
              >
                <div className="aspect-video border-b border-stone-200 dark:border-stone-800">
                  <Thumb />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    {p.number} · {p.company}
                  </p>
                  <h2 className={`mt-1 text-lg font-semibold tracking-tight transition-colors ${p.accent}`}>{p.title}</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">Problem</dt>
                      <dd className="mt-0.5 text-stone-700 dark:text-stone-300">{p.problem}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">For</dt>
                      <dd className="mt-0.5 text-stone-700 dark:text-stone-300">{p.forWho}</dd>
                    </div>
                  </dl>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <li key={t} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold">
                    Open prototype
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-14 grid gap-6 border-t border-stone-200 pt-8 text-sm text-stone-600 sm:grid-cols-3 dark:border-stone-800 dark:text-stone-400">
          <div>
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">Why prototypes</h2>
            <p className="mt-1">A clickable flow answers &ldquo;would people actually use this?&rdquo; in days, not a quarter.</p>
          </div>
          <div>
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">What&apos;s inside</h2>
            <p className="mt-1">Front-end only, fictional data, real rules: parsing, stock, credit, schemes, GST and collections are unit-tested.</p>
          </div>
          <div>
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">Each one includes</h2>
            <p className="mt-1">Product notes: the problem, assumptions, and the metrics I&apos;d measure next.</p>
          </div>
        </section>

        <p className="mt-10 text-xs text-stone-400">
          Companies, people and numbers are invented. Source on{" "}
          <a href={REPO_URL} className="underline underline-offset-2 hover:text-stone-600 dark:hover:text-stone-300">GitHub</a>.
        </p>
      </main>
    </>
  );
}
