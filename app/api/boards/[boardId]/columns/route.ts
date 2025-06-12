import { NextResponse } from "next/server"
import { getCollection, convertToObjectId } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { boardId: string } }) {
  try {
    const boardId = params.boardId

    const columnsCollection = await getCollection("columns")
    const columns = await columnsCollection
      .find({ boardId: convertToObjectId(boardId) })
      .sort({ order: 1 })
      .toArray()

    return NextResponse.json(columns)
  } catch (error) {
    console.error("Error al obtener columnas:", error)
    return NextResponse.json({ error: "Error al obtener columnas" }, { status: 500 })
  }
}
