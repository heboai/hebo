import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export function Sonner() {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
            <Toaster 
                richColors 
                position="bottom-center" 
                theme="light"
                className="toaster-light"
            />
        </ThemeProvider>
    )
}
