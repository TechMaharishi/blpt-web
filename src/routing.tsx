import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import { AppShell } from "./pages/app-shell";
import { DashboardPage } from "./pages/dashboard";
import { SettingsPage } from "./pages/settings";
import { PlaceholderPage } from "./pages/placeholder";
import { LoginPage } from "./pages/login";
import { OTPVerificationPage } from "./pages/otp-verification";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { ResetPasswordPage } from "./pages/reset-password";
import { authClient } from "@/lib/auth-client";

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
            const { data } = await authClient.getSession();
            if (!data?.session) {
                throw redirect("/login");
            }
            return data;
        },
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
