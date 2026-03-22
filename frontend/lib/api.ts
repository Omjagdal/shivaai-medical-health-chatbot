const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export interface ChatMessage {
  id: string
  type: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isTyping?: boolean
}

export interface ReportAnalysis {
  filename: string
  status: string
  analysis: string
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

// API functions for SHIVAAI backend integration
export const api = {
  // Upload medical report
  uploadReport: async (file: File): Promise<ReportAnalysis> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/upload-report/`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload report")
    }

    return response.json()
  },

  // Ask medical question
  askQuestion: async (question: string): Promise<QuestionResponse> => {
    const formData = new FormData()
    formData.append("question", question)

    const response = await fetch(`${API_BASE_URL}/ask-question/`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to ask question")
    }

    return response.json()
  },

  // Simplify medical term
  simplifyTerm: async (term: string): Promise<TermSimplification> => {
    const formData = new FormData()
    formData.append("term", term)

    const response = await fetch(`${API_BASE_URL}/simplify-term/`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to simplify term")
    }

    return response.json()
  },

  // WebSocket connection for real-time chat
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
