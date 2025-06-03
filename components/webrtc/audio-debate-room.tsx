"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react"
import { useWebSocket } from "@/hooks/use-websocket"

interface AudioDebateRoomProps {
  debateId: string
  participants: any[]
  currentUser: any
}

export function AudioDebateRoom({ debateId, participants, currentUser }: AudioDebateRoomProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcripts, setTranscripts] = useState<any[]>([])

  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const { socket, isConnected: socketConnected } = useWebSocket()

  useEffect(() => {
    if (socketConnected && socket) {
      setupWebRTC()
      setupSocketListeners()
    }

    return () => {
      cleanup()
    }
  }, [socketConnected, socket])

  const setupWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      localStreamRef.current = stream

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      peerConnectionRef.current = peerConnection

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0]
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          const opponent = participants.find((p) => p.user.id !== currentUser.id)
          if (opponent) {
            socket.emit("webrtc_ice_candidate", {
              debateId,
              targetUserId: opponent.user.id,
              candidate: event.candidate,
            })
          }
        }
      }

      // Setup media recorder for transcription
      setupMediaRecorder(stream)

      setIsConnected(true)
    } catch (error) {
      console.error("Error setting up WebRTC:", error)
    }
  }

  const setupSocketListeners = () => {
    if (!socket) return

    socket.on("webrtc_offer", async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(data.offer)
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)

        socket.emit("webrtc_answer", {
          debateId,
          targetUserId: data.fromUserId,
          answer,
        })
      }
    })

    socket.on("webrtc_answer", async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(data.answer)
      }
    })

    socket.on("webrtc_ice_candidate", async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate)
      }
    })

    socket.on("audio_transcription", (data) => {
      setTranscripts((prev) => [...prev, data])
    })
  }

  const setupMediaRecorder = (stream: MediaStream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder

      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
        await sendAudioForTranscription(audioBlob)
        audioChunks.length = 0
      }
    } catch (error) {
      console.error("Error setting up media recorder:", error)
    }
  }

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("debateId", debateId)

      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setTranscripts((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: result.transcript,
            speaker: currentUser.username,
            timestamp: new Date(),
            aiScore: result.aiScore,
          },
        ])
      }
    } catch (error) {
      console.error("Error sending audio for transcription:", error)
    }
  }

  const startCall = async () => {
    if (peerConnectionRef.current && socket) {
      const opponent = participants.find((p) => p.user.id !== currentUser.id)
      if (opponent) {
        const offer = await peerConnectionRef.current.createOffer()
        await peerConnectionRef.current.setLocalDescription(offer)

        socket.emit("webrtc_offer", {
          debateId,
          targetUserId: opponent.user.id,
          offer,
        })
      }
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
      mediaRecorderRef.current.start()
      setIsRecording(true)

      // Stop recording after 30 seconds
      setTimeout(() => {
        stopRecording()
      }, 30000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const endCall = () => {
    cleanup()
    setIsConnected(false)
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Audio Controls */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Audio Debate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio Elements */}
            <div className="hidden">
              <audio ref={localAudioRef} autoPlay muted />
              <audio ref={remoteAudioRef} autoPlay />
            </div>

            {/* Connection Status */}
            <div className="text-center">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Connecting..."}
              </Badge>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button onClick={toggleMute} variant={isMuted ? "destructive" : "outline"} size="lg">
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                disabled={!isConnected}
              >
                {isRecording ? "Stop Speaking" : "Start Speaking"}
              </Button>

              {participants.length < 2 ? (
                <Button onClick={startCall} size="lg" disabled={!isConnected}>
                  <Phone className="h-5 w-5 mr-2" />
                  Start Call
                </Button>
              ) : (
                <Button onClick={endCall} variant="destructive" size="lg">
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Call
                </Button>
              )}
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 text-red-600">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <span>Recording...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transcripts */}
      <div>
        <Card className="h-[500px]">
          <CardHeader>
            <CardTitle>Live Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {transcripts.map((transcript) => (
                  <div key={transcript.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{transcript.speaker}</span>
                      {transcript.aiScore && (
                        <Badge variant="outline" className="text-xs">
                          AI: {transcript.aiScore}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{transcript.text}</p>
                    <span className="text-xs text-gray-500">{new Date(transcript.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}

                {transcripts.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start speaking to see live transcription</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
