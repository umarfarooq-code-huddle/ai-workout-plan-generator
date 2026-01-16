"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, SendHorizonalIcon, SendIcon } from "lucide-react"

interface WorkoutPromptViewProps {
  onSubmit: (description: string) => void
  isLoading: boolean
}

export function WorkoutPromptView({ onSubmit, isLoading }: WorkoutPromptViewProps) {
  const [description, setDescription] = useState("")

  const handleSubmit = () => {
    if (description.trim()) {
      onSubmit(description)
    }
  }

  const charCount = description.length
  const maxChars = 1000
  const isDescriptionPresent = Boolean(description.trim())
  const isDisabled = !isDescriptionPresent || isLoading

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Smarter training starts here</h1>
          <p className="text-lg text-muted-foreground">Chat with AI to build custom fitness plans</p>
        </div>

        {/* Input Card */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-4">
          <Textarea
            placeholder="Describe what are we building today..."
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, maxChars))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (description.trim()) {
                  handleSubmit()
                }
              }
            }}
            disabled={isLoading}
            className="min-h-24 resize-none text-base focus:ring-2 focus:ring-primary"
          />

          {/* Footer with char count and button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {charCount}/{maxChars}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isDisabled}
              size="icon"
              className={`rounded-full w-10 h-10 border-0 ${isDisabled ? "" : "hover:opacity-90"}`}
              style={{
                backgroundColor: isDisabled ? "rgba(99, 103, 239, 0.2)" : "#6367EF",
                color: isDisabled ? "#6367EF" : "#FFFFFF",
              }}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizonalIcon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
