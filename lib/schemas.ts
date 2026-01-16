import { z } from "zod"

export const ExerciseSchema = z.object({
  circuit: z.string(),
  name: z.string(),
  sets: z.number(),
  reps: z.string(),
  rest: z.string(),
  notes: z.string(),
})

export const DaySchema = z.object({
  day: z.string(),
  focus: z.string(),
  exercises: z.array(ExerciseSchema),
})

export const WeekSchema = z.object({
  week: z.number(),
  days: z.array(DaySchema),
})

export const WorkoutPlanSchema = z.object({
  planName: z.string(),
  description: z.string(),
  weeks: z.array(WeekSchema),
})

export type Exercise = z.infer<typeof ExerciseSchema>
export type Day = z.infer<typeof DaySchema>
export type Week = z.infer<typeof WeekSchema>
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>
