"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Users, Clock, Plus, Search, Eye, Mic, Type } from "lucide-react"

interface Debate {
  id: string
  title: string
  topic: string
  type: string
  mode: "TEXT" | "AUDIO"
  visibility: string
  status: "PENDING" | "LIVE" | "ENDED"
  created_at: string
  participants: any[]
  creator: {
    id: string
    username: string
  }
  duration_minutes: number
  tags: string[]
}

export default function DebatesPage() {
  const [debates, setDebates] = useState<Debate[]>([])
  const [filteredDebates, setFilteredDebates] = useState<Debate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [modeFilter, setModeFilter] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchCurrentUser()
    fetchDebates()
  }, [])

  useEffect(() => {
    filterDebates()
  }, [debates, searchTerm, statusFilter, modeFilter])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
    }
  }

  const fetchDebates = async () => {
    try {
      const response = await fetch("/api/debates")
      if (response.ok) {
        const data = await response.json()
        setDebates(data)
      }
    } catch (error) {
      console.error("Failed to fetch debates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterDebates = () => {
    let filtered = debates

    if (searchTerm) {
      filtered = filtered.filter(
        (debate) =>
          debate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          debate.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          debate.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((debate) => debate.status.toLowerCase() === statusFilter)
    }

    if (modeFilter !== "all") {
      filtered = filtered.filter((debate) => debate.mode.toLowerCase() === modeFilter)
    }

    setFilteredDebates(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "live":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "ended":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isUserParticipant = (debate: Debate) => {
    if (!currentUser) return false
    return debate.participants.some((p) => p.user_id === currentUser.id)
  }

  const canJoinDebate = (debate: Debate) => {
    if (!currentUser) return false
    if (debate.status !== "PENDING") return false
    if (debate.participants.length >= 2) return false
    if (isUserParticipant(debate)) return false
    return true
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Debates</h1>
            <p className="text-gray-600 mt-2">Join ongoing debates or create your own</p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/debates/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Debate
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search debates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Debates Grid */}
        {filteredDebates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No debates found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || modeFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Be the first to create a debate!"}
              </p>
              <Button asChild>
                <Link href="/debates/create">Create First Debate</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDebates.map((debate) => (
              <Card key={debate.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{debate.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">{debate.topic}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(debate.status)}>{debate.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Mode and Type */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        {debate.mode.toLowerCase() === "audio" ? (
                          <Mic className="h-4 w-4 mr-1" />
                        ) : (
                          <Type className="h-4 w-4 mr-1" />
                        )}
                        {debate.mode.toLowerCase()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {debate.duration_minutes}m
                      </div>
                    </div>

                    {/* Creator and Participants */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        {debate.participants.length}/2 participants
                      </div>
                      <span className="text-gray-500">by {debate.creator.username}</span>
                    </div>

                    {/* Tags */}
                    {debate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {debate.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {debate.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{debate.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="text-xs text-gray-500">Created {formatDate(debate.created_at)}</div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {canJoinDebate(debate) ? (
                        <Button asChild className="w-full">
                          <Link href={`/debates/${debate.id}`}>Join Debate</Link>
                        </Button>
                      ) : isUserParticipant(debate) && debate.status === "PENDING" ? (
                        <Button asChild className="w-full bg-yellow-600 hover:bg-yellow-700">
                          <Link href={`/debates/${debate.id}`}>Waiting for Opponent</Link>
                        </Button>
                      ) : debate.status.toLowerCase() === "live" ? (
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/debates/${debate.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Watch Live
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/debates/${debate.id}`}>View Results</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
