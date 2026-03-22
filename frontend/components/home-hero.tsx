"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bot, FileText, MessageSquare, Stethoscope, Upload, Zap, Shield, Clock, Users, Sparkles, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export function HomeHero() {
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-medical-blue/5 to-medical-purple/5 relative overflow-hidden">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2);
          }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
        
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
        }
        
        .button-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .button-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3), 0 8px 10px -6px rgba(59, 130, 246, 0.2);
        }
        
        .button-hover:active {
          transform: translateY(0px);
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #10b981);
          background-size: 200% 200%;
          animation: gradient-shift 5s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .hover-glow {
          transition: all 0.3s ease;
        }
        
        .hover-glow:hover {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
      `}</style>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-medical-blue/10 rounded-full blur-3xl animate-float"
          style={{ 
            top: '10%', 
            left: '5%',
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-medical-purple/10 rounded-full blur-3xl animate-float-slow"
          style={{ 
            top: '50%', 
            right: '10%',
            animationDelay: '2s',
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-medical-green/10 rounded-full blur-3xl animate-float"
          style={{ 
            bottom: '10%', 
            left: '40%',
            animationDelay: '4s',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * -0.01}px)`
          }}
        />
      </div>

      {/* Header */}
      <header 
        className="border-b border-medical-blue/20 bg-background/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300"
        style={{
          boxShadow: scrollY > 10 ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-medical-blue to-medical-purple rounded-lg flex items-center justify-center animate-pulse-glow">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">SHIVAAI</h1>
              <p className="text-sm text-muted-foreground">Medical AI Assistant</p>
            </div>
          </div>
          <Link href="/chat">
            <Button className="bg-medical-blue hover:bg-medical-blue/90 button-hover">
              Start Chat <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="animate-bounce-in">
          <Badge variant="secondary" className="mb-6 bg-medical-blue/10 text-medical-blue border-medical-blue/20 hover:bg-medical-blue/20 transition-all duration-300 cursor-default">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Advanced AI & RAG Technology
          </Badge>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-balance mb-6 animate-slide-up">
          <span className="text-gradient">Your Intelligent</span>
          <br />
          <span className="text-gradient">Medical Assistant</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground text-balance mb-10 max-w-3xl mx-auto animate-slide-up stagger-1">
          SHIVAAI combines cutting-edge AI with medical expertise to provide instant answers, analyze reports, and
          simplify complex medical terminology for better healthcare understanding.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-2">
          <Link href="/chat">
            <Button size="lg" className="bg-gradient-to-r from-medical-blue to-medical-purple hover:from-medical-blue/90 hover:to-medical-purple/90 text-white button-hover group">
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Medical Chat
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-medical-blue/20 hover:bg-medical-blue/5 bg-transparent button-hover">
            <FileText className="w-5 h-5 mr-2" />
            Learn More
          </Button>
        </div>

        {/* Floating Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-16 animate-fade-in stagger-3">
          <div className="text-center card-hover p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-medical-blue/10">
            <div className="text-3xl font-bold text-medical-blue">24/7</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center card-hover p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-medical-purple/10">
            <div className="text-3xl font-bold text-medical-purple">1000+</div>
            <div className="text-sm text-muted-foreground">Diseases</div>
          </div>
          <div className="text-center card-hover p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-medical-green/10">
            <div className="text-3xl font-bold text-medical-green">AI</div>
            <div className="text-sm text-muted-foreground">Powered</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <Badge variant="outline" className="mb-4 border-medical-blue/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            Comprehensive Medical AI Features
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Four powerful tools designed to enhance your medical knowledge and healthcare experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-medical-blue/20 hover:border-medical-blue/40 card-hover hover-glow group overflow-hidden relative animate-scale-in stagger-1">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-medical-blue/20 to-medical-blue/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Bot className="w-7 h-7 text-medical-blue" />
              </div>
              <CardTitle className="text-medical-blue flex items-center gap-2">
                AI Medical Chat
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Get instant answers to medical questions using advanced RAG technology and comprehensive medical
                databases.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-blue" />
                  Evidence-based responses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-blue" />
                  Disease information lookup
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-blue" />
                  Symptom analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-blue" />
                  Treatment guidance
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-medical-purple/20 hover:border-medical-purple/40 card-hover hover-glow group overflow-hidden relative animate-scale-in stagger-2">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-medical-purple/20 to-medical-purple/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-7 h-7 text-medical-purple" />
              </div>
              <CardTitle className="text-medical-purple flex items-center gap-2">
                Report Analysis
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Upload medical reports, lab results, or images for AI-powered analysis and interpretation.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-purple" />
                  PDF & image support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-purple" />
                  Lab result interpretation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-purple" />
                  Medical imaging analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-purple" />
                  Detailed explanations
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-medical-green/20 hover:border-medical-green/40 card-hover hover-glow group overflow-hidden relative animate-scale-in stagger-3">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-medical-green/20 to-medical-green/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-7 h-7 text-medical-green" />
              </div>
              <CardTitle className="text-medical-green flex items-center gap-2">
                Term Simplifier
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Convert complex medical terminology into easy-to-understand language for better comprehension.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-green" />
                  Plain language explanations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-green" />
                  Medical jargon breakdown
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-green" />
                  Context-aware definitions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-green" />
                  Educational insights
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-medical-accent/20 hover:border-medical-accent/40 card-hover hover-glow group overflow-hidden relative animate-scale-in stagger-4">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-medical-accent/20 to-medical-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-7 h-7 text-medical-accent" />
              </div>
              <CardTitle className="text-medical-accent flex items-center gap-2">
                Real-Time Chat
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Experience instant medical consultations with WebSocket-powered real-time communication.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  Instant responses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  Live disease queries
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  WebSocket technology
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  Seamless interaction
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-medical-blue/5 via-medical-purple/5 to-medical-green/5 rounded-3xl p-12 backdrop-blur-sm border border-white/20 animate-fade-in">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-medical-blue/20">
              <Shield className="w-3 h-3 mr-1" />
              Why Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Why Choose SHIVAAI?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with healthcare professionals and patients in mind
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group animate-slide-up stagger-1">
              <div className="w-20 h-20 bg-gradient-to-br from-medical-blue/20 to-medical-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 animate-pulse-glow">
                <Shield className="w-10 h-10 text-medical-blue" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gradient">Trusted & Secure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built with medical-grade security standards and evidence-based medical knowledge for reliable healthcare
                information.
              </p>
            </div>

            <div className="text-center group animate-slide-up stagger-2">
              <div className="w-20 h-20 bg-gradient-to-br from-medical-purple/20 to-medical-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 animate-pulse-glow" style={{ animationDelay: '1s' }}>
                <Clock className="w-10 h-10 text-medical-purple" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gradient">24/7 Availability</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access medical information and assistance anytime, anywhere with our always-available AI assistant.
              </p>
            </div>

            <div className="text-center group animate-slide-up stagger-3">
              <div className="w-20 h-20 bg-gradient-to-br from-medical-green/20 to-medical-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 animate-pulse-glow" style={{ animationDelay: '2s' }}>
                <Users className="w-10 h-10 text-medical-green" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gradient">User-Friendly</h3>
              <p className="text-muted-foreground leading-relaxed">
                Designed for both healthcare professionals and patients with intuitive interfaces and clear explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-medical-blue/10 via-medical-purple/10 to-medical-green/10 rounded-3xl p-12 backdrop-blur-sm border border-white/20 animate-scale-in relative overflow-hidden">
          <div className="absolute inset-0 shimmer opacity-20" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient relative z-10">
            Ready to Experience Intelligent Healthcare?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 relative z-10 max-w-2xl mx-auto">
            Join thousands of users who trust SHIVAAI for their medical information needs. Start your conversation with
            our AI medical assistant today.
          </p>
          <Link href="/chat">
            <Button
              size="lg"
              className="bg-gradient-to-r from-medical-blue via-medical-purple to-medical-green hover:from-medical-blue/90 hover:via-medical-purple/90 hover:to-medical-green/90 text-white button-hover group relative z-10 text-lg px-8 py-6"
            >
              <MessageSquare className="w-6 h-6 mr-2" />
              Start Your Medical Chat Now
              <ArrowRight className="w-6 h-6 ml-2 transition-transform group-hover:translate-x-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-medical-blue/20 bg-background/95 backdrop-blur-md mt-20">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 bg-gradient-to-br from-medical-blue to-medical-purple rounded-xl flex items-center justify-center animate-pulse-glow">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg text-gradient">SHIVAAI Medical AI</p>
                <p className="text-sm text-muted-foreground">Intelligent Healthcare Assistant</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              © 2024 SHIVAAI. Built with 
              <span className="text-medical-blue font-semibold">FastAPI</span> & 
              <span className="text-medical-purple font-semibold">Next.js</span> for better healthcare.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}