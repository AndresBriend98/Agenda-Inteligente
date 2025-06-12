import { getCollection, convertToObjectId } from "../db"
import type { Rule, Facts, ActionResult, TaskData, UpdateData } from "../types"
import { DateParser } from "../utils/date-parser"

// Reglas relacionadas con tareas
export const taskRules: Rule[] = [
  // R7: Crear una tarea
  {
    id: "R7",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R7 (crear tarea):", facts)
      return (
        (facts.intent === "crear_tarea" ||
          (facts.message.toLowerCase().includes("crea") && facts.message.toLowerCase().includes("tarea"))) &&
        facts.entities?.tarea_titulo &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para crear tarea:", facts.entities)

      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo crear la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const columnsCollection = await getCollection("columns")
      const tasksCollection = await getCollection("tasks")

      // Determinar la columna donde crear la tarea
      let columnQuery = {}
      if (facts.entities.columna_nombre) {
        // Si se especificó una columna - búsqueda insensible a mayúsculas/minúsculas
        console.log("Buscando columna específica:", facts.entities.columna_nombre)
        columnQuery = {
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        }
      } else {
        // Por defecto, usar la primera columna (Haciendo)
        console.log("Usando columna por defecto: Haciendo")
        columnQuery = {
          name: { $regex: /^Haciendo$/i },
          boardId: convertToObjectId(facts.boardId),
        }
      }

      const column = await columnsCollection.findOne(columnQuery)

      if (!column) {
        console.log("No se encontró la columna:", columnQuery)
        return {
          success: false,
          message: `No se encontró la columna ${
            facts.entities.columna_nombre ? `"${facts.entities.columna_nombre}"` : "predeterminada"
          } en este tablero.`,
          actionTaken: false,
        }
      }

      console.log("Columna encontrada:", column.name)

      // Crear la tarea
      const taskData: TaskData = {
        title: facts.entities.tarea_titulo,
        description: facts.entities.tarea_descripcion || "",
        columnId: column._id,
        boardId: facts.boardId ? convertToObjectId(facts.boardId) : null,
        priority: facts.entities.tarea_prioridad || "Media",
        members: facts.entities.tarea_miembros || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Añadir fecha de vencimiento si se proporcionó
      if (facts.entities.tarea_fecha) {
        taskData.dueDate = new Date(facts.entities.tarea_fecha)
      }

      const result = await tasksCollection.insertOne(taskData)

      if (result.acknowledged) {
        let message = `Tarea "${facts.entities.tarea_titulo}" creada con éxito en la columna "${column.name}".`

        // Añadir información sobre la fecha si se estableció
        if (facts.entities.tarea_fecha) {
          const fechaFormateada = DateParser.formatDate(new Date(facts.entities.tarea_fecha))
          message += ` Fecha de vencimiento: ${fechaFormateada}.`
        }

        return {
          success: true,
          message,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo crear la tarea.",
        actionTaken: false,
      }
    },
    priority: 8,
  },

  // R8: Eliminar una tarea
  {
    id: "R8",
    condition: (facts: Facts) => {
      return facts.intent === "eliminar_tarea" && facts.entities?.tarea_titulo && facts.boardId
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo eliminar la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")

      // Buscar la tarea por título en el tablero actual - insensible a mayúsculas/minúsculas
      const task = await tasksCollection.findOne({
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      })

      if (!task) {
        return {
          success: false,
          message: `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`,
          actionTaken: false,
        }
      }

      // Eliminar la tarea
      const deleteResult = await tasksCollection.deleteOne({ _id: task._id })

      if (deleteResult.deletedCount === 1) {
        return {
          success: true,
          message: `Tarea "${facts.entities.tarea_titulo}" eliminada con éxito.`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo eliminar la tarea.",
        actionTaken: false,
      }
    },
    priority: 8,
  },

  // R9: Modificar título o descripción de una tarea
  {
    id: "R9",
    condition: (facts: Facts) => {
      return (
        facts.intent === "modificar_tarea" &&
        facts.entities?.tarea_titulo_actual &&
        (facts.entities?.tarea_titulo_nuevo || facts.entities?.tarea_descripcion) &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo modificar la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")

      const updateData: UpdateData = { updatedAt: new Date() }

      if (facts.entities.tarea_titulo_nuevo) {
        updateData.title = facts.entities.tarea_titulo_nuevo
      }

      if (facts.entities.tarea_descripcion) {
        updateData.description = facts.entities.tarea_descripcion
      }

      const updateResult = await tasksCollection.updateOne(
        {
          title: { $regex: new RegExp(`^${facts.entities.tarea_titulo_actual}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        },
        { $set: updateData },
      )

      if (updateResult.matchedCount === 1) {
        let message = "Tarea actualizada con éxito."
        if (facts.entities.tarea_titulo_nuevo) {
          message = `Título de la tarea actualizado de "${facts.entities.tarea_titulo_actual}" a "${facts.entities.tarea_titulo_nuevo}".`
        } else if (facts.entities.tarea_descripcion) {
          message = `Descripción de la tarea "${facts.entities.tarea_titulo_actual}" actualizada.`
        }

        return {
          success: true,
          message,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar la tarea.",
        actionTaken: false,
      }
    },
    priority: 7,
  },

  // R10: Cambiar prioridad de una tarea
  {
    id: "R10",
    condition: (facts: Facts) => {
      return (
        facts.intent === "cambiar_prioridad" &&
        facts.entities?.tarea_titulo &&
        facts.entities?.tarea_prioridad &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo cambiar la prioridad de la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")

      // Normalizar la prioridad
      let priority = facts.entities.tarea_prioridad.toLowerCase()
      if (priority === "alta" || priority === "high") {
        priority = "Alta"
      } else if (priority === "media" || priority === "medium") {
        priority = "Media"
      } else if (priority === "baja" || priority === "low") {
        priority = "Baja"
      } else {
        priority = "Media" // Valor por defecto
      }

      const updateResult = await tasksCollection.updateOne(
        {
          title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        },
        {
          $set: {
            priority,
            updatedAt: new Date(),
          },
        },
      )

      if (updateResult.matchedCount === 1) {
        return {
          success: true,
          message: `Prioridad de la tarea "${facts.entities.tarea_titulo}" actualizada a "${priority}".`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar la prioridad de la tarea.",
        actionTaken: false,
      }
    },
    priority: 7,
  },

  // R11: Cambiar fecha de vencimiento de una tarea
  {
    id: "R11",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R11 (cambiar fecha):", facts)
      return (
        facts.intent === "cambiar_fecha" && facts.entities?.tarea_titulo && facts.entities?.tarea_fecha && facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para cambiar fecha:", facts.entities)

      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo cambiar la fecha de la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")

      // Buscar la tarea - insensible a mayúsculas/minúsculas
      console.log("Buscando tarea:", facts.entities.tarea_titulo)
      const task = await tasksCollection.findOne({
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      })

      if (!task) {
        console.log("No se encontró la tarea")
        return {
          success: false,
          message: `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`,
          actionTaken: false,
        }
      }

      console.log("Tarea encontrada:", task.title)
      console.log("Estableciendo fecha:", facts.entities.tarea_fecha)

      const updateResult = await tasksCollection.updateOne(
        { _id: task._id },
        {
          $set: {
            dueDate: new Date(facts.entities.tarea_fecha),
            updatedAt: new Date(),
          },
        },
      )

      if (updateResult.matchedCount === 1) {
        // Formatear la fecha para mostrarla en el mensaje
        const fechaFormateada = DateParser.formatDate(new Date(facts.entities.tarea_fecha))
        const expresionOriginal = facts.entities.tarea_fecha_expresion || facts.entities.tarea_fecha

        return {
          success: true,
          message: `Fecha de vencimiento de la tarea "${task.title}" actualizada a ${fechaFormateada} (${expresionOriginal}).`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar la fecha de vencimiento de la tarea.",
        actionTaken: false,
      }
    },
    priority: 7,
  },

  // R12: Asignar o remover miembros de una tarea
  {
    id: "R12",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R12 (gestionar miembros):", facts)
      return (
        facts.intent === "gestionar_miembros" &&
        facts.entities?.tarea_titulo &&
        facts.entities?.tarea_miembros &&
        facts.entities?.accion_miembro &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para gestionar miembros:", facts.entities)

      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudieron gestionar los miembros de la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")

      // Buscar la tarea - insensible a mayúsculas/minúsculas
      console.log("Buscando tarea:", facts.entities.tarea_titulo)
      const task = await tasksCollection.findOne({
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      })

      if (!task) {
        console.log("No se encontró la tarea")
        return {
          success: false,
          message: `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`,
          actionTaken: false,
        }
      }

      console.log("Tarea encontrada:", task.title)

      let updateOperation = {}
      const accion = facts.entities.accion_miembro.toLowerCase()
      console.log("Acción a realizar:", accion)

      if (accion === "agregar" || accion === "asignar" || accion === "añadir") {
        // Añadir miembros
        updateOperation = {
          $addToSet: { members: { $each: facts.entities.tarea_miembros } },
          $set: { updatedAt: new Date() },
        }
      } else if (accion === "quitar" || accion === "eliminar" || accion === "remover") {
        // Quitar miembros
        updateOperation = {
          $pull: { members: { $in: facts.entities.tarea_miembros } },
          $set: { updatedAt: new Date() },
        }
      } else {
        return {
          success: false,
          message: 'Acción no reconocida. Use "agregar" o "quitar".',
          actionTaken: false,
        }
      }

      console.log("Operación de actualización:", updateOperation)
      const updateResult = await tasksCollection.updateOne({ _id: task._id }, updateOperation)
      console.log("Resultado de la actualización:", updateResult)

      if (updateResult.matchedCount === 1) {
        const accionTexto =
          accion === "agregar" || accion === "asignar" || accion === "añadir" ? "asignados a" : "removidos de"

        return {
          success: true,
          message: `Miembros ${accionTexto} la tarea "${task.title}" correctamente.`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudieron actualizar los miembros de la tarea.",
        actionTaken: false,
      }
    },
    priority: 7,
  },

  // R13: Mover una tarea a otra columna
  {
    id: "R13",
    condition: (facts: Facts) => {
      return (
        facts.intent === "mover_tarea" &&
        facts.entities?.tarea_titulo &&
        facts.entities?.columna_destino &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo mover la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Buscar la tarea - insensible a mayúsculas/minúsculas
      const task = await tasksCollection.findOne({
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      })

      if (!task) {
        return {
          success: false,
          message: `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`,
          actionTaken: false,
        }
      }

      // Buscar la columna destino - búsqueda insensible a mayúsculas/minúsculas
      const destColumn = await columnsCollection.findOne({
        name: { $regex: new RegExp(`^${facts.entities.columna_destino}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      })

      if (!destColumn) {
        return {
          success: false,
          message: `No se encontró la columna "${facts.entities.columna_destino}" en este tablero.`,
          actionTaken: false,
        }
      }

      // Mover la tarea
      const updateResult = await tasksCollection.updateOne(
        { _id: task._id },
        {
          $set: {
            columnId: destColumn._id,
            updatedAt: new Date(),
          },
        },
      )

      if (updateResult.matchedCount === 1) {
        return {
          success: true,
          message: `Tarea "${task.title}" movida a la columna "${destColumn.name}".`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo mover la tarea.",
        actionTaken: false,
      }
    },
    priority: 8,
  },

  // R14: Marcar tarea como completada
  {
    id: "R14",
    condition: (facts: Facts) => {
      return facts.intent === "completar_tarea" && facts.entities?.tarea_titulo && facts.boardId
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo completar la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Buscar la tarea - insensible a mayúsculas/minúsculas
      const task = await tasksCollection.findOne({
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      })

      if (!task) {
        return {
          success: false,
          message: `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`,
          actionTaken: false,
        }
      }

      // Buscar la columna "Completadas" - búsqueda insensible a mayúsculas/minúsculas
      const completedColumn = await columnsCollection.findOne({
        name: { $regex: /^Completadas$/i },
        boardId: convertToObjectId(facts.boardId),
      })

      if (!completedColumn) {
        return {
          success: false,
          message: 'No se encontró la columna "Completadas" en este tablero.',
          actionTaken: false,
        }
      }

      // Mover la tarea a "Completadas"
      const updateResult = await tasksCollection.updateOne(
        { _id: task._id },
        {
          $set: {
            columnId: completedColumn._id,
            updatedAt: new Date(),
          },
        },
      )

      if (updateResult.matchedCount === 1) {
        return {
          success: true,
          message: `Tarea "${task.title}" marcada como completada y movida a la columna "Completadas".`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo marcar la tarea como completada.",
        actionTaken: false,
      }
    },
    priority: 8,
  },
]
