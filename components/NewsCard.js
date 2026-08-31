import { formatRelativeTr } from '../lib/formatDate';

export default function NewsCard({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
          {item.source}
        </span>
        <time dateTime={item.publishedAt}>{formatRelativeTr(item.publishedAt)}</time>
      </div>

      <h3 className="mb-1.5 line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-brand-700 sm:text-lg">
        {item.title}
      </h3>

      <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
        {item.summary}
      </p>

      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
        Habere git
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </a>
  );
}
