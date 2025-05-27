import { useState, useRef, useEffect } from 'react'

// For demo purposes - replace with your actual API key
const OPENAI_API_KEY = 'your-api-key-here';

const systemMessage = {
  "role": "system", 
  "content": "Explain things like you're talking to a software professional with 2 years of experience."
}

function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm ChatGPT! Ask me anything!",
      sentTime: "just now",
      sender: "ChatGPT"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFileContent, setUploadedFileContent] = useState('');
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setUploadedFileContent(content);
        
        // Add a message showing the file was uploaded
        const fileMessage = {
          message: `📄 File uploaded: ${file.name} (${content.length} characters)`,
          sender: "user",
          sentTime: new Date().toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, fileMessage]);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a text file (.txt)');
    }
    
    // Reset the input
    event.target.value = '';
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
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message}
    });

    // If there's uploaded file content, include it in the system message
    let enhancedSystemMessage = systemMessage;
    if (uploadedFileContent) {
      enhancedSystemMessage = {
        ...systemMessage,
        content: `${systemMessage.content}\n\nYou also have access to this uploaded file content:\n\n${uploadedFileContent}`
      };
    }

    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages": [
        enhancedSystemMessage,
        ...apiMessages
      ]
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiRequestBody)
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        setMessages([...chatMessages, {
          message: data.choices[0].message.content,
          sender: "ChatGPT",
          sentTime: new Date().toLocaleTimeString()
        }]);
      } else {
        setMessages([...chatMessages, {
          message: "Sorry, I encountered an error processing your request.",
          sender: "ChatGPT",
          sentTime: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([...chatMessages, {
        message: "Sorry, I encountered a network error. Please try again.",
        sender: "ChatGPT",
        sentTime: new Date().toLocaleTimeString()
      }]);
    }
    
    setIsTyping(false);
  }

  const clearUploadedFile = () => {
    setUploadedFileContent('');
    const clearMessage = {
      message: "📄 File content cleared from context",
      sender: "user",
      sentTime: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, clearMessage]);
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#2c3e50',
        color: 'white',
        textAlign: 'left',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        Chatbot
      </div>

      {/* File Upload Controls */}
      <div style={{ 
        padding: "12px", 
        borderBottom: "1px solid #e0e0e0",
        backgroundColor: "#f8f9fa",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "8px 16px",
            backgroundColor: "darkblue",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500"
          }}
        >
          Upload Text File
        </button>
        
        {uploadedFileContent && (
          <>
            <span style={{ 
              fontSize: "13px", 
              color: "#28a745",
              fontWeight: "500"
            }}>
              ✓ File loaded ({uploadedFileContent.length} chars)
            </span>
            <button
              onClick={clearUploadedFile}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Clear File
            </button>
          </>
        )}
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        backgroundColor: '#ffffff'
      }}>
        {messages.map((message, i) => (
          <div
            key={i}
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: message.sender === 'user' ? '#bbb' : '#e9ecef',
                color: message.sender === 'user' ? 'white' : '#333',
                wordWrap: 'break-word'
              }}
            >
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {message.message}
              </div>
              <div style={{
                fontSize: '11px',
                opacity: 0.7,
                marginTop: '4px'
              }}>
                {message.sentTime}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: '#e9ecef',
              color: '#666',
              fontStyle: 'italic'
            }}>
              ChatGPT is typing...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={uploadedFileContent ? "Ask about the uploaded file..." : "Type your message here..."}
            style={{
              flex: 1,
              minHeight: '20px',
              maxHeight: '120px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none'
            }}
            rows="1"
          />
          {/*
          <button
            onClick={handleSend}
            style={{
              padding: '8px 16px',
              backgroundColor: 'darkblue',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '60px'
            }}
          >
            Send
          </button>
          */}
        </div>
      </div>
    </div>
  )
}

export default App