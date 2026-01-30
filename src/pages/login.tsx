import { useState } from "react"
import { cn, getRolePath } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import logo from "@/assets/logo.png"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { useNavigate } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginPage() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    )
}

function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const { mutate: signIn, isPending } = useMutation({
        mutationFn: async () => {
            const { data, error } = await authClient.signIn.email({
                email,
                password,
                rememberMe,
            })
            if (error) throw error
            return data
        },
        onSuccess: (data) => {
            console.log("Sign in successful", data)
            const rolePath = data.user ? getRolePath((data.user as any).role || "user") : "app";
            navigate(`/${rolePath}/dashboard`)
        },
        onError: (err: any) => {
            console.log("Sign in error", err)
            if (err.status === 403) {
                setError("Please verify your email address. Redirecting to verification...")
                // Send verification OTP and redirect
                authClient.emailOtp.sendVerificationOtp({
                    email,
                    type: "email-verification",
                }).then(() => {
                    navigate(`/verify-otp?email=${encodeURIComponent(email)}&type=email-verification`)
                })
            } else {
                setError(err.message || "An error occurred")
            }
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        console.log("Attempting sign in...")
        signIn()
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <img src={logo} alt="Beyond Limit Logo" className="h-24 w-32 object-contain" />
                    </div>
                    <CardTitle>Login to your admin account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid gap-2">
                                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                                    <a
                                        href="/forgot-password"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          navigate("/forgot-password");
                                        }}
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="sr-only">
                                            {showPassword ? "Hide password" : "Show password"}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="remember-me" 
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                />
                                <label
                                    htmlFor="remember-me"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Remember me
                                </label>
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
