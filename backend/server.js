// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Inicializar app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Modelo de columna
const ColumnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    default: '#f5f5f5'
  }
});

const Column = mongoose.model('Column', ColumnSchema);

// Modelo de tarea
const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  dueDate: {
    type: Date,
    required: false
  },
  priority: {
    type: String,
    enum: ['Baja', 'Media', 'Alta'],
    default: 'Media'
  },
  status: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  originalMessage: {
    type: String,
    required: true
  },
  assignedTo: {
    type: [String],
    default: ['Yo']
  },
  checklist: [{
    text: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  tags: {
    type: [String],
    default: []
  }
});

const Task = mongoose.model('Task', TaskSchema);

// Verificar API Key de OpenRouter
if (!process.env.OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY no está configurada en el archivo .env');
  process.exit(1);
}

// Función para obtener la fecha actual formateada
function getCurrentDateTime() {
  const now = new Date();
  // Ajustar a la zona horaria local
  const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  
  return {
    date: localDate.toISOString().split('T')[0], // YYYY-MM-DD
    time: localDate.toTimeString().split(' ')[0], // HH:MM:SS
    full: localDate.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

// Función para procesar fechas relativas
function processRelativeDate(dateStr) {
  const now = new Date();
  // Ajustar a la zona horaria local
  const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  const lowerDateStr = dateStr.toLowerCase();

  // Mapeo de unidades de tiempo en español
  const timeUnits = {
    'hora': 60 * 60 * 1000,
    'horas': 60 * 60 * 1000,
    'día': 24 * 60 * 60 * 1000,
    'días': 24 * 60 * 60 * 1000,
    'semana': 7 * 24 * 60 * 60 * 1000,
    'semanas': 7 * 24 * 60 * 60 * 1000,
    'mes': 30 * 24 * 60 * 60 * 1000,
    'meses': 30 * 24 * 60 * 60 * 1000,
    'año': 365 * 24 * 60 * 60 * 1000,
    'años': 365 * 24 * 60 * 60 * 1000
  };

  // Patrones comunes de fechas relativas
  const patterns = [
    {
      regex: /hoy/i,
      process: () => today
    },
    {
      regex: /(\d+)\s*(hora|horas)/i,
      process: (match) => {
        const hours = parseInt(match[1]);
        return new Date(today.getTime() + hours * timeUnits['hora']);
      }
    },
    {
      regex: /(\d+)\s*(día|días)/i,
      process: (match) => {
        const days = parseInt(match[1]);
        return new Date(today.getTime() + days * timeUnits['día']);
      }
    },
    {
      regex: /(\d+)\s*(semana|semanas)/i,
      process: (match) => {
        const weeks = parseInt(match[1]);
        return new Date(today.getTime() + weeks * timeUnits['semana']);
      }
    },
    {
      regex: /(\d+)\s*(mes|meses)/i,
      process: (match) => {
        const months = parseInt(match[1]);
        return new Date(today.getTime() + months * timeUnits['mes']);
      }
    },
    {
      regex: /mañana/i,
      process: () => new Date(today.getTime() + timeUnits['día'])
    },
    {
      regex: /pasado\s*mañana/i,
      process: () => new Date(today.getTime() + 2 * timeUnits['día'])
    },
    {
      regex: /próxima\s*semana/i,
      process: () => new Date(today.getTime() + timeUnits['semana'])
    },
    {
      regex: /próximo\s*mes/i,
      process: () => new Date(today.getTime() + timeUnits['mes'])
    }
  ];

  // Intentar procesar la fecha relativa
  for (const pattern of patterns) {
    const match = lowerDateStr.match(pattern.regex);
    if (match) {
      const result = pattern.process(match);
      // Asegurar que la fecha resultante esté en la zona horaria local
      return new Date(result.getTime() - (result.getTimezoneOffset() * 60000));
    }
  }

  // Si no es una fecha relativa, intentar parsear como fecha absoluta
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Asegurar que la fecha absoluta esté en la zona horaria local
      return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    }
  } catch (error) {
    console.error('Error al procesar fecha:', error);
  }

  return null;
}

// Función para procesar el mensaje con IA
async function processMessageWithAI(message, existingTask = null) {
  try {
    console.log('Procesando mensaje con IA:', message);
    
    const currentDateTime = getCurrentDateTime();
    console.log('Fecha y hora actual:', currentDateTime.full);

    // Primero verificar si es un comando de gestión
    const managementCommands = {
      deleteColumn: /borra(r|me|mos)?\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      deleteTask: /borra(r|me|mos)?\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
      moveTask: /mueve\s+(?:la\s+)?tarea\s+"([^"]+)"\s+a\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      clearColumn: /limpia(r|me|mos)?\s+(?:la\s+)?columna\s+"([^"]+)"/i
    };

    // Verificar si el mensaje coincide con algún comando
    for (const [command, regex] of Object.entries(managementCommands)) {
      const match = message.match(regex);
      if (match) {
        switch (command) {
          case 'deleteColumn':
            const columnName = match[2];
            const column = await Column.findOne({ name: columnName });
            if (!column) {
              throw new Error(`No se encontró la columna "${columnName}"`);
            }
            // Mover tareas a "Pendiente"
            await Task.updateMany(
              { status: columnName },
              { status: 'Pendiente' }
            );
            await Column.findByIdAndDelete(column._id);
            return { type: 'columnDeleted', columnName };

          case 'deleteTask':
            const taskTitle = match[2];
            const task = await Task.findOne({ title: taskTitle });
            if (!task) {
              throw new Error(`No se encontró la tarea "${taskTitle}"`);
            }
            await Task.findByIdAndDelete(task._id);
            return { type: 'taskDeleted', taskTitle };

          case 'moveTask':
            const [_, taskTitleToMove, targetColumn] = match;
            const taskToMove = await Task.findOne({ title: taskTitleToMove });
            if (!taskToMove) {
              throw new Error(`No se encontró la tarea "${taskTitleToMove}"`);
            }
            const targetColumnExists = await Column.findOne({ name: targetColumn });
            if (!targetColumnExists) {
              throw new Error(`No se encontró la columna "${targetColumn}"`);
            }
            taskToMove.status = targetColumn;
            await taskToMove.save();
            return { type: 'taskMoved', taskTitle: taskTitleToMove, newColumn: targetColumn };

          case 'clearColumn':
            const columnToClear = match[2];
            const columnExists = await Column.findOne({ name: columnToClear });
            if (!columnExists) {
              throw new Error(`No se encontró la columna "${columnToClear}"`);
            }
            await Task.deleteMany({ status: columnToClear });
            return { type: 'columnCleared', columnName: columnToClear };
        }
      }
    }

    // Si no es un comando de gestión, continuar con el procesamiento normal
    const isModification = existingTask !== null;
    const basePrompt = isModification 
      ? `Analiza el siguiente mensaje que solicita modificar una tarea existente.
         FECHA Y HORA ACTUAL: ${currentDateTime.full}
         
         Tarea actual:
         - Título: ${existingTask.title}
         - Descripción: ${existingTask.description}
         - Fecha: ${existingTask.dueDate ? new Date(existingTask.dueDate).toLocaleDateString() : 'Sin fecha'}
         - Prioridad: ${existingTask.priority}
         - Estado: ${existingTask.status}
         - Asignados: ${existingTask.assignedTo.join(', ')}
         - Checklist: ${existingTask.checklist ? existingTask.checklist.map(item => `${item.text} (${item.completed ? '✓' : '□'})`).join(', ') : 'Sin checklist'}
         - Etiquetas: ${existingTask.tags.join(', ') || 'Sin etiquetas'}
         
         Responde SOLO con un objeto JSON que contenga SOLO los campos que deben modificarse.
         Si un campo no debe cambiar, NO lo incluyas en la respuesta.
         
         Ejemplos de modificaciones:
         - "Cambiar la fecha para mañana" → {"dueDate": "YYYY-MM-DD"}
         - "Entregar en una semana" → {"dueDate": "YYYY-MM-DD"}
         - "Aumentar la prioridad" → {"priority": "Alta"}
         - "Agregar a Juan al equipo" → {"assignedTo": ["Yo", "Juan"]}
         - "Cambiar el título a 'Nuevo título'" → {"title": "Nuevo título"}
         - "Marcar 'Hacer diapositivas' como completado" → {"checklist": [{"text": "Hacer diapositivas", "completed": true}]}
         - "Agregar etiqueta 'Urgente'" → {"tags": ["Urgente"]}
         - "Eliminar etiqueta 'Urgente'" → {"tags": ["Trabajo", "Proyecto"]}
         
         Reglas para fechas:
         - La fecha actual es: ${currentDateTime.full}
         - Si el mensaje menciona "mañana", calcula la fecha a partir de ${currentDateTime.date}
         - Si menciona "en X días/semanas/meses", calcula la fecha relativa desde ${currentDateTime.date}
         - Si menciona "próxima semana", calcula la fecha a partir de ${currentDateTime.date}
         - Si menciona "próximo mes", calcula la fecha a partir de ${currentDateTime.date}
         - Siempre devuelve la fecha en formato YYYY-MM-DD
         - Asegúrate de usar el año actual (${new Date().getFullYear()})
         
         Reglas generales:
         - Solo incluye los campos que realmente deben cambiar
         - Para prioridad usa "Alta", "Media" o "Baja"
         - Para estado usa "Pendiente", "En progreso" o "Completada"
         - Para assignedTo incluye siempre el array completo de personas
         - Para checklist, incluye solo los items que cambian
         - Para tags, incluye el array completo de etiquetas después de la modificación
         
         Mensaje: "${message}"
         Responde SOLO con el objeto JSON de modificaciones.`
      : `Analiza el siguiente mensaje y extrae la información de las tareas y columnas mencionadas.
         FECHA Y HORA ACTUAL: ${currentDateTime.full}
         
         IMPORTANTE - DIFERENCIA ENTRE TARJETAS Y TAREAS:
         - Una TARJETA es una columna que agrupa tareas (ej: "Trabajo", "Universidad", "Personal")
         - Una TAREA es una actividad específica que va dentro de una tarjeta
         
         Ejemplos de creación:
         - "Crear una tarjeta para Trabajo" → Crea una nueva columna llamada "Trabajo"
         - "Crear una tarea de hacer informe" → Crea una tarea dentro de una columna existente
         - "Necesito una tarjeta para mis tareas de universidad" → Crea una columna "Universidad"
         - "Tengo que hacer un informe para mañana" → Crea una tarea con fecha para mañana
         
         Responde SOLO en formato JSON con un objeto que contenga dos arrays:
         {
           "tasks": [
             {
               "title": "título corto y profesional (máx. 50 caracteres)",
               "description": "redacción profesional y concisa (máx. 200 caracteres)",
               "assignedTo": ["array de personas mencionadas"],
               "dueDate": "fecha en YYYY-MM-DD o null",
               "priority": "Alta/Media/Baja",
               "status": "nombre de la columna",
               "checklist": [
                 {
                   "text": "texto del paso",
                   "completed": false
                 }
               ],
               "tags": ["array de etiquetas relevantes"]
             }
           ],
           "columns": [
             {
               "name": "nombre de la columna",
               "color": "#f5f5f5",
               "order": número de orden
             }
           ]
         }

         Reglas para fechas:
         - La fecha actual es: ${currentDateTime.full}
         - Si el mensaje menciona "mañana", calcula la fecha a partir de ${currentDateTime.date}
         - Si menciona "en X días/semanas/meses", calcula la fecha relativa desde ${currentDateTime.date}
         - Si menciona "próxima semana", calcula la fecha a partir de ${currentDateTime.date}
         - Si menciona "próximo mes", calcula la fecha a partir de ${currentDateTime.date}
         - Siempre devuelve la fecha en formato YYYY-MM-DD
         - Asegúrate de usar el año actual (${new Date().getFullYear()})
         
         Reglas para columnas (tarjetas):
         1. Crea una columna SOLO si el mensaje menciona explícitamente "tarjeta" o "columna"
         2. Las columnas pueden ser:
            - Estados de trabajo (Pendiente, En progreso, Completada)
            - Categorías de tareas (Trabajo, Personal, Universidad)
            - Prioridades (Urgente, Normal, Baja)
            - Fases de proyecto (Planificación, Desarrollo, Testing)
         3. Todas las columnas deben usar el color #f5f5f5
         4. Mantén un orden lógico de las columnas
         
         Reglas para tareas:
         1. Crea una tarea si el mensaje describe una actividad o acción a realizar
         2. Analiza el contexto y tema de la tarea
         3. Identifica categorías relevantes
         4. Usa etiquetas predefinidas cuando sea posible
         5. Agrega etiquetas específicas cuando sea necesario
         
         Etiquetas predefinidas:
         - "Urgente": para tareas con alta prioridad o fechas cercanas
         - "Trabajo": para tareas relacionadas con el trabajo profesional
         - "Universidad": para tareas académicas o de estudio
         - "Reunión": para tareas que involucran reuniones o presentaciones
         - "Investigación": para tareas de investigación o análisis
         - "Personal": para tareas personales o de ocio
         - "Proyecto": para tareas que son parte de un proyecto más grande
         - "Documentación": para tareas de documentación o escritura
         - "Desarrollo": para tareas de programación o desarrollo
         - "Diseño": para tareas de diseño o creativas
         
         IMPORTANTE:
         - Si el mensaje menciona "tarjeta" o "columna", crea una nueva columna
         - Si el mensaje describe una actividad, crea una tarea
         - Las tareas siempre deben ir dentro de una columna existente
         - Usa etiquetas relevantes y específicas
         - No agregues más de 5 etiquetas por tarea
         - Las etiquetas deben ser concisas (1-2 palabras)
         - Usa mayúsculas solo en la primera letra
         - Mantén las columnas por defecto si no hay sugerencia de nuevas
         
         Mensaje: "${message}"
         Responde SOLO con el objeto JSON.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/chatgpt-4o-latest',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en productividad. Extraes tareas de mensajes y las estructuras en formato JSON para una app de gestión tipo Trello.'
        },
        {
          role: 'user',
          content: basePrompt
        },
        {
          role: 'user',
          content: `Mensaje: "${message}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 800,
      top_p: 0.95,
      frequency_penalty: 0.2,
      presence_penalty: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'Task Manager'
      }
    });

    console.log('Respuesta completa de la API:', JSON.stringify(response.data, null, 2));

    if (!response.data) {
      throw new Error('La respuesta de la API está vacía');
    }

    if (!response.data.choices) {
      throw new Error('La respuesta no contiene choices');
    }

    if (!response.data.choices[0]) {
      throw new Error('No hay choices en la respuesta');
    }

    if (!response.data.choices[0].message) {
      throw new Error('No hay mensaje en la respuesta');
    }

    const responseText = response.data.choices[0].message.content;
    console.log('Respuesta de IA:', responseText);

    // Extraer el JSON de la respuesta
    const jsonMatch = responseText.match(isModification ? /\{[\s\S]*\}/ : /\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer la información de la respuesta de IA');
    }

    let data;
    try {
      const cleanJson = jsonMatch[0]
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .trim();

      data = JSON.parse(cleanJson);
      console.log('JSON parseado:', data);

      // Validar la estructura del JSON
      if (!isModification && (!data.tasks || !Array.isArray(data.tasks))) {
        throw new Error('Formato de respuesta inválido: falta el array de tareas');
      }
    } catch (error) {
      console.error('Error al parsear JSON:', error);
      throw new Error('Error al procesar la respuesta de IA: JSON inválido');
    }

    if (isModification) {
      // Procesar modificaciones
      const modifications = data;
      const updatedTask = { ...existingTask.toObject() };

      if (modifications.title) updatedTask.title = modifications.title;
      if (modifications.description) updatedTask.description = modifications.description;
      if (modifications.priority) updatedTask.priority = modifications.priority;
      if (modifications.status) updatedTask.status = modifications.status;
      if (modifications.assignedTo) updatedTask.assignedTo = modifications.assignedTo;
      
      if (modifications.checklist) {
        const existingChecklist = updatedTask.checklist || [];
        modifications.checklist.forEach(modifiedItem => {
          const existingItem = existingChecklist.find(item => item.text === modifiedItem.text);
          if (existingItem) {
            existingItem.completed = modifiedItem.completed;
          } else {
            existingChecklist.push(modifiedItem);
          }
        });
        updatedTask.checklist = existingChecklist;
      }

      if (modifications.tags) {
        // Reemplazar completamente el array de etiquetas
        updatedTask.tags = modifications.tags;
      }
      
      if (modifications.dueDate) {
        try {
          const processedDate = processRelativeDate(modifications.dueDate);
          if (processedDate) {
            updatedTask.dueDate = processedDate;
          }
        } catch (error) {
          console.error('Error al procesar la fecha:', error);
        }
      }

      return updatedTask;
    } else {
      // Procesar nuevas tareas y columnas
      const { tasks: tasksData, columns: columnsData } = data;

      // Crear nuevas columnas si existen
      if (columnsData && columnsData.length > 0) {
        for (const columnData of columnsData) {
          await Column.findOneAndUpdate(
            { name: columnData.name },
            columnData,
            { upsert: true, new: true }
          );
        }
      }

      // Procesar tareas
      return await Promise.all(tasksData.map(async (taskData) => {
        let dueDate = null;
        if (taskData.dueDate && taskData.dueDate !== 'null') {
          try {
            const cleanDate = taskData.dueDate.replace(/[^0-9-]/g, '');
            const parsedDate = new Date(cleanDate);
            if (!isNaN(parsedDate.getTime())) {
              dueDate = parsedDate;
            }
          } catch (error) {
            console.error('Error al procesar la fecha:', error);
          }
        }

        let priority = taskData.priority || 'Media';
        if (dueDate) {
          const today = new Date();
          const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) priority = 'Alta';
          else if (diffDays <= 3) priority = 'Media';
          else priority = 'Baja';
        }

        return {
          title: taskData.title || message,
          description: taskData.description || '',
          dueDate: dueDate,
          priority: priority,
          status: taskData.status || 'Pendiente',
          assignedTo: taskData.assignedTo || ['Yo'],
          originalMessage: message,
          checklist: taskData.checklist || [],
          tags: taskData.tags || []
        };
      }));
    }
  } catch (error) {
    console.error('Error al procesar con IA:', error);
    throw new Error(`Error al procesar el mensaje: ${error.message}`);
  }
}

// Función para verificar si es un comando de gestión
async function processManagementCommand(message) {
  const managementCommands = {
    deleteColumn: /borra(r|me|mos)?\s+(?:la\s+)?columna\s+"([^"]+)"/i,
    deleteTask: /borra(r|me|mos)?\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
    moveTask: /mueve\s+(?:la\s+)?tarea\s+"([^"]+)"\s+a\s+(?:la\s+)?columna\s+"([^"]+)"/i,
    clearColumn: /limpia(r|me|mos)?\s+(?:la\s+)?columna\s+"([^"]+)"/i
  };

  for (const [command, regex] of Object.entries(managementCommands)) {
    const match = message.match(regex);
    if (match) {
      switch (command) {
        case 'deleteColumn':
          const columnName = match[2];
          const column = await Column.findOne({ name: columnName });
          if (!column) {
            throw new Error(`No se encontró la columna "${columnName}"`);
          }
          // Mover tareas a "Pendiente"
          await Task.updateMany(
            { status: columnName },
            { status: 'Pendiente' }
          );
          await Column.findByIdAndDelete(column._id);
          return { type: 'columnDeleted', columnName };

        case 'deleteTask':
          const taskTitle = match[2];
          const task = await Task.findOne({ title: taskTitle });
          if (!task) {
            throw new Error(`No se encontró la tarea "${taskTitle}"`);
          }
          await Task.findByIdAndDelete(task._id);
          return { type: 'taskDeleted', taskTitle };

        case 'moveTask':
          const [_, taskTitleToMove, targetColumn] = match;
          const taskToMove = await Task.findOne({ title: taskTitleToMove });
          if (!taskToMove) {
            throw new Error(`No se encontró la tarea "${taskTitleToMove}"`);
          }
          const targetColumnExists = await Column.findOne({ name: targetColumn });
          if (!targetColumnExists) {
            throw new Error(`No se encontró la columna "${targetColumn}"`);
          }
          taskToMove.status = targetColumn;
          await taskToMove.save();
          return { type: 'taskMoved', taskTitle: taskTitleToMove, newColumn: targetColumn };

        case 'clearColumn':
          const columnToClear = match[2];
          const columnExists = await Column.findOne({ name: columnToClear });
          if (!columnExists) {
            throw new Error(`No se encontró la columna "${columnToClear}"`);
          }
          await Task.deleteMany({ status: columnToClear });
          return { type: 'columnCleared', columnName: columnToClear };
      }
    }
  }
  return null;
}

// Modificar la ruta para manejar los comandos de gestión
app.post('/api/process-message', async (req, res) => {
  try {
    const { message, taskId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }

    // Primero verificar si es un comando de gestión
    const managementResult = await processManagementCommand(message);
    if (managementResult) {
      switch (managementResult.type) {
        case 'columnDeleted':
          return res.json({ message: `Columna "${managementResult.columnName}" eliminada correctamente` });
        case 'taskDeleted':
          return res.json({ message: `Tarea "${managementResult.taskTitle}" eliminada correctamente` });
        case 'taskMoved':
          return res.json({ message: `Tarea "${managementResult.taskTitle}" movida a la columna "${managementResult.newColumn}"` });
        case 'columnCleared':
          return res.json({ message: `Columna "${managementResult.columnName}" limpiada correctamente` });
      }
    }
    
    // Si no es un comando de gestión, continuar con el procesamiento normal
    if (taskId) {
      const existingTask = await Task.findById(taskId);
      if (!existingTask) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      const updatedTaskData = await processMessageWithAI(message, existingTask);
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        updatedTaskData,
        { new: true }
      );
      res.json(updatedTask);
    } else {
      const tasksData = await processMessageWithAI(message);
      const createdTasks = await Promise.all(
        tasksData.map(taskData => new Task(taskData).save())
      );
      res.status(201).json(createdTasks);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las tareas
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Actualizar una tarea
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
});

// Eliminar una tarea
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

// Rutas para columnas
app.get('/api/columns', async (req, res) => {
  try {
    const columns = await Column.find().sort({ order: 1 });
    res.json(columns);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener columnas' });
  }
});

app.post('/api/columns', async (req, res) => {
  try {
    const { name, color } = req.body;
    const lastColumn = await Column.findOne().sort({ order: -1 });
    const order = lastColumn ? lastColumn.order + 1 : 0;

    const column = new Column({
      name,
      order,
      color: color || '#f5f5f5'
    });

    await column.save();
    res.status(201).json(column);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear columna' });
  }
});

app.put('/api/columns/:id', async (req, res) => {
  try {
    const { name, color, order } = req.body;
    const column = await Column.findByIdAndUpdate(
      req.params.id,
      { name, color, order },
      { new: true }
    );
    res.json(column);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar columna' });
  }
});

app.delete('/api/columns/:id', async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) {
      return res.status(404).json({ error: 'Columna no encontrada' });
    }

    // Mover tareas a la columna "Pendiente"
    await Task.updateMany(
      { status: column.name },
      { status: 'Pendiente' }
    );

    await Column.findByIdAndDelete(req.params.id);
    res.json({ message: 'Columna eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar columna' });
  }
});

// Inicializar columnas por defecto
async function initializeDefaultColumns() {
  try {
    const defaultColumns = [
      { name: 'Pendiente', order: 0, color: '#f5f5f5' },
      { name: 'En progreso', order: 1, color: '#f5f5f5' },
      { name: 'Completada', order: 2, color: '#f5f5f5' }
    ];

    for (const column of defaultColumns) {
      await Column.findOneAndUpdate(
        { name: column.name },
        column,
        { upsert: true, new: true }
      );
    }
    console.log('Columnas por defecto inicializadas');
  } catch (error) {
    console.error('Error al inicializar columnas por defecto:', error);
  }
}

// Llamar a la inicialización después de conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('MongoDB conectado');
    initializeDefaultColumns();
  })
  .catch(err => {
    console.error('Error de conexión a MongoDB:', err);
    process.exit(1);
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});