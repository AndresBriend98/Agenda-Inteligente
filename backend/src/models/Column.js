const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#f5f5f5'
  },
  order: {
    type: Number,
    required: true
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
columnSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método estático para obtener todas las columnas ordenadas
columnSchema.statics.getOrderedColumns = async function() {
  return this.find().sort({ order: 1 });
};

// Método estático para crear columnas por defecto
columnSchema.statics.createDefaultColumns = async function() {
  const defaultColumns = [
    { name: 'Pendiente', color: '#f5f5f5', order: 0 },
    { name: 'En progreso', color: '#f5f5f5', order: 1 },
    { name: 'Completada', color: '#f5f5f5', order: 2 }
  ];

  for (const column of defaultColumns) {
    await this.findOneAndUpdate(
      { name: column.name },
      column,
      { upsert: true, new: true }
    );
  }
};

const Column = mongoose.model('Column', columnSchema);

module.exports = Column; 