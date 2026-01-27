import { authClient } from "@/lib/auth-client"
import { Navigate, Outlet } from "react-router-dom"
import { PageLoader } from "./page-loader"
import type { ReactNode } from "react"

export function PublicOnlyRoute({ children }: { children?: ReactNode }) {
    const { data: session, isPending } = authClient.useSession()

    if (isPending && !session) {
        return <PageLoader />
    }

    if (session) {
        return <Navigate to="/app/dashboard" />
    }

    return children ? <>{children}</> : <Outlet />
}
