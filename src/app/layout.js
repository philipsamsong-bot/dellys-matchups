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

export const metadata = {
  metadataBase: new URL("https://dellysmatchups.org"),
  title: {
    default: "Delly's Matchups",
    template: "%s | Delly's Matchups",
  },
  description:
    "Delly's Matchups is a global faith-based matchmaking, counselling and mentorship platform helping individuals build intentional, healthy and authentic relationships.",
  applicationName: "Delly's Matchups",
  openGraph: {
    title: "Delly's Matchups",
    description:
      "A global faith-based matchmaking, counselling and mentorship platform redefining authentic relationships.",
    url: "https://dellysmatchups.org",
    siteName: "Delly's Matchups",
    images: [
      {
        url: "/dellys-logo.png",
        width: 1200,
        height: 630,
        alt: "Delly's Matchups",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delly's Matchups",
    description:
      "A global faith-based matchmaking, counselling and mentorship platform redefining authentic relationships.",
    images: ["/dellys-logo.png"],
  },
  icons: {
    icon: "/dellys-logo.png",
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
