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
const tagline = "Redefining Authentic Relationships";

const siteDescription =
  "Delly's Matchups is a global faith-based matchmaking, counselling and mentorship platform redefining authentic relationships through Biblical principles, intentional connections, and meaningful community.";

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },

  description: siteDescription,
  applicationName: siteName,

  openGraph: {
    title: `${siteName} | ${tagline}`,
    description: siteDescription,
    url: siteUrl,
    siteName,
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteName} - ${tagline}`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${siteName} | ${tagline}`,
    description: siteDescription,
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
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