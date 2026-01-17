"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Trash2Icon, RefreshCwIcon, ArrowUpDownIcon, ArrowUpRightIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { WorkoutPlan, Exercise } from "@/lib/schemas"

interface WorkoutPlanViewProps {
  plan: WorkoutPlan
  onBack: () => void
  planId?: string
}

export function WorkoutPlanView({ plan, onBack, planId }: WorkoutPlanViewProps) {
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>(
    plan.weeks.reduce(
      (acc, week) => {
        week.days.forEach((day) => {
          const key = `${week.week}-${day.day}`
          acc[key] = day.exercises
        })
        return acc
      },
      {} as Record<string, Exercise[]>,
    ),
  )

  const [activeWeek, setActiveWeek] = useState("1")
  const [deleteTarget, setDeleteTarget] = useState<{ week: number; day: string; index: number } | null>(null)

  const persistPlan = async (nextExercises: Record<string, Exercise[]>) => {
    if (!planId) return
    const nextPlan: WorkoutPlan = {
      ...plan,
      weeks: plan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => {
          const key = `${week.week}-${day.day}`
          return nextExercises[key] ? { ...day, exercises: nextExercises[key] } : day
        }),
      })),
    }

    try {
      await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: planId, plan: nextPlan }),
      })
    } catch (err) {
      console.error("Failed to persist plan change", err)
    }
  }

  const currentWeekData = useMemo(() => {
    return plan.weeks.find((w) => w.week === Number.parseInt(activeWeek))
  }, [activeWeek, plan.weeks])

  const deleteExercise = (weekNum: number, dayLabel: string, index: number) => {
    const key = `${weekNum}-${dayLabel}`
    setExercises((prev) => {
      const updated = {
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index),
      }
      void persistPlan(updated)
      return updated
    })
  }

  const moveExercise = (weekNum: number, dayLabel: string, index: number, direction: "up" | "down") => {
    const key = `${weekNum}-${dayLabel}`
    setExercises((prev) => {
      const newExercises = [...prev[key]]
      const newIndex = direction === "up" ? index - 1 : index + 1

      if (newIndex >= 0 && newIndex < newExercises.length) {
        ;[newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]]
      }

      const updated = {
        ...prev,
        [key]: newExercises,
      }
      void persistPlan(updated)
      return updated
    })
  }

  if (!currentWeekData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading workout plan...</p>
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-foreground px-3 pb-10 pt-4 sm:px-4 md:px-6 md:pt-6 plan-reveal">
      <header className="w-full mb-10 flex items-center justify-center bg-white py-6 px-4">
        <div className="flex items-center gap-1 text-[26px] md:text-[28px] font-semibold text-black leading-none">
          <span style={{ fontFamily: "'Poppins', sans-serif" }}>Maxed</span>
          <ArrowUpRightIcon className="h-6 w-6 md:h-7 md:w-7" />
        </div>
      </header>
      {/* Week navigation pills (Figma 1:2275) */}
      <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <TabsList className="flex gap-2 md:gap-[10px] bg-transparent p-0 mb-10 md:mb-[100px]">
            {plan.weeks.map((week) => (
              <TabsTrigger
                key={week.week}
                value={week.week.toString()}
                className="h-10 px-2 rounded-[6px] text-[15px] md:text-[16px] font-medium leading-[1.5] min-w-[72px] md:min-w-[77px] justify-center data-[state=active]:bg-[#6367EF] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-black shadow-none border-0"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Week {week.week}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2 h-[38px] min-w-[139px]" />
        </div>

        <TabsContent value={activeWeek}>
          <div className="space-y-4">
            {currentWeekData.days.map((day) => {
              const dayKey = `${currentWeekData.week}-${day.day}`
              const dayExercises = exercises[dayKey] || []
              const dayFocus = day.focus?.trim()
              const isRestDay =
                dayExercises.length === 0 ||
                dayExercises.every((ex) => {
                  const name = ex.name?.toLowerCase() || ""
                  const notes = ex.notes?.toLowerCase() || ""
                  return name.includes("rest") || notes.includes("rest")
                })
              const headerLabel = isRestDay ? `${day.day} - Rest` : dayFocus ? `${day.day} - ${dayFocus}` : day.day

              return (
                <Card
                  key={dayKey}
                  className="bg-transparent text-foreground overflow-visible border-none shadow-none rounded-none p-0"
                >
                  {/* Day title bar */}
                  <div
                    className="flex h-[48px] sm:h-[53px] items-center justify-between rounded-[8px] px-4 sm:px-6"
                    style={{
                      backgroundColor: isRestDay ? "#E2E2E2" : "#cbcdeb",
                    }}
                  >
                    <div
                      className="text-[18px] sm:text-[20px] font-medium"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        color: isRestDay ? "#6b7280" : "#000000",
                        lineHeight: 1.2,
                      }}
                    >
                      {headerLabel}
                    </div>
                    <div className="w-[52px]" />
                  </div>

                  {isRestDay ? null : (
                    <div className="overflow-x-auto px-1 py-2">
                      <Table className="w-full min-w-[700px] table-fixed border-separate border-spacing-y-2 border-spacing-x-0">
                        <TableHeader className="[&_tr]:bg-[#F9FAFB]">
                          <TableRow className="text-xs font-semibold uppercase tracking-wide text-[#111827]">
                            <TableHead className="h-[48px] sm:h-[53px] w-[70px] px-2 sm:px-3 align-middle text-left border-r border-[#E5E7EB] rounded-tl-md rounded-bl-md">
                              Circuits
                            </TableHead>
                            <TableHead className="h-[48px] sm:h-[53px] w-[150px] px-2 sm:px-3 align-middle text-left border-r border-[#E5E7EB]">
                              Exercise
                            </TableHead>
                            <TableHead className="h-[48px] sm:h-[53px] w-[70px] px-2 sm:px-3 align-middle text-center border-r border-[#E5E7EB]">
                              Sets
                            </TableHead>
                            <TableHead className="h-[48px] sm:h-[53px] w-[70px] px-2 sm:px-3 align-middle text-center border-r border-[#E5E7EB]">
                              Reps
                            </TableHead>
                            <TableHead className="h-[48px] sm:h-[53px] w-[350px] px-2 sm:px-3 align-middle text-left ">
                              Notes
                            </TableHead>
                            <TableHead className="h-[48px] sm:h-[53px] w-[52px] px-2 sm:px-3 align-middle text-center ">

                            </TableHead>
                            <TableHead className="h-[48px] sm:h-[53px] w-[52px] px-2 sm:px-3 align-middle text-center rounded-tr-md rounded-br-md">

                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayExercises.length > 0 ? (
                            dayExercises.map((exercise, index) => {
                              const noteText =
                                exercise.notes && exercise.notes.length > 50
                                  ? `${exercise.notes.slice(0, 50)}...`
                                  : exercise.notes

                              const exerciseTitle =
                                exercise.name.length > 20 ? `${exercise.name.slice(0, 20)}...` : exercise.name

                              return (
                                <TableRow
                                  key={index}
                                  className="h-[48px] sm:h-[53px] text-sm sm:text-sm shadow-sm bg-white rounded-b-md"
                                  style={{ color: "#0F172A" }}
                                >
                                  <TableCell className="px-2 sm:px-3 align-middle font-medium rounded-bl-md border-r border-[#E5E7EB]">
                                    {exercise.circuit}
                                  </TableCell>
                                  <TableCell className="px-2 sm:px-3 align-middle border-r border-[#E5E7EB]">
                                    {exerciseTitle}
                                  </TableCell>
                                  <TableCell className="px-2 sm:px-3 align-middle text-center border-r border-[#E5E7EB]">
                                    {exercise.sets}
                                  </TableCell>
                                  <TableCell className="px-2 sm:px-3 align-middle text-center border-r border-[#E5E7EB]">
                                    {exercise.reps}
                                  </TableCell>
                                  <TableCell
                                    className="px-2 sm:px-3 align-middle text-sm border-r border-[#E5E7EB] italic"
                                    style={{ color: "#000000" }}
                                  >
                                    {noteText}
                                  </TableCell>
                                  <TableCell className="px-2 sm:px-3 align-middle text-center border-r border-[#E5E7EB]">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 group"
                                      onClick={() =>
                                        setDeleteTarget({
                                          week: currentWeekData.week,
                                          day: day.day,
                                          index,
                                        })
                                      }
                                      title="Delete this exercise"
                                    >
                                      <Trash2Icon className="w-4 h-4 text-[#D1CDCD] group-hover:text-[#ef4444]" />
                                    </Button>
                                  </TableCell>
                                  <TableCell className="px-2 sm:px-3 align-middle text-center rounded-br-md">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 group"
                                      onClick={(e) =>
                                        moveExercise(
                                          currentWeekData.week,
                                          day.day,
                                          index,
                                          e.shiftKey ? "up" : "down",
                                        )
                                      }
                                      title="Click to move down, Shift+Click to move up"
                                    >
                                      <ArrowUpDownIcon className="w-4 h-4 text-[#D1CDCD] group-hover:text-[#6367EF]" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          ) : (
                            <TableRow className="h-[53px]">
                              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                No exercises for this day
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the exercise from this day. You can add it back manually if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteExercise(deleteTarget.week, deleteTarget.day, deleteTarget.index)
                  setDeleteTarget(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
