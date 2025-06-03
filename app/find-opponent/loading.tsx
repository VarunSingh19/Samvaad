import { Loader2 } from "lucide-react"

export default function LoadingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-lg font-medium text-gray-600">Loading online users...</p>
            </div>
        </div>
    )
}
