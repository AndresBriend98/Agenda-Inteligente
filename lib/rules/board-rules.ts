import { getCollection, convertToObjectId } from "../db"
import type { Rule, Facts, ActionResult } from "../types"

// Reglas relacionadas con tableros
export const boardRules: Rule[] = [
  // R1: Crear un tablero
  {
    id: "R1",
    condition: (facts: Facts) => {
      return facts.intent === "crear_tablero" && facts.entities?.tablero_nombre
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      const boardsCollection = await getCollection("boards")
      const result = await boardsCollection.insertOne({
        name: facts.entities.tablero_nombre,
        description: facts.entities.tablero_descripcion || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (result.acknowledged) {
        // Si se crea un tablero, crear columnas por defecto
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

        return {
          success: true,
          message: `Tablero "${facts.entities.tablero_nombre}" creado con éxito con las columnas predeterminadas.`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo crear el tablero.",
        actionTaken: false,
      }
    },
    priority: 10,
  },

  // R2: Eliminar un tablero - MEJORADO
  {
    id: "R2",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R2 (eliminar tablero):", facts)
      return (
        facts.intent === "eliminar_tablero" &&
        (facts.entities?.tablero_nombre || facts.entities?.usar_tablero_actual || facts.boardId)
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para eliminar tablero:", facts.entities)

      const boardsCollection = await getCollection("boards")
      let query = {}
      let boardName = ""

      // Determinar qué tablero eliminar
      if (facts.entities?.usar_tablero_actual && facts.boardId) {
        // Eliminar el tablero actual
        query = { _id: convertToObjectId(facts.boardId) }
        console.log("Eliminando tablero actual con ID:", facts.boardId)
      } else if (facts.entities?.tablero_nombre) {
        // Eliminar tablero por nombre - insensible a mayúsculas/minúsculas
        query = { name: { $regex: new RegExp(`^${facts.entities.tablero_nombre}$`, "i") } }
        console.log("Eliminando tablero por nombre:", facts.entities.tablero_nombre)
      } else if (facts.boardId) {
        // Si no se especifica nombre pero hay boardId, usar el actual
        query = { _id: convertToObjectId(facts.boardId) }
        console.log("Eliminando tablero actual (sin nombre especificado):", facts.boardId)
      } else {
        return {
          success: false,
          message: "No se especificó qué tablero eliminar.",
          actionTaken: false,
        }
      }

      const board = await boardsCollection.findOne(query)
      if (!board) {
        return {
          success: false,
          message: facts.entities?.tablero_nombre
            ? `No se encontró el tablero "${facts.entities.tablero_nombre}".`
            : "No se encontró el tablero especificado.",
          actionTaken: false,
        }
      }

      boardName = board.name

      // Eliminar el tablero
      const deleteResult = await boardsCollection.deleteOne({ _id: board._id })

      if (deleteResult.deletedCount === 1) {
        // Eliminar columnas asociadas
        const columnsCollection = await getCollection("columns")
        await columnsCollection.deleteMany({ boardId: board._id })

        // Eliminar tareas asociadas
        const tasksCollection = await getCollection("tasks")
        await tasksCollection.deleteMany({ boardId: board._id })

        return {
          success: true,
          message: `Tablero "${boardName}" eliminado con éxito junto con todas sus columnas y tareas.`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo eliminar el tablero.",
        actionTaken: false,
      }
    },
    priority: 10,
  },

  // R3: Modificar título de un tablero - MEJORADO
  {
    id: "R3",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R3 (modificar tablero):", facts)
      return (
        facts.intent === "modificar_tablero" &&
        facts.entities?.tablero_nombre_nuevo &&
        (facts.entities?.tablero_nombre_actual || facts.entities?.usar_tablero_actual || facts.boardId)
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para modificar tablero:", facts.entities)

      const boardsCollection = await getCollection("boards")
      let query = {}
      let nombreAnterior = ""

      // Determinar qué tablero modificar
      if (facts.entities?.usar_tablero_actual && facts.boardId) {
        // Modificar el tablero actual
        query = { _id: convertToObjectId(facts.boardId) }
        console.log("Modificando tablero actual con ID:", facts.boardId)
      } else if (facts.entities?.tablero_nombre_actual) {
        // Modificar tablero por nombre actual - insensible a mayúsculas/minúsculas
        query = { name: { $regex: new RegExp(`^${facts.entities.tablero_nombre_actual}$`, "i") } }
        console.log("Modificando tablero por nombre actual:", facts.entities.tablero_nombre_actual)
      } else if (facts.boardId) {
        // Si no se especifica nombre actual pero hay boardId, usar el actual
        query = { _id: convertToObjectId(facts.boardId) }
        console.log("Modificando tablero actual (sin nombre actual especificado):", facts.boardId)
      } else {
        return {
          success: false,
          message: "No se especificó qué tablero modificar.",
          actionTaken: false,
        }
      }

      // Primero obtener el tablero para conocer su nombre actual
      const board = await boardsCollection.findOne(query)
      if (!board) {
        return {
          success: false,
          message: facts.entities?.tablero_nombre_actual
            ? `No se encontró el tablero "${facts.entities.tablero_nombre_actual}".`
            : "No se encontró el tablero especificado.",
          actionTaken: false,
        }
      }

      nombreAnterior = board.name

      // Actualizar el nombre del tablero
      const updateResult = await boardsCollection.updateOne(
        { _id: board._id },
        {
          $set: {
            name: facts.entities.tablero_nombre_nuevo,
            updatedAt: new Date(),
          },
        },
      )

      if (updateResult.matchedCount === 1) {
        return {
          success: true,
          message: `Nombre del tablero actualizado de "${nombreAnterior}" a "${facts.entities.tablero_nombre_nuevo}".`,
          actionTaken: true,
          data: {
            boardId: board._id.toString(),
            oldName: nombreAnterior,
            newName: facts.entities.tablero_nombre_nuevo,
          },
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar el nombre del tablero.",
        actionTaken: false,
      }
    },
    priority: 8,
  },
]
