import { NextResponse } from "next/server"
import { getCollection, convertToObjectId } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { boardId: string; columnId: string } }) {
  try {
    const { boardId, columnId } = params

    const tasksCollection = await getCollection("tasks")
    const tasks = await tasksCollection
      .find({
        boardId: convertToObjectId(boardId),
        columnId: convertToObjectId(columnId),
      })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error al obtener tareas:", error)
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 })
  }
}
