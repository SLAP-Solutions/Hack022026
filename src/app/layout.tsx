import type { Metadata } from "next";
import { Merriweather, Manrope } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "../components/layout/AppSidebar";
import { WalletProvider } from "../context/WalletContext";
import { WalletGate } from "../components/wallet/WalletGate";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner"

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-merriweather",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slapsure - Insurance Claims",
  description: "Automated insurance claims and payouts on Flare using FTSO",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <body className={`${manrope.className} antialiased bg-sidebar`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WalletProvider>
            <WalletGate>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="p-4 pl-0 h-screen overflow-hidden bg-sidebar">
                  <main className="bg-white dark:bg-neutral-950 rounded-xl border border-slate-200 dark:border-neutral-800 h-full overflow-auto">
                    {children}
                  </main>
                  <Toaster />
                </SidebarInset>
              </SidebarProvider>
            </WalletGate>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
