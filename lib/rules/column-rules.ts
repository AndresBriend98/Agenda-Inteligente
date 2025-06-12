import { getCollection, convertToObjectId } from "../db"
import type { Rule, Facts, ActionResult } from "../types"

// Reglas relacionadas con columnas
export const columnRules: Rule[] = [
  // R4: Crear una columna
  {
    id: "R4",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R4 (crear columna):", facts)
      // Hacer la condición más flexible
      return (
        (facts.intent === "crear_columna" ||
          (facts.message.toLowerCase().includes("crea") && facts.message.toLowerCase().includes("columna"))) &&
        facts.entities?.columna_nombre &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para crear columna con nombre:", facts.entities.columna_nombre)

      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo crear la columna: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const columnsCollection = await getCollection("columns")

      // Obtener el orden más alto actual
      const highestOrderColumn = await columnsCollection
        .find({
          boardId: convertToObjectId(facts.boardId),
        })
        .sort({ order: -1 })
        .limit(1)
        .toArray()

      const nextOrder = highestOrderColumn.length > 0 ? highestOrderColumn[0].order + 1 : 0

      const result = await columnsCollection.insertOne({
        name: facts.entities.columna_nombre,
        boardId: facts.boardId ? convertToObjectId(facts.boardId) : null,
        order: nextOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (result.acknowledged) {
        return {
          success: true,
          message: `Columna "${facts.entities.columna_nombre}" creada con éxito.`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo crear la columna.",
        actionTaken: false,
      }
    },
    priority: 9,
  },

  // R5: Eliminar una columna
  {
    id: "R5",
    condition: (facts: Facts) => {
      return facts.intent === "eliminar_columna" && facts.entities?.columna_nombre && facts.boardId
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo eliminar la columna: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const columnsCollection = await getCollection("columns")

      // Buscar la columna por nombre en el tablero actual - insensible a mayúsculas/minúsculas
      const column = await columnsCollection.findOne({
        name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      })

      if (!column) {
        return {
          success: false,
          message: `No se encontró la columna "${facts.entities.columna_nombre}" en este tablero.`,
          actionTaken: false,
        }
      }

      // Eliminar la columna
      const deleteResult = await columnsCollection.deleteOne({ _id: column._id })

      if (deleteResult.deletedCount === 1) {
        // Eliminar tareas asociadas
        const tasksCollection = await getCollection("tasks")
        await tasksCollection.deleteMany({ columnId: column._id })

        return {
          success: true,
          message: `Columna "${facts.entities.columna_nombre}" eliminada con éxito junto con todas sus tareas.`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo eliminar la columna.",
        actionTaken: false,
      }
    },
    priority: 9,
  },

  // R6: Modificar título de una columna
  {
    id: "R6",
    condition: (facts: Facts) => {
      return (
        facts.intent === "modificar_columna" &&
        facts.entities?.columna_nombre_actual &&
        facts.entities?.columna_nombre_nuevo &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo modificar la columna: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const columnsCollection = await getCollection("columns")

      const updateResult = await columnsCollection.updateOne(
        {
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre_actual}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        },
        {
          $set: {
            name: facts.entities.columna_nombre_nuevo,
            updatedAt: new Date(),
          },
        },
      )

      if (updateResult.matchedCount === 1) {
        return {
          success: true,
          message: `Nombre de la columna actualizado de "${facts.entities.columna_nombre_actual}" a "${facts.entities.columna_nombre_nuevo}".`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar el nombre de la columna.",
        actionTaken: false,
      }
    },
    priority: 7,
  },
]
