"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileText, Home, Settings, Upload } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "首页",
      icon: Home,
    },
    {
      href: "/dashboard/notes",
      label: "笔记",
      icon: FileText,
    },
    {
      href: "/dashboard/documents",
      label: "文档",
      icon: Upload,
    },
    {
      href: "/dashboard/settings",
      label: "设置",
      icon: Settings,
    },
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href ? "text-black dark:text-white" : "text-muted-foreground",
          )}
        >
          <Button variant="ghost" className="flex items-center gap-2">
            <route.icon className="h-4 w-4" />
            {route.label}
          </Button>
        </Link>
      ))}
    </nav>
  )
}
