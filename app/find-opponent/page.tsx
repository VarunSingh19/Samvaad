"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/use-websocket"
import {
    Loader2,
    Search,
    Users,
    Trophy,
    BarChart,
    Clock,
    RefreshCw,
    UserPlus,
    CheckCircle,
    XCircle,
} from "lucide-react"

interface OnlineUser {
    id: string
    username: string
    avatar_url: string | null
    level: number
    rank: string
    elo_rating: number
    total_debates: number
    wins: number
    losses: number
    win_rate: number
}

interface DebateRequest {
    id: string
    sender: {
        id: string
        username: string
        avatar_url: string | null
        level: number
        rank: string
    }
    topic: string
    position: string
    mode: string
    duration_minutes: number
    created_at: string
    status: string
}

export default function FindOpponentPage() {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
    const [incomingRequests, setIncomingRequests] = useState<DebateRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isRequestPending, setIsRequestPending] = useState(false)
    const [debateTopic, setDebateTopic] = useState("")
    const [debatePosition, setDebatePosition] = useState("FOR")
    const [debateMode, setDebateMode] = useState("TEXT")
    const [debateDuration, setDebateDuration] = useState("15")
    const { toast } = useToast()
    const router = useRouter()
    const { socket, isConnected } = useWebSocket()

    useEffect(() => {
        fetchOnlineUsers()
        fetchIncomingRequests()
        const interval = setInterval(() => {
            fetchOnlineUsers()
            fetchIncomingRequests()
        }, 30000) // Refresh every 30 seconds
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (isConnected && socket) {
            // Listen for new debate requests
            socket.on("debate_request", (data) => {
                fetchIncomingRequests()
                toast({
                    title: "New Debate Request",
                    description: `${data.senderName} wants to debate with you on "${data.topic}"`,
                })
            })

            // Listen for request status updates
            socket.on("debate_request_update", (data) => {
                if (data.status === "ACCEPTED") {
                    toast({
                        title: "Request Accepted",
                        description: `Your debate request has been accepted! Redirecting to debate room...`,
                    })
                    setTimeout(() => {
                        router.push(`/debates/${data.debateId}`)
                    }, 2000)
                } else if (data.status === "DECLINED") {
                    toast({
                        title: "Request Declined",
                        description: `Your debate request has been declined.`,
                        variant: "destructive",
                    })
                }
            })

            return () => {
                socket.off("debate_request")
                socket.off("debate_request_update")
            }
        }
    }, [isConnected, socket, toast, router])

    const fetchOnlineUsers = async () => {
        try {
            const response = await fetch("/api/users/online")
            if (response.ok) {
                const data = await response.json()
                setOnlineUsers(data)
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch online users",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Failed to fetch online users:", error)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    const fetchIncomingRequests = async () => {
        try {
            const response = await fetch("/api/debate-requests")
            if (response.ok) {
                const data = await response.json()
                setIncomingRequests(data)
            }
        } catch (error) {
            console.error("Failed to fetch incoming requests:", error)
        }
    }

    const handleRefresh = () => {
        setIsRefreshing(true)
        fetchOnlineUsers()
    }

    const handleSendRequest = async () => {
        if (!selectedUser) return

        if (!debateTopic.trim()) {
            toast({
                title: "Error",
                description: "Please enter a debate topic",
                variant: "destructive",
            })
            return
        }

        setIsRequestPending(true)

        try {
            const response = await fetch("/api/debate-requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    recipient_id: selectedUser.id,
                    topic: debateTopic,
                    position: debatePosition,
                    mode: debateMode,
                    duration_minutes: Number.parseInt(debateDuration),
                }),
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: `Debate request sent to ${selectedUser.username}`,
                })
                setIsDialogOpen(false)
                setDebateTopic("")
                setDebatePosition("FOR")
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to send debate request",
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
            setIsRequestPending(false)
        }
    }

    const handleAcceptRequest = async (requestId: string) => {
        try {
            const response = await fetch(`/api/debate-requests/${requestId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "accept",
                }),
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Success",
                    description: "Debate request accepted",
                })
                fetchIncomingRequests()
                router.push(`/debates/${data.debate_id}`)
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to accept debate request",
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

    const handleDeclineRequest = async (requestId: string) => {
        try {
            const response = await fetch(`/api/debate-requests/${requestId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "decline",
                }),
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Debate request declined",
                })
                fetchIncomingRequests()
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Failed to decline debate request",
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

    const filteredUsers = onlineUsers.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Find an Opponent</h1>
                        <p className="text-gray-600 mt-1">Challenge online users to a debate</p>
                    </div>
                    <Button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
                        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </Button>
                </div>

                <Tabs defaultValue="online">
                    <TabsList className="grid grid-cols-2 mb-6">
                        <TabsTrigger value="online" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Online Users ({onlineUsers.length})
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Incoming Requests ({incomingRequests.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="online">
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-lg font-medium text-gray-600">No online users found</p>
                                    <p className="text-gray-500 mt-1">Try refreshing or check back later</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredUsers.map((user) => (
                                    <Card key={user.id} className="overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    {user.avatar_url ? (
                                                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.username} />
                                                    ) : (
                                                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-lg">{user.username}</CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {user.rank}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">Level {user.level}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Trophy className="h-3 w-3 text-yellow-500" />
                                                    <span className="text-gray-600">Win Rate:</span>
                                                    <span className="font-medium">{user.win_rate}%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <BarChart className="h-3 w-3 text-blue-500" />
                                                    <span className="text-gray-600">ELO:</span>
                                                    <span className="font-medium">{user.elo_rating}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-green-500" />
                                                    <span className="text-gray-600">Debates:</span>
                                                    <span className="font-medium">{user.total_debates}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Trophy className="h-3 w-3 text-purple-500" />
                                                    <span className="text-gray-600">Wins:</span>
                                                    <span className="font-medium">{user.wins}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-2">
                                            <Button
                                                className="w-full"
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setIsDialogOpen(true)
                                                }}
                                            >
                                                Challenge to Debate
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="requests">
                        {incomingRequests.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-lg font-medium text-gray-600">No incoming debate requests</p>
                                    <p className="text-gray-500 mt-1">When someone challenges you, it will appear here</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {incomingRequests.map((request) => (
                                    <Card key={request.id}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        {request.sender.avatar_url ? (
                                                            <AvatarImage
                                                                src={request.sender.avatar_url || "/placeholder.svg"}
                                                                alt={request.sender.username}
                                                            />
                                                        ) : (
                                                            <AvatarFallback>{request.sender.username[0].toUpperCase()}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-lg">{request.sender.username}</CardTitle>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {request.sender.rank}
                                                            </Badge>
                                                            <span className="text-xs text-gray-500">Level {request.sender.level}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(request.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-700">Topic</h3>
                                                    <p className="text-sm">{request.topic}</p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <h3 className="text-xs font-medium text-gray-700">Position</h3>
                                                        <p className="text-sm">
                                                            {request.position === "FOR" ? "For (Affirmative)" : "Against (Negative)"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-medium text-gray-700">Mode</h3>
                                                        <p className="text-sm">{request.mode}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-medium text-gray-700">Duration</h3>
                                                        <p className="text-sm">{request.duration_minutes} minutes</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex gap-3">
                                            <Button className="flex-1" onClick={() => handleAcceptRequest(request.id)}>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Accept
                                            </Button>
                                            <Button variant="outline" className="flex-1" onClick={() => handleDeclineRequest(request.id)}>
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Decline
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Challenge to Debate</DialogTitle>
                        <DialogDescription>{selectedUser && `Send a debate request to ${selectedUser.username}`}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                                Debate Topic
                            </label>
                            <Textarea
                                id="topic"
                                placeholder="Enter the topic for debate..."
                                value={debateTopic}
                                onChange={(e) => setDebateTopic(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Position
                                </label>
                                <Select value={debatePosition} onValueChange={setDebatePosition}>
                                    <SelectTrigger id="position">
                                        <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FOR">For (Affirmative)</SelectItem>
                                        <SelectItem value="AGAINST">Against (Negative)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
                                    Debate Mode
                                </label>
                                <Select value={debateMode} onValueChange={setDebateMode}>
                                    <SelectTrigger id="mode">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEXT">Text</SelectItem>
                                        <SelectItem value="AUDIO">Audio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes)
                            </label>
                            <Select value={debateDuration} onValueChange={setDebateDuration}>
                                <SelectTrigger id="duration">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 minutes</SelectItem>
                                    <SelectItem value="10">10 minutes</SelectItem>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="20">20 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendRequest} disabled={isRequestPending || !debateTopic.trim()}>
                            {isRequestPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Challenge"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
