"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Bot, User, Loader2, Wifi, WifiOff, RefreshCw, Zap, AlertCircle, CheckCircle, Activity } from "lucide-react"
import { useWebSocket } from "@/hooks/use-websocket"
import type { ChatMessage } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const WS_URL = API_BASE_URL.replace("http", "ws") + "/ws/disease_info"

export function RealTimeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content: "Real-time connection established! Ask me any medical question and get instant responses.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { isConnected, isConnecting, error, connect, disconnect, sendMessage } = useWebSocket(WS_URL, {
    onMessage: (data) => {
      setIsWaitingForResponse(false)

      // Remove typing indicator
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"))

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.llm_answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Add retrieved documents if available
      if (data.retrieved_docs && data.retrieved_docs.length > 0) {
        const docsMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: "system",
          content: `Related medical information found:\n\n${data.retrieved_docs
            .map((doc: any) => `**${doc.disease}**: ${doc.info.substring(0, 200)}...`)
            .join("\n\n")}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, docsMessage])
      }
    },
    onError: (error) => {
      console.error("WebSocket error:", error)
      setIsWaitingForResponse(false)
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"))
    },
    onOpen: () => {
      console.log("WebSocket connected")
    },
    onClose: () => {
      console.log("WebSocket disconnected")
      setIsWaitingForResponse(false)
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"))
    },
  })

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!input.trim() || !isConnected || isWaitingForResponse) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Send message via WebSocket
    const success = sendMessage(input.trim())

    if (success) {
      setInput("")
      setIsWaitingForResponse(true)

      // Add typing indicator
      const typingMessage: ChatMessage = {
        id: "typing",
        type: "assistant",
        content: "Processing your question in real-time...",
        timestamp: new Date(),
        isTyping: true,
      }
      setMessages((prev) => [...prev, typingMessage])
    } else {
      // Remove the user message if sending failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />")
  }

  const getConnectionStatus = () => {
    if (isConnecting) {
      return { icon: RefreshCw, text: "Connecting...", color: "text-yellow-500", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" }
    }
    if (isConnected) {
      return { icon: Wifi, text: "Connected", color: "text-medical-green", bgColor: "bg-medical-green/10", borderColor: "border-medical-green/30" }
    }
    return { icon: WifiOff, text: "Disconnected", color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/30" }
  }

  const status = getConnectionStatus()
  const StatusIcon = status.icon

  return (
    <div className="space-y-4">
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
          }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes typing-dots {
          0%, 20% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease infinite;
        }
        
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        
        .animate-typing-dot-1 {
          animation: typing-dots 1.4s infinite;
          animation-delay: 0s;
        }
        
        .animate-typing-dot-2 {
          animation: typing-dots 1.4s infinite;
          animation-delay: 0.2s;
        }
        
        .animate-typing-dot-3 {
          animation: typing-dots 1.4s infinite;
          animation-delay: 0.4s;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -6px rgba(0, 0, 0, 0.1);
        }
        
        .button-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .button-hover:hover {
          transform: translateY(-2px) scale(1.02);
        }
        
        .button-hover:active {
          transform: translateY(0) scale(0.98);
        }
        
        .message-appear {
          animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .connection-indicator {
          position: relative;
        }
        
        .connection-indicator::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: inherit;
          opacity: 0.3;
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Connection Status Card with Enhanced Animation */}
      <Card className="border-medical-purple/20 bg-gradient-to-r from-medical-purple/10 via-medical-purple/5 to-transparent animate-gradient hover-lift overflow-hidden relative animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className={`p-3 rounded-xl bg-gradient-to-br from-medical-purple/30 to-medical-purple/10 animate-pulse-glow relative`}>
                <Zap className="h-6 w-6 text-medical-purple animate-bounce-gentle" />
                <div className="absolute -top-1 -right-1">
                  <Activity className="h-4 w-4 text-medical-green animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg bg-gradient-to-r from-medical-purple to-medical-blue bg-clip-text text-transparent">
                  Real-Time Medical Chat
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`connection-indicator p-1 rounded-full ${status.bgColor}`}>
                    <StatusIcon className={`h-4 w-4 ${status.color} ${isConnecting ? "animate-spin" : isConnected ? "animate-pulse" : ""}`} />
                  </div>
                  <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                  {isConnected && (
                    <Badge variant="secondary" className="bg-medical-green/10 text-medical-green border-medical-green/20 animate-scale-in">
                      <span className="inline-block w-2 h-2 rounded-full bg-medical-green mr-1 animate-pulse" />
                      Live
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 self-end sm:self-auto">
              {!isConnected && !isConnecting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connect}
                  className="text-medical-purple border-medical-purple/30 hover:bg-medical-purple/10 bg-transparent button-hover group"
                >
                  <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  Reconnect
                </Button>
              )}
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="text-muted-foreground hover:text-destructive bg-transparent button-hover"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert with Animation */}
      {error && (
        <Alert variant="destructive" className="animate-slide-up border-destructive/50 bg-destructive/5">
          <AlertCircle className="h-4 w-4 animate-bounce-gentle" />
          <AlertDescription className="font-medium">{error}. Please check your connection and try again.</AlertDescription>
        </Alert>
      )}

      {/* Chat Interface with Enhanced Design */}
      <Card className="flex flex-col h-[calc(100dvh-20rem)] sm:h-[600px] min-h-[300px] hover-lift overflow-hidden relative border-medical-purple/20 animate-scale-in">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute w-full h-full bg-gradient-to-br from-medical-purple/20 via-transparent to-medical-blue/20 animate-gradient" />
        </div>

        <CardHeader className="pb-4 border-b border-medical-purple/10 bg-gradient-to-r from-medical-purple/5 to-transparent relative z-10">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-medical-blue/20 to-medical-purple/20 animate-pulse-glow">
              <Bot className="h-6 w-6 text-medical-blue" />
            </div>
            <span className="bg-gradient-to-r from-medical-blue to-medical-purple bg-clip-text text-transparent text-xl">
              Real-Time Medical Assistant
            </span>
            {isConnected && (
              <Badge variant="secondary" className="bg-gradient-to-r from-medical-green/20 to-medical-green/10 text-medical-green border-medical-green/30 animate-scale-in">
                <CheckCircle className="h-3 w-3 mr-1 animate-pulse" />
                Live Connection
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <ScrollArea className="flex-1 px-4 relative z-10" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 message-appear ${message.type === "user" ? "justify-end" : "justify-start"}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {message.type !== "user" && (
                  <Avatar className="h-10 w-10 mt-1 hover-lift border-2 border-white shadow-lg">
                    <AvatarFallback
                      className={`
                      ${message.type === "assistant" 
                        ? "bg-gradient-to-br from-medical-blue/20 to-medical-purple/20 text-medical-blue" 
                        : "bg-medical-gray/10 text-muted-foreground"
                      }
                      transition-all duration-300
                    `}
                    >
                      {message.type === "assistant" ? <Bot className="h-5 w-5" /> : "S"}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`
                  max-w-[90%] sm:max-w-[80%] rounded-xl px-3 sm:px-5 py-3 text-sm transition-all duration-300 relative overflow-hidden break-words
                  ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-medical-purple to-medical-purple/90 text-white ml-auto shadow-lg hover:shadow-xl"
                      : message.type === "system"
                        ? "bg-gradient-to-r from-medical-gray/10 to-medical-gray/5 text-foreground border-2 border-medical-blue/20 hover:border-medical-blue/40 shadow-sm hover:shadow-md"
                        : "bg-white text-card-foreground border-2 border-medical-purple/20 hover:border-medical-purple/40 shadow-md hover:shadow-lg"
                  }
                  ${message.isTyping ? "animate-pulse-glow" : "hover-lift"}
                `}
                >
                  {message.type !== "user" && !message.isTyping && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-medical-blue via-medical-purple to-medical-green animate-gradient" />
                  )}
                  
                  {message.isTyping ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-medical-purple" />
                      <span className="text-medical-purple font-medium">{message.content}</span>
                      <div className="flex gap-1 ml-2">
                        <span className="w-2 h-2 rounded-full bg-medical-purple animate-typing-dot-1" />
                        <span className="w-2 h-2 rounded-full bg-medical-purple animate-typing-dot-2" />
                        <span className="w-2 h-2 rounded-full bg-medical-purple animate-typing-dot-3" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: formatMessageContent(message.content),
                      }}
                    />
                  )}
                  <div
                    className={`
                    text-xs mt-2 opacity-70 font-medium flex items-center gap-1
                    ${message.type === "user" ? "text-white/80" : "text-muted-foreground"}
                  `}
                  >
                    <Activity className="h-3 w-3" />
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {message.type === "user" && (
                  <Avatar className="h-10 w-10 mt-1 hover-lift border-2 border-white shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-medical-purple/20 to-medical-blue/20 text-medical-purple transition-all duration-300">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area with Enhanced Styling */}
        <div className="border-t-2 border-medical-purple/10 p-4 bg-gradient-to-r from-medical-purple/5 via-transparent to-medical-blue/5 relative z-10">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isConnected ? "Ask a medical question for instant response..." : "Connect to start chatting..."
                }
                disabled={!isConnected || isWaitingForResponse}
                className="focus:ring-2 focus:ring-medical-purple/50 border-2 border-medical-purple/20 bg-white/80 backdrop-blur-sm transition-all duration-300 pl-4 pr-12 py-6 text-base"
              />
              {isConnected && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Zap className="h-5 w-5 text-medical-purple animate-pulse" />
                </div>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || !isConnected || isWaitingForResponse}
              className="bg-gradient-to-r from-medical-purple to-medical-blue hover:from-medical-purple/90 hover:to-medical-blue/90 text-white shadow-lg hover:shadow-xl button-hover group px-4 sm:px-6 py-6 shrink-0"
            >
              {isWaitingForResponse ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-medical-purple animate-pulse" />
              <p className="text-xs text-muted-foreground font-medium">
                Real-time responses powered by WebSocket technology
              </p>
            </div>
            {isConnected && (
              <Badge variant="secondary" className="bg-medical-green/10 text-medical-green text-xs animate-scale-in">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Active
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}