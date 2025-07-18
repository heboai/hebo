//import type { Metadata } from "next";
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


/*
const metadata: Metadata = {
  title: "Hebo Cloud",
  description: "The fastest way to build & scale agents",
};
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased stack-scope`} suppressHydrationWarning>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}