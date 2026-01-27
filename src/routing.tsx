import { createBrowserRouter, Navigate, redirect, useRouteError } from "react-router-dom";
import { AppShell } from "./pages/app-shell";
import { DashboardPage } from "./pages/dashboard";
import { SettingsPage } from "./pages/settings";
import { PlaceholderPage } from "./pages/placeholder";
import { LoginPage } from "./pages/login";
import { OTPVerificationPage } from "./pages/otp-verification";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { ResetPasswordPage } from "./pages/reset-password";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

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

const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
    },
    {
        path: "/reset-password",
        element: <ResetPasswordPage />,
    },
    {
        path: "/verify-otp",
        element: <OTPVerificationPage />,
    },
    {
        path: "/",
        element: <Navigate to="/app/dashboard" />,
    },
    {
        path: "/app",
        loader: async () => {
            try {
                const { data } = await authClient.getSession();
                if (!data?.session) {
                    throw redirect("/login");
                }
                return data;
            } catch (error) {
                // If it's a redirect, let it pass through
                if (error instanceof Response) throw error;
                // For other errors (network, etc), assume not logged in -> redirect to login
                throw redirect("/login");
            }
        },
        errorElement: <AppError />,
        element: <AppShell />,
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
            {
                path: "settings",
                element: <SettingsPage />,
            },
        ],
    },
]);

export default router;
