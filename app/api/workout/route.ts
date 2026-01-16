import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { WorkoutPlanSchema } from "@/lib/schemas"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { userDescription } = await request.json()

    if (!userDescription?.trim()) {
      return new Response(JSON.stringify({ error: "Please describe your workout needs" }), { status: 400 })
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: WorkoutPlanSchema,
      prompt: `Create a comprehensive 4-week workout plan based on this description: "${userDescription}"
      
The plan should include:
- A descriptive plan name
- 4 weeks of progressive training
- Each week should have 4-5 workout days
- Include rest days labeled as "Rest"
- Each exercise should have: circuit letter (A, B, C, etc.), exercise name, sets, reps, and AI-generated notes
- Format reps as "12,10,8" for descending or "10-12" for ranges
- Include realistic rest periods

Return a valid JSON object matching the schema.`,
    })

    // Return the object as JSON
    return new Response(JSON.stringify(result.object), {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Workout generation error:", error)
    return new Response(JSON.stringify({ error: "Failed to generate workout plan" }), { status: 500 })
  }
}
