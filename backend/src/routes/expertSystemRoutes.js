const express = require('express');
const router = express.Router();
const expertSystemController = require('../controllers/expertSystemController');

// Rutas para tarjetas
router.post('/cards', expertSystemController.manageCard);
router.put('/cards/:id', expertSystemController.manageCard);
router.delete('/cards/:id', expertSystemController.manageCard);

// Rutas para tareas
router.post('/tasks', expertSystemController.manageTask);
router.put('/tasks/:id', expertSystemController.manageTask);
router.delete('/tasks/:id', expertSystemController.manageTask);

// Rutas para gestionar miembros de tareas
router.post('/tasks/:taskId/members', expertSystemController.manageTaskMembers);
router.delete('/tasks/:taskId/members', expertSystemController.manageTaskMembers);

// Rutas para miembros
router.post('/members', expertSystemController.manageMember);
router.put('/members/:id', expertSystemController.manageMember);
router.delete('/members/:id', expertSystemController.manageMember);

// Ruta para procesar comandos del sistema experto
router.post('/process-command', expertSystemController.processExpertCommand);

module.exports = router; 