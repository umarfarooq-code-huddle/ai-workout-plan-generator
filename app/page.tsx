"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { WorkoutPromptView } from "@/components/workout-prompt-view"
import { WorkoutPlanView } from "@/components/workout-plan-view"
import type { WorkoutPlan } from "@/lib/schemas"

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() {
  const [currentView, setCurrentView] = useState<"prompt" | "plan">("prompt")
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [planId, setPlanId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Preserve planId if already in URL when rehydrating
  useEffect(() => {
    if (planId) return
    const existingPlanId = searchParams.get("planId")
    if (existingPlanId) {
      setPlanId(existingPlanId)
    }
  }, [planId, searchParams])

  // If planId is present in URL, fetch the plan server-side and show it
  useEffect(() => {
    const loadPlan = async (id: string) => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/plans/${encodeURIComponent(id)}`)
        if (!res.ok) {
          throw new Error("Plan not found")
        }
        const plan = (await res.json()) as WorkoutPlan
        setWorkoutPlan(plan)
        setCurrentView("plan")
      } catch (err) {
        console.error("Failed to load plan:", err)
        setWorkoutPlan(null)
        setCurrentView("prompt")
        setPlanId(null)
        router.replace("/")
        alert("Could not load that plan.")
      } finally {
        setIsLoading(false)
      }
    }

    const id = searchParams.get("planId")
    if (id && !workoutPlan) {
      loadPlan(id)
    }
  }, [router, searchParams, workoutPlan])

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
      const newPlanId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`

      setWorkoutPlan(plan)
      setPlanId(newPlanId)
      router.replace(`/?planId=${encodeURIComponent(newPlanId)}`)
      setCurrentView("plan")

      // Persist to Supabase via server API
      try {
        const saveRes = await fetch("/api/plans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: newPlanId, plan }),
        })
        if (!saveRes.ok) {
          console.error("Failed to save plan", await saveRes.text())
        }
      } catch (err) {
        console.error("Plan save error:", err)
      }
    } catch (error) {
      console.error("Error generating workout:", error)
      alert("Failed to generate workout plan. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && planId && !workoutPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading your workout plan...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {currentView === "prompt" ? (
        <WorkoutPromptView onSubmit={handleGenerateWorkout} isLoading={isLoading} />
      ) : workoutPlan ? (
        <WorkoutPlanView
          plan={workoutPlan}
          planId={planId ?? undefined}
          onBack={() => {
            setCurrentView("prompt")
            setWorkoutPlan(null)
            setPlanId(null)
            router.replace("/")
          }}
        />
      ) : null}
    </>
  )
}
