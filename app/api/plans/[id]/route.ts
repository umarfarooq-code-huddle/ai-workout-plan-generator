import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(_: Request, { params }: { params: Promise<{ id?: string; planId?: string }> }) {
  try {
    const { id, planId } = await params
    const resolvedId = planId ?? id
    if (!resolvedId) {
      return new Response(JSON.stringify({ error: "Missing plan id" }), { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("workout_plans")
      .select("id, plan")
      .eq("id", resolvedId)
      .single()

    if (error) {
      if (error.code === "PGRST116" || error.message?.toLowerCase().includes("row")) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 })
      }
      console.error("Supabase fetch error:", error)
      return new Response(JSON.stringify({ error: "Failed to fetch plan" }), { status: 500 })
    }

    return new Response(JSON.stringify(data.plan), { status: 200 })
  } catch (err) {
    console.error("Fetch plan error:", err)
    return new Response(JSON.stringify({ error: "Failed to fetch plan" }), { status: 500 })
  }
}
