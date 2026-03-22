import { ChatInterface } from "@/components/chat-interface"

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-medical-blue/5 to-medical-purple/5 p-4">
      <div className="container mx-auto h-screen flex flex-col py-4">
        <ChatInterface />
      </div>
    </main>
  )
}
