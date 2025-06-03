"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, Award, TrendingUp, Users, Zap } from "lucide-react"

interface LeaderboardEntry {
    rank: number
    user: {
        id: string
        username: string
        avatar_url?: string
        level: number
        rank: string
        xp: number
    }
    score: number
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [leaderboardType, setLeaderboardType] = useState("global")

    useEffect(() => {
        fetchLeaderboard()
    }, [leaderboardType])

    const fetchLeaderboard = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/gamification/leaderboard?type=${leaderboardType}&limit=50`)
            if (response.ok) {
                const data = await response.json()
                setLeaderboard(data)
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-6 w-6 text-yellow-500" />
            case 2:
                return <Medal className="h-6 w-6 text-gray-400" />
            case 3:
                return <Award className="h-6 w-6 text-amber-600" />
            default:
                return <span className="text-lg font-bold text-gray-500">#{rank}</span>
        }
    }

    const getRankBadgeColor = (rank: string) => {
        switch (rank.toLowerCase()) {
            case "grandmaster":
                return "bg-purple-100 text-purple-800"
            case "master":
                return "bg-red-100 text-red-800"
            case "expert":
                return "bg-blue-100 text-blue-800"
            case "advanced":
                return "bg-green-100 text-green-800"
            case "intermediate":
                return "bg-yellow-100 text-yellow-800"
            case "competent":
                return "bg-orange-100 text-orange-800"
            case "apprentice":
                return "bg-indigo-100 text-indigo-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        Leaderboard
                    </h1>
                    <p className="text-gray-600 mt-2">See how you rank against other debaters</p>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select leaderboard type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="global">Global Rankings</SelectItem>
                            <SelectItem value="weekly">This Week</SelectItem>
                            <SelectItem value="category">By Category</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-lg">
                                <Users className="h-5 w-5 mr-2 text-blue-600" />
                                Total Debaters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{leaderboard.length}</div>
                            <p className="text-sm text-gray-600">Active participants</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-lg">
                                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                                Top Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{leaderboard[0]?.score.toLocaleString() || 0}</div>
                            <p className="text-sm text-gray-600">XP points</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-lg">
                                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                                Average Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {leaderboard.length > 0
                                    ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.user.level, 0) / leaderboard.length)
                                    : 0}
                            </div>
                            <p className="text-sm text-gray-600">Community level</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Leaderboard */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rankings</CardTitle>
                        <CardDescription>
                            {leaderboardType === "global" && "All-time rankings based on XP earned"}
                            {leaderboardType === "weekly" && "Rankings for this week"}
                            {leaderboardType === "category" && "Rankings by debate category"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-12">
                                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
                                <p className="text-gray-600">Be the first to start debating and claim the top spot!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {leaderboard.map((entry) => (
                                    <div
                                        key={entry.user.id}
                                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-gray-50 ${entry.rank <= 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200" : ""
                                            }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            {/* Rank */}
                                            <div className="flex-shrink-0 w-12 flex justify-center">{getRankIcon(entry.rank)}</div>

                                            {/* Avatar */}
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                                    {entry.user.username[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* User Info */}
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{entry.user.username}</h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Badge className={getRankBadgeColor(entry.user.rank)} variant="secondary">
                                                        {entry.user.rank}
                                                    </Badge>
                                                    <span className="text-sm text-gray-500">Level {entry.user.level}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-gray-900">{entry.score.toLocaleString()}</div>
                                            <div className="text-sm text-gray-500">XP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Call to Action */}
                {leaderboard.length > 0 && (
                    <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="text-center py-8">
                            <Trophy className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Climb the Rankings?</h3>
                            <p className="text-gray-600 mb-4">
                                Participate in debates, earn XP, and improve your ranking on the leaderboard!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="/debates"
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                >
                                    Join a Debate
                                </a>
                                <a
                                    href="/debates/create"
                                    className="inline-flex items-center px-6 py-3 border border-blue-300 text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                                >
                                    Create Debate
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
