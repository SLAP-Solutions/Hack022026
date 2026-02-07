"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, FileText, TrendingUp, DollarSign } from "lucide-react"
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

const menuItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Claims",
    href: "/claims",
    icon: FileText,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: DollarSign,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <Link href="/" className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
            <Image
              src="/logo.png"
              alt="SLAPSure Logo"
              width={120}
              height={32}
              className="h-8 w-auto group-data-[collapsible=icon]:hidden"
              priority
            />
            <Image
              src="/icon-logo.png"
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
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <ConnectWallet />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
