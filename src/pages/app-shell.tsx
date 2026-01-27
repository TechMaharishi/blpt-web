import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Suspense } from "react"
import { PageLoader } from "@/components/page-loader"

export function AppShell() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold">Beyond Limits Learning Hub Admin Panel</h1>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet />
                    </Suspense>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
