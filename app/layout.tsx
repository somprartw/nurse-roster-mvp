import SWRegister from "./sw-register";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Nurse Roster",
  description: "ระบบจัดการตารางเวรสำหรับทีมงาน",
  manifest: "/manifest.webmanifest",
  icons: {
    // Browser favicon
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon-192-v2.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512-v2.png", sizes: "512x512", type: "image/png" },
    ],

    // iOS Add to Home Screen
    apple: [
      {
        url: "/apple-touch-icon-v2.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SWRegister />
        {children}
      </body>
    </html>
  );
}
