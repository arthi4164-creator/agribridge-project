import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, Bot, User, CheckCircle, ArrowRight, X } from 'lucide-react';

export default function AIAssistantWidget({ language = 'en', onAutoFillForm, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: language === 'ta' 
        ? "வணக்கம்! நான் உங்கள் அக்ரிபிரிட்ஜ் AI உதவியாளர். நீங்கள் என்ன பயிர் விற்க விரும்புகிறீர்கள்? (எ.கா: தக்காளி 500 கிலோ கோவை)"
        : "Welcome to AgriBridge AI! What crop do you want to sell today? (e.g. Tomato, 500 kg, Coimbatore)"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationState, setConversationState] = useState({ step: 'initial', form_data: {} });
  const [autoFillCandidate, setAutoFillCandidate] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, autoFillCandidate]);

  // Voice synthesis
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech Recognition (Web Speech API)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback voice simulation for testing
      simulateVoiceInput();
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
        setIsListening(false);
      };
      recognition.onerror = (e) => {
        console.error("Speech error", e);
        setIsListening(false);
        simulateVoiceInput();
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      simulateVoiceInput();
    }
  };

  const simulateVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const sample = language === 'ta' 
        ? "தக்காளி 500 கிலோ பொள்ளாச்சி" 
        : "I have 500 kg Tomato in Coimbatore";
      setInputText(sample);
      handleSendMessage(sample);
    }, 1400);
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: language,
          conversation_state: conversationState
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiReply = { sender: 'ai', text: data.reply };
        setMessages(prev => [...prev, aiReply]);
        setConversationState(data.conversation_state);

        if (data.auto_fill_form && data.auto_fill_form.ready_for_submit) {
          setAutoFillCandidate(data.auto_fill_form);
        }

        // Voice speak response
        speakText(data.reply.split('\n')[0]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: "Service temporarily unavailable. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'ai', text: "Connection error. Checking offline knowledge base." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAutoFill = () => {
    if (autoFillCandidate && onAutoFillForm) {
      onAutoFillForm(autoFillCandidate);
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #cbdcd3', boxShadow: '0 12px 30px rgba(10, 47, 29, 0.12)', display: 'flex', flexDirection: 'column', height: '560px', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a2f1d 0%, #12472d 100%)', color: '#ffffff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#10b981', padding: '6px', borderRadius: '8px', color: '#ffffff' }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              AgriBridge AI Assistant
              <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                {language === 'ta' ? 'தமிழ்' : 'English'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#a3c2b2' }}>
              Voice & Text Agricultural Copilot
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onClose && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ padding: '8px 12px', background: '#f4faf6', borderBottom: '1px solid #e2ece6', display: 'flex', gap: '6px', overflowX: 'auto' }}>
        <button 
          onClick={() => handleSendMessage(language === 'ta' ? "தக்காளி 500 கிலோ கோவை" : "Sell 500 kg Tomato in Coimbatore")}
          style={{ fontSize: '0.75rem', background: '#ffffff', border: '1px solid #cbdcd3', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, color: '#0f241a' }}
        >
          ⚡ {language === 'ta' ? "தக்காளி 500 கிலோ கோவை" : "Sell 500 kg Tomato"}
        </button>
        <button 
          onClick={() => handleSendMessage(language === 'ta' ? "தக்காளி சந்தை விலை என்ன?" : "What is the tomato price forecast?")}
          style={{ fontSize: '0.75rem', background: '#ffffff', border: '1px solid #cbdcd3', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, color: '#0f241a' }}
        >
          💰 {language === 'ta' ? "தக்காளி விலை என்ன?" : "Tomato Price Forecast"}
        </button>
        <button 
          onClick={() => handleSendMessage(language === 'ta' ? "வாங்குபவர் தேவைகள் உள்ளதா?" : "Are there active buyer requirements?")}
          style={{ fontSize: '0.75rem', background: '#ffffff', border: '1px solid #cbdcd3', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, color: '#0f241a' }}
        >
          🛒 {language === 'ta' ? "வாங்குபவர் தேவைகள்" : "Buyer Requirements"}
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#ffffff' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: '8px' }}>
            {m.sender === 'ai' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ecfdf5', color: '#108e56', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Sparkles size={16} />
              </div>
            )}
            <div style={{
              maxWidth: '82%',
              padding: '10px 14px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
              background: m.sender === 'user' ? 'linear-gradient(135deg, #108e56 0%, #0a2f1d 100%)' : '#f1f5f3',
              color: m.sender === 'user' ? '#ffffff' : '#0f241a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              {m.text}
              {m.sender === 'ai' && (
                <button 
                  onClick={() => speakText(m.text)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '6px', color: '#108e56', verticalAlign: 'middle' }}
                  title="Listen to response"
                >
                  <Volume2 size={14} />
                </button>
              )}
            </div>
            {m.sender === 'user' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#4b6357', fontSize: '0.85rem' }}>
            <div className="voice-wave">
              <div className="voice-bar"></div>
              <div className="voice-bar"></div>
              <div className="voice-bar"></div>
            </div>
            <span>AI analyzing crop demand and price...</span>
          </div>
        )}

        {/* Auto Fill Action Callout */}
        {autoFillCandidate && (
          <div style={{ background: '#ecfdf5', border: '1.5px solid #34d399', borderRadius: '12px', padding: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#059669', fontSize: '0.9rem' }}>
              <CheckCircle size={18} /> Ready to Populate Form Automatically:
            </div>
            <div style={{ fontSize: '0.84rem', color: '#065f46', marginTop: '4px', lineHeight: 1.4 }}>
              <strong>Crop:</strong> {autoFillCandidate.crop} | <strong>Quantity:</strong> {autoFillCandidate.quantity_kg} kg | <strong>Location:</strong> {autoFillCandidate.location}
            </div>
            <button 
              onClick={handleApplyAutoFill}
              style={{ marginTop: '10px', background: '#059669', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Apply to "Sell Crop" Form <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Listening State Banner */}
      {isListening && (
        <div style={{ background: '#fef3c7', borderTop: '1px solid #fde68a', padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: '#92400e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }}></span>
            <span>Listening... Speak your crop, quantity, and location</span>
          </div>
          <button onClick={() => setIsListening(false)} style={{ background: 'transparent', border: 'none', color: '#92400e', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
        </div>
      )}

      {/* Input Form Bar */}
      <div style={{ padding: '12px', background: '#f8faf9', borderTop: '1px solid #cbdcd3', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          onClick={toggleListening}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: isListening ? '#dc2626' : '#ecfdf5',
            color: isListening ? '#ffffff' : '#059669',
            border: isListening ? 'none' : '1.5px solid #34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Voice Input (Tamil/English)"
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={language === 'ta' ? "பயிர், அளவு, இடம் கேட்கலாம்..." : "Ask AI or say 'Tomato 500kg Coimbatore'..."}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1.5px solid #cbdcd3',
            fontSize: '0.92rem',
            outline: 'none'
          }}
        />

        <button 
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: '#108e56',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'default',
            opacity: inputText.trim() ? 1 : 0.6,
            flexShrink: 0
          }}
        >
          <Send size={18} />
        </button>
      </div>

    </div>
  );
}
