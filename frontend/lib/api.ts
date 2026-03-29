const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000"
const API_V1 = `${API_BASE_URL}/api/v1`

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ChatMessage {
  id: string
  type: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isTyping?: boolean
  confidence?: number
  needsReview?: boolean
  sources?: SourceDocument[]
}

export interface SourceDocument {
  content: string
  disease: string
  relevance_score: number
}

export interface ChatResponse {
  answer: string
  sources: SourceDocument[]
  confidence: number
  needs_professional_review: boolean
  session_id: string
  used_retrieval: boolean
}

export interface ReportAnalysis {
  filename: string
  analysis: string
}

export interface UploadDocsResponse {
  filename: string
  chunks_added: number
  message: string
}

export interface HealthResponse {
  status: string
  version: string
  vector_store_loaded: boolean
  document_count: number
  llm_available: boolean
  active_sessions: number
  uptime_seconds: number
  environment: string
}

export interface QuestionResponse {
  question: string
  llm_answer: string
  retrieved_docs: Array<{
    disease: string
    info: string
    score: number
  }>
}

export interface TermSimplification {
  term: string
  simplified: string
}

// ─────────────────────────────────────────────
// SSE Streaming Helper
// ─────────────────────────────────────────────

export interface SSECallbacks {
  onToken: (token: string) => void
  onSession: (sessionId: string) => void
  onDone: () => void
  onError: (error: string) => void
}

async function streamChat(
  message: string,
  sessionId: string | null,
  callbacks: SSECallbacks
): Promise<void> {
  const response = await fetch(`${API_V1}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      stream: true,
    }),
  })

  if (!response.ok) {
    callbacks.onError(`Server error: ${response.status}`)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError("Failed to create stream reader")
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6))
            switch (data.type) {
              case "token":
                callbacks.onToken(data.content)
                break
              case "session":
                callbacks.onSession(data.session_id)
                break
              case "done":
                callbacks.onDone()
                break
              case "error":
                callbacks.onError(data.message)
                break
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ─────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────

export const api = {
  // ── New v1 endpoints ──

  chat: async (
    message: string,
    sessionId: string | null = null
  ): Promise<ChatResponse> => {
    const response = await fetch(`${API_V1}/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        stream: false,
      }),
    })
    if (!response.ok) throw new Error("Failed to send message")
    return response.json()
  },

  chatStream: streamChat,

  uploadDocs: async (file: File): Promise<UploadDocsResponse> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_V1}/docs/upload`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) throw new Error("Failed to upload document")
    return response.json()
  },

  getHealth: async (): Promise<HealthResponse> => {
    const response = await fetch(`${API_V1}/health`)
    if (!response.ok) throw new Error("Health check failed")
    return response.json()
  },

  // ── Legacy endpoints (backward compatible) ──

  uploadReport: async (file: File): Promise<ReportAnalysis> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch(`${API_BASE_URL}/upload-report/`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) throw new Error("Failed to upload report")
    return response.json()
  },

  askQuestion: async (question: string): Promise<QuestionResponse> => {
    const formData = new FormData()
    formData.append("question", question)
    const response = await fetch(`${API_BASE_URL}/ask-question/`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) throw new Error("Failed to ask question")
    return response.json()
  },

  simplifyTerm: async (term: string): Promise<TermSimplification> => {
    const formData = new FormData()
    formData.append("term", term)
    const response = await fetch(`${API_BASE_URL}/simplify-term/`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) throw new Error("Failed to simplify term")
    return response.json()
  },

  // WebSocket (for real-time chat backward compat)
  connectWebSocket: (onMessage: (data: any) => void, onError?: (error: Event) => void) => {
    const wsUrl = API_BASE_URL.replace("http", "ws") + "/ws/disease_info"
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onMessage(data)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      onError?.(error)
    }

    return ws
  },
}
