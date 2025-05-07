const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['Alta', 'Media', 'Baja'],
    default: 'Media'
  },
  status: {
    type: String,
    required: true,
    default: 'Pendiente'
  },
  assignedTo: {
    type: [String],
    default: ['Yo']
  },
  originalMessage: {
    type: String,
    required: true
  },
  checklist: [{
    text: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  tags: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar updatedAt antes de cada guardado
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método estático para obtener tareas por estado
taskSchema.statics.getTasksByStatus = async function(status) {
  return this.find({ status }).sort({ dueDate: 1, priority: -1 });
};

// Método estático para obtener tareas por prioridad
taskSchema.statics.getTasksByPriority = async function(priority) {
  return this.find({ priority }).sort({ dueDate: 1 });
};

// Método estático para obtener tareas por etiqueta
taskSchema.statics.getTasksByTag = async function(tag) {
  return this.find({ tags: tag }).sort({ dueDate: 1, priority: -1 });
};

// Método estático para obtener tareas por asignado
taskSchema.statics.getTasksByAssignee = async function(assignee) {
  return this.find({ assignedTo: assignee }).sort({ dueDate: 1, priority: -1 });
};

// Método estático para obtener tareas vencidas
taskSchema.statics.getOverdueTasks = async function() {
  const now = new Date();
  return this.find({
    dueDate: { $lt: now },
    status: { $ne: 'Completada' }
  }).sort({ dueDate: 1 });
};

// Método estático para obtener tareas próximas a vencer
taskSchema.statics.getUpcomingTasks = async function(days = 7) {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    dueDate: {
      $gte: now,
      $lte: futureDate
    },
    status: { $ne: 'Completada' }
  }).sort({ dueDate: 1, priority: -1 });
};

// Método estático para buscar tareas
taskSchema.statics.searchTasks = async function(query) {
  return this.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } }
    ]
  }).sort({ dueDate: 1, priority: -1 });
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 