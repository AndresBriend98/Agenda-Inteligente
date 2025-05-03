import React, { useState } from 'react';

function MessageInput({ onSubmit, disabled }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
      setMessage('');
    }
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje para crear una tarea (ej: 'Necesito terminar el informe trimestral para el viernes')"
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !message.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}

export default MessageInput;  