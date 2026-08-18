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
  title: {
    default: "Silver Loft LMS",
    template: "%s | Silver Loft LMS",
  },
  description: "Marketplace LMS for independent instructors and students",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#112A46",
};

import { Suspense } from "react";
import AppLayout from "./components/AppLayout";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <AppLayout>
            {children}
            </AppLayout>
        </Suspense>
      </body>
    </html>
  );
}
