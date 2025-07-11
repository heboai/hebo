import Image from 'next/image'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head, Search } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
 
export const metadata = {
  title: 'Hebo Documentation',
  description: 'Hebo Documentation',
  metadataBase: new URL('https://docs.hebo.ai'),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-precomposed.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/favicon.ico']
  },
  openGraph: {
    title: 'Hebo Documentation',
    description: 'Hebo Documentation',
    images: [
      {
        url: 'https://hebo.ai/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hebo AI Documentation'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hebo Docs',
    description: 'Hebo Documentation',
    images: ['https://hebo.ai/og-image.png'],
  },
}
 
const banner = <Banner storageKey="hebo-evals-release-banner">Hebo Evals is  finally released 🎉</Banner>
const navbar = (
  <Navbar
    logo={<div style={{display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'row', justifyContent: 'center'}}>
        <b>Hebo AI</b> <Image src="/hebo-icon.png" alt="Hebo" width={15} height={15}/></div>}
    logoLink="/"
    projectLink='https://github.com/heboai/hebo'
    chatLink='https://discord.com/invite/cCJtXZRU5p'
  />
)
const footer = <Footer>All rights reserved. {new Date().getFullYear()} © Hebo.</Footer>
const search = <Search placeholder="Search Hebo Docs..."></Search> 

export default async function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head/>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/heboai/hebo-docs"
          footer={footer}
          search={search}
        >
          {children}  
        </Layout>
      </body>
    </html>
  )
}