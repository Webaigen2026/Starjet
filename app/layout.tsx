import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "./components/ThemeProvider";
import { SidebarProvider } from "./components/SidebarContext";
import SidebarNav from "./components/SidebarNav";
import "./globals.css";

/*
  Cera Pro (licensed) is wired via @font-face in globals.css from /fonts/*.woff2.
  next/font/local cannot be used until those files exist — it hard-fails the build.

  Temporary: Geist fills --font-cera so the typography system stays intact.
  After adding the three CeraPro-*.woff2 files under public/fonts/, replace this
  Geist block with localFont (see public/fonts/README.md).
*/

const geistSans = Geist({
  variable: "--font-cera",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StarJet | Flights & Cargo between Haiti and the U.S.",
  description:
    "Search flights, manage bookings, and ship cargo between Haiti, Miami, New York, and Boston with StarJet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.className} flex min-h-full flex-col bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className="flex min-h-full">
              <SidebarNav />

              <main className="flex min-w-0 flex-1 flex-col">
                {children}
              </main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}