const mongoose = require('mongoose');

// Función para conectar a la base de datos
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
    // Crear columnas por defecto
    const Column = require('../models/Column');
    await Column.createDefaultColumns();
    
    return conn;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
}

// Función para desconectar de la base de datos
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB desconectado');
  } catch (error) {
    console.error('Error al desconectar de MongoDB:', error);
    process.exit(1);
  }
}

module.exports = {
  connectDB,
  disconnectDB
}; 