/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // GitHub Pages tamamen statik dosya barındırır; sunucu tarafı kod
  // çalıştırmaz. Bu yüzden Next.js'i "statik export" modunda derliyoruz —
  // `next build` çıktısı doğrudan `out/` klasörüne yazılır.
  output: 'export',

  // GitHub Pages, bir proje reposunu <kullanici-adi>.github.io/<repo-adi>/
  // altında yayınlar. Bu reponun gerçek adı "Haberler" (erginylmz-eng/Haberler)
  // olduğu için basePath buna göre ayarlandı. Repo adını değiştirirseniz bu
  // iki satırı da güncelleyin.
  basePath: '/Haberler',
  assetPrefix: '/Haberler/',

  images: {
    unoptimized: true, // next/image optimizasyon sunucusu statik export'ta çalışmaz
  },
};

export default nextConfig;
