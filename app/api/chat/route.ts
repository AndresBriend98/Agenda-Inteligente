import { NextResponse } from "next/server"
import { NaturalLanguageProcessor } from "@/lib/natural-language-processor"

export async function POST(request: Request) {
  try {
    const { message, boardContext } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 })
    }

    console.log("Mensaje recibido:", message)
    console.log("Contexto del tablero:", boardContext)

    // Procesar el mensaje con el procesador de lenguaje natural
    const nlp = new NaturalLanguageProcessor()

    // Asegurarnos de que el boardContext sea una cadena válida
    let boardId = null
    if (boardContext && typeof boardContext === "string") {
      boardId = boardContext
    } else if (boardContext && typeof boardContext === "object" && boardContext._id) {
      boardId = boardContext._id
    }

    console.log("ID del tablero procesado:", boardId)

    const result = await nlp.processMessage(message, boardId)

    console.log("Resultado del procesamiento:", result)

    return NextResponse.json({
      response: result.message,
      actionTaken: result.actionTaken || false,
      success: result.success,
    })
  } catch (error) {
    console.error("Error en el endpoint de chat:", error)
    return NextResponse.json({ error: "Error al procesar el mensaje" }, { status: 500 })
  }
}
