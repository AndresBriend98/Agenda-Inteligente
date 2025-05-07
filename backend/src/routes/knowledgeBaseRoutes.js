const express = require('express');
const router = express.Router();
const knowledgeBaseController = require('../controllers/knowledgeBaseController');

// Rutas para reglas
router.get('/rules', knowledgeBaseController.getRules);
router.post('/rules', knowledgeBaseController.addRule);
router.put('/rules/:id', knowledgeBaseController.updateRule);
router.delete('/rules/:id', knowledgeBaseController.removeRule);

// Rutas para hechos
router.get('/facts', knowledgeBaseController.getFacts);
router.post('/facts', knowledgeBaseController.addFact);

// Rutas para respuestas
router.get('/responses/history', knowledgeBaseController.getResponseHistory);
router.post('/responses/templates', knowledgeBaseController.addResponseTemplate);

module.exports = router; 