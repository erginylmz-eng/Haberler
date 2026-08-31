// Google "ile giriş yap" düğmesi için istemci kimliği (Client ID).
//
// Bu bir GİZLİ ANAHTAR DEĞİLDİR — sayfanın kaynak kodunda zaten herkese
// görünür durumdadır, bu yüzden GitHub'a normal bir dosya olarak
// yüklenmesinde sakınca yoktur (bir "secret" değildir).
//
// DİKKAT: Buraya "Client Secret" (GOCSPX- ile başlayan değer) DEĞİL,
// "Client ID" (...apps.googleusercontent.com ile biten değer) yazılmalı.
//
// Nereden alınır: Google Cloud Console → APIs & Services → Credentials →
// oluşturduğunuz OAuth 2.0 Client ID (bkz. kurulum rehberi Bölüm 2).
// Örnek biçim: 1234567890-abcdefgh1234567890abcdefgh.apps.googleusercontent.com
export const GOOGLE_CLIENT_ID = 'BURAYA_GOOGLE_CLIENT_ID_YAZIN.apps.googleusercontent.com';
