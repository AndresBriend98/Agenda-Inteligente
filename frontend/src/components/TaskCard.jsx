import React from 'react';

function TaskCard({ task, onStatusChange }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Alta': return 'priority-high';
      case 'Media': return 'priority-medium';
      case 'Baja': return 'priority-low';
      default: return '';
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      taskId: task._id,
      currentStatus: task.status
    }));
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  const getInitials = (name) => {
    if (name === 'Yo') return 'Yo';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const getRandomColor = (name) => {
    const colors = [
      '#2196F3', // Azul
      '#4CAF50', // Verde
      '#FF9800', // Naranja
      '#9C27B0', // Morado
      '#F44336', // Rojo
      '#00BCD4', // Cyan
      '#FFC107', // Amarillo
      '#795548', // Marrón
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleChecklistItemToggle = async (itemText) => {
    try {
      const response = await fetch(`http://localhost:5000/api/process-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Marcar '${itemText}' como ${task.checklist.find(item => item.text === itemText).completed ? 'no completado' : 'completado'}`,
          taskId: task._id
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el checklist');
      }

      const updatedTask = await response.json();
      onStatusChange(updatedTask);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el checklist');
    }
  };

  const getTagColor = (tag) => {
    const tagColors = {
      'Urgente': '#d50000',
      'Trabajo': '#2196F3',
      'Universidad': '#9C27B0',
      'Reunión': '#FF9800',
      'Investigación': '#4CAF50',
      'Personal': '#795548',
      'Proyecto': '#00BCD4',
      'Documentación': '#607D8B',
      'Desarrollo': '#3F51B5',
      'Diseño': '#E91E63'
    };
    return tagColors[tag] || '#757575';
  };

  return (
    <div 
      className={`task-card ${getPriorityClass(task.priority)}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="card-header">
        <h3>{task.title}</h3>
        <div className="card-actions">
          <span className="task-priority">{task.priority}</span>
        </div>
      </div>
      <div className="card-body">
        <p>{task.description}</p>
        <div className="task-meta">
          <span className="due-date">
            Vence: {formatDate(task.dueDate)}
          </span>
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="task-tags">
            {task.tags.map((tag, index) => (
              <span 
                key={index} 
                className="tag"
                style={{ backgroundColor: getTagColor(tag) }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {task.checklist && task.checklist.length > 0 && (
          <div className="checklist">
            <h4>Pasos:</h4>
            <ul>
              {task.checklist.map((item, index) => (
                <li key={index} className="checklist-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleChecklistItemToggle(item.text)}
                    />
                    <span className={`checkmark ${item.completed ? 'completed' : ''}`}>
                      {item.completed ? '✓' : ''}
                    </span>
                    <span className={`item-text ${item.completed ? 'completed' : ''}`}>
                      {item.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="assigned-avatars">
          {task.assignedTo && task.assignedTo.map((person, index) => (
            <div 
              key={index}
              className="avatar"
              style={{ backgroundColor: getRandomColor(person) }}
              title={person}
            >
              {getInitials(person)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;