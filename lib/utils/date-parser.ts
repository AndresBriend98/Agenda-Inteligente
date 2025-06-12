/**
 * Utilidad para analizar expresiones de fecha en lenguaje natural
 */
export class DateParser {
  /**
   * Analiza una expresión de fecha en lenguaje natural y devuelve un objeto Date
   * @param expression Expresión de fecha (ej: "hoy", "mañana", "en 7 días", "el 15 de mayo")
   * @returns Objeto Date o null si no se pudo analizar
   */
  static parseDate(expression: string): Date | null {
    if (!expression) return null

    console.log("Analizando expresión de fecha:", expression)
    const expressionLower = expression.toLowerCase().trim()
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalizar a inicio del día

    // Expresiones relativas simples
    if (expressionLower === "hoy") {
      console.log("Fecha reconocida: HOY")
      return today
    }

    if (expressionLower === "mañana" || expressionLower === "manana") {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      console.log("Fecha reconocida: MAÑANA", tomorrow)
      return tomorrow
    }

    if (expressionLower === "pasado mañana" || expressionLower === "pasado manana") {
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      console.log("Fecha reconocida: PASADO MAÑANA", dayAfterTomorrow)
      return dayAfterTomorrow
    }

    // Expresiones "en X días/semanas/meses"
    const enDiasMatch = expressionLower.match(/en\s+(\d+)\s+d[ií]as?/)
    if (enDiasMatch && enDiasMatch[1]) {
      const dias = Number.parseInt(enDiasMatch[1], 10)
      const fecha = new Date(today)
      fecha.setDate(fecha.getDate() + dias)
      console.log(`Fecha reconocida: EN ${dias} DÍAS`, fecha)
      return fecha
    }

    const enSemanasMatch = expressionLower.match(/en\s+(\d+)\s+semanas?/)
    if (enSemanasMatch && enSemanasMatch[1]) {
      const semanas = Number.parseInt(enSemanasMatch[1], 10)
      const fecha = new Date(today)
      fecha.setDate(fecha.getDate() + semanas * 7)
      console.log(`Fecha reconocida: EN ${semanas} SEMANAS`, fecha)
      return fecha
    }

    const enMesesMatch = expressionLower.match(/en\s+(\d+)\s+meses?/)
    if (enMesesMatch && enMesesMatch[1]) {
      const meses = Number.parseInt(enMesesMatch[1], 10)
      const fecha = new Date(today)
      fecha.setMonth(fecha.getMonth() + meses)
      console.log(`Fecha reconocida: EN ${meses} MESES`, fecha)
      return fecha
    }

    // Expresiones "el día X del mes Y"
    const diaDelMesMatch = expressionLower.match(/(?:el\s+)?(\d{1,2})\s+de\s+([a-zé]+)(?:\s+(?:de\s+)?(\d{4}))?/)
    if (diaDelMesMatch) {
      const dia = Number.parseInt(diaDelMesMatch[1], 10)
      const mesNombre = diaDelMesMatch[2]
      const año = diaDelMesMatch[3] ? Number.parseInt(diaDelMesMatch[3], 10) : today.getFullYear()

      const meses: { [key: string]: number } = {
        enero: 0,
        febrero: 1,
        marzo: 2,
        abril: 3,
        mayo: 4,
        junio: 5,
        julio: 6,
        agosto: 7,
        septiembre: 8,
        setiembre: 8,
        octubre: 9,
        noviembre: 10,
        diciembre: 11,
      }

      if (meses[mesNombre] !== undefined) {
        const fecha = new Date(año, meses[mesNombre], dia)
        console.log(`Fecha reconocida: ${dia} DE ${mesNombre.toUpperCase()} DE ${año}`, fecha)
        return fecha
      }
    }

    // Expresiones "próximo lunes/martes/etc."
    const proximoDiaMatch = expressionLower.match(/pr[óo]ximo\s+([a-zé]+)/)
    if (proximoDiaMatch) {
      const diaSemana = proximoDiaMatch[1]
      const diasSemana: { [key: string]: number } = {
        lunes: 1,
        martes: 2,
        miércoles: 3,
        miercoles: 3,
        jueves: 4,
        viernes: 5,
        sábado: 6,
        sabado: 6,
        domingo: 0,
      }

      if (diasSemana[diaSemana] !== undefined) {
        const fecha = new Date(today)
        const diaActual = fecha.getDay()
        let diasHasta = diasSemana[diaSemana] - diaActual

        if (diasHasta <= 0) {
          diasHasta += 7 // Si el día ya pasó esta semana, ir al de la próxima
        }

        fecha.setDate(fecha.getDate() + diasHasta)
        console.log(`Fecha reconocida: PRÓXIMO ${diaSemana.toUpperCase()}`, fecha)
        return fecha
      }
    }

    // Formatos de fecha estándar (DD/MM/YYYY o YYYY-MM-DD)
    const formatoEstandarMatch = expressionLower.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (formatoEstandarMatch) {
      const dia = Number.parseInt(formatoEstandarMatch[1], 10)
      const mes = Number.parseInt(formatoEstandarMatch[2], 10) - 1 // Los meses en JS van de 0 a 11
      const año = Number.parseInt(formatoEstandarMatch[3], 10)

      const fecha = new Date(año, mes, dia)
      console.log(`Fecha reconocida: FORMATO DD/MM/YYYY`, fecha)
      return fecha
    }

    const formatoISOMatch = expressionLower.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (formatoISOMatch) {
      const año = Number.parseInt(formatoISOMatch[1], 10)
      const mes = Number.parseInt(formatoISOMatch[2], 10) - 1 // Los meses en JS van de 0 a 11
      const dia = Number.parseInt(formatoISOMatch[3], 10)

      const fecha = new Date(año, mes, dia)
      console.log(`Fecha reconocida: FORMATO YYYY-MM-DD`, fecha)
      return fecha
    }

    // Intentar reconocer solo números como día del mes actual
    const soloDiaMatch = expressionLower.match(/^(\d{1,2})$/)
    if (soloDiaMatch) {
      const dia = Number.parseInt(soloDiaMatch[1], 10)
      if (dia >= 1 && dia <= 31) {
        const fecha = new Date(today)
        fecha.setDate(dia)
        console.log(`Fecha reconocida: DÍA ${dia} DEL MES ACTUAL`, fecha)
        return fecha
      }
    }

    // Si no se pudo analizar la expresión
    console.log("No se pudo analizar la expresión de fecha:", expressionLower)
    return null
  }

  /**
   * Formatea una fecha en formato legible (DD/MM/YYYY)
   * @param date Fecha a formatear
   * @returns Cadena con la fecha formateada
   */
  static formatDate(date: Date): string {
    if (!date) return ""

    const dia = date.getDate().toString().padStart(2, "0")
    const mes = (date.getMonth() + 1).toString().padStart(2, "0")
    const año = date.getFullYear()

    return `${dia}/${mes}/${año}`
  }

  /**
   * Formatea una fecha en formato ISO (YYYY-MM-DD)
   * @param date Fecha a formatear
   * @returns Cadena con la fecha formateada en ISO
   */
  static formatDateISO(date: Date): string {
    if (!date) return ""

    const dia = date.getDate().toString().padStart(2, "0")
    const mes = (date.getMonth() + 1).toString().padStart(2, "0")
    const año = date.getFullYear()

    return `${año}-${mes}-${dia}`
  }
}
