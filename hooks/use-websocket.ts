"use client"

import { useEffect, useState, useRef } from "react"
import { io, type Socket } from "socket.io-client"

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Get auth token from cookie
    const getAuthToken = () => {
      const cookies = document.cookie.split(";")
      const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("access_token="))
      return tokenCookie ? tokenCookie.split("=")[1] : null
    }

    const token = getAuthToken()

    if (token) {
      const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001", {
        auth: {
          token,
        },
        transports: ["websocket"],
      })

      socketInstance.on("connect", () => {
        console.log("Connected to WebSocket server")
        setIsConnected(true)
      })

      socketInstance.on("disconnect", () => {
        console.log("Disconnected from WebSocket server")
        setIsConnected(false)
      })

      socketInstance.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error)
        setIsConnected(false)
      })

      socketRef.current = socketInstance
      setSocket(socketInstance)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  return { socket, isConnected }
}
