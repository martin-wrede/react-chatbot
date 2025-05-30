import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm ChatGPT! Ask me anything!",
      sentTime: "just now",
      sender: "ChatGPT"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{ name, content }]
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setUploadedFiles(prev => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a text file (.txt)');
    }
    event.target.value = '';
  };

  const selectFile = (index) => {
    setSelectedFileIndex(index);
  };

  const deleteFile = (indexToDelete) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== indexToDelete));
    if (selectedFileIndex === indexToDelete) {
      setSelectedFileIndex(null);
    } else if (selectedFileIndex > indexToDelete) {
      setSelectedFileIndex(prev => prev - 1);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const newMessage = {
      message: inputValue,
      sender: "user",
      sentTime: new Date().toLocaleTimeString()
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  async function processMessageToChatGPT(chatMessages) {
    const apiMessages = chatMessages.map(msg => ({
      role: msg.sender === "ChatGPT" ? "assistant" : "user",
      content: msg.message
    }));

    const requestBody = {
      messages: apiMessages,
      uploadedFileContent: selectedFileIndex !== null ? uploadedFiles[selectedFileIndex]?.content : null
    };

    try {
      const response = await fetch("/functions/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Function error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || "Sorry, I encountered an error.";

      setMessages([...chatMessages, {
        message: reply,
        sender: "ChatGPT",
        sentTime: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      console.error('Error calling chat function:', error);
      setMessages([...chatMessages, {
        message: "Sorry, I encountered a network error.",
        sender: "ChatGPT",
        sentTime: new Date().toLocaleTimeString()
      }]);
    }
    setIsTyping(false);
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="bot-icon">B</div>
        <span>Chatbot </span>
      </div>

      <div className="messages-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.sender === 'user' ? 'user' : 'bot'}`}>
            {msg.sender === 'ChatGPT' && <div className="avatar">B</div>}
            <div className={`message-bubble ${msg.sender}`}>
              <div className="message-text">{msg.message}</div>
              <div className="timestamp">{msg.sentTime}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-row bot typing">
            <div className="avatar">B</div>
            <div className="message-bubble bot">
              <em>Bot is typing...</em>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="upload-bar">
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button className="upload-button"
         onClick={() => fileInputRef.current?.click()}><span style={{fontSize:'20px',}}>+</span></button>

        <div className="file-list">
          {uploadedFiles.map((file, index) => (
            <div key={index} className={`file-status ${selectedFileIndex === index ? 'selected' : ''}`}>
              <span
                style={{textAlign:'left'}}
                onClick={() => selectFile(index)}
>
                 {file.name} <br/>({file.content.length} chars)
              </span>
              <button   onClick={() => deleteFile(index)}>x</button>
            </div>
          ))}
        </div>
      </div>

      <div className="input-bar">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selectedFileIndex !== null ? "Ask about the selected file..." : "Type your message here..."}
          rows="1"
        />
      </div>
    </div>
  );
}

export default App;
