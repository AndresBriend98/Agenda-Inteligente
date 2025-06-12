import type { Facts, Rule, ActionResult } from "./types"
import { boardRules } from "./rules/board-rules"
import { columnRules } from "./rules/column-rules"
import { taskRules } from "./rules/task-rules"
import { IntentAnalyzer } from "./nlp/intent-analyzer"

// Motor de inferencia
export class InferenceEngine {
  private rules: Rule[] = []
  private facts: Facts

  constructor(facts: Facts) {
    this.facts = facts
    this.initializeRules()
  }

  private initializeRules() {
    // Agregar todas las reglas desde los módulos separados
    this.rules = [...boardRules, ...columnRules, ...taskRules]
  }

  // Método para ejecutar el motor de inferencia
  async run(): Promise<ActionResult> {
    try {
      // Primero, analizar la intención del mensaje
      await IntentAnalyzer.analyzeIntent(this.facts)

      // Filtrar reglas que cumplen con las condiciones
      const applicableRules = this.rules.filter((rule) => rule.condition(this.facts))

      // Si no hay reglas aplicables, devolver mensaje de ayuda
      if (applicableRules.length === 0) {
        return {
          success: false,
          message: IntentAnalyzer.getHelpMessage(this.facts),
          actionTaken: false,
        }
      }

      // Ordenar reglas por prioridad (mayor primero)
      applicableRules.sort((a, b) => b.priority - a.priority)

      // Ejecutar la regla de mayor prioridad
      return await applicableRules[0].action(this.facts)
    } catch (error) {
      console.error("Error en el motor de inferencia:", error)
      return {
        success: false,
        message: "Ocurrió un error al procesar tu solicitud. Por favor, intenta con un comando más simple.",
        actionTaken: false,
      }
    }
  }
}
