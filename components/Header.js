import AuthButton from './AuthButton';

export default function Header({ generatedAt }) {
  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-brand-900 via-brand-700 to-brand-600 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
            M
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight sm:text-base">
              Movus Haber
            </p>
            <p className="text-[11px] leading-tight text-white/70">
              Lojistik &amp; Finans Özetleri
            </p>
          </div>
        </div>
        <AuthButton />
      </div>
      {generatedAt && (
        <div className="border-t border-white/10 bg-black/10 px-4 py-1 text-center text-[11px] text-white/70">
          Son güncelleme: {generatedAt}
        </div>
      )}
    </header>
  );
}
