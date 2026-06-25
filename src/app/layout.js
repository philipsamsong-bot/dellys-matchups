// src/app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://dellysmatchups.org";
const siteName = "Delly's Matchups";
const logoUrl = `${siteUrl}/dellys-logo.png`;
const siteDescription =
  "Delly's Matchups is a global faith-based matchmaking, counselling and mentorship platform helping individuals build intentional, healthy and authentic relationships rooted in Biblical principles.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    siteName,
    images: [
      {
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: "Delly's Matchups Official Logo",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [logoUrl],
  },
  icons: {
    icon: "/dellys-logo.png",
    shortcut: "/dellys-logo.png",
    apple: "/dellys-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
