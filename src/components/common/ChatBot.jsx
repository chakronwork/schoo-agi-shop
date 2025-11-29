'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react'

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'model', text: 'สวัสดีครับ! ผม Agri-Bot มีอะไรให้ช่วยเรื่องอุปกรณ์การเกษตรไหมครับ? 🌱' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // ฟังก์ชันเลื่อนลงล่างสุดเวลามีข้อความใหม่
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    // 1. เพิ่มข้อความ User ลงในหน้าจอทันที
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setLoading(true)

    try {
      // 2. เตรียม History สำหรับส่งให้ API
      // ⚠️ สำคัญ: ต้องตัดข้อความแรก (Greeting ของ Bot) ออกด้วย .slice(1)
      // เพราะ Gemini API บังคับว่า History ต้องเริ่มด้วย User เสมอ ห้ามเริ่มด้วย Model
      const historyForApi = messages
        .slice(1) 
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))

      // 3. ส่งไปที่ API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: historyForApi
        })
      })

      const data = await res.json()
      
      // 4. เพิ่มข้อความตอบกลับจาก Bot ลงในหน้าจอ
      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }])
      } else {
        throw new Error('No response')
      }

    } catch (error) {
      console.error("Chat Error:", error)
      setMessages(prev => [...prev, { role: 'model', text: 'ขออภัยครับ ตอนนี้สมองผมเบลอนิดหน่อย ลองถามใหม่นะ 😅' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-agri-primary p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Agri-Bot Assistant</h3>
                <p className="text-[10px] text-green-100 opacity-90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-agri-primary text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ถามเกี่ยวกับสินค้า..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-agri-accent/50 transition-all text-gray-700"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="p-2 bg-agri-primary text-white rounded-full hover:bg-agri-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-lg shadow-agri-primary/30 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${
          isOpen ? 'bg-gray-600 rotate-90' : 'bg-agri-primary hover:bg-agri-hover'
        } text-white`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  )
}