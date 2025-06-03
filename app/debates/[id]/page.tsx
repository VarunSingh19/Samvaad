// "use client"

// import type React from "react"

// import { useEffect, useState, useRef } from "react"
// import { useParams, useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import { Progress } from "@/components/ui/progress"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { useToast } from "@/hooks/use-toast"
// import {
//   Send,
//   Users,
//   Clock,
//   Brain,
//   AlertTriangle,
//   CheckCircle,
//   XCircle,
//   Play,
//   MessageSquare,
//   Eye,
//   Trophy,
//   LogOut,
// } from "lucide-react"
// import { DebateResults } from "@/components/debate-results"

// interface DebateMessage {
//   id: string
//   content: string
//   sender: {
//     id: string
//     username: string
//   }
//   role: "AFFIRMATIVE" | "NEGATIVE"
//   created_at: string
//   is_flagged: boolean
//   ai_analysis?: {
//     score: number
//     feedback: string
//     flagged: boolean
//     strengths: string[]
//     areas_to_improve: string[]
//   }
// }

// interface GlobalMessage {
//   id: string
//   content: string
//   sender: {
//     id: string
//     username: string
//     level: number
//     rank: string
//   }
//   created_at: string
//   is_flagged: boolean
// }

// interface Participant {
//   id: string
//   role: "AFFIRMATIVE" | "NEGATIVE"
//   position: string
//   is_ready: boolean
//   user: {
//     id: string
//     username: string
//     level: number
//     rank: string
//     is_online: boolean
//   }
// }

// interface Debate {
//   id: string
//   title: string
//   topic: string
//   mode: "TEXT" | "AUDIO"
//   status: "PENDING" | "READY" | "LIVE" | "ENDED" | "CANCELLED"
//   duration_minutes: number
//   created_at: string
//   started_at?: string
//   ended_at?: string
//   participants: Participant[]
//   messages: DebateMessage[]
//   creator: {
//     id: string
//     username: string
//   }
//   winner?: {
//     id: string
//     username: string
//     level: number
//     rank: string
//   }
// }

// export default function DebateRoomPage() {
//   const params = useParams()
//   const debateId = params.id as string
//   const [debate, setDebate] = useState<Debate | null>(null)
//   const [debateResults, setDebateResults] = useState<any>(null)
//   const [globalMessages, setGlobalMessages] = useState<GlobalMessage[]>([])
//   const [newMessage, setNewMessage] = useState("")
//   const [newGlobalMessage, setNewGlobalMessage] = useState("")
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSending, setIsSending] = useState(false)
//   const [isJoining, setIsJoining] = useState(false)
//   const [isBeginning, setIsBeginning] = useState(false)
//   const [currentUser, setCurrentUser] = useState<any>(null)
//   const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
//   const [activeTab, setActiveTab] = useState("debate")
//   const [showResults, setShowResults] = useState(false)
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const globalMessagesEndRef = useRef<HTMLDivElement>(null)
//   const { toast } = useToast()
//   const router = useRouter()
//   const [aiInsights, setAiInsights] = useState({
//     debateQuality: 75,
//     engagementLevel: 60,
//     respectfulness: 90,
//     recentFeedback: "Arguments are well-structured",
//   })

//   useEffect(() => {
//     fetchCurrentUser()
//     fetchDebate()
//     fetchGlobalMessages()
//     const interval = setInterval(() => {
//       fetchDebate()
//       fetchGlobalMessages()
//     }, 3000) // Poll for updates
//     return () => clearInterval(interval)
//   }, [debateId])

//   useEffect(() => {
//     scrollToBottom()
//   }, [debate?.messages])

//   useEffect(() => {
//     scrollToGlobalBottom()
//   }, [globalMessages])

//   useEffect(() => {
//     if (debate?.status === "LIVE" && debate.started_at) {
//       const timer = setInterval(() => {
//         const startTime = new Date(debate.started_at!).getTime()
//         const endTime = startTime + debate.duration_minutes * 60 * 1000
//         const now = Date.now()
//         const remaining = Math.max(0, endTime - now)

//         setTimeRemaining(remaining)

//         if (remaining === 0) {
//           clearInterval(timer)
//           fetchDebate() // Refresh to get updated status
//         }
//       }, 1000)

//       return () => clearInterval(timer)
//     }
//   }, [debate])

//   useEffect(() => {
//     // Show results when debate is ended
//     if (debate && (debate.status === "ENDED" || debate.status === "CANCELLED")) {
//       fetchDebateResults()
//     }
//   }, [debate, debate?.status])

//   useEffect(() => {
//     // Mock socket connection for testing purposes
//     const mockSocket = {
//       on: (event: string, callback: (data: any) => void) => {
//         // Simulate AI analysis data after a delay
//         if (event === "ai_analysis") {
//           setTimeout(() => {
//             const mockData = {
//               analysis: {
//                 argument_quality: Math.floor(Math.random() * 100),
//                 topic_relevance: Math.floor(Math.random() * 100),
//                 tone_score: Math.floor(Math.random() * 100),
//                 feedback: "Mock AI feedback",
//               },
//             }
//             callback(mockData)
//           }, 2000) // Simulate delay
//         }
//       },
//       off: (event: string) => {
//         console.log(`Socket off: ${event}`)
//       },
//     }

//     const socketConnected = true
//     const socket = mockSocket

//     if (socketConnected && socket) {
//       socket.on("ai_analysis", (data) => {
//         // Update AI insights based on real-time analysis
//         setAiInsights((prev) => ({
//           ...prev,
//           debateQuality: data.analysis.argument_quality || prev.debateQuality,
//           engagementLevel: data.analysis.topic_relevance || prev.engagementLevel,
//           respectfulness: data.analysis.tone_score || prev.respectfulness,
//           recentFeedback: data.analysis.feedback || prev.recentFeedback,
//         }))
//       })

//       return () => {
//         socket.off("ai_analysis")
//       }
//     }
//   }, [])

//   const fetchCurrentUser = async () => {
//     try {
//       const response = await fetch("/api/auth/me")
//       if (response.ok) {
//         const userData = await response.json()
//         setCurrentUser(userData)
//       }
//     } catch (error) {
//       console.error("Failed to fetch user:", error)
//     }
//   }

//   const fetchDebate = async () => {
//     try {
//       const response = await fetch(`/api/debates/${debateId}`)
//       if (response.ok) {
//         const data = await response.json()
//         setDebate(data)
//       } else {
//         toast({
//           title: "Error",
//           description: "Debate not found",
//           variant: "destructive",
//         })
//       }
//     } catch (error) {
//       console.error("Failed to fetch debate:", error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const fetchDebateResults = async () => {
//     try {
//       const response = await fetch(`/api/debates/${debateId}/results`)
//       if (response.ok) {
//         const data = await response.json()
//         setDebateResults(data)
//         setShowResults(true)
//       }
//     } catch (error) {
//       console.error("Failed to fetch debate results:", error)
//     }
//   }

//   const fetchGlobalMessages = async () => {
//     try {
//       const response = await fetch(`/api/debates/${debateId}/global-chat`)
//       if (response.ok) {
//         const data = await response.json()
//         setGlobalMessages(data)
//       }
//     } catch (error) {
//       console.error("Failed to fetch global messages:", error)
//     }
//   }

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }

//   const scrollToGlobalBottom = () => {
//     globalMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }

//   const handleJoinDebate = async () => {
//     if (!currentUser) {
//       toast({
//         title: "Error",
//         description: "You must be logged in to join a debate",
//         variant: "destructive",
//       })
//       return
//     }

//     setIsJoining(true)

//     try {
//       const response = await fetch(`/api/debates/${debateId}/join`, {
//         method: "POST",
//       })

//       if (response.ok) {
//         toast({
//           title: "Success",
//           description: "Joined debate successfully!",
//         })
//         fetchDebate()
//       } else {
//         const error = await response.json()
//         toast({
//           title: "Error",
//           description: error.error || "Failed to join debate",
//           variant: "destructive",
//         })
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Something went wrong",
//         variant: "destructive",
//       })
//     } finally {
//       setIsJoining(false)
//     }
//   }

//   const handleBeginDebate = async () => {
//     setIsBeginning(true)

//     try {
//       const response = await fetch(`/api/debates/${debateId}/begin`, {
//         method: "POST",
//       })

//       if (response.ok) {
//         const result = await response.json()
//         toast({
//           title: "Success",
//           description: result.message,
//         })
//         fetchDebate()
//       } else {
//         const error = await response.json()
//         toast({
//           title: "Error",
//           description: error.error || "Failed to begin debate",
//           variant: "destructive",
//         })
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Something went wrong",
//         variant: "destructive",
//       })
//     } finally {
//       setIsBeginning(false)
//     }
//   }

//   const handleSendMessage = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!newMessage.trim()) return

//     setIsSending(true)

//     try {
//       const response = await fetch(`/api/debates/${debateId}/messages`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           content: newMessage.trim(),
//         }),
//       })

//       if (response.ok) {
//         setNewMessage("")
//         fetchDebate()
//       } else {
//         const error = await response.json()
//         toast({
//           title: "Error",
//           description: error.error || "Failed to send message",
//           variant: "destructive",
//         })
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to send message",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSending(false)
//     }
//   }

//   const handleSendGlobalMessage = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!newGlobalMessage.trim()) return

//     try {
//       const response = await fetch(`/api/debates/${debateId}/global-chat`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           content: newGlobalMessage.trim(),
//         }),
//       })

//       if (response.ok) {
//         setNewGlobalMessage("")
//         fetchGlobalMessages()
//       } else {
//         const error = await response.json()
//         toast({
//           title: "Error",
//           description: error.error || "Failed to send message",
//           variant: "destructive",
//         })
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to send message",
//         variant: "destructive",
//       })
//     }
//   }

//   const formatTime = (ms: number) => {
//     const minutes = Math.floor(ms / 60000)
//     const seconds = Math.floor((ms % 60000) / 1000)
//     return `${minutes}:${seconds.toString().padStart(2, "0")}`
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "LIVE":
//         return "bg-green-100 text-green-800"
//       case "READY":
//         return "bg-blue-100 text-blue-800"
//       case "PENDING":
//         return "bg-yellow-100 text-yellow-800"
//       case "ENDED":
//         return "bg-purple-100 text-purple-800"
//       case "CANCELLED":
//         return "bg-red-100 text-red-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }

//   const getUserParticipant = () => {
//     if (!currentUser || !debate) return null
//     return debate.participants.find((p) => p.user.id === currentUser.id)
//   }

//   const canSendMessage = () => {
//     const userParticipant = getUserParticipant()
//     return userParticipant && debate?.status === "LIVE"
//   }

//   const canBeginDebate = () => {
//     const userParticipant = getUserParticipant()
//     return userParticipant && debate?.status === "READY" && !userParticipant.is_ready
//   }

//   // Add these functions after the existing functions:
//   const handleEndDebate = async () => {
//     if (!confirm("Are you sure you want to end this debate? This action cannot be undone.")) {
//       return
//     }

//     try {
//       const response = await fetch(`/api/debates/${debateId}/end`, {
//         method: "POST",
//       })

//       if (response.ok) {
//         toast({
//           title: "Success",
//           description: "Debate ended successfully",
//         })
//         fetchDebate()
//       } else {
//         const error = await response.json()
//         toast({
//           title: "Error",
//           description: error.error || "Failed to end debate",
//           variant: "destructive",
//         })
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Something went wrong",
//         variant: "destructive",
//       })
//     }
//   }

//   const handleExitDebate = async () => {
//     if (!confirm("Are you sure you want to exit this debate? You will forfeit the match.")) {
//       return
//     }

//     try {
//       const response = await fetch(`/api/debates/${debateId}/exit`, {
//         method: "POST",
//       })

//       if (response.ok) {
//         toast({
//           title: "Success",
//           description: "Exited debate successfully",
//         })
//         router.push("/debates")
//       } else {
//         const error = await response.json()
//         toast({
//           title: "Error",
//           description: error.error || "Failed to exit debate",
//           variant: "destructive",
//         })
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Something went wrong",
//         variant: "destructive",
//       })
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
//       </div>
//     )
//   }

//   if (!debate) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Card className="text-center p-8">
//           <CardContent>
//             <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
//             <h2 className="text-2xl font-bold mb-2">Debate Not Found</h2>
//             <p className="text-gray-600">The debate you're looking for doesn't exist.</p>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   // Show results page if debate is ended
//   if (showResults && debateResults && (debate.status === "ENDED" || debate.status === "CANCELLED")) {
//     return (
//       <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-4xl mx-auto">
//           <div className="mb-6">
//             <Button variant="outline" onClick={() => setShowResults(false)} className="mb-4">
//               ← Back to Debate Room
//             </Button>
//           </div>
//           <DebateResults debate={debateResults} />
//         </div>
//       </div>
//     )
//   }

//   const userParticipant = getUserParticipant()
//   const isParticipant = !!userParticipant
//   const canJoin = debate.status === "PENDING" && debate.participants.length < 2 && !isParticipant && currentUser
//   const bothParticipantsOnline = debate.participants.length === 2 && debate.participants.every((p) => p.user.is_online)

//   return (
//     <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-6">
//           {/* Update the header section to include End/Exit buttons: */}
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">{debate.title}</h1>
//               <p className="text-gray-600 mt-2">{debate.topic}</p>
//             </div>
//             <div className="flex items-center gap-2">
//               <Badge className={getStatusColor(debate.status)}>{debate.status}</Badge>
//               {timeRemaining !== null && debate.status === "LIVE" && (
//                 <Badge variant="outline" className="flex items-center gap-1">
//                   <Clock className="h-3 w-3" />
//                   {formatTime(timeRemaining)}
//                 </Badge>
//               )}
//               {(debate.status === "ENDED" || debate.status === "CANCELLED") && (
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setShowResults(true)}
//                   className="flex items-center gap-1"
//                 >
//                   <Trophy className="h-4 w-4" />
//                   View Results
//                 </Button>
//               )}
//               {/* Add End/Exit buttons for participants */}
//               {isParticipant && debate.status === "LIVE" && (
//                 <>
//                   <Button variant="destructive" size="sm" onClick={handleEndDebate} className="flex items-center gap-1">
//                     <XCircle className="h-4 w-4" />
//                     End Debate
//                   </Button>
//                   <Button variant="outline" size="sm" onClick={handleExitDebate} className="flex items-center gap-1">
//                     <LogOut className="h-4 w-4" />
//                     Exit
//                   </Button>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Debate Ended Banner */}
//         {(debate.status === "ENDED" || debate.status === "CANCELLED") && (
//           <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
//             <CardContent className="text-center py-6">
//               <Trophy className="h-12 w-12 mx-auto text-purple-600 mb-4" />
//               <h2 className="text-2xl font-bold text-gray-900 mb-2">
//                 {debate.status === "ENDED" ? "🎉 Debate Completed!" : "⚠️ Debate Cancelled"}
//               </h2>
//               {debate.winner && (
//                 <p className="text-lg text-gray-700 mb-4">
//                   Winner: <strong>{debate.winner.username}</strong>
//                 </p>
//               )}
//               <Button onClick={() => setShowResults(true)} className="mt-2">
//                 <Trophy className="h-4 w-4 mr-2" />
//                 View Full Results
//               </Button>
//             </CardContent>
//           </Card>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//           {/* Main Debate Area */}
//           <div className="lg:col-span-3">
//             <Card className="h-[600px] flex flex-col">
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Users className="h-5 w-5" />
//                     <span>Debate Room</span>
//                   </div>
//                   <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
//                     <TabsList>
//                       <TabsTrigger value="debate" className="flex items-center gap-2">
//                         <MessageSquare className="h-4 w-4" />
//                         Debate
//                       </TabsTrigger>
//                       <TabsTrigger value="global" className="flex items-center gap-2">
//                         <Eye className="h-4 w-4" />
//                         Global Chat ({globalMessages.length})
//                       </TabsTrigger>
//                     </TabsList>
//                   </Tabs>
//                 </div>
//                 <CardDescription>
//                   {debate.mode === "TEXT" ? "Text-based debate" : "Audio debate with transcription"}
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="flex-1 flex flex-col">
//                 <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
//                   <TabsContent value="debate" className="flex-1 flex flex-col mt-0">
//                     {/* Debate Messages */}
//                     <ScrollArea className="flex-1 pr-4">
//                       <div className="space-y-4">
//                         {debate.messages.length === 0 ? (
//                           <div className="text-center py-8 text-gray-500">
//                             <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
//                             <p>No messages yet. Start the debate!</p>
//                           </div>
//                         ) : (
//                           debate.messages.map((message) => (
//                             <div
//                               key={message.id}
//                               className={`flex gap-3 ${message.role === "AFFIRMATIVE" ? "justify-start" : "justify-end"}`}
//                             >
//                               <div
//                                 className={`max-w-[70%] rounded-lg p-3 ${message.role === "AFFIRMATIVE"
//                                     ? "bg-blue-100 text-blue-900"
//                                     : "bg-green-100 text-green-900"
//                                   }`}
//                               >
//                                 <div className="flex items-center gap-2 mb-1">
//                                   <Avatar className="h-6 w-6">
//                                     <AvatarFallback className="text-xs">
//                                       {message.sender.username[0].toUpperCase()}
//                                     </AvatarFallback>
//                                   </Avatar>
//                                   <span className="font-medium text-sm">{message.sender.username}</span>
//                                   <span className="text-xs opacity-70">
//                                     {message.role === "AFFIRMATIVE" ? "For" : "Against"}
//                                   </span>
//                                   {message.is_flagged && <AlertTriangle className="h-4 w-4 text-red-500" />}
//                                 </div>
//                                 <p className="text-sm">{message.content}</p>
//                                 {message.ai_analysis && (
//                                   <div className="mt-2 pt-2 border-t border-current/20">
//                                     <div className="flex items-center gap-2 text-xs">
//                                       <Brain className="h-3 w-3" />
//                                       <span>AI Score: {message.ai_analysis.score}/100</span>
//                                       {message.ai_analysis.flagged ? (
//                                         <XCircle className="h-3 w-3 text-red-500" />
//                                       ) : (
//                                         <CheckCircle className="h-3 w-3 text-green-500" />
//                                       )}
//                                     </div>
//                                     <p className="text-xs mt-1 opacity-80">{message.ai_analysis.feedback}</p>
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
//                           ))
//                         )}
//                         <div ref={messagesEndRef} />
//                       </div>
//                     </ScrollArea>

//                     {/* Debate Message Input */}
//                     {canSendMessage() ? (
//                       <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
//                         <Input
//                           value={newMessage}
//                           onChange={(e) => setNewMessage(e.target.value)}
//                           placeholder="Type your argument..."
//                           disabled={isSending}
//                         />
//                         <Button type="submit" disabled={isSending || !newMessage.trim()}>
//                           <Send className="h-4 w-4" />
//                         </Button>
//                       </form>
//                     ) : canJoin ? (
//                       <div className="mt-4">
//                         <Button onClick={handleJoinDebate} className="w-full" disabled={isJoining}>
//                           {isJoining ? "Joining..." : "Join Debate"}
//                         </Button>
//                       </div>
//                     ) : canBeginDebate() ? (
//                       <div className="mt-4">
//                         <div className="text-center mb-4">
//                           <p className="text-sm text-gray-600 mb-2">
//                             Both participants are ready! Click begin to start the debate.
//                           </p>
//                           {!bothParticipantsOnline && (
//                             <p className="text-xs text-orange-600">⚠️ Waiting for both participants to be online</p>
//                           )}
//                         </div>
//                         <Button
//                           onClick={handleBeginDebate}
//                           className="w-full"
//                           disabled={isBeginning || !bothParticipantsOnline}
//                         >
//                           <Play className="h-4 w-4 mr-2" />
//                           {isBeginning ? "Starting..." : "Begin Debate"}
//                         </Button>
//                       </div>
//                     ) : isParticipant && debate.status === "READY" && userParticipant?.is_ready ? (
//                       <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
//                         <p className="text-blue-800">You're ready! Waiting for opponent to begin...</p>
//                       </div>
//                     ) : isParticipant && debate.status === "PENDING" ? (
//                       <div className="mt-4 text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
//                         <p className="text-yellow-800">Waiting for an opponent to join...</p>
//                       </div>
//                     ) : !currentUser ? (
//                       <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
//                         <p className="text-blue-800">Please log in to participate in debates</p>
//                       </div>
//                     ) : !isParticipant && debate.status === "LIVE" ? (
//                       <div className="mt-4 text-center text-gray-500">
//                         <p>This debate is in progress</p>
//                         <p className="text-sm mt-2">You can watch and chat in global chat</p>
//                       </div>
//                     ) : debate.status === "ENDED" || debate.status === "CANCELLED" ? (
//                       <div className="mt-4 text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
//                         <p className="text-purple-800">This debate has ended</p>
//                         <Button onClick={() => setShowResults(true)} className="mt-2" size="sm">
//                           View Results
//                         </Button>
//                       </div>
//                     ) : (
//                       <div className="mt-4 text-center text-gray-500">
//                         <p>This debate is not active</p>
//                       </div>
//                     )}
//                   </TabsContent>

//                   <TabsContent value="global" className="flex-1 flex flex-col mt-0">
//                     {/* Global Chat Messages */}
//                     <ScrollArea className="flex-1 pr-4">
//                       <div className="space-y-3">
//                         {globalMessages.length === 0 ? (
//                           <div className="text-center py-8 text-gray-500">
//                             <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
//                             <p>No global chat messages yet. Be the first to comment!</p>
//                           </div>
//                         ) : (
//                           globalMessages.map((message) => (
//                             <div key={message.id} className="flex gap-3">
//                               <Avatar className="h-8 w-8">
//                                 <AvatarFallback className="text-xs">
//                                   {message.sender.username[0].toUpperCase()}
//                                 </AvatarFallback>
//                               </Avatar>
//                               <div className="flex-1 bg-gray-50 rounded-lg p-3">
//                                 <div className="flex items-center gap-2 mb-1">
//                                   <span className="font-medium text-sm">{message.sender.username}</span>
//                                   <Badge variant="outline" className="text-xs">
//                                     {message.sender.rank}
//                                   </Badge>
//                                   <span className="text-xs text-gray-500">Level {message.sender.level}</span>
//                                   {message.is_flagged && <AlertTriangle className="h-3 w-3 text-red-500" />}
//                                 </div>
//                                 <p className="text-sm text-gray-700">{message.content}</p>
//                                 <span className="text-xs text-gray-500">
//                                   {new Date(message.created_at).toLocaleTimeString()}
//                                 </span>
//                               </div>
//                             </div>
//                           ))
//                         )}
//                         <div ref={globalMessagesEndRef} />
//                       </div>
//                     </ScrollArea>

//                     {/* Global Chat Input */}
//                     {currentUser ? (
//                       <form onSubmit={handleSendGlobalMessage} className="flex gap-2 mt-4">
//                         <Input
//                           value={newGlobalMessage}
//                           onChange={(e) => setNewGlobalMessage(e.target.value)}
//                           placeholder="Share your thoughts on this debate..."
//                         />
//                         <Button type="submit" disabled={!newGlobalMessage.trim()}>
//                           <Send className="h-4 w-4" />
//                         </Button>
//                       </form>
//                     ) : (
//                       <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
//                         <p className="text-blue-800">Please log in to participate in global chat</p>
//                       </div>
//                     )}
//                   </TabsContent>
//                 </Tabs>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             {/* Participants */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Users className="h-5 w-5" />
//                   Participants
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   {debate.participants.map((participant) => (
//                     <div key={participant.id} className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <div className="relative">
//                           <Avatar className="h-8 w-8">
//                             <AvatarFallback>{participant.user.username[0].toUpperCase()}</AvatarFallback>
//                           </Avatar>
//                           <div
//                             className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${participant.user.is_online ? "bg-green-500" : "bg-gray-400"
//                               }`}
//                           />
//                         </div>
//                         <div>
//                           <p className="font-medium text-sm flex items-center gap-1">
//                             {participant.user.username}
//                             {debate.winner && participant.user.id === debate.winner.id && (
//                               <Trophy className="h-3 w-3 text-yellow-500" />
//                             )}
//                           </p>
//                           <p className="text-xs text-gray-500">{participant.user.rank}</p>
//                         </div>
//                       </div>
//                       <div className="flex flex-col items-end gap-1">
//                         <Badge variant="outline" className="text-xs">
//                           {participant.position}
//                         </Badge>
//                         {debate.status === "READY" && (
//                           <Badge variant={participant.is_ready ? "default" : "secondary"} className="text-xs">
//                             {participant.is_ready ? "Ready" : "Not Ready"}
//                           </Badge>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                   {debate.participants.length < 2 && (
//                     <div className="text-center py-4 text-gray-500">
//                       <p className="text-sm">Waiting for opponent...</p>
//                       {!isParticipant && currentUser && (
//                         <Button onClick={handleJoinDebate} className="mt-2" size="sm" disabled={isJoining}>
//                           {isJoining ? "Joining..." : "Join as Opponent"}
//                         </Button>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>

//             {/* AI Insights */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Brain className="h-5 w-5" />
//                   AI Insights
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   <div>
//                     <p className="text-sm font-medium mb-1">Debate Quality</p>
//                     <Progress value={aiInsights.debateQuality} className="h-2" />
//                     <p className="text-xs text-gray-500 mt-1">{aiInsights.recentFeedback}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium mb-1">Engagement Level</p>
//                     <Progress value={aiInsights.engagementLevel} className="h-2" />
//                     <p className="text-xs text-gray-500 mt-1">Good topic relevance</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium mb-1">Respectfulness</p>
//                     <Progress value={aiInsights.respectfulness} className="h-2" />
//                     <p className="text-xs text-gray-500 mt-1">Maintaining civil discourse</p>
//                   </div>
//                   {debate?.status === "LIVE" && (
//                     <div className="pt-2 border-t">
//                       <div className="flex items-center gap-1 text-xs text-green-600">
//                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                         <span>Live AI Analysis</span>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Debate Info */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Debate Info</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-2 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Creator:</span>
//                     <span>{debate.creator.username}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Mode:</span>
//                     <span className="capitalize">{debate.mode.toLowerCase()}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Duration:</span>
//                     <span>{debate.duration_minutes} minutes</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Created:</span>
//                     <span>{new Date(debate.created_at).toLocaleDateString()}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Viewers:</span>
//                     <span>{globalMessages.length > 0 ? `${globalMessages.length} active` : "0"}</span>
//                   </div>
//                   {(debate.status === "ENDED" || debate.status === "CANCELLED") && (
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Status:</span>
//                       <Badge className={getStatusColor(debate.status)} variant="outline">
//                         {debate.status}
//                       </Badge>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/use-websocket"
import {
  Send,
  Users,
  Clock,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  MessageSquare,
  Eye,
  Trophy,
  LogOut,
} from "lucide-react"
import { DebateResults } from "@/components/debate-results"

interface DebateMessage {
  id: string
  content: string
  sender: {
    id: string
    username: string
    avatar_url?: string
  }
  role: "AFFIRMATIVE" | "NEGATIVE"
  created_at: string
  is_flagged: boolean
  ai_analysis?: {
    score: number
    feedback: string
    flagged: boolean
    strengths: string[]
    areas_to_improve: string[]
  }
}

interface GlobalMessage {
  id: string
  content: string
  sender: {
    id: string
    username: string
    level: number
    rank: string
    avatar_url?: string
  }
  created_at: string
  is_flagged: boolean
}

interface Participant {
  id: string
  role: "AFFIRMATIVE" | "NEGATIVE"
  position: string
  is_ready: boolean
  user: {
    id: string
    username: string
    level: number
    rank: string
    is_online: boolean
    avatar_url?: string
  }
}

interface Debate {
  id: string
  title: string
  topic: string
  mode: "TEXT" | "AUDIO"
  status: "PENDING" | "READY" | "LIVE" | "ENDED" | "CANCELLED"
  duration_minutes: number
  created_at: string
  started_at?: string
  ended_at?: string
  participants: Participant[]
  messages: DebateMessage[]
  creator: {
    id: string
    username: string
    avatar_url?: string
  }
  winner?: {
    id: string
    username: string
    level: number
    rank: string
    avatar_url?: string
  }
}

interface AIInsights {
  debateQuality: number
  engagementLevel: number
  respectfulness: number
  recentFeedback: string
}

export default function DebateRoomPage() {
  const params = useParams()
  const debateId = params.id as string
  const [debate, setDebate] = useState<Debate | null>(null)
  const [debateResults, setDebateResults] = useState<any>(null)
  const [globalMessages, setGlobalMessages] = useState<GlobalMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [newGlobalMessage, setNewGlobalMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isBeginning, setIsBeginning] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("debate")
  const [showResults, setShowResults] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsights>({
    debateQuality: 0,
    engagementLevel: 0,
    respectfulness: 0,
    recentFeedback: "Waiting for debate to begin...",
  })
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const globalMessagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { socket, isConnected } = useWebSocket()

  useEffect(() => {
    fetchCurrentUser()
    fetchDebate()
    fetchGlobalMessages()
    fetchAIInsights()
    const interval = setInterval(() => {
      fetchDebate()
      fetchGlobalMessages()
    }, 3000) // Poll for updates
    return () => clearInterval(interval)
  }, [debateId])

  useEffect(() => {
    scrollToBottom()
  }, [debate?.messages])

  useEffect(() => {
    scrollToGlobalBottom()
  }, [globalMessages])

  useEffect(() => {
    if (debate?.status === "LIVE" && debate.started_at) {
      const timer = setInterval(() => {
        const startTime = new Date(debate.started_at!).getTime()
        const endTime = startTime + debate.duration_minutes * 60 * 1000
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)

        setTimeRemaining(remaining)

        if (remaining === 0) {
          clearInterval(timer)
          fetchDebate() // Refresh to get updated status
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [debate])

  useEffect(() => {
    // Show results when debate is ended
    if (debate && (debate.status === "ENDED" || debate.status === "CANCELLED")) {
      fetchDebateResults()
    }
  }, [debate, debate?.status])

  useEffect(() => {
    // Setup real-time AI analysis via WebSocket
    if (isConnected && socket && debate?.status === "LIVE") {
      // Join debate room
      socket.emit("join_debate_room", { debateId })

      // Listen for AI analysis updates
      socket.on("ai_analysis", (data) => {
        if (data.debateId === debateId) {
          setAiInsights({
            debateQuality: data.analysis.argument_quality || aiInsights.debateQuality,
            engagementLevel: data.analysis.topic_relevance || aiInsights.engagementLevel,
            respectfulness: data.analysis.tone_score || aiInsights.respectfulness,
            recentFeedback: data.analysis.feedback || aiInsights.recentFeedback,
          })
        }
      })

      return () => {
        socket.off("ai_analysis")
        socket.emit("leave_debate_room", { debateId })
      }
    }
  }, [isConnected, socket, debate?.status, debateId])

  // Fetch AI insights when new messages arrive
  useEffect(() => {
    if (debate?.status === "LIVE" && debate.messages.length > 0) {
      fetchAIInsights()
    }
  }, [debate?.messages.length])

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

  const fetchDebate = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}`)
      if (response.ok) {
        const data = await response.json()
        setDebate(data)
      } else {
        toast({
          title: "Error",
          description: "Debate not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch debate:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDebateResults = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}/results`)
      if (response.ok) {
        const data = await response.json()
        setDebateResults(data)
        setShowResults(true)
      }
    } catch (error) {
      console.error("Failed to fetch debate results:", error)
    }
  }

  const fetchGlobalMessages = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}/global-chat`)
      if (response.ok) {
        const data = await response.json()
        setGlobalMessages(data)
      }
    } catch (error) {
      console.error("Failed to fetch global messages:", error)
    }
  }

  const fetchAIInsights = async () => {
    if (!debate || debate.status !== "LIVE" || debate.messages.length === 0) return

    setIsLoadingAI(true)
    try {
      // Get real-time AI analysis from the flow-analysis endpoint
      const response = await fetch(`/api/debates/${debateId}/flow-analysis`)
      if (response.ok) {
        const data = await response.json()
        setAiInsights({
          debateQuality: data.overall_quality || 0,
          engagementLevel: data.engagement_level || 0,
          respectfulness: data.tone_score || 90,
          recentFeedback: data.feedback || "Analysis in progress...",
        })
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error)
    } finally {
      setIsLoadingAI(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToGlobalBottom = () => {
    globalMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleJoinDebate = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to join a debate",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)

    try {
      const response = await fetch(`/api/debates/${debateId}/join`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Joined debate successfully!",
        })
        fetchDebate()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to join debate",
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
      setIsJoining(false)
    }
  }

  const handleBeginDebate = async () => {
    setIsBeginning(true)

    try {
      const response = await fetch(`/api/debates/${debateId}/begin`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message,
        })
        fetchDebate()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to begin debate",
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
      setIsBeginning(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    setIsSending(true)

    try {
      const response = await fetch(`/api/debates/${debateId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage("")
        fetchDebate()

        // Request AI coaching for the message
        try {
          const coachingResponse = await fetch("/api/ai/coaching", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              debateId,
              currentMessage: newMessage.trim(),
            }),
          })

          if (coachingResponse.ok) {
            const coachingData = await coachingResponse.json()
            // We don't need to do anything with this data as it will be
            // processed by the server and sent via WebSocket
          }
        } catch (coachingError) {
          console.error("Failed to get AI coaching:", coachingError)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newGlobalMessage.trim()) return

    try {
      const response = await fetch(`/api/debates/${debateId}/global-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newGlobalMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewGlobalMessage("")
        fetchGlobalMessages()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-green-100 text-green-800"
      case "READY":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "ENDED":
        return "bg-purple-100 text-purple-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUserParticipant = () => {
    if (!currentUser || !debate) return null
    return debate.participants.find((p) => p.user.id === currentUser.id)
  }

  const canSendMessage = () => {
    const userParticipant = getUserParticipant()
    return userParticipant && debate?.status === "LIVE"
  }

  const canBeginDebate = () => {
    const userParticipant = getUserParticipant()
    return userParticipant && debate?.status === "READY" && !userParticipant.is_ready
  }

  const handleEndDebate = async () => {
    if (!confirm("Are you sure you want to end this debate? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/debates/${debateId}/end`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Debate ended successfully",
        })
        fetchDebate()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to end debate",
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

  const handleExitDebate = async () => {
    if (!confirm("Are you sure you want to exit this debate? You will forfeit the match.")) {
      return
    }

    try {
      const response = await fetch(`/api/debates/${debateId}/exit`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Exited debate successfully",
        })
        router.push("/debates")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to exit debate",
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!debate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Debate Not Found</h2>
            <p className="text-gray-600">The debate you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show results page if debate is ended
  if (showResults && debateResults && (debate.status === "ENDED" || debate.status === "CANCELLED")) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setShowResults(false)} className="mb-4">
              ← Back to Debate Room
            </Button>
          </div>
          <DebateResults debate={debateResults} />
        </div>
      </div>
    )
  }

  const userParticipant = getUserParticipant()
  const isParticipant = !!userParticipant
  const canJoin = debate.status === "PENDING" && debate.participants.length < 2 && !isParticipant && currentUser
  const bothParticipantsOnline = debate.participants.length === 2 && debate.participants.every((p) => p.user.is_online)

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{debate.title}</h1>
              <p className="text-gray-600 mt-2">{debate.topic}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(debate.status)}>{debate.status}</Badge>
              {timeRemaining !== null && debate.status === "LIVE" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
              {(debate.status === "ENDED" || debate.status === "CANCELLED") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResults(true)}
                  className="flex items-center gap-1"
                >
                  <Trophy className="h-4 w-4" />
                  View Results
                </Button>
              )}
              {/* Add End/Exit buttons for participants */}
              {isParticipant && debate.status === "LIVE" && (
                <>
                  <Button variant="destructive" size="sm" onClick={handleEndDebate} className="flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    End Debate
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExitDebate} className="flex items-center gap-1">
                    <LogOut className="h-4 w-4" />
                    Exit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Debate Ended Banner */}
        {(debate.status === "ENDED" || debate.status === "CANCELLED") && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="text-center py-6">
              <Trophy className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {debate.status === "ENDED" ? "🎉 Debate Completed!" : "⚠️ Debate Cancelled"}
              </h2>
              {debate.winner && (
                <p className="text-lg text-gray-700 mb-4">
                  Winner: <strong>{debate.winner.username}</strong>
                </p>
              )}
              <Button onClick={() => setShowResults(true)} className="mt-2">
                <Trophy className="h-4 w-4 mr-2" />
                View Full Results
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Debate Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Debate Room</span>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="debate" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Debate
                      </TabsTrigger>
                      <TabsTrigger value="global" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Global Chat ({globalMessages.length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  {debate.mode === "TEXT" ? "Text-based debate" : "Audio debate with transcription"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsContent value="debate" className="flex-1 flex flex-col mt-0">
                    {/* Debate Messages */}
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-4">
                        {debate.messages.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No messages yet. Start the debate!</p>
                          </div>
                        ) : (
                          debate.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${message.role === "AFFIRMATIVE" ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${message.role === "AFFIRMATIVE"
                                    ? "bg-blue-100 text-blue-900"
                                    : "bg-green-100 text-green-900"
                                  }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="h-6 w-6">
                                    {message.sender.avatar_url ? (
                                      <AvatarImage
                                        src={message.sender.avatar_url || "/placeholder.svg"}
                                        alt={message.sender.username}
                                      />
                                    ) : (
                                      <AvatarFallback className="text-xs">
                                        {message.sender.username[0].toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span className="font-medium text-sm">{message.sender.username}</span>
                                  <span className="text-xs opacity-70">
                                    {message.role === "AFFIRMATIVE" ? "For" : "Against"}
                                  </span>
                                  {message.is_flagged && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                </div>
                                <p className="text-sm">{message.content}</p>
                                {message.ai_analysis && (
                                  <div className="mt-2 pt-2 border-t border-current/20">
                                    <div className="flex items-center gap-2 text-xs">
                                      <Brain className="h-3 w-3" />
                                      <span>AI Score: {message.ai_analysis.score}/100</span>
                                      {message.ai_analysis.flagged ? (
                                        <XCircle className="h-3 w-3 text-red-500" />
                                      ) : (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      )}
                                    </div>
                                    <p className="text-xs mt-1 opacity-80">{message.ai_analysis.feedback}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Debate Message Input */}
                    {canSendMessage() ? (
                      <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your argument..."
                          disabled={isSending}
                        />
                        <Button type="submit" disabled={isSending || !newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    ) : canJoin ? (
                      <div className="mt-4">
                        <Button onClick={handleJoinDebate} className="w-full" disabled={isJoining}>
                          {isJoining ? "Joining..." : "Join Debate"}
                        </Button>
                      </div>
                    ) : canBeginDebate() ? (
                      <div className="mt-4">
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Both participants are ready! Click begin to start the debate.
                          </p>
                          {!bothParticipantsOnline && (
                            <p className="text-xs text-orange-600">⚠️ Waiting for both participants to be online</p>
                          )}
                        </div>
                        <Button
                          onClick={handleBeginDebate}
                          className="w-full"
                          disabled={isBeginning || !bothParticipantsOnline}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {isBeginning ? "Starting..." : "Begin Debate"}
                        </Button>
                      </div>
                    ) : isParticipant && debate.status === "READY" && userParticipant?.is_ready ? (
                      <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800">You're ready! Waiting for opponent to begin...</p>
                      </div>
                    ) : isParticipant && debate.status === "PENDING" ? (
                      <div className="mt-4 text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-yellow-800">Waiting for an opponent to join...</p>
                      </div>
                    ) : !currentUser ? (
                      <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800">Please log in to participate in debates</p>
                      </div>
                    ) : !isParticipant && debate.status === "LIVE" ? (
                      <div className="mt-4 text-center text-gray-500">
                        <p>This debate is in progress</p>
                        <p className="text-sm mt-2">You can watch and chat in global chat</p>
                      </div>
                    ) : debate.status === "ENDED" || debate.status === "CANCELLED" ? (
                      <div className="mt-4 text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-purple-800">This debate has ended</p>
                        <Button onClick={() => setShowResults(true)} className="mt-2" size="sm">
                          View Results
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 text-center text-gray-500">
                        <p>This debate is not active</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="global" className="flex-1 flex flex-col mt-0">
                    {/* Global Chat Messages */}
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-3">
                        {globalMessages.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No global chat messages yet. Be the first to comment!</p>
                          </div>
                        ) : (
                          globalMessages.map((message) => (
                            <div key={message.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                {message.sender.avatar_url ? (
                                  <AvatarImage
                                    src={message.sender.avatar_url || "/placeholder.svg"}
                                    alt={message.sender.username}
                                  />
                                ) : (
                                  <AvatarFallback className="text-xs">
                                    {message.sender.username[0].toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{message.sender.username}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {message.sender.rank}
                                  </Badge>
                                  <span className="text-xs text-gray-500">Level {message.sender.level}</span>
                                  {message.is_flagged && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                </div>
                                <p className="text-sm text-gray-700">{message.content}</p>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={globalMessagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Global Chat Input */}
                    {currentUser ? (
                      <form onSubmit={handleSendGlobalMessage} className="flex gap-2 mt-4">
                        <Input
                          value={newGlobalMessage}
                          onChange={(e) => setNewGlobalMessage(e.target.value)}
                          placeholder="Share your thoughts on this debate..."
                        />
                        <Button type="submit" disabled={!newGlobalMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    ) : (
                      <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800">Please log in to participate in global chat</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {debate.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            {participant.user.avatar_url ? (
                              <AvatarImage
                                src={participant.user.avatar_url || "/placeholder.svg"}
                                alt={participant.user.username}
                              />
                            ) : (
                              <AvatarFallback>{participant.user.username[0].toUpperCase()}</AvatarFallback>
                            )}
                          </Avatar>
                          <div
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${participant.user.is_online ? "bg-green-500" : "bg-gray-400"
                              }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm flex items-center gap-1">
                            {participant.user.username}
                            {debate.winner && participant.user.id === debate.winner.id && (
                              <Trophy className="h-3 w-3 text-yellow-500" />
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{participant.user.rank}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs">
                          {participant.position}
                        </Badge>
                        {debate.status === "READY" && (
                          <Badge variant={participant.is_ready ? "default" : "secondary"} className="text-xs">
                            {participant.is_ready ? "Ready" : "Not Ready"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {debate.participants.length < 2 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Waiting for opponent...</p>
                      {!isParticipant && currentUser && (
                        <Button onClick={handleJoinDebate} className="mt-2" size="sm" disabled={isJoining}>
                          {isJoining ? "Joining..." : "Join as Opponent"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Debate Quality</p>
                    <Progress value={aiInsights.debateQuality} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{aiInsights.recentFeedback}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Engagement Level</p>
                    <Progress value={aiInsights.engagementLevel} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Topic relevance and participation</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Respectfulness</p>
                    <Progress value={aiInsights.respectfulness} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Maintaining civil discourse</p>
                  </div>
                  {debate?.status === "LIVE" && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live AI Analysis</span>
                      </div>
                      {isLoadingAI && <div className="text-xs text-gray-500 mt-1">Updating analysis...</div>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Debate Info */}
            <Card>
              <CardHeader>
                <CardTitle>Debate Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creator:</span>
                    <span>{debate.creator.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode:</span>
                    <span className="capitalize">{debate.mode.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span>{debate.duration_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(debate.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Viewers:</span>
                    <span>{globalMessages.length > 0 ? `${globalMessages.length} active` : "0"}</span>
                  </div>
                  {(debate.status === "ENDED" || debate.status === "CANCELLED") && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(debate.status)} variant="outline">
                        {debate.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
