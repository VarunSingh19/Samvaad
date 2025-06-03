"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Bell, Shield, Moon, Sun, Laptop, LogOut } from "lucide-react"

interface UserSettings {
    id: string
    email_notifications: boolean
    push_notifications: boolean
    debate_reminders: boolean
    language: string
    theme: "light" | "dark" | "system"
    content_language: string[]
    privacy_profile: "public" | "private" | "friends"
    privacy_stats: "public" | "private" | "friends"
    two_factor_auth: boolean
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/user/settings")
            if (response.ok) {
                const data = await response.json()
                setSettings(data)
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load settings. Please log in.",
                    variant: "destructive",
                })
                router.push("/login")
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error)
            toast({
                title: "Error",
                description: "Something went wrong",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveSettings = async () => {
        if (!settings) return

        setIsSaving(true)

        try {
            const response = await fetch("/api/user/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Settings saved successfully",
                })
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to save settings",
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
            setIsSaving(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            })
            return
        }

        setIsChangingPassword(true)

        try {
            const response = await fetch("/api/user/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Password changed successfully",
                })
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to change password",
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
            setIsChangingPassword(false)
        }
    }

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
            })

            if (response.ok) {
                router.push("/login")
            } else {
                toast({
                    title: "Error",
                    description: "Failed to log out",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong",
                variant: "destructive",
            })
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!settings) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="mb-4">Please log in to view your settings</p>
                        <Button onClick={() => router.push("/login")}>Log In</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>

                <Tabs defaultValue="account">
                    <TabsList className="grid grid-cols-4 mb-8">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
                    </TabsList>

                    <TabsContent value="account">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Information</CardTitle>
                                    <CardDescription>Manage your account details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <Input id="email" value={settings.email_notifications ? "email@example.com" : ""} disabled />
                                        <p className="text-xs text-gray-500 mt-1">Contact support to change your email address</p>
                                    </div>

                                    <div>
                                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                                            Language
                                        </label>
                                        <Select
                                            value={settings.language}
                                            onValueChange={(value) => setSettings({ ...settings, language: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="es">Spanish</SelectItem>
                                                <SelectItem value="fr">French</SelectItem>
                                                <SelectItem value="de">German</SelectItem>
                                                <SelectItem value="hi">Hindi</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="outline" onClick={() => router.push("/profile")}>
                                        View Profile
                                    </Button>
                                    <Button onClick={handleSaveSettings} disabled={isSaving}>
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>Update your password</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div>
                                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                                Current Password
                                            </label>
                                            <Input
                                                id="currentPassword"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                                New Password
                                            </label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm New Password
                                            </label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <Button type="submit" className="w-full" disabled={isChangingPassword}>
                                            {isChangingPassword ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Changing...
                                                </>
                                            ) : (
                                                "Change Password"
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                                    <CardDescription>Irreversible actions</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium">Log out from all devices</h3>
                                            <p className="text-sm text-gray-500">
                                                This will log you out from all devices except the current one
                                            </p>
                                        </div>
                                        <Button variant="outline">Log Out All</Button>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium">Delete Account</h3>
                                            <p className="text-sm text-gray-500">
                                                This action is irreversible. All your data will be permanently deleted.
                                            </p>
                                        </div>
                                        <Button variant="destructive">Delete Account</Button>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Log Out
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notification Settings
                                </CardTitle>
                                <CardDescription>Manage how you receive notifications</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Email Notifications</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Email Notifications</p>
                                                <p className="text-sm text-gray-500">Receive notifications via email</p>
                                            </div>
                                            <Switch
                                                checked={settings.email_notifications}
                                                onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Debate Reminders</p>
                                                <p className="text-sm text-gray-500">Get reminded about upcoming debates</p>
                                            </div>
                                            <Switch
                                                checked={settings.debate_reminders}
                                                onCheckedChange={(checked) => setSettings({ ...settings, debate_reminders: checked })}
                                                disabled={!settings.email_notifications}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Push Notifications</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Push Notifications</p>
                                                <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                                            </div>
                                            <Switch
                                                checked={settings.push_notifications}
                                                onCheckedChange={(checked) => setSettings({ ...settings, push_notifications: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Notification Settings"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>Customize how Samvaad looks</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Theme</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer ${settings.theme === "light" ? "border-blue-600 bg-blue-50" : ""
                                                }`}
                                            onClick={() => setSettings({ ...settings, theme: "light" })}
                                        >
                                            <div className="flex justify-center mb-3">
                                                <Sun className="h-8 w-8 text-yellow-500" />
                                            </div>
                                            <p className="text-center font-medium">Light</p>
                                        </div>
                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer ${settings.theme === "dark" ? "border-blue-600 bg-blue-50" : ""
                                                }`}
                                            onClick={() => setSettings({ ...settings, theme: "dark" })}
                                        >
                                            <div className="flex justify-center mb-3">
                                                <Moon className="h-8 w-8 text-blue-900" />
                                            </div>
                                            <p className="text-center font-medium">Dark</p>
                                        </div>
                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer ${settings.theme === "system" ? "border-blue-600 bg-blue-50" : ""
                                                }`}
                                            onClick={() => setSettings({ ...settings, theme: "system" })}
                                        >
                                            <div className="flex justify-center mb-3">
                                                <Laptop className="h-8 w-8 text-gray-600" />
                                            </div>
                                            <p className="text-center font-medium">System</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Content Language</h3>
                                    <p className="text-sm text-gray-500">
                                        Select languages for debate content (debates will be shown in these languages)
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {["English", "Spanish", "French", "German", "Hindi", "Chinese"].map((lang) => (
                                            <div key={lang} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`lang-${lang}`}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={settings.content_language.includes(lang.toLowerCase())}
                                                    onChange={(e) => {
                                                        const langLower = lang.toLowerCase()
                                                        if (e.target.checked) {
                                                            setSettings({
                                                                ...settings,
                                                                content_language: [...settings.content_language, langLower],
                                                            })
                                                        } else {
                                                            setSettings({
                                                                ...settings,
                                                                content_language: settings.content_language.filter((l) => l !== langLower),
                                                            })
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`lang-${lang}`} className="text-sm font-medium text-gray-700">
                                                    {lang}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Appearance Settings"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Privacy & Security
                                </CardTitle>
                                <CardDescription>Manage your privacy and security settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Privacy</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label htmlFor="profile-privacy" className="block text-sm font-medium text-gray-700 mb-1">
                                                Profile Visibility
                                            </label>
                                            <Select
                                                value={settings.privacy_profile}
                                                onValueChange={(value: "public" | "private" | "friends") =>
                                                    setSettings({ ...settings, privacy_profile: value })
                                                }
                                            >
                                                <SelectTrigger id="profile-privacy">
                                                    <SelectValue placeholder="Select visibility" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="public">Public (Everyone can see)</SelectItem>
                                                    <SelectItem value="friends">Friends Only</SelectItem>
                                                    <SelectItem value="private">Private (Only you)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label htmlFor="stats-privacy" className="block text-sm font-medium text-gray-700 mb-1">
                                                Stats Visibility
                                            </label>
                                            <Select
                                                value={settings.privacy_stats}
                                                onValueChange={(value: "public" | "private" | "friends") =>
                                                    setSettings({ ...settings, privacy_stats: value })
                                                }
                                            >
                                                <SelectTrigger id="stats-privacy">
                                                    <SelectValue placeholder="Select visibility" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="public">Public (Everyone can see)</SelectItem>
                                                    <SelectItem value="friends">Friends Only</SelectItem>
                                                    <SelectItem value="private">Private (Only you)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Security</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Two-Factor Authentication</p>
                                                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                            </div>
                                            <Switch
                                                checked={settings.two_factor_auth}
                                                onCheckedChange={(checked) => setSettings({ ...settings, two_factor_auth: checked })}
                                            />
                                        </div>

                                        {settings.two_factor_auth && (
                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-800">
                                                    Two-factor authentication is enabled. You'll receive a verification code via email when
                                                    logging in from a new device.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Privacy & Security Settings"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
