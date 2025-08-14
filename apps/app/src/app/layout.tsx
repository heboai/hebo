import type { Metadata, Viewport } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "~/styles/tailwind.css";
import "~/styles/global.css";
import "~/styles/stack.css";
import { MSWProvider } from "~/components/MSWProvider";

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
    default: "Hebo Cloud",
    template: "%s | Hebo Cloud",
  },
  description: "The fastest way to build & scale agents",
  openGraph: {
    url: "https://hebo.cloud",
    siteName: "Hebo Cloud",
    type: "website",
  },
  icons: {
    icon: "/hebo-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <MSWProvider />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
