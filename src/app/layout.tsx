import type { Metadata } from "next";
import { Merriweather, Manrope } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "../components/layout/AppSidebar";
import { WalletProvider } from "../context/WalletContext";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
    <html lang="en" className={`${manrope.variable} ${merriweather.variable}`}>
      <body className={`${manrope.className} antialiased bg-sidebar`}>
        <WalletProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="p-4 pl-0 h-screen overflow-hidden bg-sidebar">
              <main className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 h-full overflow-auto p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
