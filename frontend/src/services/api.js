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
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error en la respuesta:', data);
      if (data.error) {
        if (data.error.includes('API')) {
          throw new Error('Error en la comunicación con la IA. Por favor, verifica tu API key y vuelve a intentar.');
        } else if (data.error.includes('vacía')) {
          throw new Error('La IA no pudo procesar tu mensaje. Por favor, intenta reformularlo.');
        } else if (data.error.includes('JSON')) {
          throw new Error('Error al procesar la respuesta de la IA. Por favor, intenta nuevamente.');
        }
      }
      throw new Error(data.error || 'Error al procesar el mensaje');
    }
    
    return data;
  } catch (error) {
    console.error('Error detallado:', error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor. Por favor, verifica que el servidor esté en ejecución.');
    }
    throw error;
  }
};

export const getTasks = async () => {
  const response = await fetch(`${API_URL}/tasks`);
  if (!response.ok) {
    throw new Error('Error al obtener las tareas');
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