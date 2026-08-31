#!/usr/bin/env node
/**
 * Lojistik ve finans RSS kaynaklarından haber çeker, Google Gemini API'sinin
 * ÜCRETSİZ katmanı ile Türkçe kısa özet çıkarır ve sonucu data/news.json'a
 * yazar. Bu sistem tamamen ücretsiz kalacak şekilde tasarlanmıştır: Gemini
 * API'nin ücretsiz katmanı kredi kartı gerektirmez (bkz. README "Bu sistem
 * neden tamamen ücretsiz?" bölümü).
 *
 * Kullanım:
 *   GEMINI_API_KEY=... node scripts/fetch-news.mjs
 *
 * GEMINI_API_KEY tanımlı değilse script çalışmaya devam eder, ancak AI
 * özeti yerine kaynağın kendi özetini (varsa) kısaltarak kullanır — yani
 * anahtar olmadan da site tamamen çalışır durumda kalır.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import {
  SOURCES,
  CATEGORY_LABELS,
  MAX_ITEMS_PER_CATEGORY,
  MAX_AGE_DAYS,
} from './sources.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'news.json');
// Gemini'nin ücretsiz katımındaki en bütçe dostu modellerden biri.
// Güncel model adları için https://ai.google.dev/gemini-api/docs/models
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

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

  return items.slice(0, MAX_ITEMS_PER_CATEGORY * 2); // özetlemeden önce biraz pay bırak
}

async function summarizeBatch(genAI, items) {
  if (items.length === 0) return [];
  if (!genAI) {
    // API anahtarı yoksa kaynağın kendi özetini kısaltarak kullan.
    return items.map((item) => ({
      summary: item.snippet
        ? item.snippet.slice(0, 220) + (item.snippet.length > 220 ? '…' : '')
        : 'Özet mevcut değil, haberin tamamı için kaynağa gidin.',
    }));
  }

  const payload = items.map((item, index) => ({
    index,
    title: item.title,
    snippet: item.snippet,
  }));

  const prompt = `Aşağıda lojistik/finans sektörüyle ilgili haber başlıkları ve kısa içerik parçaları JSON formatında verilmiştir. Her haber için, sadece verilen bilgiye dayanarak 2-3 cümlelik, nesnel ve profesyonel bir TÜRKÇE özet yaz. Yorum katma, abartma, spekülasyon yapma; sadece haberde geçen bilgiyi özetle. Şirket/kişi/rakam isimlerini olduğu gibi koru.

Girdi:
${JSON.stringify(payload, null, 2)}

Sadece şu formatta bir JSON dizisi döndür, başka hiçbir açıklama ekleme:
[{"index": 0, "summary": "..."}, {"index": 1, "summary": "..."}, ...]`;

  try {
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Model yanıtında JSON dizisi bulunamadı');

    const parsed = JSON.parse(jsonMatch[0]);
    const byIndex = new Map(parsed.map((p) => [p.index, p.summary]));

    return items.map((item, index) => ({
      summary:
        byIndex.get(index) ||
        item.snippet?.slice(0, 220) ||
        'Özet oluşturulamadı, kaynağa gidin.',
    }));
  } catch (err) {
    console.warn(`[uyarı] AI özetleme başarısız oldu, ham özet kullanılacak: ${err.message}`);
    return items.map((item) => ({
      summary: item.snippet
        ? item.snippet.slice(0, 220) + (item.snippet.length > 220 ? '…' : '')
        : 'Özet mevcut değil, haberin tamamı için kaynağa gidin.',
    }));
  }
}

function slugify(input, index) {
  const base = (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'haber'}-${index}`;
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
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

  if (!genAI) {
    console.warn(
      '[uyarı] GEMINI_API_KEY tanımlı değil. AI özetleme atlanacak, kaynak özetleri kullanılacak.'
    );
  }

  const previous = await loadPreviousData();
  const categories = {};

  for (const categoryKey of Object.keys(SOURCES)) {
    console.log(`\n=== ${CATEGORY_LABELS[categoryKey]} ===`);
    const rawItems = await collectCategoryItems(categoryKey);
    console.log(`${rawItems.length} aday haber bulundu.`);

    const topItems = rawItems.slice(0, MAX_ITEMS_PER_CATEGORY);
    const summaries = await summarizeBatch(genAI, topItems);

    let finalItems = topItems.map((item, index) => ({
      id: slugify(item.title, index),
      title: item.title,
      summary: summaries[index]?.summary || '',
      source: item.source,
      sourceUrl: item.sourceUrl,
      link: item.link,
      publishedAt: item.publishedAt || new Date().toISOString(),
    }));

    // Bu kategoride hiç yeni haber bulunamadıysa (kaynaklar geçici olarak
    // erişilemez olabilir), önceki çalıştırmadaki veriyi koru; kategoriyi
    // boşaltma.
    const previousItems = previous?.categories?.[categoryKey]?.items;
    if (finalItems.length === 0 && previousItems?.length) {
      console.warn(
        `[uyarı] "${CATEGORY_LABELS[categoryKey]}" için yeni haber bulunamadı, önceki veri korunuyor.`
      );
      finalItems = previousItems;
    }

    categories[categoryKey] = {
      label: CATEGORY_LABELS[categoryKey],
      items: finalItems,
    };

    console.log(`${finalItems.length} haber özetlendi.`);
  }

  const totalItems = Object.values(categories).reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );

  if (totalItems === 0) {
    console.error(
      '\n[durduruldu] Hiçbir kategoride haber bulunamadı (muhtemelen ağ erişimi ' +
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
  console.log(`\nnews.json güncellendi: ${OUTPUT_PATH} (toplam ${totalItems} haber)`);
}

main().catch((err) => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
