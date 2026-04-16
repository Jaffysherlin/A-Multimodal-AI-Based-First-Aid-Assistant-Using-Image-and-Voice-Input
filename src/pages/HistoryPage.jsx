import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import {
    Clock,
    ChevronRight,
    Activity,
    Calendar,
    MapPin,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

export default function HistoryPage() {
    const { currentUser } = useAuth()
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!currentUser) return

        // Removed orderBy to avoid requiring a composite index in Firestore
        const q = query(
            collection(db, "incidents"),
            where("user_id", "==", currentUser.uid)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            // Sort in-memory instead of on-server to fix index requirement issue
            const sortedData = data.sort((a, b) => {
                const dateA = a.created_date?.toDate?.() || new Date(0)
                const dateB = b.created_date?.toDate?.() || new Date(0)
                return dateB - dateA
            })

            setIncidents(sortedData)
            setLoading(false)
        }, (err) => {
            console.error("History Firestore Error:", err)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    const severityColors = {
        critical: 'bg-red-100 text-red-600',
        severe: 'bg-orange-100 text-orange-600',
        moderate: 'bg-amber-100 text-amber-600',
        minor: 'bg-emerald-100 text-emerald-600'
    }

    if (loading) return <div className="p-8 text-center text-blue-500">Loading History...</div>

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-blue-900">Incident History</h1>
                <p className="text-slate-500">Review your past emergency assessments and guidance.</p>
            </header>

            <div className="space-y-4">
                {incidents.map((incident, index) => (
                    <motion.div
                        key={incident.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            to={`/guidance/${incident.id}`}
                            className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-lg hover:shadow-2xl transition-all flex flex-col md:flex-row gap-6 items-center group"
                        >
                            {incident.image_url ? (
                                <img
                                    src={incident.image_url}
                                    className="w-24 h-24 rounded-2xl object-cover shadow-md shrink-0 border-2 border-slate-50"
                                    alt="Incident"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0 border-2 border-slate-50">
                                    <Activity size={32} />
                                </div>
                            )}

                            <div className="flex-1 space-y-2 text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                        severityColors[incident.severity] || 'bg-slate-100 text-slate-500'
                                    )}>
                                        {incident.severity}
                                    </span>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
                                        incident.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                    )}>
                                        {(incident.status === 'completed') ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                        {(incident.status || 'in_progress').replace('_', ' ')}
                                    </span>
                                    {incident.patient_name && (
                                        <span className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {incident.patient_name}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-blue-900 group-hover:text-blue-600 transition-colors">
                                    {incident.ai_analysis?.diagnosis || 'Diagnosis Pending'}
                                </h3>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        {incident.created_date?.toDate?.() ? incident.created_date.toDate().toLocaleDateString() : 'Just now'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {incident.created_date?.toDate?.() ? incident.created_date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl group-hover:bg-blue-50 transition-colors shrink-0">
                                <ChevronRight size={24} className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {incidents.length === 0 && (
                    <div className="p-20 text-center bg-white/50 border border-dashed border-blue-200 rounded-[3rem]">
                        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-300 mx-auto mb-6">
                            <HistoryIcon size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-blue-900 mb-2">No Incidents Yet</h3>
                        <p className="text-slate-500 mb-8">Your assessment history will appear here once you start an incident report.</p>
                        <Link to="/assessment" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                            New Assessment
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

function HistoryIcon(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            {...props}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    )
}
import { ArrowRight } from 'lucide-react'
import React from 'react'
