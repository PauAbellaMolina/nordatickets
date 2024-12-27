import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
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
        <title>Norda Tickets</title>
        <meta name="description" content="Digitise the sales process and management of tickets, drinks and consumables for your concerts and events with Norda Tickets. The best mobile purchase experience for both the organizer and attendee." />
        <meta name="keywords" content="event tickets, ticketing, event management, Norda Tickets, mobile ticketing, event drinks, consumable ticketing" />
        <meta name="author" content="Norda Tickets" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Norda Tickets" />
        <meta property="og:description" content="Digitise the sales process and management of tickets, drinks and consumables for your concerts and events with Norda Tickets. The best mobile purchase experience for both the organizer and attendee." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.nordatickets.com" />
        <meta property="og:image" content="https://waniuunkeiqwqatzunof.supabase.co/storage/v1/object/public/assets/og-image.png" />
        
        {/* iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Norda Tickets" />
        
        {/* Social Media Links */}
        <link rel="instagram" href="https://www.instagram.com/nordatickets" />
        <link rel="linkedin" href="https://linkedin.com/company/nordatickets" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.nordatickets.com" />
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
