import { authClient } from "@/lib/auth-client"
import { Navigate, Outlet, useParams, useLocation } from "react-router-dom"
import { PageLoader } from "./page-loader"
import { getRolePath } from "@/lib/utils"
import type { ReactNode } from "react"

export function ProtectedRoute({ children }: { children?: ReactNode }) {
    const { data: session, isPending } = authClient.useSession()
    const params = useParams();
    const location = useLocation();

    if (isPending && !session) {
        return <PageLoader />
    }

    if (!session) {
        return <Navigate to="/login" />
    }

    const rolePath = getRolePath((session.user as any).role || "user");
    const currentRolePath = params.rolePath;

    if (currentRolePath && currentRolePath !== rolePath) {
        const newPath = location.pathname.replace(`/${currentRolePath}`, `/${rolePath}`);
        return <Navigate to={newPath} replace />
    }

    return children ? <>{children}</> : <Outlet />
}
