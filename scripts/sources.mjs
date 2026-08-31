// Doğrulanmış RSS kaynakları (2026-08-31 itibarıyla test edilmiştir).
// Bir kaynak zamanla değişebilir/kapanabilir; script her kaynağı ayrı ayrı
// dener ve başarısız olanı atlayıp diğerleriyle devam eder.
//
// keywords: sadece genel/karma bir kaynaktan (ör. Dünya Gazetesi ana RSS'i)
// belirli bir kategoriye uygun haberleri süzmek için kullanılır. Boş
// bırakılırsa kaynaktaki tüm haberler o kategoriye dahil edilir.

export const SOURCES = {
  'dunya-lojistik': [
    { name: 'FreightWaves', url: 'https://www.freightwaves.com/feed' },
    { name: 'The Loadstar', url: 'https://theloadstar.com/feed/' },
    { name: 'gCaptain', url: 'https://gcaptain.com/feed/' },
    { name: 'Splash247', url: 'https://splash247.com/feed/' },
    { name: 'Journal of Commerce', url: 'https://www.joc.com/rss.xml' },
    { name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feeds/news/' },
    { name: 'Container News', url: 'https://container-news.com/feed/' },
  ],
  'turkiye-lojistik': [
    { name: 'LojiPort', url: 'https://www.lojiport.com/feed/' },
    { name: 'Taşıma Dünyası Gazetesi', url: 'https://www.tasimadunyasi.com/rss' },
    { name: 'Taşımacılar.com', url: 'https://www.tasimacilar.com/rss' },
    {
      name: 'Dünya Gazetesi',
      url: 'https://www.dunya.com/rss',
      keywords: [
        'lojistik',
        'taşıma',
        'taşımacılık',
        'nakliye',
        'kargo',
        'liman',
        'gemi',
        'denizcilik',
        'demiryolu',
        'tedarik zinciri',
        'hava kargo',
        'antrepo',
        'depolama',
        'ihracat',
      ],
    },
  ],
  'finans-dunya': [
    { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
    { name: 'Investing.com', url: 'https://www.investing.com/rss/news.rss' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
    { name: 'Forbes Business', url: 'https://www.forbes.com/business/feed/' },
  ],
  'finans-turkiye': [
    { name: 'Bloomberg HT', url: 'https://www.bloomberght.com/rss' },
    { name: 'Sabah Ekonomi', url: 'https://www.sabah.com.tr/rss/ekonomi.xml' },
    { name: 'Habertürk Ekonomi', url: 'https://www.haberturk.com/rss/ekonomi.xml' },
    { name: 'Anadolu Ajansı Ekonomi', url: 'https://www.aa.com.tr/tr/rss/default?cat=ekonomi' },
    { name: 'Dünya Gazetesi', url: 'https://www.dunya.com/rss' },
  ],
};

export const CATEGORY_LABELS = {
  'dunya-lojistik': 'Dünya Lojistik',
  'turkiye-lojistik': 'Türkiye Lojistik',
  'finans-dunya': 'Dünya Finans',
  'finans-turkiye': 'Türkiye Finans',
};

// Kategori başına siteye yazılacak azami haber sayısı.
export const MAX_ITEMS_PER_CATEGORY = 9;

// Bu tarihten daha eski haberler elenir (gün cinsinden).
export const MAX_AGE_DAYS = 6;
