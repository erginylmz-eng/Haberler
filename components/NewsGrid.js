import NewsCard from './NewsCard';

export default function NewsGrid({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
        Bu kategori için henüz özet bulunmuyor. Otomatik güncelleme bir sonraki
        çalışmada burayı dolduracak.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <NewsCard key={item.id || item.link} item={item} />
      ))}
    </div>
  );
}
