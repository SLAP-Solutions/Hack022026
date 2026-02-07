"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, FileText, TrendingUp, DollarSign, Users, Bot } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ConnectWallet } from "../wallet/ConnectWallet"
import { PriceDashboard } from "@/components/prices/PriceDashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"

const menuItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: DollarSign,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
  },
  {
    title: "Agents",
    href: "/agents",
    icon: Bot,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <Link href="/" className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
            <Image
              src={isDark ? "/logo-white.png" : "/logo.png"}
              alt="SLAPSure Logo"
              width={120}
              height={32}
              className="h-8 w-auto group-data-[collapsible=icon]:hidden"
              priority
            />
            <Image
              src={isDark ? "/icon-logo-white.png" : "/icon-logo.png"}
              alt="SLAPSure"
              width={36}
              height={36}
              className="size-9 shrink-0 object-contain hidden group-data-[collapsible=icon]:block"
              priority
            />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <PriceDashboard />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 p-2">
          <div className="flex-1">
            <ConnectWallet />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
