"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const { onMessage, onError, onOpen, onClose, reconnectAttempts = 3, reconnectInterval = 3000 } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectCountRef.current = 0
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      ws.onerror = (error) => {
        setError("WebSocket connection error")
        setIsConnecting(false)
        onError?.(error)
      }

      ws.onclose = () => {
        setIsConnected(false)
        setIsConnecting(false)
        onClose?.()

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else {
          setError("Failed to connect after multiple attempts")
        }
      }
    } catch (error) {
      setIsConnecting(false)
      setError("Failed to create WebSocket connection")
    }
  }, [url, onMessage, onError, onOpen, onClose, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    reconnectCountRef.current = 0
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === "string" ? message : JSON.stringify(message))
      return true
    }
    return false
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
  }
}
