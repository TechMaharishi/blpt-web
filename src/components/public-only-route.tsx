import { authClient } from "@/lib/auth-client"
import { Navigate, Outlet } from "react-router-dom"
import { PageLoader } from "./page-loader"
import { getRolePath } from "@/lib/utils"
import type { ReactNode } from "react"

export function PublicOnlyRoute({ children }: { children?: ReactNode }) {
    const { data: session, isPending } = authClient.useSession()

    if (isPending && !session) {
        return <PageLoader />
    }

    if (session) {
        const rolePath = getRolePath((session.user as any).role || "user");
        return <Navigate to={`/${rolePath}/dashboard`} />
    }

    return children ? <>{children}</> : <Outlet />
}
