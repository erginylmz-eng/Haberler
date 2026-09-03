export default function NewsBriefing({ category }) {
  const paragraphs = category?.paragraphs || [];

  if (paragraphs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
        Bu kategori için henüz derleme bulunmuyor. Otomatik güncelleme bir
        sonraki çalışmada burayı dolduracak.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-[15px] leading-relaxed text-slate-700">
            {paragraph}
          </p>
        ))}
      </div>

      {category?.sources?.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
          Kaynaklar:{' '}
          {category.sources.map((source, index) => (
            <span key={source.url || source.name}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600"
              >
                {source.name}
              </a>
              {index < category.sources.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
