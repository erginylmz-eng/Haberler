#!/usr/bin/env node
/**
 * Lojistik ve finans RSS kaynaklarından haber çeker ve Groq API'sinin
 * ÜCRETSİZ, kredi kartı istemeyen katmanını kullanarak, her kategori için
 * TEK BİR TÜRKÇE BRİFİNG METNİNE derler (kaynak başlıkları ne dilde olursa
 * olsun). Amaç: kullanıcının kaynak haber sitelerine gitmesine gerek
 * kalmadan, o kategoride neler olduğunu Türkçe olarak anlaması. Bu sistem
 * tamamen ücretsiz kalacak şekilde tasarlanmıştır: Groq'un ücretsiz
 * geliştirici katmanı kredi kartı gerektirmez, sadece dakika/gün başına
 * istek kotasıyla sınırlıdır (bkz. README "Bu sistem neden tamamen
 * ücretsiz?" bölümü).
 *
 * NOT (2026-09-04): Bu script önceden Google Gemini API kullanıyordu.
 * Gemini projesine beklenmedik şekilde bir ödeme hesabı/harcama tavanı
 * bağlanıp "monthly spending cap exceeded" hatası vermeye başlaması
 * üzerine, gerçekten ücretsiz ve kredi kartı istemeyen Groq'a geçildi.
 *
 * Kullanım:
 *   GROQ_API_KEY=... node scripts/fetch-news.mjs
 *
 * GROQ_API_KEY tanımlı değilse script çalışmaya devam eder, ancak
 * derleme/çeviri yapılamaz — ham kaynak metinleri (orijinal dilinde)
 * kısaltılarak kullanılır. Site yine de çalışır durumda kalır, ama asıl
 * değer (Türkçe derleme) için anahtar eklenmesi şiddetle önerilir.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Parser from 'rss-parser';
import Groq from 'groq-sdk';
import {
  SOURCES,
  CATEGORY_LABELS,
  MAX_ITEMS_PER_CATEGORY,
  MAX_AGE_DAYS,
} from './sources.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'news.json');
// Groq'un ücretsiz katmanında sunulan, çok dilli/Türkçe talimat takibi
// güçlü bir model. Güncel model listesi için https://console.groq.com/docs/models
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; MovusHaberBot/1.0; +https://movus.com.tr)',
  },
});

function stripHtml(html = '') {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function withinAgeLimit(dateStr) {
  if (!dateStr) return true; // tarih yoksa eleme, listede kalsın
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return true;
  const ageMs = Date.now() - date.getTime();
  return ageMs <= MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

function matchesKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return true;
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

async function fetchFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).map((item) => ({
      title: stripHtml(item.title || ''),
      link: item.link,
      publishedAt: item.isoDate || item.pubDate || null,
      snippet: stripHtml(
        item.contentSnippet || item.content || item.summary || ''
      ).slice(0, 600),
      source: source.name,
      sourceUrl: item.link ? new URL(item.link).origin : source.url,
      keywords: source.keywords,
    }));
  } catch (err) {
    console.warn(`[uyarı] ${source.name} (${source.url}) çekilemedi: ${err.message}`);
    return [];
  }
}

async function collectCategoryItems(categoryKey) {
  const sources = SOURCES[categoryKey] || [];
  const results = await Promise.all(sources.map(fetchFeed));
  const seen = new Set();
  const items = [];

  for (const list of results) {
    for (const item of list) {
      if (!item.link || !item.title) continue;
      if (seen.has(item.link)) continue;
      if (!withinAgeLimit(item.publishedAt)) continue;
      if (!matchesKeywords(`${item.title} ${item.snippet}`, item.keywords)) continue;
      seen.add(item.link);
      items.push(item);
    }
  }

  items.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  return items.slice(0, MAX_ITEMS_PER_CATEGORY * 2); // derlemeden önce biraz pay bırak
}

function uniqueSources(items) {
  const byName = new Map();
  for (const item of items) {
    if (!byName.has(item.source)) {
      byName.set(item.source, { name: item.source, url: item.sourceUrl });
    }
  }
  return Array.from(byName.values());
}

/**
 * Bir promise'i verilen süre (ms) içinde tamamlanmazsa reddeden bir
 * yarışa sokar. AI API çağrısı bazen (nadiren) hiç yanıt vermeden
 * askıda kalabiliyor (bkz. run geçmişindeki 6 saatlik "askıda kalma"
 * vakaları) — bu sarmalayıcı olmadan tüm job, GitHub Actions'ın
 * varsayılan 6 saatlik job timeout'una kadar takılı kalıyordu.
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} zaman aşımına uğradı (${ms}ms)`)), ms)
    ),
  ]);
}

/**
 * Bir kategorideki ham haberleri TEK BİR Türkçe brifinge derler.
 * Döndürülen paragraflar birbirinden bağımsız, 2-4 cümlelik, nesnel
 * metinlerdir — kullanıcı bunları okuyarak kaynağa gitmeden habere hakim
 * olabilmelidir.
 */
async function compileBriefing(groq, items, categoryLabel) {
  if (items.length === 0) return [];

  if (!groq) {
    // API anahtarı yoksa çeviri/derleme yapılamaz; en iyi ihtimalle her
    // kaynağın kendi özetini (orijinal dilinde) kısaltarak sırala.
    return items
      .slice(0, MAX_ITEMS_PER_CATEGORY)
      .map(
        (item) =>
          `[${item.source}] ${item.title}${item.snippet ? ' — ' + item.snippet.slice(0, 200) : ''}`
      );
  }

  const payload = items.map((item, index) => ({
    index,
    title: item.title,
    snippet: item.snippet,
    source: item.source,
  }));

  const prompt = `Aşağıda "${categoryLabel}" kategorisiyle ilgili, çeşitli kaynaklardan (bazıları İngilizce) toplanmış ham haber başlıkları ve kısa içerik parçaları JSON formatında verilmiştir.

Görevin: Bunları TÜRKÇE, profesyonel bir "haber brifingi" hâline DERLEMEK. Bu brifingi okuyan bir kişi, kaynak sitelere hiç gitmeden o kategoride neler olup bittiğini anlamalıdır — yani bu bir link listesi değil, gerçek bir özet/derleme olmalı.

Kurallar:
- Türkçe dışında hiçbir dilde metin üretme; İngilizce (veya başka dildeki) başlık ve içerikleri tamamen Türkçeye çevirerek derle.
- Sadece verilen bilgiye dayan; yorum katma, abartma, spekülasyon yapma.
- Birbiriyle ilgili haberleri gerekirse tek bir paragrafta birleştir; aynı konuyu tekrar tekrar yazma.
- Her paragraf 2-4 cümle olsun, nesnel ve bilgilendirici bir üslupla yazılsın. Şirket/kişi/rakam isimlerini olduğu gibi koru.
- Kaç farklı önemli gelişme varsa o kadar paragraf yaz (genelde 3-8 arası); önemsiz/tekrarlayan haberleri eleyebilirsin.
- Yanıtını SADECE şu JSON formatında ver, başka hiçbir açıklama ekleme:
{"paragraphs": ["...", "...", ...]}

Girdi haberleri:
${JSON.stringify(payload, null, 2)}`;

  try {
    const response = await withTimeout(
      groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
      45000,
      'Groq API çağrısı'
    );

    const text = response.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Model yanıtında JSON nesnesi bulunamadı');

    const parsed = JSON.parse(jsonMatch[0]);
    const paragraphs = Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [];
    if (paragraphs.length === 0) throw new Error('Model boş brifing döndürdü');

    return paragraphs;
  } catch (err) {
    console.warn(`[uyarı] AI derlemesi başarısız oldu, ham başlıklar kullanılacak: ${err?.message || err}`);
    return items
      .slice(0, MAX_ITEMS_PER_CATEGORY)
      .map(
        (item) =>
          `[${item.source}] ${item.title}${item.snippet ? ' — ' + item.snippet.slice(0, 200) : ''}`
      );
  }
}

async function loadPreviousData() {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  const groq = apiKey ? new Groq({ apiKey }) : null;

  if (!groq) {
    console.warn(
      '[uyarı] GROQ_API_KEY tanımlı değil. Türkçe derleme atlanacak, ham başlıklar kullanılacak.'
    );
  }

  const previous = await loadPreviousData();
  const categories = {};

  for (const categoryKey of Object.keys(SOURCES)) {
    console.log(`\n=== ${CATEGORY_LABELS[categoryKey]} ===`);
    const rawItems = await collectCategoryItems(categoryKey);
    console.log(`${rawItems.length} aday haber bulundu.`);

    const topItems = rawItems.slice(0, MAX_ITEMS_PER_CATEGORY);
    let paragraphs = await compileBriefing(groq, topItems, CATEGORY_LABELS[categoryKey]);
    let sources = uniqueSources(topItems);

    // Bu kategoride hiç yeni haber bulunamadıysa (kaynaklar geçici olarak
    // erişilemez olabilir), önceki çalıştırmadaki brifingi koru; kategoriyi
    // boşaltma.
    const previousCategory = previous?.categories?.[categoryKey];
    if (paragraphs.length === 0 && previousCategory?.paragraphs?.length) {
      console.warn(
        `[uyarı] "${CATEGORY_LABELS[categoryKey]}" için yeni haber bulunamadı, önceki brifing korunuyor.`
      );
      paragraphs = previousCategory.paragraphs;
      sources = previousCategory.sources || [];
    }

    categories[categoryKey] = {
      label: CATEGORY_LABELS[categoryKey],
      paragraphs,
      sources,
    };

    console.log(`${paragraphs.length} paragraflık brifing oluşturuldu.`);
  }

  const totalParagraphs = Object.values(categories).reduce(
    (sum, cat) => sum + cat.paragraphs.length,
    0
  );

  if (totalParagraphs === 0) {
    console.error(
      '\n[durduruldu] Hiçbir kategoride brifing oluşturulamadı (muhtemelen ağ erişimi ' +
        'engellendi ya da tüm kaynaklar geçici olarak erişilemez durumda). ' +
        'Mevcut data/news.json korunuyor, üzerine boş veri yazılmadı.'
    );
    process.exitCode = 1;
    return;
  }

  const output = {
    generatedAt: new Date().toISOString(),
    categories,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`\nnews.json güncellendi: ${OUTPUT_PATH} (toplam ${totalParagraphs} paragraf)`);
}

main().catch((err) => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
