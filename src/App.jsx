import React, { useState } from 'react';

  function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          messages: messages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("AI Response:", data);

      const assistantMessage = {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.'
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung deiner Nachricht.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>AI Chatbot</h1>
      
      {/* Chat Messages Container */}
      <div style={{
        flex: 1,
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        overflowY: 'auto',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            Beginne eine Unterhaltung...
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: message.role === 'user' ? '#007bff' : '#fff',
                color: message.role === 'user' ? 'white' : 'black',
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                border: message.role === 'assistant' ? '1px solid #ddd' : 'none',
                marginLeft: message.role === 'user' ? '20%' : '0',
                marginRight: message.role === 'assistant' ? '20%' : '0'
              }}
            >
              <strong>{message.role === 'user' ? 'Du:' : 'AI:'}</strong>
              <div style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                {message.content}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            marginRight: '20%',
            fontStyle: 'italic',
            color: '#666'
          }}>
            AI tippt...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <textarea
          placeholder="Schreibe deine Nachricht..."
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            resize: 'none',
            minHeight: '60px',
            fontFamily: 'Arial, sans-serif'
          }}
          rows={2}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isLoading || !inputMessage.trim() ? '#ccc' : '#007bff',
            color: 'white',
            cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Senden...' : 'Senden'}
        </button>
      </div>
    </div>
  );
}

export default App;