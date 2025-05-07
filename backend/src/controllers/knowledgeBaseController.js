const { knowledgeBase } = require('../services/knowledgeBase');

// Obtener todas las reglas
exports.getRules = async (req, res) => {
    try {
        const { category } = req.query;
        const rules = await knowledgeBase.queryRules(category);
        res.json(rules);
    } catch (error) {
        console.error('Error al obtener reglas:', error);
        res.status(500).json({ error: 'Error al obtener reglas' });
    }
};

// Agregar una nueva regla
exports.addRule = async (req, res) => {
    try {
        const { category, condition, action, priority } = req.body;
        const rule = await knowledgeBase.addRule(category, condition, action, priority);
        res.status(201).json(rule);
    } catch (error) {
        console.error('Error al agregar regla:', error);
        res.status(500).json({ error: 'Error al agregar regla' });
    }
};

// Actualizar una regla existente
exports.updateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const rule = await knowledgeBase.updateRule(id, updates);
        res.json(rule);
    } catch (error) {
        console.error('Error al actualizar regla:', error);
        res.status(500).json({ error: 'Error al actualizar regla' });
    }
};

// Eliminar una regla
exports.removeRule = async (req, res) => {
    try {
        const { id } = req.params;
        await knowledgeBase.removeRule(id);
        res.json({ message: 'Regla eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar regla:', error);
        res.status(500).json({ error: 'Error al eliminar regla' });
    }
};

// Obtener hechos
exports.getFacts = async (req, res) => {
    try {
        const { type } = req.query;
        const facts = await knowledgeBase.getFacts(type);
        res.json(facts);
    } catch (error) {
        console.error('Error al obtener hechos:', error);
        res.status(500).json({ error: 'Error al obtener hechos' });
    }
};

// Agregar un nuevo hecho
exports.addFact = async (req, res) => {
    try {
        const { type, value, description } = req.body;
        const fact = await knowledgeBase.addFact(type, value, description);
        res.status(201).json(fact);
    } catch (error) {
        console.error('Error al agregar hecho:', error);
        res.status(500).json({ error: 'Error al agregar hecho' });
    }
};

// Obtener historial de respuestas
exports.getResponseHistory = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        const filter = {};
        
        if (type) {
            filter['template.type'] = type;
        }
        
        if (startDate && endDate) {
            filter.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const history = await knowledgeBase.getResponseHistory(filter);
        res.json(history);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
};

// Agregar una nueva plantilla de respuesta
exports.addResponseTemplate = async (req, res) => {
    try {
        const { type, template, variables } = req.body;
        const responseTemplate = await knowledgeBase.addResponseTemplate(type, template, variables);
        res.status(201).json(responseTemplate);
    } catch (error) {
        console.error('Error al agregar plantilla:', error);
        res.status(500).json({ error: 'Error al agregar plantilla' });
    }
}; 