import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import logo from "@/assets/logo.png"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { authClient } from "@/lib/auth-client"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function OTPVerificationPage() {
    const [searchParams] = useSearchParams()
    const email = searchParams.get("email") || ""
    const type = searchParams.get("type") || "email-verification"
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        if (type === "email-verification") {
            await authClient.emailOtp.verifyEmail({
                email,
                otp,
            }, {
                onSuccess: () => {
                    navigate("/app/dashboard")
                },
                onError: (ctx) => {
                    setError(ctx.error.message)
                    setIsLoading(false)
                }
            })
        } else if (type === "forget-password") {
            await authClient.emailOtp.checkVerificationOtp({
                email,
                type: "forget-password",
                otp,
            }, {
                onSuccess: () => {
                    navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`)
                },
                onError: (ctx) => {
                    setError(ctx.error.message)
                    setIsLoading(false)
                }
            })
        } else {
             setError("Invalid verification type")
             setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <img src={logo} alt="Beyond Limit Logo" className="h-24 w-32 object-contain" />
                        </div>
                        <CardTitle>Verify your email</CardTitle>
                        <CardDescription>
                            Enter the 6-digit code sent to your email address.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="flex flex-col gap-6 items-center" onSubmit={handleSubmit}>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
