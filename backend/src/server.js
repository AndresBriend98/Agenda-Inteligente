require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { processMessageWithAI, testOpenRouterConnection } = require('./services/aiService');
const Task = require('./models/Task');
const Column = require('./models/Column');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a la base de datos
connectDB();

// Rutas
app.post('/api/process-message', async (req, res) => {
  try {
    const { message, taskId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    console.log('Mensaje recibido:', message);

    let result;
    if (taskId) {
      const existingTask = await Task.findById(taskId);
      if (!existingTask) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      result = await processMessageWithAI(message, existingTask);
      await Task.findByIdAndUpdate(taskId, result);
    } else {
      result = await processMessageWithAI(message);
      console.log('Resultado de processMessageWithAI:', JSON.stringify(result, null, 2));

      // Si es un comando de gestión, devolver la respuesta directamente
      if (result.type) {
        let responseMessage = '';
        switch (result.type) {
          case 'columnDeleted':
            responseMessage = `Columna "${result.columnName}" eliminada correctamente`;
            break;
          case 'taskDeleted':
            responseMessage = `Tarea "${result.taskTitle}" eliminada correctamente`;
            break;
          case 'taskMoved':
            responseMessage = `Tarea "${result.taskTitle}" movida a la columna "${result.newColumn}"`;
            break;
          case 'columnCleared':
            responseMessage = `Columna "${result.columnName}" limpiada correctamente`;
            break;
          case 'taskRenamed':
            responseMessage = `Tarea renombrada de "${result.oldTitle}" a "${result.newTitle}"`;
            break;
          case 'columnRenamed':
            responseMessage = `Columna renombrada de "${result.oldName}" a "${result.newName}"`;
            break;
          case 'priorityChanged':
            responseMessage = `Prioridad de la tarea "${result.taskTitle}" cambiada a "${result.newPriority}"`;
            break;
          case 'tagAdded':
            responseMessage = `Etiqueta "${result.tag}" agregada a la tarea "${result.taskTitle}"`;
            break;
          case 'tagRemoved':
            responseMessage = `Etiqueta "${result.tag}" removida de la tarea "${result.taskTitle}"`;
            break;
          case 'checklistAdded':
            responseMessage = `Paso "${result.item}" agregado a la tarea "${result.taskTitle}"`;
            break;
          case 'checklistCompleted':
            responseMessage = `Paso "${result.item}" marcado como completado en la tarea "${result.taskTitle}"`;
            break;
          case 'taskAssigned':
            responseMessage = `Tarea "${result.taskTitle}" asignada a "${result.assignee}"`;
            break;
        }
        return res.json({ message: responseMessage, type: result.type });
      }

      // Si no es un comando de gestión, procesar como tarea normal
      if (!result || !Array.isArray(result)) {
        console.error('Resultado inválido:', result);
        return res.status(500).json({ error: 'Formato de respuesta inválido' });
      }

      // Crear tareas
      const tasks = [];
      for (const taskData of result) {
        try {
          // Verificar si la columna existe, si no, usar 'Pendiente'
          const columnExists = await Column.findOne({ name: taskData.status });
          if (!columnExists) {
            taskData.status = 'Pendiente';
          }

          // Asegurar que assignedTo tenga al menos un valor
          if (!taskData.assignedTo || taskData.assignedTo.length === 0) {
            taskData.assignedTo = ['Yo'];
          }

          const task = new Task(taskData);
          await task.save();
          tasks.push(task);
        } catch (error) {
          console.error('Error al crear tarea:', error);
        }
      }
      result = tasks;
    }

    console.log('Resultado final:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Error al procesar mensaje:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const { status, priority, tag, assignee, search } = req.query;
    let tasks;

    if (status) {
      tasks = await Task.getTasksByStatus(status);
    } else if (priority) {
      tasks = await Task.getTasksByPriority(priority);
    } else if (tag) {
      tasks = await Task.getTasksByTag(tag);
    } else if (assignee) {
      tasks = await Task.getTasksByAssignee(assignee);
    } else if (search) {
      tasks = await Task.searchTasks(search);
    } else {
      tasks = await Task.find().sort({ dueDate: 1, priority: -1 });
    }

    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/overdue', async (req, res) => {
  try {
    const tasks = await Task.getOverdueTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas vencidas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/upcoming', async (req, res) => {
  try {
    const { days } = req.query;
    const tasks = await Task.getUpcomingTasks(days ? parseInt(days) : 7);
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas próximas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/columns', async (req, res) => {
  try {
    const columns = await Column.getOrderedColumns();
    res.json(columns);
  } catch (error) {
    console.error('Error al obtener columnas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/columns', async (req, res) => {
  try {
    const { name, color, order } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre de la columna es requerido' });
    }

    const column = await Column.create({ name, color, order });
    res.status(201).json(column);
  } catch (error) {
    console.error('Error al crear columna:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/columns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;

    const column = await Column.findByIdAndUpdate(
      id,
      { name, color, order },
      { new: true }
    );

    if (!column) {
      return res.status(404).json({ error: 'Columna no encontrada' });
    }

    res.json(column);
  } catch (error) {
    console.error('Error al actualizar columna:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/columns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const column = await Column.findByIdAndDelete(id);

    if (!column) {
      return res.status(404).json({ error: 'Columna no encontrada' });
    }

    // Actualizar tareas que estaban en esta columna
    await Task.updateMany(
      { status: column.name },
      { status: 'Pendiente' }
    );

    res.json({ message: 'Columna eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar columna:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-connection', async (req, res) => {
  try {
    const result = await testOpenRouterConnection();
    res.json(result);
  } catch (error) {
    console.error('Error al probar conexión:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 