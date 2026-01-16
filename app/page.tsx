"use client"

import { useState } from "react"
import { WorkoutPromptView } from "@/components/workout-prompt-view"
import { WorkoutPlanView } from "@/components/workout-plan-view"
import type { WorkoutPlan } from "@/lib/schemas"

export default function Home() {
  const [currentView, setCurrentView] = useState<"prompt" | "plan">("prompt")
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateWorkout = async (description: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userDescription: description }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate workout")
      }

      // Parse the streamed response
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      let fullText = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += new TextDecoder().decode(value)
      }

      // Extract JSON from the streamed response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("Invalid response format")

      const plan = JSON.parse(jsonMatch[0]) as WorkoutPlan
      setWorkoutPlan(plan)
      setCurrentView("plan")
    } catch (error) {
      console.error("Error generating workout:", error)
      alert("Failed to generate workout plan. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {currentView === "prompt" ? (
        <WorkoutPromptView onSubmit={handleGenerateWorkout} isLoading={isLoading} />
      ) : workoutPlan ? (
        <WorkoutPlanView
          plan={workoutPlan}
          onBack={() => {
            setCurrentView("prompt")
            setWorkoutPlan(null)
          }}
        />
      ) : null}
    </>
  )
}
