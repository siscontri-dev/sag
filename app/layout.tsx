import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Bovinos y Porcinos",
  description: "Sistema de gestión para bovinos y porcinos",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-gray-200 py-4">
              <div className="container mx-auto px-2 max-w-[95%]">
                <h1 className="text-2xl font-bold text-gray-800">Bovinos y Porcinos</h1>
              </div>
            </header>
            <main className="flex-1 py-8">
              <div className="container mx-auto px-2 max-w-[95%]">{children}</div>
            </main>
            <footer className="bg-white border-t border-gray-200 py-4 mt-8">
              <div className="container mx-auto px-2 max-w-[95%] text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Bovinos y Porcinos. Todos los derechos reservados.
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
