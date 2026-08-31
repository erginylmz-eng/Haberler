import Header from '../components/Header';
import NewsTabs from '../components/NewsTabs';
import newsData from '../data/news.json';
import { formatFullTr } from '../lib/formatDate';

export default function Home() {
  const generatedAt = formatFullTr(newsData.generatedAt);

  return (
    <main className="min-h-screen pb-10">
      <Header generatedAt={generatedAt} />
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <NewsTabs categories={newsData.categories} />
        <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Özetler yapay zeka ile otomatik oluşturulur; önemli kararlar için
          orijinal kaynağı kontrol edin. © {new Date().getFullYear()} Movus
          Lojistik Yatırım A.Ş.
        </footer>
      </div>
    </main>
  );
}
