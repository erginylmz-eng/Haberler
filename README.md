# Movus Haber

Movus Lojistik Yatırım A.Ş. için hazırlanmış, mobil uyumlu özet haber sitesi. **Sistemin tamamı ücretsizdir ve bir "kredi" veya faturalama sistemine bağlı değildir** (bkz. Bölüm 0 — bu, önceki bir sürümde yaşanan gerçek bir sorunun düzeltilmiş halidir).

Bu repo: **github.com/erginylmz-eng/Haberler** — canlı adresi (yayınlandıktan sonra): **https://erginylmz-eng.github.io/Haberler/**

Üç ana başlık:

1. **Dünya Lojistik** — küresel taşımacılık, denizcilik, tedarik zinciri haberleri
2. **Türkiye Lojistik** — Türkiye lojistik/taşımacılık sektörü haberleri
3. **Finans** — alt başlıkları **Türkiye** ve **Dünya** olan finans/ekonomi haberleri

Haberler ilgili kaynakların RSS beslemelerinden otomatik çekilir, Google Gemini API'sinin ücretsiz katmanı ile Türkçe kısa özete dönüştürülür ve siteye yansıtılır. Giriş Google hesabıyla yapılabilir (site herkese açıktır, giriş sadece kişiselleştirme/kimlik amaçlıdır).

---

## 0. Bu sistem neden tamamen ücretsiz

| Bileşen | Servis | Neden güvenli/ücretsiz |
|---|---|---|
| Barındırma | **GitHub Pages** | GitHub hesabına dahildir, kullanım/kredi bazlı ücretlendirme yoktur. |
| Kod deposu + otomatik güncelleme + yayınlama | **GitHub Actions** | Genel (public) depolarda tamamen sınırsız ve ücretsiz. Özel depoda bile ayda 2.000 dakika ücretsiz kota var; bu sistem ayda ~60-120 dakika kullanır. |
| Google ile giriş | **Google Identity Services (istemci taraflı)** | Sunucu veya "client secret" gerekmez, sadece herkese açık bir Client ID kullanılır. |
| Haber özetleme (AI) | **Google Gemini API — Free Tier** | Kredi kartı istemez. `GEMINI_API_KEY` tanımlamazsanız sistem yine çalışır, sadece haberin kendi RSS özetini gösterir. |
| Haber kaynakları | **Herkese açık RSS beslemeleri** | Ücretli bir haber API'si kullanılmıyor. |

**Not:** İlk kurulumda sırasıyla Vercel+Anthropic, sonra Netlify+Gemini denendi; ikisi de zamanla ücretli/kısıtlı çıktı (Vercel Hobby ticari kullanıma kapalı; Netlify 2025 sonunda "kredi" bazlı faturalamaya geçti ve bu sistemin sık otomatik yayınları krediyi hızla tüketip siteyi tamamen durdurdu). GitHub Pages + GitHub Actions + Google'ın burada kullanılan servisleri kullanım hacminden bağımsız olarak ücretsiz kalacak şekilde seçildi.

---

## 1. Nasıl çalışır?

```
GitHub Actions (zamanlanmış, 4 saatte bir) — ücretsiz
        │
        ▼
scripts/fetch-news.mjs  →  RSS kaynaklarını çeker → Gemini (ücretsiz) ile özetler
        │
        ▼
data/news.json  (repoya otomatik commit edilir)
        │
        ▼
Bu commit, "Siteyi Yayınla" iş akışını otomatik tetikler
        │
        ▼
https://erginylmz-eng.github.io/Haberler/  (Google girişi + 3 sekmeli haber özetleri)
```

---

## 2. Yerelde deneme (isteğe bağlı)

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000/Haberler` adresini açın (repo adı `basePath` olarak `next.config.mjs`'e gömülü).

Statik derlemeyi (GitHub Pages'in yayınlayacağı hâliyle) yerelde önizlemek için:

```bash
npm run build
npm run preview
```

Haber çekme scriptini elle denemek isterseniz:

```bash
GEMINI_API_KEY=... npm run fetch-news
```

---

## 3. GitHub Pages'i etkinleştirme (tek seferlik)

Reponuzda **Settings → Pages** sayfasına gidin. **Build and deployment → Source** kısmından **GitHub Actions**'ı seçin. Bu, `deploy-pages.yml` iş akışının siteyi yayınlamasına izin veren tek seferlik bir ayardır. Bu adım yapılmadan site 404 verir.

---

## 4. Google ile giriş için istemci kimliği oluşturma (ücretsiz, sunucu gerektirmez)

1. [Google Cloud Console](https://console.cloud.google.com/) → yeni bir proje oluşturun (örn. "Movus Haber"). Kredi kartı istenmez.
2. **APIs & Services → OAuth consent screen**: User type **External** → Create. Uygulama adı "Movus Haber", destek e-postası kendi e-postanız. **Save and Continue** ile ilerleyin.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins** kısmına ekleyin: `https://erginylmz-eng.github.io` (sonunda `/Haberler` OLMADAN, sadece kök adres)
   - **Authorized redirect URIs eklemenize gerek yoktur.**
4. **Create**'e basın, **Client ID** değerini kopyalayın (Client secret oluşmaz/gerekmez).
5. `lib/config.js` dosyasındaki `GOOGLE_CLIENT_ID` değerini bu Client ID ile değiştirip commit/push edin.

---

## 5. Otomatik haber güncellemesi için GitHub Secret'ı ekleme (ücretsiz)

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) adresinden bir Gemini API anahtarı oluşturun.
2. GitHub reponuzda **Settings → Secrets and variables → Actions → New repository secret**: Name `GEMINI_API_KEY`, Value az önce aldığınız anahtar.
3. **Actions** sekmesi → **Haberleri Güncelle** → **Run workflow** ile elle tetikleyip test edin.

**AI özetlemeyi hiç kullanmak istemezseniz:** `GEMINI_API_KEY` eklemeyin; sistem otomatik olarak haberlerin kendi RSS özetini kullanır.

---

## 6. Haber kaynaklarını özelleştirme

Tüm RSS kaynakları `scripts/sources.mjs` dosyasındadır. Düzenleyip push etmeniz yeterlidir.

---

## 7. Sorun giderme

- **Site 404 veriyor:** Settings → Pages → Source'un **GitHub Actions** olduğundan emin olun (Bölüm 3). Actions sekmesinden "Siteyi Yayınla" iş akışının yeşil onay aldığını kontrol edin.
- **Tasarım/CSS bozuk:** `next.config.mjs`'teki `basePath` (`/Haberler`) reponuzun gerçek adıyla eşleşmiyor olabilir.
- **Google düğmesi görünmüyor:** `lib/config.js`'teki `GOOGLE_CLIENT_ID` hâlâ placeholder olabilir.
- **Google girişi hata veriyor:** Authorized JavaScript origins tam olarak `https://erginylmz-eng.github.io` olmalı (sonunda `/Haberler` olmadan).
- **Haberler güncellenmiyor:** Actions loglarına bakın, `GEMINI_API_KEY` secret'ını kontrol edin.

---

## 8. Bakım önerileri

- Bağımlılıkları arada bir güncelleyin: `npm outdated`, `npm audit`.
- RSS kaynakları zamanla adres değiştirebilir; `scripts/sources.mjs`'ten güncelleyin.
