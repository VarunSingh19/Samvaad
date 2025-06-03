"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MessageCircle, Trophy, Plus, Zap, TrendingUp, Clock } from "lucide-react"

interface UserStats {
  id: string
  username: string
  level: number
  xp: number
  rank: string
  total_debates: number
  wins: number
  losses: number
  account_type: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const winRate = user.total_debates > 0 ? (user.wins / user.total_debates) * 100 : 0
  const xpToNextLevel = user.level * 1000 - (user.xp % 1000)
  const levelProgress = ((user.xp % 1000) / 1000) * 100

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.username}!</h1>
          <p className="text-gray-600 mt-2">Ready to engage in some thought-provoking debates?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                Create Debate
              </CardTitle>
              <CardDescription>Start a new structured debate on any topic</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/debates/create">Create New Debate</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                Quick Match
              </CardTitle>
              <CardDescription>Get matched with an opponent instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/find-opponent">Find Opponent</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                Browse Debates
              </CardTitle>
              <CardDescription>Join ongoing debates or watch live</CardDescription>
            </CardContent>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/debates">Browse All</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.level}</div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{user.xp.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{user.total_debates}</div>
                  <div className="text-sm text-gray-600">Debates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{winRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress to Level {user.level + 1}</span>
                  <span className="text-sm text-gray-600">{xpToNextLevel} XP needed</span>
                </div>
                <Progress value={levelProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Rank & Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Rank & Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {user.rank}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Wins</span>
                  <span className="font-medium text-green-600">{user.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Losses</span>
                  <span className="font-medium text-red-600">{user.losses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <Badge variant={user.account_type === "ADMIN" ? "default" : "outline"}>{user.account_type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent debates. Start your first debate to see activity here!</p>
              <Button asChild className="mt-4">
                <Link href="/debates/create">Create Your First Debate</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
