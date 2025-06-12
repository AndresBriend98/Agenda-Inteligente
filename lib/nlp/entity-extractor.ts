import type { Facts } from "../types"
import { DateParser } from "../utils/date-parser"

export class EntityExtractor {
  // Extraer entidades de tablero - MEJORADO
  static extractTableroEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}

    console.log("Extrayendo entidades de tablero del mensaje:", message)

    // Extraer nombre del tablero para crear/eliminar
    const nombreMatch =
      message.match(/tablero\s+(?:llamado|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"/i) ||
      message.match(/tablero\s+(?:llamado|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)/i) ||
      message.match(/tablero\s+"([^"]+)"/i) ||
      message.match(/tablero\s+([^\s",.]+)/i)

    if (nombreMatch) {
      facts.entities.tablero_nombre = nombreMatch[1]
      console.log("Nombre de tablero encontrado:", facts.entities.tablero_nombre)
    }

    // Para modificar tablero - detectar nombre actual y nuevo nombre con "por" o "a" - MEJORADO
    // Primero intentamos con patrones específicos para "por"
    const cambiarNombrePorPatrones = [
      // Patrones con comillas
      /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      /renombrar?\s+(?:el\s+)?tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /renombrar?\s+(?:el\s+)?tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /renombrar?\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /renombrar?\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+)?tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+)?tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+)?tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+)?tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      // Patrones más directos
      /cambia\s+(?:el\s+)?tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /cambia\s+(?:el\s+)?tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /cambia\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /cambia\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      // Patrones sin "nombre"
      /cambiar?\s+tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /cambiar?\s+tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /cambiar?\s+tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /cambiar?\s+tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
    ]

    for (const patron of cambiarNombrePorPatrones) {
      const match = message.match(patron)
      if (match && match[1] && match[2]) {
        facts.entities.tablero_nombre_actual = match[1].trim()
        facts.entities.tablero_nombre_nuevo = match[2].trim()
        console.log(
          "Nombre actual y nuevo encontrados con 'por':",
          facts.entities.tablero_nombre_actual,
          "->",
          facts.entities.tablero_nombre_nuevo,
        )
        break
      }
    }

    // Si no se encontró con "por", intentar con "a"
    if (!facts.entities.tablero_nombre_nuevo) {
      const cambiarNombreAPatrones = [
        // Patrones completos con "nombre"
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
        /renombrar?\s+(?:el\s+)?tablero\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
        /renombrar?\s+(?:el\s+)?tablero\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
        /renombrar?\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
        /renombrar?\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
        // Patrones más directos
        /cambia\s+(?:el\s+)?tablero\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
        /cambia\s+(?:el\s+)?tablero\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
        /cambia\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
        /cambia\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
        // Patrones sin "nombre"
        /cambiar?\s+tablero\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
        /cambiar?\s+tablero\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
        /cambiar?\s+tablero\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
        /cambiar?\s+tablero\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
        // Patrones solo con nuevo nombre
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+a\s+"([^"]+)"/i,
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+a\s+([^\s",.]+)/i,
        /renombrar?\s+(?:el\s+)?tablero\s+a\s+"([^"]+)"/i,
        /renombrar?\s+(?:el\s+)?tablero\s+a\s+([^\s",.]+)/i,
        /cambiar?\s+tablero\s+a\s+"([^"]+)"/i,
        /cambiar?\s+tablero\s+a\s+([^\s",.]+)/i,
        /nombre\s+(?:del\s+)?tablero\s+a\s+"([^"]+)"/i,
        /nombre\s+(?:del\s+)?tablero\s+a\s+([^\s",.]+)/i,
      ]

      for (const patron of cambiarNombreAPatrones) {
        const match = message.match(patron)
        if (match) {
          if (match[2]) {
            // Patrón con nombre actual y nuevo
            facts.entities.tablero_nombre_actual = match[1].trim()
            facts.entities.tablero_nombre_nuevo = match[2].trim()
            console.log(
              "Nombre actual y nuevo encontrados con 'a':",
              facts.entities.tablero_nombre_actual,
              "->",
              facts.entities.tablero_nombre_nuevo,
            )
          } else if (match[1]) {
            // Solo nuevo nombre
            facts.entities.tablero_nombre_nuevo = match[1].trim()
            console.log("Nuevo nombre de tablero encontrado con 'a':", facts.entities.tablero_nombre_nuevo)
          }
          break
        }
      }
    }

    // Extraer descripción si existe
    const descripcionMatch = message.match(/descripción\s+"([^"]+)"/i) || message.match(/descripción\s+([^\s"]+)/i)

    if (descripcionMatch) {
      facts.entities.tablero_descripcion = descripcionMatch[1]
    }

    console.log("Entidades de tablero extraídas:", facts.entities)
  }

  // Extraer entidades de columna
  static extractColumnaEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}
    console.log("Extrayendo entidades de columna del mensaje:", message)

    // Extraer nombre de la columna para crear/eliminar - Patrones mejorados
    const patronesNombre = [
      /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"/i,
      /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)/i,
      /columna\s+llamada\s+([^\s",.]+)/i,
      /crear\s+columna\s+([^\s",.]+)/i,
      /crea\s+columna\s+([^\s",.]+)/i,
      /nueva\s+columna\s+([^\s",.]+)/i,
    ]

    for (const patron of patronesNombre) {
      const match = message.match(patron)
      if (match && match[1]) {
        console.log(`Nombre de columna encontrado con patrón ${patron}: ${match[1]}`)
        facts.entities.columna_nombre = match[1]
        break
      }
    }

    // Si no se encontró con los patrones anteriores, buscar después de "llamada"
    if (!facts.entities.columna_nombre && message.toLowerCase().includes("llamada")) {
      const partes = message.toLowerCase().split("llamada")
      if (partes.length > 1 && partes[1].trim()) {
        const nombrePosible = partes[1].trim().split(/\s+/)[0]
        if (nombrePosible) {
          console.log(`Nombre de columna extraído después de "llamada": ${nombrePosible}`)
          facts.entities.columna_nombre = nombrePosible
        }
      }
    }

    // Para modificar columna
    const nombreActualMatch =
      message.match(/columna\s+(?:llamada|que\s+se\s+llama|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"\s+a/i) ||
      message.match(/columna\s+(?:llamada|que\s+se\s+llama|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)\s+a/i)

    const nombreNuevoMatch = message.match(/a\s+"([^"]+)"/i) || message.match(/a\s+([^\s"]+)$/i)

    if (nombreActualMatch) {
      facts.entities.columna_nombre_actual = nombreActualMatch[1]
    }

    if (nombreNuevoMatch) {
      facts.entities.columna_nombre_nuevo = nombreNuevoMatch[1]
    }

    console.log("Entidades de columna extraídas:", facts.entities)
  }

  // EXTRACCIÓN MEJORADA DE ENTIDADES DE TAREA
  static extractTareaEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}
    console.log("Extrayendo entidades de tarea del mensaje:", message)

    // EXTRAER TÍTULO DE TAREA - MEJORADO
    if (!facts.entities.tarea_titulo) {
      // Patrones con comillas (alta prioridad)
      const patronesConComillas = [
        /tarea\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?(?:nombre|título)(?:\s+de)?)\s+"([^"]+)"/i,
        /tarea\s+"([^"]+)"/i,
        /crear?\s+(?:una\s+)?tarea\s+"([^"]+)"/i,
        /crea\s+(?:una\s+)?tarea\s+"([^"]+)"/i,
        /nueva\s+tarea\s+"([^"]+)"/i,
        /añadir?\s+(?:una\s+)?tarea\s+"([^"]+)"/i,
        /agregar?\s+(?:una\s+)?tarea\s+"([^"]+)"/i,
        /eliminar?\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
        /borrar?\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
        /modificar?\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
        /cambiar?\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
        /mover?\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
        /completar?\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
      ]

      for (const patron of patronesConComillas) {
        const match = message.match(patron)
        if (match && match[1]) {
          facts.entities.tarea_titulo = match[1].trim()
          console.log(`Título de tarea encontrado con comillas: "${facts.entities.tarea_titulo}"`)
          break
        }
      }

      // Si no se encontró con comillas, buscar sin comillas
      if (!facts.entities.tarea_titulo) {
        const patronesSinComillas = [
          /tarea\s+(?:llamada|que\s+se\s+llame)\s+([^"]+?)(?:\s+en\s+|\s+a\s+|\s+con\s+|\s*$)/i,
          /crear?\s+(?:una\s+)?tarea\s+([^"]+?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
          /crea\s+(?:una\s+)?tarea\s+([^"]+?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
          /nueva\s+tarea\s+([^"]+?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
          /añadir?\s+(?:una\s+)?tarea\s+([^"]+?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
          /agregar?\s+(?:una\s+)?tarea\s+([^"]+?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
          /eliminar?\s+(?:la\s+)?tarea\s+([^"]+?)(?:\s*$)/i,
          /borrar?\s+(?:la\s+)?tarea\s+([^"]+?)(?:\s*$)/i,
          /modificar?\s+(?:la\s+)?tarea\s+([^"]+?)(?:\s+a\s+|\s*$)/i,
          /cambiar?\s+(?:la\s+)?tarea\s+([^"]+?)(?:\s+a\s+|\s*$)/i,
          /mover?\s+(?:la\s+)?tarea\s+([^"]+?)(?:\s+a\s+|\s*$)/i,
          /completar?\s+(?:la\s+)?tarea\s+([^"]+?)(?:\s*$)/i,
          /tarea\s+([^"]+?)(?:\s+en\s+|\s+a\s+|\s+con\s+|\s*$)/i,
        ]

        for (const patron of patronesSinComillas) {
          const match = message.match(patron)
          if (match && match[1]) {
            const titulo = match[1].trim()
            // Filtrar palabras comunes que no deberían ser títulos
            if (!["nueva", "llamada", "que", "con", "la", "el", "una", "un"].includes(titulo.toLowerCase())) {
              facts.entities.tarea_titulo = titulo
              console.log(`Título de tarea encontrado sin comillas: "${facts.entities.tarea_titulo}"`)
              break
            }
          }
        }
      }
    }

    // EXTRAER COLUMNA ESPECÍFICA PARA LA TAREA
    if (message.toLowerCase().includes(" en ")) {
      const patronesColumna = [
        /en\s+(?:la\s+)?columna\s+"([^"]+)"/i,
        /en\s+(?:la\s+)?columna\s+([^"]+?)(?:\s+con\s+|\s+para\s+|\s*$)/i,
        /en\s+"([^"]+)"(?:\s+con\s+|\s+para\s+|\s*$)/i,
        /en\s+([^"]+?)(?:\s+con\s+|\s+para\s+|\s*$)/i,
      ]

      for (const patron of patronesColumna) {
        const match = message.match(patron)
        if (match && match[1]) {
          const columna = match[1].trim()
          // Filtrar palabras que no deberían ser nombres de columna
          if (!["la", "el", "una", "un", "con", "para", "de"].includes(columna.toLowerCase())) {
            facts.entities.columna_nombre = columna
            console.log(`Columna para tarea encontrada: "${facts.entities.columna_nombre}"`)
            break
          }
        }
      }
    }

    // EXTRAER ENTIDADES PARA MODIFICAR TAREA
    if (facts.intent === "modificar_tarea") {
      // Buscar título actual y nuevo
      const patronesModificar = [
        /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
        /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+([^"]+?)(?:\s*$)/i,
        /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^"]+?)\s+(?:a|por)\s+"([^"]+)"/i,
        /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^"]+?)\s+(?:a|por)\s+([^"]+?)(?:\s*$)/i,
        /renombrar?\s+(?:la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
        /renombrar?\s+(?:la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+([^"]+?)(?:\s*$)/i,
        /renombrar?\s+(?:la\s+)?tarea\s+([^"]+?)\s+(?:a|por)\s+"([^"]+)"/i,
        /renombrar?\s+(?:la\s+)?tarea\s+([^"]+?)\s+(?:a|por)\s+([^"]+?)(?:\s*$)/i,
      ]

      for (const patron of patronesModificar) {
        const match = message.match(patron)
        if (match && match[1] && match[2]) {
          facts.entities.tarea_titulo_actual = match[1].trim()
          facts.entities.tarea_titulo_nuevo = match[2].trim()
          console.log(
            `Títulos para modificar encontrados: "${facts.entities.tarea_titulo_actual}" -> "${facts.entities.tarea_titulo_nuevo}"`,
          )
          break
        }
      }

      // Si no se encontraron ambos títulos, buscar solo el nuevo
      if (!facts.entities.tarea_titulo_nuevo) {
        const patronesNuevoTitulo = [/(?:a|por)\s+"([^"]+)"(?:\s*$)/i, /(?:a|por)\s+([^"]+?)(?:\s*$)/i]

        for (const patron of patronesNuevoTitulo) {
          const match = message.match(patron)
          if (match && match[1]) {
            facts.entities.tarea_titulo_nuevo = match[1].trim()
            console.log(`Nuevo título encontrado: "${facts.entities.tarea_titulo_nuevo}"`)
            break
          }
        }
      }
    }

    // EXTRAER DESCRIPCIÓN
    const patronesDescripcion = [
      /descripción\s+"([^"]+)"/i,
      /descripción\s+([^"]+?)(?:\s+con\s+|\s+para\s+|\s*$)/i,
      /con\s+descripción\s+"([^"]+)"/i,
      /con\s+descripción\s+([^"]+?)(?:\s+con\s+|\s+para\s+|\s*$)/i,
    ]

    for (const patron of patronesDescripcion) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.tarea_descripcion = match[1].trim()
        console.log(`Descripción encontrada: "${facts.entities.tarea_descripcion}"`)
        break
      }
    }

    // EXTRAER PRIORIDAD
    const patronesPrioridad = [
      /prioridad\s+(alta|media|baja)/i,
      /con\s+prioridad\s+(alta|media|baja)/i,
      /prioridad\s+(high|medium|low)/i,
      /(alta|media|baja)\s+prioridad/i,
    ]

    for (const patron of patronesPrioridad) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.tarea_prioridad = match[1].toLowerCase()
        console.log(`Prioridad encontrada: "${facts.entities.tarea_prioridad}"`)
        break
      }
    }

    // EXTRAER FECHA - usar método específico
    this.extractFechaEntities(facts, message)

    // EXTRAER MIEMBROS
    const patronesMiembros = [
      /miembros?\s+"([^"]+)"/i,
      /miembros?\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /asignar?\s+a\s+"([^"]+)"/i,
      /asignar?\s+a\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /añadir?\s+a\s+"([^"]+)"/i,
      /añadir?\s+a\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /agregar?\s+a\s+"([^"]+)"/i,
      /agregar?\s+a\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
    ]

    for (const patron of patronesMiembros) {
      const match = message.match(patron)
      if (match && match[1]) {
        const miembrosTexto = match[1].trim()
        // Dividir por comas, "y", "e" si hay varios miembros
        facts.entities.tarea_miembros = miembrosTexto
          .split(/\s*[,ye]\s+/)
          .map((m) => m.trim())
          .filter((m) => m.length > 0)
        console.log(`Miembros encontrados:`, facts.entities.tarea_miembros)
        break
      }
    }

    // EXTRAER ACCIÓN PARA MIEMBROS
    if (!facts.entities.accion_miembro && facts.entities.tarea_miembros) {
      const patronesAccion = [
        /(agregar|añadir|asignar|quitar|eliminar|remover)\s+(?:a\s+)?(?:miembros?|[^"]+?)\s+(?:a\s+la\s+)?tarea/i,
        /(agregar|añadir|asignar|quitar|eliminar|remover)\s+miembros?/i,
      ]

      for (const patron of patronesAccion) {
        const match = message.match(patron)
        if (match && match[1]) {
          facts.entities.accion_miembro = match[1].toLowerCase()
          console.log(`Acción de miembro detectada: "${facts.entities.accion_miembro}"`)
          break
        }
      }

      // Si no se detectó una acción específica, asumir "asignar" por defecto
      if (!facts.entities.accion_miembro) {
        facts.entities.accion_miembro = "asignar"
        console.log("Usando acción de miembro por defecto: asignar")
      }
    }

    // EXTRAER COLUMNA DESTINO PARA MOVER TAREA
    if (facts.intent === "mover_tarea") {
      const patronesColumnaDestino = [
        /a\s+(?:la\s+)?columna\s+"([^"]+)"/i,
        /a\s+(?:la\s+)?columna\s+([^"]+?)(?:\s*$)/i,
        /a\s+"([^"]+)"(?:\s*$)/i,
        /a\s+([^"]+?)(?:\s*$)/i,
      ]

      for (const patron of patronesColumnaDestino) {
        const match = message.match(patron)
        if (match && match[1]) {
          const columna = match[1].trim()
          if (!["la", "el", "una", "un"].includes(columna.toLowerCase())) {
            facts.entities.columna_destino = columna
            console.log(`Columna destino encontrada: "${facts.entities.columna_destino}"`)
            break
          }
        }
      }
    }

    console.log("Entidades de tarea extraídas:", facts.entities)
  }

  // Método específico para extraer expresiones de fecha - MEJORADO
  private static extractFechaEntities(facts: Facts, message: string): void {
    console.log("Extrayendo entidades de fecha del mensaje:", message)

    // Patrones mejorados para extraer fechas
    const fechaDirectaPatrones = [
      /fecha\s+(.*?)(?:\s+(?:con|y|para|a|de|en)\s+|$)/i,
      /para\s+(.*?)(?:\s+(?:con|y|para|a|de|en)\s+|$)/i,
      /vence\s+(.*?)(?:\s+(?:con|y|para|a|de|en)\s+|$)/i,
      /vencimiento\s+(.*?)(?:\s+(?:con|y|para|a|de|en)\s+|$)/i,
      /plazo\s+(.*?)(?:\s+(?:con|y|para|a|de|en)\s+|$)/i,
      /programar?\s+para\s+(.*?)(?:\s+(?:con|y|para|a|de|en)\s+|$)/i,
    ]

    let fechaExpresion = null

    // Buscar coincidencias con los patrones directos
    for (const patron of fechaDirectaPatrones) {
      const match = message.match(patron)
      if (match && match[1]) {
        fechaExpresion = match[1].trim()
        console.log(`Expresión de fecha encontrada directamente: "${fechaExpresion}"`)
        break
      }
    }

    // Si no se encontró con los patrones directos, buscar expresiones específicas
    if (!fechaExpresion) {
      // Buscar expresiones relativas simples
      const expresionesRelativas = ["hoy", "mañana", "manana", "pasado mañana", "pasado manana"]
      for (const expr of expresionesRelativas) {
        if (message.toLowerCase().includes(expr)) {
          fechaExpresion = expr
          console.log(`Expresión de fecha relativa encontrada: "${fechaExpresion}"`)
          break
        }
      }
    }

    // Buscar patrones de "en X días/semanas/meses"
    if (!fechaExpresion) {
      const enTiempoPatrones = [/en\s+(\d+)\s+d[ií]as?/i, /en\s+(\d+)\s+semanas?/i, /en\s+(\d+)\s+meses?/i]

      for (const patron of enTiempoPatrones) {
        const match = message.match(patron)
        if (match) {
          fechaExpresion = match[0]
          console.log(`Expresión de fecha "en tiempo" encontrada: "${fechaExpresion}"`)
          break
        }
      }
    }

    // Buscar patrones de "el día X del mes Y"
    if (!fechaExpresion) {
      const diaDelMesMatch = message.match(/(?:el\s+)?(\d{1,2})\s+de\s+([a-zé]+)(?:\s+(?:de\s+)?(\d{4}))?/i)
      if (diaDelMesMatch) {
        fechaExpresion = diaDelMesMatch[0]
        console.log(`Expresión de fecha "día del mes" encontrada: "${fechaExpresion}"`)
      }
    }

    // Buscar patrones de "próximo día de la semana"
    if (!fechaExpresion) {
      const proximoDiaMatch = message.match(/pr[óo]ximo\s+([a-zé]+)/i)
      if (proximoDiaMatch) {
        fechaExpresion = proximoDiaMatch[0]
        console.log(`Expresión de fecha "próximo día" encontrada: "${fechaExpresion}"`)
      }
    }

    // Buscar formatos estándar
    if (!fechaExpresion) {
      const formatoEstandarMatch = message.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/i)
      if (formatoEstandarMatch) {
        fechaExpresion = formatoEstandarMatch[1]
        console.log(`Expresión de fecha formato estándar encontrada: "${fechaExpresion}"`)
      } else {
        const formatoISOMatch = message.match(/\b(\d{4}-\d{1,2}-\d{1,2})\b/i)
        if (formatoISOMatch) {
          fechaExpresion = formatoISOMatch[1]
          console.log(`Expresión de fecha formato ISO encontrada: "${fechaExpresion}"`)
        }
      }
    }

    // Si se encontró una expresión de fecha, intentar analizarla
    if (fechaExpresion) {
      const fechaObjeto = DateParser.parseDate(fechaExpresion)
      if (fechaObjeto) {
        // Guardar tanto la expresión original como la fecha analizada
        facts.entities = facts.entities || {}
        facts.entities.tarea_fecha_expresion = fechaExpresion
        facts.entities.tarea_fecha = DateParser.formatDateISO(fechaObjeto)
        console.log(`Fecha analizada: ${facts.entities.tarea_fecha} (de la expresión: ${fechaExpresion})`)
      } else {
        console.log(`No se pudo analizar la expresión de fecha: ${fechaExpresion}`)
      }
    } else {
      console.log("No se encontró ninguna expresión de fecha en el mensaje")
    }
  }
}
