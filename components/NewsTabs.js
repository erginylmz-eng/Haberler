'use client';

import { useState } from 'react';
import NewsGrid from './NewsGrid';

const MAIN_TABS = [
  { key: 'dunya-lojistik', label: 'Dünya Lojistik' },
  { key: 'turkiye-lojistik', label: 'Türkiye Lojistik' },
  { key: 'finans', label: 'Finans' },
];

const FINANS_SUB_TABS = [
  { key: 'finans-turkiye', label: 'Türkiye' },
  { key: 'finans-dunya', label: 'Dünya' },
];

export default function NewsTabs({ categories }) {
  const [activeTab, setActiveTab] = useState(MAIN_TABS[0].key);
  const [financeSubTab, setFinanceSubTab] = useState(FINANS_SUB_TABS[0].key);

  const activeItems =
    activeTab === 'finans'
      ? categories[financeSubTab]?.items
      : categories[activeTab]?.items;

  return (
    <div>
      <div className="no-scrollbar sticky top-[64px] z-10 -mx-4 mb-5 flex gap-2 overflow-x-auto border-b border-slate-200 bg-[#f4f6fb]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-2">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'finans' && (
        <div className="mb-5 flex gap-2">
          {FINANS_SUB_TABS.map((sub) => (
            <button
              key={sub.key}
              onClick={() => setFinanceSubTab(sub.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                financeSubTab === sub.key
                  ? 'border-brand-600 bg-brand-600/10 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {sub.label} Finans
            </button>
          ))}
        </div>
      )}

      <NewsGrid items={activeItems} />
    </div>
  );
}
