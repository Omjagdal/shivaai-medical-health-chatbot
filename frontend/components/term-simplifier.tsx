"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Search, Loader2, BookOpen, Lightbulb, AlertCircle, CheckCircle, Copy, Trash2 } from "lucide-react"
import { api, type TermSimplification } from "@/lib/api"

interface SimplifiedTerm {
  id: string
  term: string
  simplified: string
  timestamp: Date
}

const commonMedicalTerms = [
  "Hypertension",
  "Myocardial Infarction",
  "Pneumonia",
  "Diabetes Mellitus",
  "Gastroenteritis",
  "Bronchitis",
  "Arthritis",
  "Anemia",
  "Tachycardia",
  "Bradycardia",
  "Hypoglycemia",
  "Hyperglycemia",
]

export function TermSimplifier() {
  const [inputTerm, setInputTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [simplifiedTerms, setSimplifiedTerms] = useState<SimplifiedTerm[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSimplifyTerm = async (term: string) => {
    if (!term.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response: TermSimplification = await api.simplifyTerm(term.trim())

      const newSimplifiedTerm: SimplifiedTerm = {
        id: Date.now().toString(),
        term: response.term,
        simplified: response.simplified,
        timestamp: new Date(),
      }

      setSimplifiedTerms((prev) => [newSimplifiedTerm, ...prev])
      setInputTerm("")
    } catch (error) {
      console.error("Error simplifying term:", error)
      setError("Failed to simplify the medical term. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSimplifyTerm(inputTerm)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const removeTerm = (id: string) => {
    setSimplifiedTerms((prev) => prev.filter((term) => term.id !== id))
  }

  const clearAll = () => {
    setSimplifiedTerms([])
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="border-medical-green/20 bg-medical-green/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-medical-green">
            <Brain className="h-5 w-5" />
            Medical Term Simplifier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={inputTerm}
              onChange={(e) => setInputTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a medical term to simplify..."
              disabled={isLoading}
              className="flex-1 focus:ring-medical-green/50"
            />
            <Button
              onClick={() => handleSimplifyTerm(inputTerm)}
              disabled={!inputTerm.trim() || isLoading}
              className="bg-medical-green hover:bg-medical-green/90 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Common Terms */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Common medical terms:</p>
            <div className="flex flex-wrap gap-2">
              {commonMedicalTerms.map((term) => (
                <Badge
                  key={term}
                  variant="secondary"
                  className="cursor-pointer hover:bg-medical-green/10 transition-colors"
                  onClick={() => setInputTerm(term)}
                >
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {simplifiedTerms.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-medical-blue" />
              Simplified Terms ({simplifiedTerms.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {simplifiedTerms.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border bg-card animate-slide-up">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-medical-blue border-medical-blue/30">
                            {item.term}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="bg-medical-green/5 p-3 rounded border border-medical-green/20">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-medical-green mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-foreground leading-relaxed">{item.simplified}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.simplified)}
                          className="h-8 w-8 p-0 hover:bg-medical-green/10"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTerm(item.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="bg-medical-blue/5 border-medical-blue/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-medical-blue mt-0.5" />
            <div>
              <h3 className="font-semibold text-medical-blue mb-2">How Medical Term Simplification Works</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Enter complex medical terminology or jargon</p>
                <p>• Our AI breaks down the term into simple, understandable language</p>
                <p>• Get clear explanations that anyone can understand</p>
                <p>• Perfect for patients, students, or anyone learning medical terms</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
