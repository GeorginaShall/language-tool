import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/context/Providers";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multilingual Website Checker",
  description: "Audit multilingual websites for translation, RTL, SEO, and localization issues.",
};

const noFlashScript = `
try {
  var theme = window.localStorage.getItem('mwc-theme');
  if (theme === 'light') document.documentElement.classList.remove('dark');
  else document.documentElement.classList.add('dark');
  var lang = window.localStorage.getItem('mwc-ui-lang');
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="dark" suppressHydrationWarning>
      <head>
        <Script id="mwc-no-flash" strategy="beforeInteractive">
          {noFlashScript}
        </Script>
      </head>
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased bg-bg text-text`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
