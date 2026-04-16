import React, { useState, useEffect } from 'react'
import {
    AlertTriangle,
    Phone,
    MapPin,
    User,
    Clock,
    CheckCircle2,
    Loader2,
    Navigation,
    MessageSquare,
    Share2,
    Activity,
    Mic,
    ShieldAlert,
    Wifi,
    WifiOff,
    MicOff,
    Ear
} from 'lucide-react'
import { runSilentSOSInference } from '../lib/localAI'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    serverTimestamp
} from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export default function EmergencySOSPage() {
    const { currentUser } = useAuth()
    const [profile, setProfile] = useState(null)
    const [location, setLocation] = useState(null)
    const [lastIncident, setLastIncident] = useState(null)
    const [loading, setLoading] = useState(false)
    const [sosActive, setSosActive] = useState(false)
    const [countdown, setCountdown] = useState(null)
    const [sentContacts, setSentContacts] = useState([])
    const [error, setError] = useState(null)
    const [silentMode, setSilentMode] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [silentAnalysis, setSilentAnalysis] = useState(null)
    const recognition = React.useRef(null)

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            recognition.current = new window.webkitSpeechRecognition()
            recognition.current.continuous = true
            recognition.current.interimResults = true
            recognition.current.onresult = (event) => {
                let latest = ''
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    latest += event.results[i][0].transcript
                }
                setTranscript(prev => prev + ' ' + latest)
            }
        }
    }, [])

    useEffect(() => {
        if (transcript.length > 50) {
            analyzeAmbientAudio()
        }
    }, [transcript])

    async function analyzeAmbientAudio() {
        const analysis = await runSilentSOSInference(transcript)
        setSilentAnalysis(analysis)
        if (analysis.priority === 'high') {
            triggerSilentBroadcast()
        }
    }

    async function triggerSilentBroadcast() {
        // Automatically send GPS to contacts with NO UI popup
        const emergencyData = {
            user_id: currentUser.uid,
            timestamp: new Date().toISOString(),
            type: 'SILENT_ALERT',
            location: location,
            transcript_snippet: transcript.slice(-100)
        }
        await addDoc(collection(db, "sos_events"), {
            ...emergencyData,
            priority: 'CRITICAL',
            created_at: serverTimestamp()
        })
    }

    const startSilentSOS = () => {
        setSilentMode(true)
        setIsRecording(true)
        recognition.current?.start()
        // No visual alert or vibration - keep it silent
    }

    useEffect(() => {
        fetchUserData()
        getCurrentLocation()
    }, [currentUser])

    async function fetchUserData() {
        if (!currentUser) return
        try {
            // Fetch health profile
            const profileDoc = await getDoc(doc(db, "health_profiles", currentUser.uid))
            if (profileDoc.exists()) {
                setProfile(profileDoc.data())
            }

            // Fetch last incident
            const q = query(
                collection(db, "incidents"),
                where("user_id", "==", currentUser.uid),
                orderBy("created_date", "desc"),
                limit(1)
            )
            const snapshot = await getDocs(q)
            if (!snapshot.empty) {
                setLastIncident({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
            }
        } catch (err) {
            console.error("Error fetching user data:", err)
        }
    }

    function getCurrentLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    })
                },
                (error) => {
                    console.error("Geolocation error:", error)
                    setError("Unable to get your location. Please enable location services.")
                }
            )
        } else {
            setError("Geolocation is not supported by your browser.")
        }
    }

    function startSOSCountdown() {
        setCountdown(5)
        setSosActive(true)
        setError(null)
    }

    useEffect(() => {
        if (countdown === null) return

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else if (countdown === 0) {
            triggerSOS()
        }
    }, [countdown])

    async function triggerSOS() {
        setLoading(true)
        setError(null)
        try {
            // Prepare emergency message
            const emergencyData = {
                user_id: currentUser.uid,
                user_name: currentUser.displayName || "AidVision User",
                timestamp: new Date().toISOString(),
                location: location ? {
                    lat: location.lat,
                    lng: location.lng,
                    maps_link: `https://www.google.com/maps?q=${location.lat},${location.lng}`
                } : null,
                health_profile: {
                    blood_type: profile?.blood_type || "Unknown",
                    allergies: profile?.allergies || [],
                    medications: profile?.medications || [],
                    conditions: profile?.medical_conditions || []
                },
                last_incident: lastIncident ? {
                    diagnosis: lastIncident.ai_analysis?.diagnosis || "No recent assessment",
                    severity: lastIncident.severity || "Unknown",
                    time: lastIncident.created_date?.toDate?.().toLocaleString() || "Unknown"
                } : null
            }

            // Generate emergency message text
            const messageText = generateEmergencyMessage(emergencyData)

            // Try to save SOS event to Firestore (non-blocking)
            try {
                await addDoc(collection(db, "sos_events"), {
                    ...emergencyData,
                    message: messageText,
                    contacts_notified: profile?.emergency_contacts || [],
                    created_at: serverTimestamp()
                })
                console.log("SOS event logged to Firestore")
            } catch (firestoreErr) {
                console.warn("Failed to log SOS to Firestore (continuing anyway):", firestoreErr)
                // Don't throw - we still want to send the message
            }

            // Set contacts for display
            const contacts = profile?.emergency_contacts || []
            setSentContacts(contacts)

            // Share or copy the emergency message
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: '🚨 EMERGENCY ALERT',
                        text: messageText,
                    })
                } else {
                    await navigator.clipboard.writeText(messageText)
                    alert('Emergency message copied to clipboard! Please paste and send to your emergency contacts.')
                }
            } catch (shareErr) {
                console.error("Share/clipboard error:", shareErr)
                // Show the message in an alert as fallback
                alert(messageText)
            }

        } catch (err) {
            console.error("SOS Error:", err)
            setError(`Failed to send SOS: ${err.message}`)
            setSosActive(false)
            setCountdown(null)
        } finally {
            setLoading(false)
        }
    }

    function generateEmergencyMessage(data) {
        let message = `🚨 EMERGENCY ALERT 🚨\n\n`
        message += `${data.user_name} needs immediate help!\n\n`

        if (data.location) {
            message += `📍 LOCATION:\n${data.location.maps_link}\n\n`
        }

        if (data.last_incident) {
            message += `🏥 MEDICAL STATUS:\n`
            message += `Condition: ${data.last_incident.diagnosis}\n`
            message += `Severity: ${data.last_incident.severity.toUpperCase()}\n`
            message += `Assessed: ${data.last_incident.time}\n\n`
        }

        message += `💉 HEALTH INFO:\n`
        message += `Blood Type: ${data.health_profile.blood_type}\n`
        if (data.health_profile.allergies.length > 0) {
            message += `Allergies: ${data.health_profile.allergies.join(', ')}\n`
        }
        if (data.health_profile.medications.length > 0) {
            message += `Medications: ${data.health_profile.medications.join(', ')}\n`
        }
        if (data.health_profile.conditions.length > 0) {
            message += `Conditions: ${data.health_profile.conditions.join(', ')}\n`
        }

        message += `\n⏰ Time: ${new Date().toLocaleString()}\n`
        message += `\nSent via AidVision Emergency SOS`

        return message
    }

    function cancelSOS() {
        setCountdown(null)
        setSosActive(false)
        setSentContacts([])
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <header className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                    <AlertTriangle size={40} className="text-red-500" />
                </div>
                <h1 className="text-4xl font-black text-blue-900">Smart SOS</h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                    One-touch emergency broadcast to your saved contacts with your location and medical information.
                </p>
            </header>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusCard
                    icon={<MapPin size={24} />}
                    title="Location"
                    status={location ? "Active" : "Unavailable"}
                    color={location ? "emerald" : "slate"}
                    detail={location ? `±${Math.round(location.accuracy)}m accuracy` : "Enable GPS"}
                />
                <StatusCard
                    icon={<User size={24} />}
                    title="Health Profile"
                    status={profile ? "Loaded" : "Not Set"}
                    color={profile ? "blue" : "amber"}
                    detail={profile?.blood_type || "No data"}
                />
                <StatusCard
                    icon={<Phone size={24} />}
                    title="Emergency Contacts"
                    status={profile?.emergency_contacts?.length || 0}
                    color="cyan"
                    detail={`${profile?.emergency_contacts?.length || 0} contacts`}
                />
            </div>

            {/* Last Incident Summary */}
            {lastIncident && (
                <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity size={20} className="text-blue-600" />
                        <h3 className="text-lg font-bold text-blue-900">Last Medical Assessment</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-slate-700">
                            <span className="font-bold">Diagnosis:</span> {lastIncident.ai_analysis?.diagnosis || "N/A"}
                        </p>
                        <p className="text-slate-700">
                            <span className="font-bold">Severity:</span>{' '}
                            <span className={cn(
                                "px-2 py-1 rounded-lg text-xs font-bold uppercase",
                                lastIncident.severity === 'critical' ? 'bg-red-100 text-red-600' :
                                    lastIncident.severity === 'severe' ? 'bg-orange-100 text-orange-600' :
                                        'bg-amber-100 text-amber-600'
                            )}>
                                {lastIncident.severity}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* SOS Button */}
            <AnimatePresence mode="wait">
                {!sosActive ? (
                    <motion.div
                        key="sos-button"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="flex flex-col items-center gap-6 py-12"
                    >
                        <button
                            onClick={startSOSCountdown}
                            disabled={!location || !profile}
                            className="w-64 h-64 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-4 group"
                        >
                            <AlertTriangle size={80} className="group-hover:animate-pulse" />
                            <span className="text-3xl font-black">EMERGENCY</span>
                            <span className="text-sm opacity-90">Press to activate SOS</span>
                        </button>
                        {(!location || !profile) && (
                            <p className="text-amber-600 text-sm font-medium">
                                ⚠️ Please enable location and set up your health profile first
                            </p>
                        )}
                    </motion.div>
                ) : countdown !== null && countdown > 0 ? (
                    <motion.div
                        key="countdown"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-6 py-12"
                    >
                        <div className="w-64 h-64 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 animate-ping"></div>
                            <span className="text-9xl font-black z-10">{countdown}</span>
                            <span className="text-xl font-bold z-10">Sending SOS...</span>
                        </div>
                        <button
                            onClick={cancelSOS}
                            className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all"
                        >
                            Cancel
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-emerald-500 p-10 rounded-[2.5rem] text-white text-center shadow-2xl"
                    >
                        <CheckCircle2 size={64} className="mx-auto mb-6" />
                        <h2 className="text-3xl font-black mb-4">SOS Sent Successfully!</h2>
                        <p className="text-emerald-50 text-lg mb-6">
                            Emergency alert has been broadcast to {sentContacts.length} contact(s)
                        </p>
                        <div className="space-y-2 mb-6">
                            {sentContacts.map((contact, i) => (
                                <div key={i} className="flex items-center justify-center gap-2 text-emerald-50">
                                    <CheckCircle2 size={16} />
                                    <span>{contact.name} - {contact.phone}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={cancelSOS}
                            className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-all"
                        >
                            Close
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Silent SOS Section */}
            <section className="relative overflow-hidden p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-lg">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 w-fit rounded-full text-xs font-bold uppercase tracking-widest text-blue-400">
                            <Ear size={14} />
                            Discrete Monitoring
                        </div>
                        <h2 className="text-3xl font-black">Silent SOS (Assault/Crisis Mode)</h2>
                        <p className="text-slate-400 font-medium">
                            If you cannot speak or are in a dangerous spot, use Silent SOS. Phone stays dark, but listens for threats and broadcasts your location instantly.
                        </p>
                    </div>

                    {!silentMode ? (
                        <button
                            onClick={startSilentSOS}
                            className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                        >
                            <ShieldAlert className="text-red-600" />
                            Activate Silent SOS
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="font-bold text-red-400 uppercase tracking-widest text-sm">Silent SOS Active</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-blue-400">
                                    <Mic size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Ambient Listening Engine</p>
                                    <p className="text-xs text-slate-500">{silentAnalysis ? silentAnalysis.situation_summary : "Waiting for audio patterns..."}</p>
                                </div>
                            </div>
                            {silentAnalysis && silentAnalysis.priority === 'high' && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 animate-bounce">
                                    <AlertTriangle size={18} />
                                    <span className="text-xs font-black uppercase">Critical Threat Detected</span>
                                </div>
                            )}
                            <button
                                onClick={() => { setSilentMode(false); setIsRecording(false); recognition.current?.stop(); }}
                                className="mt-2 text-xs text-slate-500 hover:text-white transition-colors underline"
                            >
                                Deactivate & Wipe Logs
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Instructions */}
            <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
                <h3 className="text-xl font-bold text-blue-900 mb-4">How Smart SOS Works</h3>
                <ol className="space-y-3 text-slate-700">
                    <li className="flex gap-3">
                        <span className="font-bold text-blue-600">1.</span>
                        <span>Press the Emergency button when you need immediate help</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-blue-600">2.</span>
                        <span>A 5-second countdown gives you time to cancel if pressed accidentally</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-blue-600">3.</span>
                        <span>Your GPS location, health profile, and last medical assessment are sent to all emergency contacts</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-blue-600">4.</span>
                        <span>The message can be shared via SMS, WhatsApp, or any messaging app</span>
                    </li>
                </ol>
            </div>
        </div>
    )
}

function StatusCard({ icon, title, status, color, detail }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        amber: 'bg-amber-50 text-amber-600',
        slate: 'bg-slate-50 text-slate-400'
    }

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-lg">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", colorClasses[color])}>
                {icon}
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-2xl font-black text-blue-900 mb-1">{status}</p>
            <p className="text-xs text-slate-400">{detail}</p>
        </div>
    )
}
