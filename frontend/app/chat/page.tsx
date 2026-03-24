import { ChatInterface } from "@/components/chat-interface"

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-medical-blue/5 to-medical-purple/5 p-2 sm:p-4 overflow-x-hidden">
      <div className="container mx-auto min-h-[calc(100dvh-2rem)] flex flex-col py-2 sm:py-4">
        <ChatInterface />
      </div>
    </main>
  )
}
