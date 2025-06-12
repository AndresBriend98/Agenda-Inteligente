import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "El nombre del tablero es requerido" }, { status: 400 })
    }

    // Crear el tablero
    const boardsCollection = await getCollection("boards")
    const result = await boardsCollection.insertOne({
      name: name.trim(),
      description: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!result.acknowledged) {
      throw new Error("No se pudo crear el tablero")
    }

    // Crear columnas por defecto
    const columnsCollection = await getCollection("columns")
    const defaultColumns = [
      { name: "Haciendo", boardId: result.insertedId, order: 0 },
      { name: "En progreso", boardId: result.insertedId, order: 1 },
      { name: "Completadas", boardId: result.insertedId, order: 2 },
    ]

    await columnsCollection.insertMany(
      defaultColumns.map((col) => ({
        ...col,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    )

    return NextResponse.json({
      success: true,
      message: `Tablero "${name}" creado con éxito con las columnas predeterminadas.`,
      boardId: result.insertedId,
    })
  } catch (error) {
    console.error("Error al crear tablero:", error)
    return NextResponse.json({ error: "Error al crear el tablero" }, { status: 500 })
  }
}
