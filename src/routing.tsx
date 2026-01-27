import { createBrowserRouter, Navigate, useRouteError } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./pages/app-shell";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/protected-route";
import { PublicOnlyRoute } from "@/components/public-only-route";
import { PageLoader } from "@/components/page-loader";

// Lazy load pages
const DashboardPage = lazy(() => import("./pages/dashboard").then(m => ({ default: m.DashboardPage })));
const PlaceholderPage = lazy(() => import("./pages/placeholder").then(m => ({ default: m.PlaceholderPage })));
const LoginPage = lazy(() => import("./pages/login").then(m => ({ default: m.LoginPage })));
const OTPVerificationPage = lazy(() => import("./pages/otp-verification").then(m => ({ default: m.OTPVerificationPage })));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./pages/reset-password").then(m => ({ default: m.ResetPasswordPage })));

function AppError() {
    const error = useRouteError() as Error;
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-center max-w-md">
                {error?.message || "We couldn't connect to the server. Please check your internet connection or try again later."}
            </p>
            <Button onClick={() => window.location.href = "/login"}>
                Back to Login
            </Button>
        </div>
    );
}

const router = createBrowserRouter([
    {
        path: "/login",
        element: (
            <PublicOnlyRoute>
                <Suspense fallback={<PageLoader />}>
                    <LoginPage />
                </Suspense>
            </PublicOnlyRoute>
        ),
    },
    {
        path: "/forgot-password",
        element: (
            <PublicOnlyRoute>
                <Suspense fallback={<PageLoader />}>
                    <ForgotPasswordPage />
                </Suspense>
            </PublicOnlyRoute>
        ),
    },
    {
        path: "/reset-password",
        element: (
            <PublicOnlyRoute>
                <Suspense fallback={<PageLoader />}>
                    <ResetPasswordPage />
                </Suspense>
            </PublicOnlyRoute>
        ),
    },
    {
        path: "/verify-otp",
        element: (
            <Suspense fallback={<PageLoader />}>
                <OTPVerificationPage />
            </Suspense>
        ),
    },
    {
        path: "/",
        element: <Navigate to="/app/dashboard" />,
    },
    {
        path: "/app",
        errorElement: <AppError />,
        element: (
            <ProtectedRoute>
                <AppShell />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "dashboard",
                element: <DashboardPage />,
            },
            {
                path: "content",
                children: [
                    {
                        path: "shorts",
                        element: <PlaceholderPage />,
                    },
                    {
                        path: "courses",
                        element: <PlaceholderPage />,
                    },
                    {
                        path: "reviews",
                        children: [
                            {
                                path: "shorts",
                                element: <PlaceholderPage />,
                            },
                            {
                                path: "courses",
                                element: <PlaceholderPage />,
                            },
                        ]
                    },
                    {
                        path: "tags",
                        element: <PlaceholderPage />,
                    },
                ]
            },
            {
                path: "users",
                children: [
                    {
                        path: "all",
                        element: <PlaceholderPage />,
                    },
                    {
                        path: "assignments",
                        children: [
                            {
                                path: "courses",
                                element: <PlaceholderPage />,
                            },
                            {
                                path: "clinical",
                                element: <PlaceholderPage />,
                            },
                        ]
                    },
                ]
            },
            {
                path: "tickets",
                children: [
                    {
                        path: "all",
                        element: <PlaceholderPage />,
                    },
                    {
                        path: "create",
                        element: <PlaceholderPage />,
                    },
                    {
                        path: "types",
                        element: <PlaceholderPage />,
                    },
                ]
            },
        ],
    },
]);

export default router;
