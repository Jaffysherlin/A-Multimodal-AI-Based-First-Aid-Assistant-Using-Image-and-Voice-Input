import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    getDoc,
    doc,
    updateDoc
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
    CheckCircle2,
    ArrowRight,
    Clock,
    ChevronRight,
    AlertTriangle,
    X,
    Phone,
    Home as HomeIcon,
    ShieldCheck,
    Stethoscope,
    HelpCircle,
    MessageCircle,
    Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export default function GuidancePage() {
    const { incidentId } = useParams()
    const navigate = useNavigate()
    const [incident, setIncident] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeStep, setActiveStep] = useState(0)
    const [timer, setTimer] = useState(0)
    const [isTimerRunning, setIsTimerRunning] = useState(false)

    useEffect(() => {
        async function fetchIncident() {
            try {
                const docRef = doc(db, "incidents", incidentId)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    setIncident(docSnap.data())
                    // Find first uncompleted step
                    const steps = docSnap.data().guidance_steps || []
                    const firstUnfinished = steps.findIndex(s => !s.completed)
                    setActiveStep(firstUnfinished === -1 ? 0 : firstUnfinished)
                }
            } catch (err) {
                console.error("Error fetching incident:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchIncident()
    }, [incidentId])

    useEffect(() => {
        let interval;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer(p => p - 1)
            }, 1000)
        } else if (timer === 0) {
            setIsTimerRunning(false)
        }
        return () => clearInterval(interval)
    }, [isTimerRunning, timer])

    const completeStep = async (index) => {
        const newSteps = [...incident.guidance_steps]
        newSteps[index].completed = true

        try {
            const docRef = doc(db, "incidents", incidentId)
            await updateDoc(docRef, { guidance_steps: newSteps })
            setIncident({ ...incident, guidance_steps: newSteps })

            if (index < newSteps.length - 1) {
                setActiveStep(index + 1)
                const nextStepDuration = newSteps[index + 1].duration_seconds
                if (nextStepDuration > 0) {
                    setTimer(nextStepDuration)
                    setIsTimerRunning(true)
                }
            } else {
                // All steps completed
                await updateDoc(docRef, { status: 'completed' })
                setIncident(prev => ({ ...prev, status: 'completed' }))
            }
        } catch (err) {
            console.error("Error updating step:", err)
        }
    }

    const startStepTimer = (duration) => {
        setTimer(duration)
        setIsTimerRunning(true)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-brand-mesh">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-blue-600 font-bold">Loading Guidance Engine...</p>
            </div>
        </div>
    )
    if (!incident) return <div className="p-8 text-center text-red-500">Incident not found.</div>

    const severityColors = {
        critical: 'bg-red-500 text-white shadow-red-200',
        severe: 'bg-orange-500 text-white shadow-orange-200',
        moderate: 'bg-amber-500 text-white shadow-amber-200',
        minor: 'bg-emerald-500 text-white shadow-emerald-200'
    }

    const recommendationIcons = {
        emergency: <Phone className="text-red-500" />,
        urgent_care: <Stethoscope className="text-orange-500" />,
        doctor: <ShieldCheck className="text-blue-500" />,
        home_care: <HomeIcon className="text-emerald-500" />
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
            {/* Header Card */}
            <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-blue-50 shadow-2xl flex flex-col md:flex-row gap-8 items-start md:items-center">
                {incident.image_url && (
                    <img
                        src={incident.image_url}
                        className="w-40 h-40 rounded-3xl object-cover shadow-lg border-4 border-white shrink-0"
                        alt="Injury"
                    />
                )}
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg",
                            severityColors[incident.severity] || 'bg-slate-500 text-white'
                        )}>
                            {incident.severity?.toUpperCase()} SEVERITY
                        </span>
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={14} />
                            Reported recently
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-blue-900 leading-tight">
                        {incident.ai_analysis?.diagnosis || 'Injury Assessment'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-2xl w-fit">
                            <AlertTriangle size={18} className="text-blue-600" />
                            <span className="text-sm font-bold text-blue-800">Recommendation: Follow All Steps</span>
                        </div>
                        {incident.patient_name && (
                            <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-2xl w-fit border border-cyan-100">
                                <span className="text-sm font-bold text-cyan-800">Patient: {incident.patient_name} ({incident.patient_relation})</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Steps */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-blue-900 px-4">Action Steps</h2>
                    <div className="space-y-4">
                        {(incident.guidance_steps || []).map((step, idx) => {
                            const isActive = activeStep === idx
                            const isDone = step.completed

                            return (
                                <motion.div
                                    key={idx}
                                    layout
                                    className={cn(
                                        "relative overflow-hidden transition-all duration-300",
                                        isActive ? "scale-105 z-10" : "scale-100 opacity-60"
                                    )}
                                >
                                    <div className={cn(
                                        "p-8 rounded-[2rem] border-2 transition-all",
                                        isActive
                                            ? "bg-white border-blue-500 shadow-2xl"
                                            : isDone
                                                ? "bg-emerald-50 border-emerald-100 opacity-100"
                                                : "bg-white border-slate-100"
                                    )}>
                                        <div className="flex items-start gap-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-all",
                                                isDone
                                                    ? "bg-emerald-500 text-white"
                                                    : isActive
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                        : "bg-slate-100 text-slate-400"
                                            )}>
                                                {isDone ? <CheckCircle2 size={24} /> : idx + 1}
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <p className={cn(
                                                    "text-xl font-bold leading-relaxed",
                                                    isActive ? "text-blue-900" : isDone ? "text-emerald-700" : "text-slate-500"
                                                )}>
                                                    {step.instruction}
                                                </p>

                                                {isActive && step.duration_seconds > 0 && !isDone && (
                                                    <div className="flex items-center gap-4">
                                                        {timer > 0 ? (
                                                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black tabular-nums">
                                                                <Clock size={18} />
                                                                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => startStepTimer(step.duration_seconds)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
                                                            >
                                                                <Clock size={18} />
                                                                Start {step.duration_seconds}s Timer
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {isActive && !isDone && (
                                                    <button
                                                        onClick={() => completeStep(idx)}
                                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all group"
                                                    >
                                                        Mark as Done
                                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {incident.status === 'completed' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-emerald-500 p-10 rounded-[2.5rem] text-white text-center shadow-2xl shadow-emerald-200"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={48} />
                            </div>
                            <h2 className="text-3xl font-black mb-4">You did it!</h2>
                            <p className="text-emerald-50 text-xl font-medium mb-8">
                                All first aid steps have been followed. Monitor the patient and seek medical help if status changes.
                            </p>
                            <Link to="/history" className="inline-block px-10 py-4 bg-white text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-all">
                                View in History
                            </Link>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar: Details */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-blue-50 shadow-xl space-y-6">
                        <h3 className="text-xl font-bold text-blue-900">Medical Summary</h3>

                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Immediate Actions</span>
                                <ul className="mt-2 space-y-2">
                                    {(incident.ai_analysis?.immediate_actions || []).map((act, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-slate-700 font-medium">
                                            <span className="text-red-500 mt-1">•</span>
                                            {act}
                                        </li>
                                    ))}
                                    {(!incident.ai_analysis?.immediate_actions || incident.ai_analysis.immediate_actions.length === 0) && (
                                        <li className="text-sm text-slate-400 italic">No immediate actions specified.</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Provided Symptoms</span>
                                <p className="mt-2 text-sm text-slate-600 italic">"{incident.symptoms_description}"</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-cyan-700 p-8 rounded-[2rem] text-white shadow-xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <HelpCircle size={22} />
                            </div>
                            <h3 className="text-xl font-bold">Need Help?</h3>
                        </div>
                        <a href="tel:112" className="w-full py-4 bg-white text-blue-600 font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-blue-50 transition-all">
                            <Phone size={20} />
                            CALL 112
                        </a>
                        <Link to="/askaidbot" className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 border border-blue-400 hover:bg-blue-400 transition-all">
                            <MessageCircle size={20} />
                            Ask AidBot
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
