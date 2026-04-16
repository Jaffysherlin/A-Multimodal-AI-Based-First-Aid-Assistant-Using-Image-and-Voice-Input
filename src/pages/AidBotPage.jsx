import React, { useState, useEffect, useRef } from 'react'
import {
    Send,
    Bot,
    User,
    Loader2,
    MessageSquare,
    Phone,
    Trash2,
    Copy,
    ChevronDown,
    AlertCircle
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    getDocs
} from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { cn } from '../lib/utils'
import { loadLocalModels } from '../lib/localAI'

export default function AidBotPage() {
    const { currentUser } = useAuth()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [conversationId, setConversationId] = useState(null)
    const [convLoading, setConvLoading] = useState(true)
    const [convError, setConvError] = useState(null)
    const [error, setError] = useState(null)
    const scrollRef = useRef(null)

    useEffect(() => {
        if (!currentUser) return
        const fetchConversation = async () => {
            try {
                const q = query(collection(db, "conversations"), where("user_id", "==", currentUser.uid))
                const querySnapshot = await getDocs(q)
                if (!querySnapshot.empty) {
                    const docs = querySnapshot.docs.sort((a, b) => (b.data().last_updated?.seconds || 0) - (a.data().last_updated?.seconds || 0))
                    setConversationId(docs[0].id)
                } else {
                    const newConv = await addDoc(collection(db, "conversations"), {
                        user_id: currentUser.uid,
                        agent_name: "first_aid_assistant",
                        last_updated: serverTimestamp(),
                        created_at: serverTimestamp()
                    })
                    setConversationId(newConv.id)
                }
            } catch (err) {
                console.error("Chat Init Error:", err)
                setConvError("Connecting to AidBot...")
            } finally {
                setConvLoading(false)
            }
        }
        fetchConversation()
    }, [currentUser])

    useEffect(() => {
        if (!conversationId) return
        const q = query(collection(db, `conversations/${conversationId}/messages`), orderBy("timestamp", "asc"))
        return onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        })
    }, [conversationId])

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    async function sendMessage(e) {
        if (e) e.preventDefault()
        const userMessage = input.trim()
        if (!userMessage) return

        setInput('')
        setIsTyping(true)

        try {
            let currentConvId = conversationId
            if (!currentConvId) {
                const newConv = await addDoc(collection(db, "conversations"), {
                    user_id: currentUser.uid,
                    agent_name: "first_aid_assistant",
                    last_updated: serverTimestamp(),
                    created_at: serverTimestamp()
                })
                currentConvId = newConv.id
                setConversationId(currentConvId)
            }

            await addDoc(collection(db, `conversations/${currentConvId}/messages`), {
                role: 'user',
                content: userMessage,
                timestamp: serverTimestamp()
            })

            // TRY AI Synthesis
            let aiContent = "";
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

                const history = messages.slice(-6).map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }));

                const chat = model.startChat({ history });
                const result = await model.generateContent(userMessage + "\n\n(Note: You are AidBot. Stay clinical and professional.)");
                aiContent = result.response.text();
            } catch (aiErr) {
                console.warn("AidBot AI Quota/Error:", aiErr.message);
                // HELPFUL LOCAL FALLBACK FOR CHAT
                if (userMessage.toLowerCase().includes("burn")) aiContent = "To treat a burn: Immediatey run cool (not cold) water over the area for 10-15 minutes. Avoid ice. Cover with a sterile, non-stick dressing. If blisters appear or pain is severe, seek medical help.";
                else if (userMessage.toLowerCase().includes("bleed")) aiContent = "To control bleeding: Apply firm, direct pressure with a clean cloth. Elevate the limb. If blood soaks through, add more cloth on top - do not remove the original.";
                else aiContent = "I'm currently processing multiple incidents. For immediate medical guidance, please use our 'Assessment' tool or call 112 if this is a life-threatening emergency. How else can I assist with general first-aid knowledge?";
            }

            await addDoc(collection(db, `conversations/${currentConvId}/messages`), {
                role: 'assistant',
                content: aiContent,
                timestamp: serverTimestamp()
            })

        } catch (err) {
            console.error("Chat Error:", err)
        } finally {
            setIsTyping(false)
        }
    }

    const suggestions = ["What to do for a deep cut?", "How to treat a minor burn?", "Signs of a concussion", "How to perform CPR?"]

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col bg-white rounded-[2.5rem] border border-blue-50 shadow-2xl overflow-hidden" translate="no">
            <header className="px-8 py-6 border-b border-blue-50 flex items-center justify-between bg-white/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg"><Bot size={28} /></div>
                    <div><h2 className="text-xl font-bold text-blue-900">AidBot</h2><div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span className="text-sm text-slate-500">Intelligent Core Active</span></div></div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                {convLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4"><Loader2 size={40} className="text-blue-500 animate-spin" /><p className="text-blue-500 font-medium">Securing communication channel...</p></div>
                ) : messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
                        <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-500 mb-2"><MessageSquare size={40} /></div>
                        <h3 className="text-2xl font-bold text-blue-900">How can I help you today?</h3>
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {suggestions.map(s => (<button key={s} onClick={() => { setInput(s); sendMessage() }} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left text-slate-700 hover:bg-blue-50 transition-all flex justify-between items-center"><span className="text-sm font-medium">{s}</span><ChevronDown className="-rotate-90 text-slate-300" size={16} /></button>))}
                        </div>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md", msg.role === 'user' ? "bg-blue-600 text-white" : "bg-white border border-blue-100 text-blue-600")}>{msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}</div>
                            <div className={cn("p-5 rounded-[1.5rem] shadow-sm relative group", msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100")}>
                                <div className="prose prose-sm max-w-none prose-p:leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isTyping && (
                    <div className="flex gap-4 mr-auto">
                        <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-md"><Bot size={20} /></div>
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] rounded-tl-none shadow-sm flex gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span><span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></span></div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-6 border-t border-blue-50 bg-white">
                <form onSubmit={sendMessage} className="relative group">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question here..." className="w-full pl-6 pr-32 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button type="submit" disabled={!input.trim() || isTyping} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all disabled:opacity-50"><Send size={24} /></button>
                    </div>
                </form>
                <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-widest font-bold">AidBot provides general information and is not a substitute for professional medical advice.</p>
            </div>
        </div>
    )
}
