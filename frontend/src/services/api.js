const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchTasks = async () => {
  const response = await fetch(`${API_URL}/tasks`);
  if (!response.ok) {
    throw new Error('Error al obtener las tareas');
  }
  return await response.json();
};

export const processMessage = async (message) => {
  try {
    const response = await fetch(`${API_URL}/process-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al procesar el mensaje');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error detallado:', error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  
  if (!response.ok) {
    throw new Error('Error al actualizar la tarea');
  }
  
  return await response.json();
};

export const deleteTask = async (taskId) => {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Error al eliminar la tarea');
  }
  
  return await response.json();
};