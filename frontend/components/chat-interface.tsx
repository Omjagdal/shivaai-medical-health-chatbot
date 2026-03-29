"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Bot, User, Loader2, Heart, Brain, Stethoscope, Upload, Zap, Sparkles, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { api, type ChatMessage, type ChatResponse, type SourceDocument } from "@/lib/api"
import { ReportUpload } from "./report-upload"
import { TermSimplifier } from "./term-simplifier"
import { RealTimeChat } from "./real-time-chat"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm **SHIVAAI**, your AI medical assistant powered by **Self-RAG** technology. I can help you with:\n\n• 🩺 Medical questions with evidence-based answers\n• 📄 Report analysis\n• 🔬 Medical term simplification\n\nHow can I assist you today?",
      timestamp: new Date(),
      confidence: 1.0,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const toggleSources = (messageId: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const getConfidenceBadge = (confidence: number | undefined) => {
    if (confidence === undefined) return null
    if (confidence >= 0.8) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs gap-1">
          <ShieldCheck className="h-3 w-3" />
          High Confidence
        </Badge>
      )
    }
    if (confidence >= 0.5) {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs gap-1">
          <ShieldCheck className="h-3 w-3" />
          Medium Confidence
        </Badge>
      )
    }
    return (
      <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-xs gap-1">
        <AlertTriangle className="h-3 w-3" />
        Low Confidence
      </Badge>
    )
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Add streaming placeholder
    const streamId = (Date.now() + 1).toString()
    const streamingMessage: ChatMessage = {
      id: streamId,
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages((prev) => [...prev, streamingMessage])

    try {
      // Use SSE streaming
      let fullContent = ""
      let receivedSessionId = sessionId

      await api.chatStream(
        userMessage.content,
        sessionId,
        {
          onToken: (token: string) => {
            fullContent += token
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamId
                  ? { ...msg, content: fullContent, isTyping: true }
                  : msg
              )
            )
          },
          onSession: (sid: string) => {
            receivedSessionId = sid
            setSessionId(sid)
          },
          onDone: () => {
            // Finalize the streaming message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamId
                  ? { ...msg, isTyping: false }
                  : msg
              )
            )
          },
          onError: (error: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamId
                  ? {
                      ...msg,
                      content: "I'm having trouble connecting right now. Please try again.",
                      isTyping: false,
                    }
                  : msg
              )
            )
          },
        }
      )

      // After streaming completes, make a non-streaming call to get metadata (sources, confidence)
      // Only if we got a substantial response
      if (fullContent.length > 20) {
        try {
          const metaResponse: ChatResponse = await api.chat(userMessage.content, receivedSessionId)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamId
                ? {
                    ...msg,
                    confidence: metaResponse.confidence,
                    needsReview: metaResponse.needs_professional_review,
                    sources: metaResponse.sources,
                    isTyping: false,
                  }
                : msg
            )
          )
        } catch {
          // Metadata fetch is optional; streaming response is already shown
        }
      }
    } catch (error) {
      console.error("Streaming error:", error)

      // Fallback to non-streaming
      try {
        const response: ChatResponse = await api.chat(userMessage.content, sessionId)
        if (response.session_id) setSessionId(response.session_id)

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamId
              ? {
                  ...msg,
                  content: response.answer,
                  isTyping: false,
                  confidence: response.confidence,
                  needsReview: response.needs_professional_review,
                  sources: response.sources,
                }
              : msg
          )
        )
      } catch (fallbackError) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamId
              ? {
                  ...msg,
                  content: "I'm having trouble connecting to my medical database. Please try again.",
                  isTyping: false,
                }
              : msg
          )
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto overflow-x-hidden">
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
        }
        .animate-gradient { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
        .message-appear { animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .badge-hover { transition: all 0.2s ease; }
        .badge-hover:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
      `}</style>

      {/* Header */}
      <Card className="mb-4 border-medical-blue/20 bg-gradient-to-r from-medical-blue/5 via-medical-purple/5 to-medical-green/5 animate-gradient hover-lift overflow-hidden relative">
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="flex items-center gap-3 text-medical-blue">
            <div className="p-2 rounded-full bg-medical-blue/10 animate-float">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-medical-blue to-medical-purple bg-clip-text text-transparent">
                  SHIVAAI Medical Assistant
                </h1>
                <Sparkles className="h-5 w-5 text-medical-purple animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1 flex items-center gap-2">
                Self-RAG powered • Streaming responses • Evidence-validated
                {sessionId && (
                  <Badge variant="outline" className="text-xs">
                    Session Active
                  </Badge>
                )}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 bg-gradient-to-r from-medical-blue/5 to-medical-purple/5 p-1 h-auto gap-1">
          <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 px-2 py-1.5">
            <Bot className="h-4 w-4 shrink-0" />
            <span className="truncate">AI Chat</span>
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 px-2 py-1.5">
            <Zap className="h-4 w-4 shrink-0" />
            <span className="truncate">Real-Time</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 px-2 py-1.5">
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="simplify" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 px-2 py-1.5">
            <Brain className="h-4 w-4 shrink-0" />
            <span className="truncate">Simplifier</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          {/* Quick Actions */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Badge variant="secondary" className="cursor-pointer hover:bg-medical-blue/10 transition-all duration-300 badge-hover" onClick={() => setInput("What are the symptoms of diabetes?")}>
              <Heart className="h-3 w-3 mr-1" /> Common Symptoms
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-medical-green/10 transition-all duration-300 badge-hover" onClick={() => setInput("Explain hypertension in simple terms")}>
              <Brain className="h-3 w-3 mr-1" /> Simplify Terms
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-medical-purple/10 transition-all duration-300 badge-hover" onClick={() => setInput("What should I do for a fever?")}>
              <Stethoscope className="h-3 w-3 mr-1" /> First Aid
            </Badge>
          </div>

          {/* Chat Messages */}
          <Card className="flex-1 flex flex-col min-h-0 hover-lift overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 message-appear ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {message.type !== "user" && (
                      <Avatar className="h-8 w-8 mt-1 hover-lift">
                        <AvatarFallback className={`${message.type === "assistant" ? "bg-gradient-to-br from-medical-blue/20 to-medical-purple/20 text-medical-blue" : "bg-medical-gray/10 text-muted-foreground"} transition-all duration-300`}>
                          {message.type === "assistant" ? <Bot className="h-4 w-4" /> : "S"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-[90%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-3 text-sm transition-all duration-300 break-words overflow-hidden ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-medical-blue to-medical-blue/90 text-white ml-auto shadow-md hover:shadow-lg"
                        : message.type === "system"
                          ? "bg-gradient-to-r from-medical-gray/10 to-medical-gray/5 text-foreground border border-border hover:border-medical-blue/30"
                          : "bg-white text-card-foreground border border-border shadow-sm hover:shadow-md hover:border-medical-blue/30"
                    } ${message.isTyping && !message.content ? "animate-pulse-glow" : ""}`}>

                      {/* Message Content */}
                      {message.isTyping && !message.content ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-medical-blue" />
                          <span className="text-medical-blue">Thinking...</span>
                          <span className="inline-flex gap-0.5">
                            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                          </span>
                        </div>
                      ) : message.type === "user" ? (
                        <p>{message.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-medical-blue prose-strong:text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Streaming cursor */}
                      {message.isTyping && message.content && (
                        <span className="inline-block w-2 h-4 bg-medical-blue animate-pulse ml-0.5 align-text-bottom" />
                      )}

                      {/* Metadata: Confidence + Review Warning */}
                      {message.type === "assistant" && !message.isTyping && (message.confidence !== undefined || message.needsReview) && (
                        <div className="mt-3 pt-2 border-t border-border/50 flex flex-wrap items-center gap-2">
                          {getConfidenceBadge(message.confidence)}
                          {message.needsReview && (
                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Consult a professional
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Sources Panel */}
                      {message.type === "assistant" && message.sources && message.sources.length > 0 && (
                        <div className="mt-2">
                          <button
                            className="flex items-center gap-1 text-xs text-medical-blue hover:underline"
                            onClick={() => toggleSources(message.id)}
                          >
                            {expandedSources.has(message.id) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            {message.sources.length} source(s)
                          </button>
                          {expandedSources.has(message.id) && (
                            <div className="mt-2 space-y-2">
                              {message.sources.map((source, i) => (
                                <div key={i} className="bg-medical-blue/5 rounded p-2 text-xs border border-medical-blue/10">
                                  <div className="font-medium text-medical-blue">{source.disease}</div>
                                  <p className="text-muted-foreground mt-1 line-clamp-2">{source.content}</p>
                                  <span className="text-medical-blue/60">Relevance: {(source.relevance_score * 100).toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className={`text-xs mt-2 opacity-70 ${message.type === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {message.type === "user" && (
                      <Avatar className="h-8 w-8 mt-1 hover-lift">
                        <AvatarFallback className="bg-gradient-to-br from-medical-blue/20 to-medical-purple/20 text-medical-blue transition-all duration-300">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-gradient-to-r from-medical-blue/5 to-transparent">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about symptoms, treatments, or medical terms..."
                  disabled={isLoading}
                  className="flex-1 focus:ring-medical-blue/50 border-medical-blue/20 transition-all duration-300"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-medical-blue to-medical-blue/90 hover:from-medical-blue/90 hover:to-medical-blue text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-1 px-2">
                <Shield className="h-3 w-3 shrink-0" />
                <span className="hidden sm:inline">SHIVAAI provides AI-powered medical information. Always consult healthcare professionals for medical advice.</span>
                <span className="sm:hidden">For informational purposes only. Consult a doctor.</span>
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="flex-1 mt-0">
          <div className="animate-slide-up"><RealTimeChat /></div>
        </TabsContent>

        <TabsContent value="upload" className="flex-1 mt-0">
          <div className="animate-slide-up"><ReportUpload /></div>
        </TabsContent>

        <TabsContent value="simplify" className="flex-1 mt-0">
          <div className="animate-slide-up"><TermSimplifier /></div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}