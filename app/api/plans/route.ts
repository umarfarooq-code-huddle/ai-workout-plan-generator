import { supabaseAdmin } from "@/lib/supabase-admin"
import { WorkoutPlanSchema } from "@/lib/schemas"

export async function POST(req: Request) {
  try {
    const { id, plan } = await req.json()

    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "Missing plan id" }), { status: 400 })
    }

    const parsed = WorkoutPlanSchema.safeParse(plan)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid plan payload", issues: parsed.error.issues }), {
        status: 400,
      })
    }

    const { error } = await supabaseAdmin.from("workout_plans").upsert({ id, plan }).select("id").single()
    if (error) {
      console.error("Supabase insert error:", error)
      return new Response(JSON.stringify({ error: "Failed to save plan" }), { status: 500 })
    }

    return new Response(JSON.stringify({ id }), { status: 200 })
  } catch (err) {
    console.error("Save plan error:", err)
    return new Response(JSON.stringify({ error: "Failed to save plan" }), { status: 500 })
  }
}
