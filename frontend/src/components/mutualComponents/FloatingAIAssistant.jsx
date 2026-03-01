import { useState, useEffect, useRef } from "react"
import { Bot, X, Send, User, ChevronLeft, Trash2, PlusCircle, Loader2 } from "lucide-react"
import { aiApiService } from "../../services/AIService"

export default function FloatingAIAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState(null)
    const [sessions, setSessions] = useState([])
    const [showHistory, setShowHistory] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    const scrollRef = useRef(null)

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Load user sessions when the button is clicked for the first time
    const handleOpen = async () => {
        setIsOpen(true)
        if (sessions.length === 0) {
            const chatSessions = await aiApiService.listSessions()
            setSessions(chatSessions)
        }
    }

    // Load a specific session's history
    const loadSession = async (sessionId) => {
        setIsLoadingHistory(true)
        setShowHistory(false)
        try {
            const data = await aiApiService.getChatHistory(sessionId)
            setMessages(data.messages)
            setCurrentSessionId(sessionId)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    // Handle New Chat click
    const startNewChat = () => {
        setMessages([])
        setCurrentSessionId(null)
        setShowHistory(false)
    }

    // Handle Send Message
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!inputText.trim() || isStreaming) return

        const userMsg = { role: "user", content: inputText }
        setMessages((prev) => [...prev, userMsg])
        const query = inputText
        setInputText("")
        setIsStreaming(true)

        // Add empty assistant bubble for streaming
        setMessages((prev) => [...prev, { role: "assistant", content: "" }])

        await aiApiService.sendMessageStream(
            query,
            currentSessionId,
            (chunk) => {
                setMessages((prev) => {
                    const newMsgs = [...prev]
                    const lastMsg = newMsgs[newMsgs.length - 1]
                    lastMsg.content += chunk
                    return newMsgs
                })
            },
            (fullResponse) => {
                setIsStreaming(false)
                // Re-ping sessions list to show new session if it was the first msg
                if (!currentSessionId) {
                    aiApiService.listSessions().then(setSessions)
                }
            },
            (err) => {
                setIsStreaming(false)
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "Sorry, I encountered an error. Please check your connection." }
                ])
            },
            (newId) => {
                // IMPORTANT: This captures the session ID from the backend 
                // and keeps this specific chat instance linked to it!
                if (!currentSessionId) {
                    setCurrentSessionId(newId)
                }
            }
        )
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={handleOpen}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 hover:scale-110 cursor-pointer ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
                    }`}
                style={{ backgroundColor: "#01257D" }}
                aria-label="Ask AI Assistant"
            >
                <Bot className="h-6 w-6 text-white" />
            </button>

            {/* Chat Window Container */}
            <div
                className={`fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-500 overflow-hidden z-50 ${isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
                    }`}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100" style={{ backgroundColor: "#01257D" }}>
                    <div className="flex items-center gap-3">
                        {showHistory ? (
                            <button
                                onClick={() => setShowHistory(false)}
                                className="p-1 hover:bg-white/10 rounded-md transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-white" />
                            </button>
                        ) : (
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-white font-semibold text-sm">Safe-Bill Assistant</h3>
                            <p className="text-white/70 text-[10px] uppercase tracking-wider font-medium">Verified Support</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white"
                            title="Chat History"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">

                    {/* History Overly */}
                    {showHistory && (
                        <div className="absolute inset-0 bg-white z-20 flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center">
                                <span className="font-semibold text-gray-700 text-sm">Your Conversations</span>
                                <button
                                    onClick={startNewChat}
                                    className="flex items-center gap-1.5 text-xs text-[#01257D] font-medium hover:underline"
                                >
                                    <PlusCircle className="h-4 w-4" /> New Chat
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {sessions.length === 0 ? (
                                    <p className="text-center text-gray-400 text-xs py-10">No past conversations.</p>
                                ) : (
                                    sessions.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => loadSession(s.id)}
                                            className="w-full text-left p-3 hover:bg-[#01257D]/5 rounded-xl border border-transparent hover:border-[#01257D]/10 transition-all flex justify-between items-center group"
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-sm font-medium text-gray-700 truncate">{s.title}</p>
                                                <p className="text-[10px] text-gray-400">{new Date(s.updated_at).toLocaleDateString()}</p>
                                            </div>
                                            <ChevronLeft className="h-4 w-4 text-gray-300 group-hover:text-[#01257D] rotate-180" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4"
                    >
                        {messages.length === 0 && !isLoadingHistory && (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                                <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100">
                                    <Bot className="h-10 w-10 text-[#01257D]" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">How can I help you today?</h4>
                                    <p className="text-xs text-gray-500 max-w-[200px] mt-1 mx-auto">
                                        Ask me about project flows, HubSpot sync, or technical documentation.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isLoadingHistory && (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-6 w-6 text-[#01257D] animate-spin" />
                            </div>
                        )}

                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`p-1.5 rounded-lg h-fit ${m.role === 'user' ? 'bg-[#01257D] text-white' : 'bg-[#01257D]/5 text-[#01257D]'}`}>
                                    {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                </div>
                                <div
                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${m.role === 'user'
                                        ? 'bg-[#01257D] text-white rounded-tr-none'
                                        : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                                        }`}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-4 bg-white border-t border-gray-100 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-gray-50 border-none px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#01257D]/20 outline-none placeholder:text-gray-400"
                            disabled={isStreaming}
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || isStreaming}
                            className={`p-2.5 rounded-xl transition-all ${!inputText.trim() || isStreaming
                                ? 'bg-gray-100 text-gray-300'
                                : 'bg-[#01257D] text-white hover:bg-[#2346a0] active:scale-95 shadow-lg shadow-[#01257D]/10'
                                }`}
                        >
                            {isStreaming ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
