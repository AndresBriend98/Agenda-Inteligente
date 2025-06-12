import { InferenceEngine } from "./inference-engine"
import type { ActionResult } from "./types"

// Procesador de lenguaje natural
export class NaturalLanguageProcessor {
  // Método para procesar un mensaje y ejecutar el motor de inferencia
  async processMessage(message: string, boardId: string | null): Promise<ActionResult> {
    console.log("NLP procesando mensaje:", message)
    console.log("NLP con contexto de tablero:", boardId)

    // Crear los hechos iniciales
    const facts = {
      message,
      boardId,
      entities: {},
    }

    // Crear una instancia del motor de inferencia con los hechos
    const inferenceEngine = new InferenceEngine(facts)

    try {
      // Ejecutar el motor de inferencia
      const result = await inferenceEngine.run()
      console.log("Resultado del motor de inferencia:", result)
      return result
    } catch (error) {
      console.error("Error en el motor de inferencia:", error)
      return {
        success: false,
        message: "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta con un comando más simple.",
        actionTaken: false,
      }
    }
  }
}
