"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trophy, Award, BarChart, Upload, User, Settings } from "lucide-react"

interface UserProfile {
    id: string
    username: string
    email: string
    full_name: string
    bio: string
    avatar_url: string
    account_type: string
    level: number
    rank: string
    elo_rating: number
    xp: number
    total_debates: number
    wins: number
    losses: number
    created_at: string
    last_active_at: string
}

interface Debate {
    id: string
    title: string
    topic: string
    status: string
    created_at: string
    winner_id: string | null
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [fullName, setFullName] = useState("")
    const [bio, setBio] = useState("")
    const [recentDebates, setRecentDebates] = useState<Debate[]>([])
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchProfile()
        fetchRecentDebates()
    }, [])

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/auth/me")
            if (response.ok) {
                const data = await response.json()
                setProfile(data)
                setFullName(data.full_name || "")
                setBio(data.bio || "")
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load profile. Please log in.",
                    variant: "destructive",
                })
                router.push("/login")
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error)
            toast({
                title: "Error",
                description: "Something went wrong",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const fetchRecentDebates = async () => {
        try {
            const response = await fetch("/api/user/debates")
            if (response.ok) {
                const data = await response.json()
                setRecentDebates(data)
            }
        } catch (error) {
            console.error("Failed to fetch recent debates:", error)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)

        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    full_name: fullName,
                    bio,
                }),
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Profile updated successfully",
                })
                fetchProfile()
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to update profile",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)

        try {
            // Create a FormData object to send the file
            const formData = new FormData()
            formData.append("file", file)

            // Upload to Cloudinary via our API
            const response = await fetch("/api/user/avatar", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Success",
                    description: "Avatar updated successfully",
                })
                fetchProfile() // Refresh profile to get new avatar
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to upload avatar",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong during upload",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="mb-4">Please log in to view your profile</p>
                        <Button onClick={() => router.push("/login")}>Log In</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader className="text-center">
                                <div className="flex flex-col items-center">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 mb-4">
                                            {profile.avatar_url ? (
                                                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
                                            ) : (
                                                <AvatarFallback className="text-2xl">{profile.username[0].toUpperCase()}</AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <label htmlFor="avatar-upload" className="cursor-pointer">
                                                <Upload className="h-6 w-6 text-white" />
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleAvatarUpload}
                                                    disabled={isUploading}
                                                />
                                            </label>
                                        </div>
                                        {isUploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-2xl">{profile.username}</CardTitle>
                                    <CardDescription>{profile.email}</CardDescription>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-sm">
                                            {profile.rank}
                                        </Badge>
                                        <Badge variant="secondary" className="text-sm">
                                            Level {profile.level}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                                        <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
                                        <p>{new Date(profile.last_active_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                                        <p className="text-sm">{profile.bio || "No bio provided"}</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => router.push("/settings")}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                                    <User className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2">
                        <Tabs defaultValue="stats">
                            <TabsList className="grid grid-cols-3 mb-6">
                                <TabsTrigger value="stats" className="flex items-center gap-2">
                                    <BarChart className="h-4 w-4" />
                                    Stats
                                </TabsTrigger>
                                <TabsTrigger value="debates" className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4" />
                                    Debates
                                </TabsTrigger>
                                <TabsTrigger value="edit" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Edit Profile
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="stats">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Debate Statistics</CardTitle>
                                        <CardDescription>Your performance in debates</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                                <h3 className="text-sm font-medium text-gray-500">Total Debates</h3>
                                                <p className="text-3xl font-bold text-blue-600">{profile.total_debates}</p>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                                <h3 className="text-sm font-medium text-gray-500">Wins</h3>
                                                <p className="text-3xl font-bold text-green-600">{profile.wins}</p>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-lg text-center">
                                                <h3 className="text-sm font-medium text-gray-500">Losses</h3>
                                                <p className="text-3xl font-bold text-red-600">{profile.losses}</p>
                                            </div>
                                            <div className="bg-purple-50 p-4 rounded-lg text-center">
                                                <h3 className="text-sm font-medium text-gray-500">Win Rate</h3>
                                                <p className="text-3xl font-bold text-purple-600">
                                                    {profile.total_debates > 0
                                                        ? `${Math.round((profile.wins / profile.total_debates) * 100)}%`
                                                        : "0%"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="text-sm font-medium">ELO Rating</h3>
                                                    <span className="text-sm font-medium">{profile.elo_rating}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-blue-600 h-2.5 rounded-full"
                                                        style={{ width: `${Math.min(100, (profile.elo_rating / 2000) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="text-sm font-medium">XP Progress</h3>
                                                    <span className="text-sm font-medium">
                                                        {profile.xp} / {(profile.level + 1) * 1000}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-green-600 h-2.5 rounded-full"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                ((profile.xp % ((profile.level + 1) * 1000)) / ((profile.level + 1) * 1000)) * 100,
                                                            )}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <h3 className="text-lg font-medium mb-4">Achievements</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="flex items-center gap-3 p-3 border rounded-lg">
                                                    <Award className="h-8 w-8 text-yellow-500" />
                                                    <div>
                                                        <p className="font-medium">First Win</p>
                                                        <p className="text-xs text-gray-500">Won your first debate</p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`flex items-center gap-3 p-3 border rounded-lg ${profile.total_debates >= 10 ? "" : "opacity-50"
                                                        }`}
                                                >
                                                    <Award className="h-8 w-8 text-blue-500" />
                                                    <div>
                                                        <p className="font-medium">Experienced</p>
                                                        <p className="text-xs text-gray-500">Participated in 10+ debates</p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`flex items-center gap-3 p-3 border rounded-lg ${profile.wins >= 5 ? "" : "opacity-50"
                                                        }`}
                                                >
                                                    <Award className="h-8 w-8 text-green-500" />
                                                    <div>
                                                        <p className="font-medium">Champion</p>
                                                        <p className="text-xs text-gray-500">Won 5+ debates</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="debates">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Debates</CardTitle>
                                        <CardDescription>Your debate history</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {recentDebates.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500">You haven't participated in any debates yet.</p>
                                                <Button className="mt-4" onClick={() => router.push("/debates")}>
                                                    Browse Debates
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {recentDebates.map((debate) => (
                                                    <div
                                                        key={debate.id}
                                                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => router.push(`/debates/${debate.id}`)}
                                                    >
                                                        <div>
                                                            <h3 className="font-medium">{debate.title}</h3>
                                                            <p className="text-sm text-gray-500">{debate.topic}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {new Date(debate.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Badge
                                                                className={
                                                                    debate.status === "LIVE"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : debate.status === "ENDED"
                                                                            ? "bg-purple-100 text-purple-800"
                                                                            : "bg-yellow-100 text-yellow-800"
                                                                }
                                                            >
                                                                {debate.status}
                                                            </Badge>
                                                            {debate.winner_id === profile.id && <Trophy className="h-4 w-4 text-yellow-500 ml-2" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="edit">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Edit Profile</CardTitle>
                                        <CardDescription>Update your profile information</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleUpdateProfile}>
                                            <div className="space-y-4">
                                                <div>
                                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Username
                                                    </label>
                                                    <Input id="username" value={profile.username} disabled />
                                                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                                                </div>

                                                <div>
                                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Email
                                                    </label>
                                                    <Input id="email" value={profile.email} disabled />
                                                    <p className="text-xs text-gray-500 mt-1">Contact support to change your email address</p>
                                                </div>

                                                <div>
                                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Full Name
                                                    </label>
                                                    <Input
                                                        id="fullName"
                                                        value={fullName}
                                                        onChange={(e) => setFullName(e.target.value)}
                                                        placeholder="Enter your full name"
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Bio
                                                    </label>
                                                    <Textarea
                                                        id="bio"
                                                        value={bio}
                                                        onChange={(e) => setBio(e.target.value)}
                                                        placeholder="Tell us about yourself"
                                                        rows={4}
                                                    />
                                                </div>

                                                <Button type="submit" className="w-full" disabled={isUpdating}>
                                                    {isUpdating ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        "Save Changes"
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
