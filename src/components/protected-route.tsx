import { authClient } from "@/lib/auth-client"
import { Navigate, Outlet } from "react-router-dom"
import { Loader2 } from "lucide-react"
import type { ReactNode } from "react"

export function ProtectedRoute({ children }: { children?: ReactNode }) {
    const { data: session, isPending } = authClient.useSession()

    if (isPending) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" />
    }

    return children ? <>{children}</> : <Outlet />
}
