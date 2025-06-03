import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Trophy, Users, Zap, Brain, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Samvaad</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The AI-powered debate platform where ideas clash, minds grow, and arguments are refined through intelligent
            feedback and structured discourse.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Start Debating</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/debates">Browse Debates</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Samvaad?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Brain className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>AI-Powered Feedback</CardTitle>
                <CardDescription>
                  Get real-time analysis of your arguments with AI-driven insights on logic, tone, and persuasiveness.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Text & Audio Debates</CardTitle>
                <CardDescription>
                  Engage in structured debates through text or voice, with automatic transcription and analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="h-12 w-12 text-yellow-600 mb-4" />
                <CardTitle>Gamified Learning</CardTitle>
                <CardDescription>
                  Earn XP, unlock badges, and climb leaderboards as you improve your debating skills.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Smart Matchmaking</CardTitle>
                <CardDescription>
                  Get matched with opponents of similar skill levels for balanced and engaging debates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>AI Moderation</CardTitle>
                <CardDescription>
                  Maintain respectful discourse with AI-powered content moderation and toxicity detection.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Real-time Experience</CardTitle>
                <CardDescription>
                  Experience seamless real-time debates with instant feedback and live scoring.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Debate Skills?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of debaters who are improving their argumentation skills with AI-powered feedback.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
