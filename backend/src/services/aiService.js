const axios = require('axios');
const { getCurrentDateTime, processRelativeDate } = require('../utils/dateUtils');
const { processSymptom, validateEnvironment, checkAvailableMeans, processPerception, validateAction } = require('./expertSystem');
const { applyRules } = require('./rules');
const Column = require('../models/Column');
const Task = require('../models/Task');
const Member = require('../models/Member');

// Configuración de la API
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = 'http://localhost:5000';
const SITE_NAME = 'Agenda Inteligente';

// Función para validar el mensaje
function validateMessage(message) {
    if (!message) {
        return { isValid: false, error: 'El mensaje no puede estar vacío' };
    }

    if (typeof message !== 'string') {
        return { isValid: false, error: 'El mensaje debe ser texto' };
    }

    if (message.trim().length === 0) {
        return { isValid: false, error: 'El mensaje no puede estar vacío' };
    }

    // Aplicar reglas de validación
    const messageRules = applyRules({
        content: message,
        type: 'string'
    }, 'message');

    const errorRule = messageRules.find(rule => rule.type === 'error');
    if (errorRule) {
        return { isValid: false, error: errorRule.message };
    }

    return { isValid: true };
}

// Función para limpiar el contenido del mensaje
function cleanMessageContent(message) {
    // Aplicar reglas de limpieza
    const messageRules = applyRules({
        content: message,
        type: 'string'
    }, 'message');

    const cleanRule = messageRules.find(rule => rule.type === 'clean');
    return cleanRule ? cleanRule.message : message;
}

// Función para detectar la intención del mensaje
async function detectIntent(message) {
    const intentMessages = [
        {
            role: 'system',
            content: `Eres un experto en entender la intención de los usuarios. Analiza el mensaje y determina:
1. La acción principal (crear, borrar, modificar, mover)
2. El tipo de elemento (columna/tarjeta o tarea)
3. El nombre completo del elemento (incluyendo palabras descriptivas)
4. Cualquier detalle adicional (fecha, prioridad, etc.)

IMPORTANTE:
- Si el mensaje dice "cambiar el título de la tarea X por Y", interpretarlo como MODIFY con type: "task"
- Si el mensaje dice "cambiar el título de la columna X por Y", interpretarlo como MODIFY with type: "column"
- Si el mensaje dice "cambiar el título de X por Y" y X es una tarea existente, interpretarlo como MODIFY with type: "task"
- Si el mensaje dice "cambiar el título de X por Y" y X es una columna existente, interpretarlo como MODIFY with type: "column"
- Para fechas, devolver el texto exacto de la fecha mencionada (ej: "9 de este mes", "10 de mayo", "mañana")
- Captura el nombre COMPLETO del elemento, incluyendo palabras descriptivas
- Para modificaciones, incluye el nuevo nombre en details.newName

Responde SOLO con un objeto JSON en este formato:
{
  "action": "create|delete|modify|move",
  "type": "column|task",
  "name": "nombre completo del elemento",
  "details": {
    "newName": "nuevo nombre (si es una modificación)",
    "status": "nombre de columna (si aplica)",
    "dueDate": "texto exacto de la fecha mencionada",
    "priority": "Alta|Media|Baja (si aplica)",
    "description": "descripción (si aplica)",
    "addMember": "nombre del miembro a agregar (si aplica)",
    "removeMember": "nombre del miembro a eliminar (si aplica)"
  }
}`
        },
        {
            role: 'user',
            content: message
        }
    ];

    const response = await callOpenRouter(intentMessages);
    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanResponse);
}

// Función para hacer llamadas a la API de OpenRouter
async function callOpenRouter(messages, temperature = 0.1) {
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'deepseek/deepseek-prover-v2:free',
        messages,
        temperature,
        max_tokens: 1000,
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME
        }
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Respuesta inválida de la API');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error en llamada a OpenRouter:', error);
    throw new Error(`Error en la API: ${error.message}`);
  }
}

// Función para buscar una columna de forma flexible
async function findColumn(name) {
    // Primero intentar búsqueda exacta
    let column = await Column.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    // Si no se encuentra, intentar búsqueda más flexible
    if (!column) {
        const columns = await Column.find({
            name: { $regex: name, $options: 'i' }
        });

        if (columns.length === 0) {
            throw new Error(`No se encontró la columna "${name}"`);
        } else if (columns.length > 1) {
            throw new Error(`Se encontraron múltiples columnas similares a "${name}". Por favor, sé más específico.`);
        }
        column = columns[0];
    }

    return column;
}

// Función para buscar una tarea de forma flexible
async function findTask(name) {
    // Primero intentar búsqueda exacta
    let task = await Task.findOne({ 
        title: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    // Si no se encuentra, intentar búsqueda más flexible
    if (!task) {
        const tasks = await Task.find({
            title: { $regex: name, $options: 'i' }
        });

        if (tasks.length === 0) {
            throw new Error(`No se encontró la tarea "${name}"`);
        } else if (tasks.length > 1) {
            throw new Error(`Se encontraron múltiples tareas similares a "${name}". Por favor, sé más específico.`);
        }
        task = tasks[0];
    }

    return task;
}

// Función para procesar el mensaje con IA
async function processMessageWithAI(message) {
    try {
        // Validar el mensaje
        const validationResult = validateMessage(message);
        if (!validationResult.isValid) {
            return [];
        }

        // Limpiar el mensaje
        const cleanMessage = cleanMessageContent(message);

        // Detectar la intención
        const intent = await detectIntent(cleanMessage);
        console.log('Intención detectada:', intent);

        // Si la intención es modificar una tarea
        if (intent.action === 'modify' && intent.type === 'task') {
            try {
                // Buscar la tarea existente
                const task = await findTask(intent.name);
                
                // Si se está agregando un miembro
                if (intent.details.addMember) {
                    // Buscar el miembro por nombre
                    const member = await Member.findOne({ 
                        name: { $regex: new RegExp(intent.details.addMember, 'i') }
                    });
                    
                    if (!member) {
                        throw new Error(`No se encontró el miembro "${intent.details.addMember}"`);
                    }

                    // Agregar el miembro a la tarea
                    if (!task.assignedTo.includes(member._id)) {
                        task.assignedTo.push(member._id);
                        await task.save();
                    }

                    return [{
                        type: 'task',
                        action: 'modified',
                        data: await Task.findById(task._id).populate('assignedTo'),
                        message: `Miembro "${member.name}" agregado a la tarea "${task.title}"`
                    }];
                }

                // Si se está removiendo un miembro
                if (intent.details.removeMember) {
                    // Buscar el miembro por nombre
                    const member = await Member.findOne({ 
                        name: { $regex: new RegExp(intent.details.removeMember, 'i') }
                    });
                    
                    if (!member) {
                        throw new Error(`No se encontró el miembro "${intent.details.removeMember}"`);
                    }

                    // Remover el miembro de la tarea
                    task.assignedTo = task.assignedTo.filter(id => id.toString() !== member._id.toString());
                    await task.save();

                    return [{
                        type: 'task',
                        action: 'modified',
                        data: await Task.findById(task._id).populate('assignedTo'),
                        message: `Miembro "${member.name}" removido de la tarea "${task.title}"`
                    }];
                }

                // Si se está modificando el título
                if (intent.details.newName) {
                    // Verificar si el nuevo título ya existe
                    const existingTask = await Task.findOne({ 
                        title: { $regex: new RegExp(`^${intent.details.newName}$`, 'i') },
                        _id: { $ne: task._id }
                    });
                    
                    if (existingTask) {
                        throw new Error(`Ya existe una tarea con el título "${intent.details.newName}"`);
                    }

                    // Actualizar el título de la tarea
                    const oldTitle = task.title;
                    task.title = intent.details.newName;
                    await task.save();

                    return [{
                        type: 'task',
                        action: 'modified',
                        data: task,
                        message: `Tarea renombrada de "${oldTitle}" a "${intent.details.newName}"`
                    }];
                }
                
                // Si se está modificando la prioridad
                if (intent.details.priority) {
                    const oldPriority = task.priority;
                    task.priority = intent.details.priority;
                    await task.save();

                    return [{
                        type: 'task',
                        action: 'modified',
                        data: task,
                        message: `Prioridad de la tarea "${task.title}" cambiada de "${oldPriority}" a "${intent.details.priority}"`
                    }];
                }

                // Si se está modificando la descripción
                if (intent.details.description) {
                    const oldDescription = task.description;
                    task.description = intent.details.description;
                    await task.save();

                    return [{
                        type: 'task',
                        action: 'modified',
                        data: task,
                        message: `Descripción de la tarea "${task.title}" actualizada`
                    }];
                }

                // Si se está modificando la fecha de vencimiento
                if (intent.details.dueDate) {
                    try {
                        const oldDueDate = task.dueDate;
                        
                        // Procesar la fecha
                        let newDueDate;
                        const dateText = intent.details.dueDate.toLowerCase();
                        
                        // Mapeo de nombres de meses a números (0-11)
                        const monthMap = {
                            'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
                            'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
                            'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
                            '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5,
                            '7': 6, '8': 7, '9': 9, '10': 9, '11': 10, '12': 11
                        };

                        // Si es una fecha relativa
                        if (dateText.includes('mañana')) {
                            newDueDate = new Date();
                            newDueDate.setDate(newDueDate.getDate() + 1);
                        } else if (dateText.includes('semana')) {
                            newDueDate = new Date();
                            newDueDate.setDate(newDueDate.getDate() + 7);
                        } else if (dateText.includes('este mes')) {
                            const today = new Date();
                            const [day] = dateText.split(' de este mes');
                            newDueDate = new Date(today.getFullYear(), today.getMonth(), parseInt(day));
                        } else if (dateText.includes('mes que viene')) {
                            const today = new Date();
                            const [day] = dateText.split(' del mes que viene');
                            newDueDate = new Date(today.getFullYear(), today.getMonth() + 1, parseInt(day));
                        } else if (dateText.includes('próximo mes')) {
                            const today = new Date();
                            const [day] = dateText.split(' del próximo mes');
                            newDueDate = new Date(today.getFullYear(), today.getMonth() + 1, parseInt(day));
                        } else if (dateText.includes('siguiente mes')) {
                            const today = new Date();
                            const [day] = dateText.split(' del siguiente mes');
                            newDueDate = new Date(today.getFullYear(), today.getMonth() + 1, parseInt(day));
                        } else {
                            // Procesar diferentes formatos de fecha
                            let day, month;
                            
                            // Formato: "X de [mes]"
                            if (dateText.includes(' de ')) {
                                [day, month] = dateText.split(' de ');
                            }
                            // Formato: "X/[mes]"
                            else if (dateText.includes('/')) {
                                [day, month] = dateText.split('/');
                            }
                            // Formato: "X-[mes]"
                            else if (dateText.includes('-')) {
                                [day, month] = dateText.split('-');
                            }
                            // Formato: solo mes (ej: "julio")
                            else {
                                month = dateText;
                                day = new Date().getDate(); // Usar el día actual
                            }

                            // Convertir el mes a número
                            const monthNumber = monthMap[month.toLowerCase()];
                            if (monthNumber === undefined) {
                                throw new Error(`Mes no válido: ${month}`);
                            }

                            // Crear la fecha
                            newDueDate = new Date(new Date().getFullYear(), monthNumber, parseInt(day));
                        }

                        // Validar que la fecha sea válida
                        if (isNaN(newDueDate.getTime())) {
                            throw new Error('La fecha proporcionada no es válida');
                        }

                        // Actualizar solo la fecha de vencimiento
                        task.dueDate = newDueDate;
                        await task.save();

                        const formatDate = (date) => {
                            return date.toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            });
                        };

                        return [{
                            type: 'task',
                            action: 'modified',
                            data: task,
                            message: `Fecha de vencimiento de la tarea "${task.title}" cambiada de "${oldDueDate ? formatDate(oldDueDate) : 'sin fecha'}" a "${formatDate(newDueDate)}"`
                        }];
                    } catch (error) {
                        console.error('Error al modificar fecha de vencimiento:', error);
                        throw error;
                    }
                }

                throw new Error('No se especificó qué modificar en la tarea');
            } catch (error) {
                console.error('Error al modificar tarea:', error);
                throw error;
            }
        }

        // Si la intención es modificar una columna
        if (intent.action === 'modify' && intent.type === 'column') {
            try {
                // Buscar la columna existente
                const column = await findColumn(intent.name);
                
                // Verificar si el nuevo nombre ya existe
                const existingColumn = await Column.findOne({ 
                    name: { $regex: new RegExp(`^${intent.details.newName}$`, 'i') },
                    _id: { $ne: column._id }
                });
                
                if (existingColumn) {
                    throw new Error(`Ya existe una columna con el nombre "${intent.details.newName}"`);
                }

                // Actualizar el nombre de la columna
                const oldName = column.name;
                column.name = intent.details.newName;
          await column.save();

                // Actualizar las tareas que estaban en esta columna
                await Task.updateMany(
                    { status: oldName },
                    { status: intent.details.newName }
                );

                return [{
                    type: 'column',
                    action: 'modified',
                    data: column,
                    message: `Columna renombrada de "${oldName}" a "${intent.details.newName}"`
                }];
            } catch (error) {
                console.error('Error al modificar columna:', error);
                throw error;
            }
        }

        // Si la intención es eliminar una tarea
        if (intent.action === 'delete' && intent.type === 'task') {
            try {
                // Buscar la tarea existente
                const task = await findTask(intent.name);
                if (!task) {
                    throw new Error(`No se encontró la tarea "${intent.name}"`);
                }

                // Eliminar la tarea
                await Task.findByIdAndDelete(task._id);

                return [{
                    type: 'task',
                    action: 'deleted',
                    data: { name: task.title },
                    message: `Tarea "${task.title}" eliminada correctamente`
                }];
            } catch (error) {
                console.error('Error al eliminar tarea:', error);
                throw error;
            }
        }

        // Si la intención es eliminar una columna
        if (intent.action === 'delete' && intent.type === 'column') {
            try {
                // Buscar la columna existente
                const column = await findColumn(intent.name);
          if (!column) {
            throw new Error(`No se encontró la columna "${intent.name}"`);
          }

                // Actualizar las tareas que estaban en esta columna
          await Task.updateMany(
            { status: column.name },
            { status: 'Pendiente' }
          );

                // Eliminar la columna
          await Column.findByIdAndDelete(column._id);

                return [{
                    type: 'column',
                    action: 'deleted',
                    data: { name: column.name },
                    message: `Columna "${column.name}" eliminada correctamente`
                }];
            } catch (error) {
                console.error('Error al eliminar columna:', error);
                throw error;
            }
        }

        // Si la intención es crear una tarea
        if (intent.action === 'create' && intent.type === 'task') {
            try {
                // Verificar si la columna especificada existe
                let status = 'Pendiente';
                if (intent.details.status) {
                    const column = await Column.findOne({ 
                        name: { $regex: new RegExp(intent.details.status, 'i') } 
                    });
                    if (column) {
                        status = column.name;
                    }
                }

                return [{
                    title: intent.name,
                    description: intent.details.description || "",
                    dueDate: intent.details.dueDate || null,
                    priority: intent.details.priority || "Media",
                    status: status,
                    tags: [],
                    assignedTo: ["Yo"],
                    checklist: [],
                    originalMessage: cleanMessage
                }];
            } catch (error) {
                console.error('Error al crear tarea:', error);
                throw error;
            }
        }

        // Si la intención es crear una columna
        if (intent.action === 'create' && intent.type === 'column') {
            try {
                // Verificar si ya existe una columna con el mismo nombre
                const existingColumn = await Column.findOne({ 
                    name: { $regex: new RegExp(`^${intent.name}$`, 'i') } 
                });

                if (existingColumn) {
                    throw new Error(`Ya existe una columna con el nombre "${intent.name}"`);
                }

                // Obtener el último orden
                const lastColumn = await Column.findOne().sort({ order: -1 });
                const newOrder = lastColumn ? lastColumn.order + 1 : 1;

                // Crear la nueva columna sin color específico
                const newColumn = new Column({
                    name: intent.name,
                    order: newOrder
                });

                await newColumn.save();

                return [{
                    type: 'column',
                    action: 'created',
                    data: newColumn,
                    message: `Columna "${intent.name}" creada correctamente`
                }];
            } catch (error) {
                console.error('Error al crear columna:', error);
                throw error;
            }
        }

        // Procesar con IA para otros casos
        const response = await callOpenRouter([
            {
                role: "system",
                content: `Eres un asistente especializado en gestión de tareas. 
                Analiza el mensaje y genera una respuesta en formato JSON válido (sin markdown).
                La respuesta debe contener solo el JSON, sin caracteres adicionales.
                Si el mensaje es una solicitud de modificación de columna, devuelve un objeto con la estructura:
                {
                    "columns": [
                        {
                            "name": "nuevo_nombre",
                            "color": "color_actual",
                            "order": orden_actual
                        }
                    ]
                }`
      },
      {
                role: "user",
                content: cleanMessage
      }
        ], 0.7);

        // Limpiar la respuesta de la IA de cualquier formato markdown
        let aiResponse = response.trim();
        if (aiResponse.startsWith('```json')) {
            aiResponse = aiResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (aiResponse.startsWith('```')) {
            aiResponse = aiResponse.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        // Parsear la respuesta
        const result = JSON.parse(aiResponse);
        console.log('Respuesta de la IA:', result);

        return result;
    } catch (error) {
        console.error('Error al procesar mensaje con IA:', error);
        throw error;
  }
}

// Función para probar la conexión con la API
async function testOpenRouterConnection() {
  try {
    const messages = [
      {
        role: 'user',
        content: 'Hola, ¿cómo estás?'
      }
    ];

    const response = await callOpenRouter(messages);
    console.log('Prueba de conexión exitosa:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error en prueba de conexión:', error);
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status
    };
  }
}

module.exports = {
  processMessageWithAI,
  testOpenRouterConnection
}; 