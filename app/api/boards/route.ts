import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db"

export async function GET() {
  try {
    const boardsCollection = await getCollection("boards")
    const boards = await boardsCollection.find({}).sort({ updatedAt: -1 }).toArray()

    return NextResponse.json(boards)
  } catch (error) {
    console.error("Error al obtener tableros:", error)
    return NextResponse.json({ error: "Error al obtener tableros" }, { status: 500 })
  }
}
