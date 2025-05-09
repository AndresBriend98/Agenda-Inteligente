const { knowledgeBase } = require('../services/knowledgeBase');
const { processSymptom, validateEnvironment, checkAvailableMeans } = require('../services/expertSystem');

// Controlador para gestionar tarjetas
exports.manageCard = async (req, res) => {
    try {
        const { action, cardData } = req.body;
        const { id } = req.params;

        switch (action) {
            case 'create':
                const newCard = await knowledgeBase.addCard(cardData);
                return res.status(201).json(newCard);
            case 'update':
                const updatedCard = await knowledgeBase.updateCard(id, cardData);
                return res.json(updatedCard);
            case 'delete':
                await knowledgeBase.deleteCard(id);
                return res.json({ message: 'Tarjeta eliminada correctamente' });
            default:
                return res.status(400).json({ error: 'Acción no válida' });
        }
    } catch (error) {
        console.error('Error en la gestión de tarjeta:', error);
        res.status(500).json({ error: 'Error en la operación' });
    }
};

// Controlador para gestionar tareas
exports.manageTask = async (req, res) => {
    try {
        const { action, taskData } = req.body;
        const { id } = req.params;

        switch (action) {
            case 'create':
                const newTask = await knowledgeBase.addTask(taskData);
                return res.status(201).json(newTask);
            case 'update':
                const updatedTask = await knowledgeBase.updateTask(id, taskData);
                return res.json(updatedTask);
            case 'delete':
                await knowledgeBase.deleteTask(id);
                return res.json({ message: 'Tarea eliminada correctamente' });
            default:
                return res.status(400).json({ error: 'Acción no válida' });
        }
    } catch (error) {
        console.error('Error en la gestión de tarea:', error);
        res.status(500).json({ error: 'Error en la operación' });
    }
};

// Controlador para asignar miembros a tareas
exports.manageTaskMembers = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { action, memberId } = req.body;

        switch (action) {
            case 'add':
                const taskWithNewMember = await knowledgeBase.addMemberToTask(taskId, memberId);
                return res.json(taskWithNewMember);
            case 'remove':
                const taskWithoutMember = await knowledgeBase.removeMemberFromTask(taskId, memberId);
                return res.json(taskWithoutMember);
            default:
                return res.status(400).json({ error: 'Acción no válida' });
        }
    } catch (error) {
        console.error('Error en la gestión de miembros de la tarea:', error);
        res.status(500).json({ error: 'Error en la operación' });
    }
};

// Controlador para gestionar miembros
exports.manageMember = async (req, res) => {
    try {
        const { action, memberData } = req.body;
        const { id } = req.params;

        switch (action) {
            case 'create':
                const newMember = await knowledgeBase.addMember(memberData);
                return res.status(201).json(newMember);
            case 'update':
                const updatedMember = await knowledgeBase.updateMember(id, memberData);
                return res.json(updatedMember);
            case 'delete':
                await knowledgeBase.deleteMember(id);
                return res.json({ message: 'Miembro eliminado correctamente' });
            default:
                return res.status(400).json({ error: 'Acción no válida' });
        }
    } catch (error) {
        console.error('Error en la gestión de miembro:', error);
        res.status(500).json({ error: 'Error en la operación' });
    }
};

// Controlador para procesar comandos del sistema experto
exports.processExpertCommand = async (req, res) => {
    try {
        const { command, context } = req.body;
        
        // Validar el entorno
        const environmentValidation = validateEnvironment(context);
        if (!environmentValidation.isValid) {
            return res.status(400).json({ error: environmentValidation.error });
        }

        // Verificar medios disponibles
        const availableMeans = checkAvailableMeans(command);
        if (!availableMeans.isAvailable) {
            return res.status(400).json({ error: availableMeans.error });
        }

        // Procesar el comando
        const result = await knowledgeBase.processCommand(command, context);
        return res.json(result);
    } catch (error) {
        console.error('Error al procesar comando:', error);
        res.status(500).json({ error: 'Error al procesar el comando' });
    }
}; 