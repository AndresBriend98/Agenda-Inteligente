import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';

function TaskBoard({ tasks, onStatusChange }) {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    fetchColumns();
  }, [tasks]);

  const fetchColumns = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/columns');
      if (!response.ok) throw new Error('Error al obtener columnas');
      const data = await response.json();
      setColumns(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDragOver = (e, columnName) => {
    e.preventDefault();
    const column = e.currentTarget;
    column.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    const column = e.currentTarget;
    column.classList.remove('drag-over');
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const column = e.currentTarget;
    column.classList.remove('drag-over');

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { taskId, currentStatus } = data;

      if (currentStatus !== targetStatus) {
        const response = await fetch(`http://localhost:5000/api/process-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Mover tarea a ${targetStatus}`,
            taskId: taskId
          }),
        });

        if (!response.ok) throw new Error('Error al actualizar la tarea');
        const updatedTask = await response.json();
        onStatusChange(updatedTask);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="task-board-container">
      <div className="board-header">
        <h2>Tablero de Tareas</h2>
      </div>

      <div className="task-board">
        {columns.map(column => (
          <div
            key={column._id}
            className="board-column"
            style={{ backgroundColor: column.color }}
            onDragOver={(e) => handleDragOver(e, column.name)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.name)}
          >
            <h2>{column.name}</h2>
            <div className="column-content">
              {tasks.filter(task => task.status === column.name).length === 0 ? (
                <div className="empty-column">
                  No hay tareas en esta columna
                </div>
              ) : (
                tasks
                  .filter(task => task.status === column.name)
                  .map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={onStatusChange}
                    />
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskBoard;