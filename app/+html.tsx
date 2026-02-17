import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function will be rendered in the <head> of the HTML.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, Expo Router's ScrollViewStyleReset handles this.
          We add min-height: 100% to body to correct potential white bars.
        */}
        <ScrollViewStyleReset />
        
        {/*
          Inject critical styles for Web/PWA edge-to-edge.
          - Sets body background to theme color to prevent white bars.
          - Ensures min-height is 100% to fill viewport.
        */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #070b14;
            min-height: 100%;
          }
          /* Ensure no white background during overscroll */
          html {
            background-color: #070b14;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
