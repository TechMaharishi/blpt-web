import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Lock, User, Palette, Globe } from "lucide-react"

export function SettingsPage() {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <CardTitle>Profile Settings</CardTitle>
                        </div>
                        <CardDescription>
                            Update your personal information and profile details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input placeholder="John Doe" defaultValue="Demo User" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" placeholder="email@example.com" defaultValue="user@example.com" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Bio</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Tell us about yourself"
                            />
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>
                            Configure how you receive notifications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: "Email Notifications", description: "Receive notifications via email" },
                            { label: "Push Notifications", description: "Receive push notifications in browser" },
                            { label: "Weekly Digest", description: "Get a weekly summary of activity" },
                            { label: "Marketing Emails", description: "Receive updates about new features" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium">{item.label}</div>
                                    <div className="text-sm text-muted-foreground">{item.description}</div>
                                </div>
                                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                                </button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                <CardTitle>Security</CardTitle>
                            </div>
                            <CardDescription>
                                Manage your security settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                                Change Password
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                Two-Factor Authentication
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                Active Sessions
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                <CardTitle>Appearance</CardTitle>
                            </div>
                            <CardDescription>
                                Customize the look and feel.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Theme</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["Light", "Dark", "System"].map((theme) => (
                                        <button
                                            key={theme}
                                            className="rounded-lg border border-border bg-card p-3 text-sm hover:bg-accent transition-colors"
                                        >
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            <CardTitle>Language & Region</CardTitle>
                        </div>
                        <CardDescription>
                            Set your language and regional preferences.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Language</label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option>English (US)</option>
                                <option>English (UK)</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Timezone</label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option>UTC-5 (Eastern Time)</option>
                                <option>UTC-8 (Pacific Time)</option>
                                <option>UTC+0 (GMT)</option>
                                <option>UTC+5:30 (IST)</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
