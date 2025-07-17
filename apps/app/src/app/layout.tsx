"use client";

//import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/react";
import { stackApp } from "@/stack";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from 'next-themes'
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const stackTheme = {
  light: {
    primary: '#FCC44B',
    primaryForeground: '#000000'
  }
};

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
        <PostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
            <StackProvider app={stackApp}>
              <StackTheme theme={stackTheme}>
                <div className="min-h-screen">
                  {children}
                </div>
                <Toaster richColors position="bottom-center" />
              </StackTheme>
            </StackProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}