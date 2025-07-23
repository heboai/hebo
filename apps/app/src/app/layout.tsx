import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/tailwind.css";
import "../styles/stack.css";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Hebo Cloud',
    template: '%s | Hebo Cloud'
  },
  description: 'The fastest way to build & scale agents',
  openGraph: {
    url: 'https://hebo.cloud',
    siteName: 'Hebo Cloud',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}