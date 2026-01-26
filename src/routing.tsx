import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./pages/app-shell";
import { DashboardPage } from "./pages/dashboard";
import { SettingsPage } from "./pages/settings";
import { PlaceholderPage } from "./pages/placeholder";

const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/app/dashboard" />,
    },
    {
        path: "/app",
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
