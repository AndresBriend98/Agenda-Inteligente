const mongoose = require('mongoose');

// Esquema para reglas
const RuleSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['environment', 'messages', 'creation', 'prioritization', 'validation', 'errors']
    },
    condition: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
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

// Esquema para hechos
const FactSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['priority', 'status', 'action']
    },
    value: {
        type: String,
        required: true
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    }
});

// Esquema para plantillas de respuestas
const ResponseTemplateSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['success', 'error', 'notification']
    },
    template: {
        type: String,
        required: true
    },
    variables: [String],
    isActive: {
        type: Boolean,
        default: true
    }
});

// Esquema para historial de respuestas
const ResponseHistorySchema = new mongoose.Schema({
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResponseTemplate'
    },
    variables: {
        type: Map,
        of: String
    },
    response: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Esquema para tarjetas
const CardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    column: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Column',
        required: true
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }],
    dueDate: Date,
    priority: {
        type: String,
        enum: ['Alta', 'Media', 'Baja'],
        default: 'Media'
    },
    isActive: {
        type: Boolean,
        default: true
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

// Esquema para tareas
const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['Pendiente', 'En Progreso', 'Completada'],
        default: 'Pendiente'
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }],
    dueDate: Date,
    priority: {
        type: String,
        enum: ['Alta', 'Media', 'Baja'],
        default: 'Media'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Esquema para miembros
const MemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Usuario', 'Observador'],
        default: 'Usuario'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Modelos
const Rule = mongoose.model('Rule', RuleSchema);
const Fact = mongoose.model('Fact', FactSchema);
const ResponseTemplate = mongoose.model('ResponseTemplate', ResponseTemplateSchema);
const ResponseHistory = mongoose.model('ResponseHistory', ResponseHistorySchema);
const Card = mongoose.model('Card', CardSchema);
const Task = mongoose.model('Task', TaskSchema);
const Member = mongoose.model('Member', MemberSchema);

// Sistema de Base de Conocimientos
class KnowledgeBase {
    // Gestión de Reglas
    async addRule(category, condition, action, priority = 0) {
        try {
            const rule = new Rule({
                category,
                condition,
                action,
                priority
            });
            await rule.save();
            return rule;
        } catch (error) {
            console.error('Error al agregar regla:', error);
            throw error;
        }
    }

    async updateRule(ruleId, updates) {
        try {
            const rule = await Rule.findByIdAndUpdate(
                ruleId,
                { ...updates, updatedAt: Date.now() },
                { new: true }
            );
            return rule;
        } catch (error) {
            console.error('Error al actualizar regla:', error);
            throw error;
        }
    }

    async removeRule(ruleId) {
        try {
            await Rule.findByIdAndUpdate(ruleId, { isActive: false });
            return true;
        } catch (error) {
            console.error('Error al eliminar regla:', error);
            throw error;
        }
    }

    // Gestión de Hechos
    async addFact(type, value, description = '') {
        try {
            const fact = new Fact({
                type,
                value,
                description
            });
            await fact.save();
            return fact;
        } catch (error) {
            console.error('Error al agregar hecho:', error);
            throw error;
        }
    }

    async getFacts(type) {
        try {
            return await Fact.find({ type, isActive: true });
        } catch (error) {
            console.error('Error al obtener hechos:', error);
            throw error;
        }
    }

    // Sistema de Consultas
    async queryRules(category) {
        try {
            return await Rule.find({ category, isActive: true })
                           .sort({ priority: 1 });
        } catch (error) {
            console.error('Error al consultar reglas:', error);
            throw error;
        }
    }

    async queryFacts(type) {
        try {
            return await Fact.find({ type, isActive: true });
        } catch (error) {
            console.error('Error al consultar hechos:', error);
            throw error;
        }
    }

    // Sistema de Respuestas Automáticas
    async addResponseTemplate(type, template, variables = []) {
        try {
            const responseTemplate = new ResponseTemplate({
                type,
                template,
                variables
            });
            await responseTemplate.save();
            return responseTemplate;
        } catch (error) {
            console.error('Error al agregar plantilla:', error);
            throw error;
        }
    }

    async generateResponse(type, variables) {
        try {
            const template = await ResponseTemplate.findOne({ type, isActive: true });
            if (!template) {
                throw new Error(`No se encontró plantilla para el tipo: ${type}`);
            }

            let response = template.template;
            for (const [key, value] of Object.entries(variables)) {
                response = response.replace(`{${key}}`, value);
            }

            // Registrar en el historial
            const history = new ResponseHistory({
                template: template._id,
                variables,
                response
            });
            await history.save();

            return response;
        } catch (error) {
            console.error('Error al generar respuesta:', error);
            throw error;
        }
    }

    async getResponseHistory(filter = {}) {
        try {
            return await ResponseHistory.find(filter)
                                     .populate('template')
                                     .sort({ timestamp: -1 });
        } catch (error) {
            console.error('Error al obtener historial:', error);
            throw error;
        }
    }

    // Gestión de Tarjetas
    async addCard(cardData) {
        try {
            const card = new Card(cardData);
            await card.save();
            return card;
        } catch (error) {
            console.error('Error al agregar tarjeta:', error);
            throw error;
        }
    }

    async updateCard(cardId, updates) {
        try {
            const card = await Card.findByIdAndUpdate(
                cardId,
                { ...updates, updatedAt: Date.now() },
                { new: true }
            );
            return card;
        } catch (error) {
            console.error('Error al actualizar tarjeta:', error);
            throw error;
        }
    }

    async deleteCard(cardId) {
        try {
            await Card.findByIdAndUpdate(cardId, { isActive: false });
            return true;
        } catch (error) {
            console.error('Error al eliminar tarjeta:', error);
            throw error;
        }
    }

    // Gestión de Tareas
    async addTask(taskData) {
        try {
            const task = new Task(taskData);
            await task.save();
            return task;
        } catch (error) {
            console.error('Error al agregar tarea:', error);
            throw error;
        }
    }

    async updateTask(taskId, updates) {
        try {
            const task = await Task.findByIdAndUpdate(
                taskId,
                updates,
                { new: true }
            ).populate('assignedTo');
            return task;
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            await Task.findByIdAndUpdate(taskId, { isActive: false });
            return true;
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            throw error;
        }
    }

    async addMemberToTask(taskId, memberId) {
        try {
            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error('Tarea no encontrada');
            }

            if (!task.assignedTo.includes(memberId)) {
                task.assignedTo.push(memberId);
                await task.save();
            }

            return await Task.findById(taskId).populate('assignedTo');
        } catch (error) {
            console.error('Error al agregar miembro a la tarea:', error);
            throw error;
        }
    }

    async removeMemberFromTask(taskId, memberId) {
        try {
            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error('Tarea no encontrada');
            }

            task.assignedTo = task.assignedTo.filter(id => id.toString() !== memberId.toString());
            await task.save();

            return await Task.findById(taskId).populate('assignedTo');
        } catch (error) {
            console.error('Error al remover miembro de la tarea:', error);
            throw error;
        }
    }

    // Gestión de Miembros
    async addMember(memberData) {
        try {
            const member = new Member(memberData);
            await member.save();
            return member;
        } catch (error) {
            console.error('Error al agregar miembro:', error);
            throw error;
        }
    }

    async updateMember(memberId, updates) {
        try {
            const member = await Member.findByIdAndUpdate(
                memberId,
                updates,
                { new: true }
            );
            return member;
        } catch (error) {
            console.error('Error al actualizar miembro:', error);
            throw error;
        }
    }

    async deleteMember(memberId) {
        try {
            await Member.findByIdAndUpdate(memberId, { isActive: false });
            return true;
        } catch (error) {
            console.error('Error al eliminar miembro:', error);
            throw error;
        }
    }

    // Procesamiento de comandos del sistema experto
    async processCommand(command, context) {
        try {
            // Analizar el comando
            const commandAnalysis = await this.analyzeCommand(command);
            
            // Aplicar reglas relevantes
            const applicableRules = await this.getApplicableRules(commandAnalysis);
            
            // Ejecutar acciones según las reglas
            const result = await this.executeActions(applicableRules, context);
            
            return result;
        } catch (error) {
            console.error('Error al procesar comando:', error);
            throw error;
        }
    }
}

// Inicializar plantillas por defecto
async function initializeDefaultTemplates() {
    const defaultTemplates = [
        {
            type: 'success',
            template: 'Operación {action} completada para {element}',
            variables: ['action', 'element']
        },
        {
            type: 'error',
            template: 'Error: {error} en {context}',
            variables: ['error', 'context']
        },
        {
            type: 'notification',
            template: 'Notificación: {message}',
            variables: ['message']
        }
    ];

    for (const template of defaultTemplates) {
        await ResponseTemplate.findOneAndUpdate(
            { type: template.type },
            template,
            { upsert: true }
        );
    }
}

// Inicializar hechos por defecto
async function initializeDefaultFacts() {
    const defaultFacts = [
        { type: 'priority', value: 'Alta', description: 'Prioridad alta' },
        { type: 'priority', value: 'Media', description: 'Prioridad media' },
        { type: 'priority', value: 'Baja', description: 'Prioridad baja' },
        { type: 'status', value: 'Pendiente', description: 'Tarea pendiente' },
        { type: 'status', value: 'En Progreso', description: 'Tarea en progreso' },
        { type: 'status', value: 'Completada', description: 'Tarea completada' },
        { type: 'action', value: 'create', description: 'Crear elemento' },
        { type: 'action', value: 'delete', description: 'Eliminar elemento' },
        { type: 'action', value: 'modify', description: 'Modificar elemento' },
        { type: 'action', value: 'move', description: 'Mover elemento' }
    ];

    for (const fact of defaultFacts) {
        await Fact.findOneAndUpdate(
            { type: fact.type, value: fact.value },
            fact,
            { upsert: true }
        );
    }
}

// Exportar instancia y funciones de inicialización
const knowledgeBase = new KnowledgeBase();

module.exports = {
    knowledgeBase,
    initializeDefaultTemplates,
    initializeDefaultFacts
}; 