const { getCurrentDateTime } = require('../utils/dateUtils');

// Tabla PAMA
const PAMA = {
  perception: [
    'userMessage',
    'dateTime',
    'taskTitle',
    'implicitPriority',
    'categories',
    'assignedPeople',
    'taskDescription',
    'boardState',
    'existingTasks',
    'existingColumns'
  ],
  
  action: [
    'create',
    'delete',
    'modify',
    'move',
    'updateDueDate',
    'assignPriority',
    'addDescription',
    'assignPeople',
    'addTags'
  ],
  
  means: [
    'nlpProcessing',
    'intentAnalysis',
    'dateValidation',
    'dataNormalization',
    'databaseManagement',
    'openRouterAPI',
    'prioritizationSystem',
    'columnManagement',
    'tagSystem',
    'assignmentSystem'
  ],
  
  environment: [
    'mongodb',
    'restAPI',
    'webInterface',
    'nodeServer',
    'aiModel',
    'authSystem',
    'notificationSystem',
    'sessionManagement',
    'cacheSystem',
    'loggingSystem'
  ]
};

// Tabla PyA
const PyA = {
  symptoms: {
    unstructuredMessage: {
      actions: [
        { name: 'analyzeNLP', priority: 1 },
        { name: 'validateDateTime', priority: 2 },
        { name: 'normalizeText', priority: 3 }
      ]
    },
    missingDate: {
      actions: [
        { name: 'setDefaultDate', priority: 1 },
        { name: 'requestConfirmation', priority: 2 },
        { name: 'useCurrentDate', priority: 3 }
      ]
    },
    undefinedPriority: {
      actions: [
        { name: 'inferPriority', priority: 1 },
        { name: 'setDefaultPriority', priority: 2 },
        { name: 'useDueDatePriority', priority: 3 }
      ]
    },
    nonExistentColumn: {
      actions: [
        { name: 'createNewColumn', priority: 1 },
        { name: 'suggestSimilarColumn', priority: 2 },
        { name: 'useDefaultColumn', priority: 3 }
      ]
    },
    duplicateTask: {
      actions: [
        { name: 'checkExistence', priority: 1 },
        { name: 'updateExistingTask', priority: 2 },
        { name: 'notifyUser', priority: 3 }
      ]
    }
  }
};

// Función para procesar síntomas y determinar acciones
function processSymptom(symptom, context) {
  if (!PyA.symptoms[symptom]) {
    throw new Error(`Síntoma no reconocido: ${symptom}`);
  }

  const actions = PyA.symptoms[symptom].actions;
  return actions.sort((a, b) => a.priority - b.priority);
}

// Función para validar el ambiente
function validateEnvironment(environment) {
  return PAMA.environment.includes(environment);
}

// Función para verificar medios disponibles
function checkAvailableMeans(means) {
  return PAMA.means.includes(means);
}

// Función para procesar percepción
function processPerception(perception) {
  return PAMA.perception.includes(perception);
}

// Función para validar acción
function validateAction(action) {
  return PAMA.action.includes(action);
}

module.exports = {
  PAMA,
  PyA,
  processSymptom,
  validateEnvironment,
  checkAvailableMeans,
  processPerception,
  validateAction
}; 