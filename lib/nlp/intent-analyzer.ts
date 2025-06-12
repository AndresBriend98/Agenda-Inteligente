import type { Facts } from "../types"
import { EntityExtractor } from "./entity-extractor"

export class IntentAnalyzer {
  static async analyzeIntent(facts: Facts): Promise<string> {
    const message = facts.message.toLowerCase()
    console.log("Analizando intención del mensaje:", message)

    // Análisis mejorado para crear tablero
    if (
      message.match(/crea(?:r)?\s+(?:un\s+)?(?:nuevo\s+)?tablero/i) ||
      message.match(/nuevo\s+tablero/i) ||
      message.match(/tablero\s+(?:nuevo|llamado)/i)
    ) {
      facts.intent = "crear_tablero"
      EntityExtractor.extractTableroEntities(facts)

      // Si no se detectó un nombre específico pero la intención es crear tablero
      if (!facts.entities?.tablero_nombre) {
        // Buscar cualquier palabra después de "tablero" como posible nombre
        const nombreSimpleMatch = message.match(/tablero\s+([^\s,.]+)/i)
        if (
          nombreSimpleMatch &&
          nombreSimpleMatch[1] &&
          !["nuevo", "llamado", "que", "con"].includes(nombreSimpleMatch[1].toLowerCase())
        ) {
          facts.entities.tablero_nombre = nombreSimpleMatch[1]
        } else {
          // Asignar un nombre por defecto si no se detectó ninguno
          facts.entities.tablero_nombre = "Nuevo Tablero"
        }
      }
    }
    // Mejorar detección para eliminar tablero
    else if (
      message.match(/eliminar?\s+(?:el\s+)?tablero/i) ||
      message.match(/borrar?\s+(?:el\s+)?tablero/i) ||
      message.match(/quitar?\s+(?:el\s+)?tablero/i) ||
      message.match(/elimina\s+tablero/i) ||
      message.match(/borra\s+tablero/i)
    ) {
      facts.intent = "eliminar_tablero"
      EntityExtractor.extractTableroEntities(facts)

      // Si no se especifica un tablero y hay uno activo, usar el actual
      if (!facts.entities?.tablero_nombre && facts.boardId) {
        facts.entities.usar_tablero_actual = true
      }
    }
    // Mejorar detección para modificar tablero - AMPLIADO Y CORREGIDO
    else if (
      message.match(/cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero/i) ||
      message.match(/renombrar?\s+(?:el\s+)?tablero/i) ||
      message.match(/modificar?\s+(?:el\s+)?(?:nombre\s+del\s+)?tablero/i) ||
      message.match(/cambiar?\s+(?:el\s+)?tablero/i) ||
      message.match(/renombra\s+tablero/i) ||
      message.match(/cambia\s+(?:el\s+)?tablero/i) ||
      message.match(/modifica\s+(?:el\s+)?(?:nombre\s+(?:de\s+)?)?tablero/i) ||
      (message.includes("cambiar") && message.includes("tablero")) ||
      (message.includes("cambia") && message.includes("tablero")) ||
      (message.includes("renombrar") && message.includes("tablero")) ||
      (message.includes("renombra") && message.includes("tablero")) ||
      (message.includes("modificar") && message.includes("tablero")) ||
      (message.includes("modifica") && message.includes("tablero")) ||
      // Patrones específicos para "X por Y"
      message.match(/tablero\s+\w+\s+por\s+\w+/i) ||
      // Patrones específicos para "X a Y"
      message.match(/tablero\s+\w+\s+a\s+\w+/i)
    ) {
      facts.intent = "modificar_tablero"
      console.log("Intención detectada: modificar_tablero")
      EntityExtractor.extractTableroEntities(facts)

      // Si no se especifica un tablero y hay uno activo, usar el actual
      if (!facts.entities?.tablero_nombre_actual && facts.boardId) {
        facts.entities.usar_tablero_actual = true
      }
    }
    // Detección más robusta para crear columnas
    else if (
      message.match(/crea(?:r)?\s+(?:una\s+)?columna/i) ||
      message.match(/nueva\s+columna/i) ||
      (message.includes("columna") &&
        (message.includes("crear") || message.includes("crea") || message.includes("nueva")))
    ) {
      facts.intent = "crear_columna"
      console.log("Intención detectada: crear_columna")
      EntityExtractor.extractColumnaEntities(facts)

      // Si no se detectó un nombre específico pero la intención es crear columna
      if (!facts.entities?.columna_nombre) {
        console.log("No se detectó nombre de columna, buscando alternativas")

        // Buscar patrones comunes para nombres de columnas
        const patronesNombre = [
          /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"/i,
          /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)/i,
          /columna\s+([^\s,.]+)/i,
          /crear\s+columna\s+([^\s,.]+)/i,
          /crea\s+columna\s+([^\s,.]+)/i,
          /nueva\s+columna\s+([^\s,.]+)/i,
          /columna\s+llamada\s+([^\s,.]+)/i,
        ]

        for (const patron of patronesNombre) {
          const match = message.match(patron)
          if (match && match[1] && !["nueva", "llamada", "que", "con"].includes(match[1].toLowerCase())) {
            console.log(`Nombre de columna encontrado con patrón ${patron}: ${match[1]}`)
            facts.entities.columna_nombre = match[1]
            break
          }
        }

        // Si aún no se encontró un nombre, intentar extraer la última palabra después de "llamada"
        if (!facts.entities?.columna_nombre && message.includes("llamada")) {
          const palabras = message.split("llamada")[1].trim().split(/\s+/)
          if (palabras.length > 0) {
            facts.entities.columna_nombre = palabras[0]
            console.log(`Nombre de columna extraído después de "llamada": ${palabras[0]}`)
          }
        }

        // Si todavía no hay nombre, usar un valor por defecto
        if (!facts.entities?.columna_nombre) {
          facts.entities.columna_nombre = "Nueva Columna"
          console.log("Usando nombre por defecto: Nueva Columna")
        }
      }
    } else if (message.match(/eliminar\s+(?:la\s+)?columna/i)) {
      facts.intent = "eliminar_columna"
      EntityExtractor.extractColumnaEntities(facts)
    } else if (
      message.match(/cambiar\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna/i) ||
      message.match(/renombrar\s+(?:la\s+)?columna/i) ||
      message.match(/modificar\s+(?:la\s+)?columna/i)
    ) {
      facts.intent = "modificar_columna"
      EntityExtractor.extractColumnaEntities(facts)
    }
    // DETECCIÓN MEJORADA PARA CREAR TAREAS
    else if (
      message.match(/crea(?:r)?\s+(?:una\s+)?(?:nueva\s+)?tarea/i) ||
      message.match(/nueva\s+tarea/i) ||
      message.match(/añad(?:ir|e)\s+(?:una\s+)?tarea/i) ||
      message.match(/agrega(?:r)?\s+(?:una\s+)?tarea/i) ||
      (message.includes("tarea") &&
        (message.includes("crear") ||
          message.includes("crea") ||
          message.includes("nueva") ||
          message.includes("añadir") ||
          message.includes("añade") ||
          message.includes("agregar") ||
          message.includes("agrega")))
    ) {
      facts.intent = "crear_tarea"
      console.log("Intención detectada: crear_tarea")
      EntityExtractor.extractTareaEntities(facts)

      // Si no se detectó un título específico pero la intención es crear tarea
      if (!facts.entities?.tarea_titulo) {
        console.log("No se detectó título de tarea, buscando alternativas")

        // Buscar patrones comunes para títulos de tareas
        const patronesTitulo = [
          /tarea\s+"([^"]+)"/i,
          /tarea\s+([^\s,.]+)/i,
          /crear\s+tarea\s+"([^"]+)"/i,
          /crear\s+tarea\s+([^\s,.]+)/i,
          /crea\s+tarea\s+"([^"]+)"/i,
          /crea\s+tarea\s+([^\s,.]+)/i,
          /nueva\s+tarea\s+"([^"]+)"/i,
          /nueva\s+tarea\s+([^\s,.]+)/i,
          /añadir\s+tarea\s+"([^"]+)"/i,
          /añadir\s+tarea\s+([^\s,.]+)/i,
          /agregar\s+tarea\s+"([^"]+)"/i,
          /agregar\s+tarea\s+([^\s,.]+)/i,
        ]

        for (const patron of patronesTitulo) {
          const match = message.match(patron)
          if (match && match[1] && !["nueva", "llamada", "que", "con"].includes(match[1].toLowerCase())) {
            console.log(`Título de tarea encontrado con patrón ${patron}: ${match[1]}`)
            facts.entities.tarea_titulo = match[1]
            break
          }
        }

        // Si todavía no hay título, usar un valor por defecto
        if (!facts.entities?.tarea_titulo) {
          facts.entities.tarea_titulo = "Nueva Tarea"
          console.log("Usando título por defecto: Nueva Tarea")
        }
      }
    }
    // DETECCIÓN MEJORADA PARA ELIMINAR TAREAS
    else if (
      message.match(/eliminar?\s+(?:la\s+)?tarea/i) ||
      message.match(/borrar?\s+(?:la\s+)?tarea/i) ||
      message.match(/quitar?\s+(?:la\s+)?tarea/i) ||
      message.match(/elimina\s+(?:la\s+)?tarea/i) ||
      message.match(/borra\s+(?:la\s+)?tarea/i) ||
      message.match(/quita\s+(?:la\s+)?tarea/i)
    ) {
      facts.intent = "eliminar_tarea"
      console.log("Intención detectada: eliminar_tarea")
      EntityExtractor.extractTareaEntities(facts)
    }
    // DETECCIÓN MEJORADA PARA MODIFICAR TAREAS
    else if (
      message.match(/cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/renombrar?\s+(?:la\s+)?tarea/i) ||
      message.match(/modificar?\s+(?:la\s+)?tarea/i) ||
      message.match(/cambiar?\s+(?:la\s+)?descripción\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/actualizar?\s+(?:la\s+)?tarea/i) ||
      message.match(/editar?\s+(?:la\s+)?tarea/i) ||
      (message.includes("tarea") &&
        (message.includes("cambiar") ||
          message.includes("cambia") ||
          message.includes("modificar") ||
          message.includes("modifica") ||
          message.includes("renombrar") ||
          message.includes("renombra") ||
          message.includes("actualizar") ||
          message.includes("actualiza") ||
          message.includes("editar") ||
          message.includes("edita")))
    ) {
      facts.intent = "modificar_tarea"
      console.log("Intención detectada: modificar_tarea")
      EntityExtractor.extractTareaEntities(facts)
    }
    // DETECCIÓN MEJORADA PARA CAMBIAR PRIORIDAD
    else if (
      message.match(/cambiar?\s+(?:la\s+)?prioridad/i) ||
      message.match(/establecer?\s+(?:la\s+)?prioridad/i) ||
      message.match(/poner?\s+(?:la\s+)?prioridad/i) ||
      message.match(/asignar?\s+(?:la\s+)?prioridad/i) ||
      message.match(/prioridad\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/prioridad\s+(alta|media|baja)/i) ||
      (message.includes("prioridad") && message.includes("tarea"))
    ) {
      facts.intent = "cambiar_prioridad"
      console.log("Intención detectada: cambiar_prioridad")
      EntityExtractor.extractTareaEntities(facts)
    }
    // DETECCIÓN MEJORADA PARA CAMBIAR FECHA
    else if (
      message.match(/cambiar?\s+(?:la\s+)?fecha/i) ||
      message.match(/establecer?\s+(?:la\s+)?fecha/i) ||
      message.match(/poner?\s+(?:la\s+)?fecha/i) ||
      message.match(/asignar?\s+(?:la\s+)?fecha/i) ||
      message.match(/fecha\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/vencimiento\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/tarea\s+(?:para|vence)(?:\s+el)?\s+/i) ||
      message.match(/programar?\s+(?:la\s+)?tarea/i) ||
      (message.includes("fecha") && (message.includes("tarea") || message.includes("para"))) ||
      (message.includes("vence") && message.includes("tarea")) ||
      (message.includes("para") &&
        (message.includes("hoy") ||
          message.includes("mañana") ||
          message.includes("manana") ||
          message.includes("próximo") ||
          message.includes("proximo") ||
          message.match(/\d{1,2}\/\d{1,2}\/\d{4}/) ||
          message.match(/\d{4}-\d{1,2}-\d{1,2}/)))
    ) {
      facts.intent = "cambiar_fecha"
      console.log("Intención detectada: cambiar_fecha")
      EntityExtractor.extractTareaEntities(facts)
    }
    // DETECCIÓN MEJORADA PARA GESTIONAR MIEMBROS
    else if (
      message.match(/asigna(?:r)?\s+miembros/i) ||
      message.match(/añad(?:ir|e)\s+miembros/i) ||
      message.match(/agrega(?:r)?\s+miembros/i) ||
      message.match(/quita(?:r)?\s+miembros/i) ||
      message.match(/elimina(?:r)?\s+miembros/i) ||
      message.match(/remueve\s+miembros/i) ||
      message.match(/asigna\s+a\s+/i) ||
      message.match(/añade\s+a\s+/i) ||
      message.match(/agrega\s+a\s+/i) ||
      message.includes("miembros") ||
      (message.includes("asignar") && message.includes("tarea")) ||
      (message.includes("asigna") && message.includes("tarea"))
    ) {
      facts.intent = "gestionar_miembros"
      console.log("Intención detectada: gestionar_miembros")
      facts.entities = facts.entities || {}

      // Establecer acción por defecto si no se especifica
      if (message.includes("asigna") || message.includes("añad") || message.includes("agrega")) {
        facts.entities.accion_miembro = "asignar"
      } else if (message.includes("quita") || message.includes("elimina") || message.includes("remueve")) {
        facts.entities.accion_miembro = "quitar"
      } else {
        facts.entities.accion_miembro = "asignar" // Por defecto
      }

      console.log("Acción de miembros establecida:", facts.entities.accion_miembro)
      EntityExtractor.extractTareaEntities(facts)
    }
    // DETECCIÓN MEJORADA PARA MOVER TAREAS
    else if (
      message.match(/mover?\s+(?:la\s+)?tarea/i) ||
      message.match(/mueve\s+(?:la\s+)?tarea/i) ||
      message.match(/trasladar?\s+(?:la\s+)?tarea/i) ||
      message.match(/traslada\s+(?:la\s+)?tarea/i) ||
      message.match(/pasar?\s+(?:la\s+)?tarea/i) ||
      message.match(/pasa\s+(?:la\s+)?tarea/i) ||
      (message.includes("tarea") &&
        (message.includes("mover") ||
          message.includes("mueve") ||
          message.includes("trasladar") ||
          message.includes("traslada") ||
          message.includes("pasar") ||
          message.includes("pasa")))
    ) {
      facts.intent = "mover_tarea"
      console.log("Intención detectada: mover_tarea")
      EntityExtractor.extractTareaEntities(facts)
    }
    // DETECCIÓN MEJORADA PARA COMPLETAR TAREAS
    else if (
      message.match(/(?:completar|finalizar|terminar)\s+(?:la\s+)?tarea/i) ||
      message.match(/(?:completa|finaliza|termina)\s+(?:la\s+)?tarea/i) ||
      message.match(/marcar?\s+(?:la\s+)?tarea\s+(?:como\s+)?(?:completada|finalizada|terminada)/i) ||
      message.match(/marca\s+(?:la\s+)?tarea\s+(?:como\s+)?(?:completada|finalizada|terminada)/i) ||
      message.match(/(?:completada|finalizada|terminada)\s+(?:la\s+)?tarea/i) ||
      (message.includes("tarea") &&
        (message.includes("completar") ||
          message.includes("completa") ||
          message.includes("finalizar") ||
          message.includes("finaliza") ||
          message.includes("terminar") ||
          message.includes("termina") ||
          message.includes("completada") ||
          message.includes("finalizada") ||
          message.includes("terminada")))
    ) {
      facts.intent = "completar_tarea"
      console.log("Intención detectada: completar_tarea")
      EntityExtractor.extractTareaEntities(facts)
    }

    // Si no se detectó ninguna intención específica
    if (!facts.intent) {
      facts.intent = "desconocido"
    }

    console.log("Intención detectada:", facts.intent)
    console.log("Entidades extraídas:", facts.entities)

    return facts.intent
  }

  static getHelpMessage(facts: Facts): string {
    if (facts.boardId) {
      // Si está en un tablero
      return `No entendí lo que quieres hacer. Aquí hay algunas cosas que puedes pedirme:

**COLUMNAS:**
- Crear: "Crea una columna llamada Pendientes"
- Eliminar: "Elimina la columna Pendientes"
- Modificar: "Cambia el nombre de la columna Pendientes a En Revisión"

**TAREAS:**
- Crear: "Crea una tarea llamada Estudiar Física"
- Crear en columna específica: "Crea una tarea llamada Estudiar en la columna Haciendo"
- Eliminar: "Elimina la tarea Estudiar Física"
- Modificar título: "Cambia el título de la tarea Estudiar a Estudiar Matemáticas"
- Cambiar prioridad: "Establece la prioridad de Estudiar Física a Alta"
- Cambiar fecha: "Establece la fecha de la tarea Estudiar Física para mañana"
- Asignar miembros: "Asigna a Juan y María a la tarea Estudiar Física"
- Mover tarea: "Mueve la tarea Estudiar Física a la columna En Progreso"
- Completar: "Marca como completada la tarea Estudiar Física"

**TABLERO:**
- Cambiar nombre: "Cambia el nombre del tablero a Nuevo Nombre"
- Eliminar: "Elimina este tablero"`
    } else {
      // Si está en la página principal
      return `No entendí lo que quieres hacer. Aquí hay algunas cosas que puedes pedirme:
      
- Crear un tablero: "Crea un tablero llamado Proyecto Escolar"
- Eliminar un tablero: "Elimina el tablero Proyecto Escolar"
- Modificar un tablero: "Cambia el nombre del tablero Proyecto a Proyecto Escolar"`
    }
  }
}
