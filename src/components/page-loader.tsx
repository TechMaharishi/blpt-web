import { Spinner } from "@/components/ui/spinner"

export function PageLoader() {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Spinner size="lg" />
        </div>
    )
}
