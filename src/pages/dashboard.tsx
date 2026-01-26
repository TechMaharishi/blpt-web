import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react"

export function DashboardPage() {
    const stats = [
        {
            title: "Total Users",
            value: "2,543",
            change: "+12.5%",
            icon: Users,
            trend: "up",
        },
        {
            title: "Revenue",
            value: "$45,231",
            change: "+8.2%",
            icon: DollarSign,
            trend: "up",
        },
        {
            title: "Active Sessions",
            value: "1,234",
            change: "-3.1%",
            icon: BarChart3,
            trend: "down",
        },
        {
            title: "Growth Rate",
            value: "23.5%",
            change: "+5.4%",
            icon: TrendingUp,
            trend: "up",
        },
    ]

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Welcome back! Here's an overview of your application.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change} from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your recent application activity and updates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Activity item {i}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Description of activity {i}
                                        </p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {i}h ago
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common tasks and shortcuts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {["Create New Report", "Export Data", "Invite User", "View Analytics"].map((action) => (
                                <button
                                    key={action}
                                    className="w-full rounded-lg border border-border bg-card p-3 text-left text-sm hover:bg-accent transition-colors"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
