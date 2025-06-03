"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy, Medal, MessageCircle, Clock, TrendingUp, Brain, Eye } from "lucide-react"

interface DebateResultsProps {
    debate: any
}

export function DebateResults({ debate }: DebateResultsProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "ENDED":
                return "bg-green-100 text-green-800"
            case "CANCELLED":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getWinnerIcon = (participant: any) => {
        if (!debate.winner) return null
        if (participant.user.id === debate.winner.id) {
            return <Trophy className="h-5 w-5 text-yellow-500" />
        }
        return null
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {debate.status === "ENDED" ? (
                            <Trophy className="h-16 w-16 text-yellow-500" />
                        ) : (
                            <Medal className="h-16 w-16 text-gray-400" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">{debate.title}</CardTitle>
                    <CardDescription className="text-lg">{debate.topic}</CardDescription>
                    <div className="flex justify-center gap-2 mt-4">
                        <Badge className={getStatusColor(debate.status)}>{debate.status}</Badge>
                        <Badge variant="outline">{debate.mode}</Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Winner Announcement */}
            {debate.winner && (
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <CardContent className="text-center py-8">
                        <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Winner: {debate.winner.username}!</h2>
                        <p className="text-gray-600">Congratulations on a well-argued debate!</p>
                    </CardContent>
                </Card>
            )}

            {/* No Winner */}
            {!debate.winner && debate.status === "ENDED" && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="text-center py-8">
                        <Medal className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">🤝 It's a Tie!</h2>
                        <p className="text-gray-600">Both participants presented excellent arguments!</p>
                    </CardContent>
                </Card>
            )}

            {/* Debate Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <MessageCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{debate.statistics.total_messages}</div>
                        <p className="text-sm text-gray-600">Total Messages</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Clock className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-green-600">{formatDuration(debate.statistics.duration_actual)}</div>
                        <p className="text-sm text-gray-600">Actual Duration</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Eye className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                        <div className="text-2xl font-bold text-purple-600">{debate.statistics.total_viewers}</div>
                        <p className="text-sm text-gray-600">Viewers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <TrendingUp className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                        <div className="text-2xl font-bold text-orange-600">{debate.statistics.average_message_length}</div>
                        <p className="text-sm text-gray-600">Avg. Message Length</p>
                    </CardContent>
                </Card>
            </div>

            {/* Participant Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {debate.participant_stats.map((participant: any, index: number) => (
                    <Card key={participant.id} className={participant.is_winner ? "ring-2 ring-yellow-400" : ""}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback>{participant.user.username[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {participant.user.username}
                                            {getWinnerIcon(participant)}
                                        </CardTitle>
                                        <CardDescription>
                                            {participant.position} • {participant.user.rank}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant={participant.is_winner ? "default" : "secondary"}>
                                    {participant.is_winner ? "Winner" : "Participant"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* AI Score */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium flex items-center gap-1">
                                            <Brain className="h-4 w-4" />
                                            AI Score
                                        </span>
                                        <span className="text-sm font-bold">{participant.avg_ai_score}/100</span>
                                    </div>
                                    <Progress value={participant.avg_ai_score} className="h-2" />
                                </div>

                                {/* Performance Stats */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Messages</p>
                                        <p className="font-semibold">{participant.message_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Total Words</p>
                                        <p className="font-semibold">{participant.total_words}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">XP Earned</p>
                                        <p className="font-semibold text-green-600">+{participant.xp_earned}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Final Score</p>
                                        <p className="font-semibold">{participant.score}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Debate Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Debate Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div>
                                <p className="font-medium">Debate Created</p>
                                <p className="text-sm text-gray-600">{new Date(debate.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        {debate.started_at && (
                            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div>
                                    <p className="font-medium">Debate Started</p>
                                    <p className="text-sm text-gray-600">{new Date(debate.started_at).toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        {debate.ended_at && (
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                <div>
                                    <p className="font-medium">Debate Ended</p>
                                    <p className="text-sm text-gray-600">{new Date(debate.ended_at).toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* AI Summary */}
            {debate.ai_summary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            AI Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 leading-relaxed">{debate.ai_summary}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
