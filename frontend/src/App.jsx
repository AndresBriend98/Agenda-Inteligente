import React, { useState, useEffect } from 'react';
import './App.css';
import MessageInput from './components/MessageInput';
import TaskBoard from './components/TaskBoard';
import { fetchTasks, processMessage } from './services/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las tareas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSubmit = async (message) => {
    setLoading(true);
    try {
      await processMessage(message);
      await loadTasks();
      setError(null);
    } catch (err) {
      setError('Error al procesar el mensaje');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      // Actualizar el estado local primero para una respuesta inmediata
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );

      // Llamar a la API para actualizar el estado en el servidor
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado de la tarea');
      }

      // Recargar las tareas para asegurar sincronización
      await loadTasks();
    } catch (err) {
      console.error('Error al actualizar el estado:', err);
      setError('Error al actualizar el estado de la tarea');
      // Revertir el cambio local si falla la actualización
      await loadTasks();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Agenda Inteligente</h1>
      </header>
      <main className="app-main">
        <MessageInput onSubmit={handleMessageSubmit} disabled={loading} />
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : (
          <TaskBoard tasks={tasks} onStatusChange={updateTaskStatus} />
        )}
      </main>
    </div>
  );
}

export default App;