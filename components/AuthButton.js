'use client';

import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '../lib/config';

const STORAGE_KEY = 'movus-haber-google-user';
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// Google'ın kimlik (ID) token'ı JWT formatındadır: header.payload.imza
// Sunucumuz olmadığı için token'ı doğrulamıyoruz, sadece isim/foto
// göstermek amacıyla payload kısmını çözüyoruz (base64url decode).
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AuthButton() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // localStorage kullanılamıyorsa sorun değil, giriş isteğe bağlı.
    }
  }, []);

  useEffect(() => {
    if (user) return; // zaten girişliyse Google düğmesini kurmaya gerek yok
    if (GOOGLE_CLIENT_ID.startsWith('BURAYA_')) return; // henüz yapılandırılmamış

    function handleCredentialResponse(response) {
      const payload = decodeJwtPayload(response.credential);
      if (!payload) return;
      const nextUser = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };
      setUser(nextUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      } catch {
        // sorun değil, oturum sadece bu sekmede/açılışta hatırlanmayabilir
      }
    }

    function init() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'medium',
          shape: 'pill',
          text: 'signin_with',
          locale: 'tr',
        });
      }
      setReady(true);
    }

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    let script = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => script.removeEventListener('load', init);
  }, [user]);

  function handleSignOut() {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      // yoksay
    }
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 rounded-full bg-white/10 px-2 py-1 pr-3 text-sm font-medium text-white transition hover:bg-white/20"
        title="Çıkış yap"
      >
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.picture}
            alt={user.name || 'Kullanıcı'}
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-400 text-xs">
            {user.name?.[0] ?? '?'}
          </span>
        )}
        <span className="hidden sm:inline">{user.name?.split(' ')[0]}</span>
      </button>
    );
  }

  if (GOOGLE_CLIENT_ID.startsWith('BURAYA_')) {
    // Kurulum henüz tamamlanmadı: lib/config.js içine gerçek Client ID
    // girilene kadar buton yerine sessizce hiçbir şey göstermiyoruz ki
    // site test aşamasında da hatasız çalışsın.
    return null;
  }

  return <div ref={buttonRef} aria-live="polite" style={{ minHeight: 36 }} />;
}
