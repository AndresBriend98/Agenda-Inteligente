const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { initializeDefaultTemplates, initializeDefaultFacts } = require('./services/knowledgeBase');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agenda-inteligente', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Conexión a MongoDB establecida');
    // Inicializar plantillas y hechos por defecto
    return Promise.all([
        initializeDefaultTemplates(),
        initializeDefaultFacts()
    ]);
})
.then(() => {
    console.log('Base de conocimientos inicializada');
})
.catch(err => {
    console.error('Error al conectar con MongoDB:', err);
});

// Rutas
app.use('/api/knowledge', require('./routes/knowledgeBaseRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/columns', require('./routes/columnRoutes'));

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 