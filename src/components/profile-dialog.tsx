import { useState, useRef, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Trash2, CheckCircle2 } from "lucide-react"


interface ProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface UserData {
    id: string
    name: string
    email: string
    image: string
    role: "admin" | "trainer" | "trainee" | "user"
    emailVerified: boolean
    phone?: string
}

const roleMap = {
    admin: "Super Admin",
    trainer: "Training Admin",
    trainee: "Clinical Learners",
    user: "Individual Learners",
}

/**
 * ProfileDialog Component
 * 
 * Allows users to view and update their profile information including:
 * - Profile picture (upload/remove)
 * - Basic details (Name, Phone)
 * - Read-only fields (Email, Role, Verification status)
 */
export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")

    const { data: session, isPending: isLoading, refetch: refetchSession } = authClient.useSession()
    const userData = session?.user as unknown as UserData | undefined

    useEffect(() => {
        if (userData && open) {
            setName(userData.name)
            setPhone(userData.phone || "")
        }
    }, [userData, open])

    const updateInfoMutation = useMutation({
        mutationFn: async (data: { name: string; phone: string }) => {
            const res = await apiClient.post("/update-account-info", data)
            return res.data
        },
        onSuccess: () => {
            refetchSession()
            toast.success("Profile information updated successfully.")
        },
        onError: (error: any) => {
             toast.error(error.response?.data?.message || "Failed to update profile.")
        },
    })

    const uploadPhotoMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append("image", file)
            const res = await apiClient.post("/account/upload-profile-photo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            return res.data
        },
        onSuccess: () => {
            refetchSession()
            toast.success("Profile photo updated successfully.")
        },
        onError: (error: any) => {
             toast.error(error.response?.data?.message || "Failed to upload photo.")
        },
    })

    const removePhotoMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.delete("/account/remove-profile-photo")
            return res.data
        },
        onSuccess: () => {
            refetchSession()
            toast.success("Profile photo removed.")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to remove photo.")
        },
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Check file size (50MB)
            if (file.size > 50 * 1024 * 1024) {
                toast.error("File size exceeds 50MB limit.")
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
                return
            }
            uploadPhotoMutation.mutate(file)
        }
    }

    const handleSave = () => {
        updateInfoMutation.mutate({ name, phone })
    }

    const initials = userData?.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "??"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account settings and preferences.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-6 py-4">
                        {/* Profile Picture Section */}
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={userData?.image || undefined} alt={userData?.name} />
                                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadPhotoMutation.isPending}
                                >
                                    {uploadPhotoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    Upload
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => removePhotoMutation.mutate()}
                                    disabled={removePhotoMutation.isPending || !userData?.image}
                                >
                                    {removePhotoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    Remove
                                </Button>
                            </div>
                        </div>

                        {/* User Info Section */}
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Input id="email" value={userData?.email} disabled className="pr-10" />
                                    {userData?.emailVerified && (
                                        <div className="absolute right-3 top-2.5 text-green-500" title="Email Verified">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <div className="flex items-center">
                                    <Badge variant="secondary" className="px-3 py-1">
                                        {userData?.role ? roleMap[userData.role] : "User"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0400 000 000"
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Format: Australian mobile (04XX XXX XXX) or landline (0X XXXX XXXX)
                                </p>
                            </div>
                        </div>


                    </div>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={updateInfoMutation.isPending || isLoading}>
                        {updateInfoMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
