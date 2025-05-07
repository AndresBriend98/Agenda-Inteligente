const { getCurrentDateTime } = require('../utils/dateUtils');

// Definición de reglas
const messageRules = {
    // Reglas de Procesamiento de Mensajes
    validateEmptyMessage: {
        condition: (msg) => {
            console.log('Validando mensaje vacío:', msg);
            return !msg.content || msg.content.trim().length === 0;
        },
        action: () => ({ type: 'error', message: 'El mensaje no puede estar vacío' })
    },
    validateMessageFormat: {
        condition: (msg) => {
            console.log('Validando formato de mensaje:', msg);
            return typeof msg.content !== 'string';
        },
        action: () => ({ type: 'error', message: 'El mensaje debe ser texto' })
    },
    validateSpecialChars: {
        condition: (msg) => {
            console.log('Validando caracteres especiales:', msg);
            return /[<>{}[\]\\]/.test(msg.content);
        },
        action: (msg) => ({ 
            type: 'clean', 
            message: msg.content.replace(/[<>{}[\]\\]/g, '') 
        })
    }
};

const environmentRules = {
    // Reglas de Validación de Ambiente
    validateEnvironment: {
        condition: (env) => !env.isValid && !env.hasMongoDB,
        action: () => ({ type: 'error', message: 'Error de base de datos' })
    },
    validateConfig: {
        condition: (env) => !env.isValid && !env.hasOpenRouterKey,
        action: () => ({ type: 'error', message: 'Error de configuración' })
    },
    validateServer: {
        condition: (env) => !env.isValid && !env.hasNodeServer,
        action: () => ({ type: 'error', message: 'Error de servidor' })
    }
};

// Funciones auxiliares
function isDueDateNear(date) {
    if (!date) return false;
    const dueDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
}

function isDueDateFar(date) {
    if (!date) return false;
    const dueDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diffDays > 7;
}

// Función para evaluar reglas
function evaluateRules(context, rules) {
    const results = [];
    
    // Evaluar cada regla
    for (const [ruleName, rule] of Object.entries(rules)) {
        if (rule.condition(context)) {
            const result = rule.action(context);
            results.push({
                rule: ruleName,
                ...result
            });
        }
    }
    
    return results;
}

// Función para aplicar reglas
function applyRules(context, type = 'message') {
    const rules = type === 'message' ? messageRules : environmentRules;
    const results = evaluateRules(context, rules);
    
    // Ordenar resultados por prioridad
    results.sort((a, b) => {
        const priorityOrder = {
            'error': 1,
            'request': 2,
            'clean': 3,
            'update': 4
        };
        return priorityOrder[a.type] - priorityOrder[b.type];
    });
    
    return results;
}

module.exports = {
    messageRules,
    environmentRules,
    evaluateRules,
    applyRules
}; 