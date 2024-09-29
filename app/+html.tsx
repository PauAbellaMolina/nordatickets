import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* 
          This viewport disables scaling which makes the mobile website act more like a native app.
          However this does reduce built-in accessibility. If you want to enable scaling, use this instead:
            <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        */}
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover"
        />
        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
        {/* SEO Meta Tags */}
        <title>ElTeuTikt</title>
        <meta name="description" content="Digitalitza el procés de venda i gestió els tickets de consumicions dels teus esdeveniments i festes amb ElTeuTikt. La millor experiència de compra per l'organitzador i l'assistent." />
        <meta name="keywords" content="event tickets, ticketing, event management, ElTeuTikt, mobile ticketing, event drinks, consumable ticketing" />
        <meta name="author" content="ElTeuTikt" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="ElTeuTikt" />
        <meta property="og:description" content="Digitalitza el procés de venda i gestió els tickets de consumicions dels teus esdeveniments i festes amb ElTeuTikt. La millor experiència de compra per l'organitzador i l'assistent." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.elteutikt.com" />
        <meta property="og:image" content="https://waniuunkeiqwqatzunof.supabase.co/storage/v1/object/public/assets/og-image.png" />
        
        {/* iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ElTeuTikt" />
        
        {/* Social Media Links */}
        <link rel="instagram" href="https://www.instagram.com/elteutikt" />
        <link rel="linkedin" href="https://linkedin.com/company/elteutikt" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.elteutikt.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html {
  overscroll-behavior: none;
}
body {
  background-color: #f2f2f2;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000000;
  }
}`;
