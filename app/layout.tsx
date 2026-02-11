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
    // iPhone Add to Home Screen
    apple: "/apple-touch-icon.png?v=2",

    // Browser tab favicon (16/32 inside .ico)
    icon: [{ url: "/favicon.ico" }],
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
