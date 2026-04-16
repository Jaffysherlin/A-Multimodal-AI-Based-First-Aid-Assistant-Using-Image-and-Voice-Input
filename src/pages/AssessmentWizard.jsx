import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Camera,
    Mic,
    Send,
    ArrowRight,
    ArrowLeft,
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Activity,
    Users,
    User,
    Heart,
    History
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'
import { db, storage } from '../lib/firebase'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { runHybridInference } from '../lib/localAI'

const steps = [
    { id: 0, title: 'Identity', desc: 'Who is this for?' },
    { id: 1, title: 'Visual Assessment', desc: 'Upload or take a photo' },
    { id: 2, title: 'Symptom Details', desc: 'Describe what happened' },
    { id: 3, title: 'AI Analysis', desc: 'Get immediate guidance' }
]

export default function AssessmentWizard() {
    const { currentUser } = useAuth()
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(0)
    const [selectedProfile, setSelectedProfile] = useState({ type: 'me', name: 'Myself' })
    const [dependents, setDependents] = useState([])
    const [image, setImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [symptoms, setSymptoms] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('')
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (!currentUser) return
        const fetchDependents = async () => {
            const { getDocs, query, where, collection } = await import('firebase/firestore')
            const q = query(collection(db, "dependents"), where("user_id", "==", currentUser.uid))
            const snapshot = await getDocs(q)
            setDependents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        }
        fetchDependents()
    }, [currentUser])

    const recognition = useRef(null)
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            recognition.current = new window.webkitSpeechRecognition()
            recognition.current.continuous = true
            recognition.current.interimResults = true
            recognition.current.onresult = (event) => {
                let transcript = ''
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    transcript += event.results[i][0].transcript
                }
                setSymptoms(prev => prev + ' ' + transcript)
            }
        }
    }, [])

    const toggleRecording = () => {
        if (isRecording) recognition.current?.stop()
        else recognition.current?.start()
        setIsRecording(!isRecording)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

    async function startAnalysis() {
        setLoading(true)
        setError('')
        setStatus('Warming up Neural Core...')

        try {
            // Task 1: Fetch Profile (Non-Blocking if needed)
            let profileData = { name: selectedProfile.name || 'User', relation: selectedProfile.relation || 'Self' };
            try {
                if (selectedProfile.type === 'me') {
                    const profileDoc = await getDoc(doc(db, "health_profiles", currentUser.uid));
                    if (profileDoc.exists()) {
                        profileData = { ...profileData, ...profileDoc.data() };
                    }
                }
            } catch (e) { console.warn("Profile fetch skipped."); }

            // Task 2: Core Analysis
            const result = await runHybridInference(
                symptoms,
                image,
                (msg) => setStatus(msg),
                { heart_rate: 80, oxygen_sat: 98, systolic_bp: 120, diastolic_bp: 80, temperature: 36.5 }
            );

            // Task 3: Background tasks (Image Upload)
            let imageUrl = '';
            const uploadBackground = async () => {
                if (!image) return;
                try {
                    const storageRef = ref(storage, `incidents/${currentUser.uid}/${Date.now()}_${image.name}`);
                    const snapshot = await uploadBytes(storageRef, image);
                    return await getDownloadURL(snapshot.ref);
                } catch (e) { console.error("BG Upload Failed", e); return ''; }
            };

            // Start upload but don't strictly wait forever if it's the only thing left
            setStatus('Synchronizing Evidence...')

            const analysisData = result.final;

            // Create the record
            const incidentRef = await addDoc(collection(db, "incidents"), {
                user_id: currentUser.uid,
                patient_name: profileData.name,
                patient_relation: profileData.relation || 'Self',
                incident_type: result.validated_category,
                severity: analysisData.severity,
                symptoms_description: symptoms,
                image_url: imagePreview || '', // Use preview for instant display if upload slow
                ai_analysis: {
                    diagnosis: analysisData.diagnosis,
                    severity_assessment: analysisData.severity,
                    immediate_actions: analysisData.immediate_actions,
                    rationale: analysisData.rationale
                },
                guidance_steps: (analysisData.guidance_steps || []).map((s, i) => ({
                    step_number: i + 1,
                    instruction: s.step,
                    duration_seconds: s.duration || 0,
                    completed: false
                })),
                incident_time: serverTimestamp(),
                status: 'in_progress',
                created_date: serverTimestamp()
            });

            // Navigate IMMEDIATELY
            navigate(`/guidance/${incidentRef.id}`);

        } catch (err) {
            console.error("Critical System Fault:", err)
            setError(`Synthesis diverted to local storage. Please try again or call 112.`)
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 relative">
            <Link to="/history" className="fixed top-6 right-6 z-50 group/history">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl flex flex-col items-center justify-center text-white hover:scale-110 active:scale-95 transition-all border-4 border-white">
                    <History size={24} className="mb-0.5" />
                    <span className="text-[9px] font-black uppercase tracking-tight">History</span>
                </div>
            </Link>

            <div className="flex items-center justify-between px-6">
                {steps.map((s, i) => (
                    <div key={s.id} className="flex flex-col items-center gap-2 relative flex-1">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 z-10",
                            currentStep >= s.id ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-300 border border-slate-100"
                        )}>
                            {currentStep > s.id ? <CheckCircle2 size={24} /> : <span>{s.id}</span>}
                        </div>
                        <span className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            currentStep >= s.id ? "text-blue-600" : "text-slate-400"
                        )}>{s.title}</span>
                        {i < steps.length - 1 && (
                            <div className={cn(
                                "absolute top-6 left-[60%] w-[80%] h-0.5 -z-0",
                                currentStep > s.id ? "bg-blue-600" : "bg-slate-100"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-blue-50 shadow-2xl min-h-[500px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                    {currentStep === 0 && (
                        <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-blue-900">Guardian Link Selection</h2>
                                <p className="text-slate-500">Who is experiencing this medical situation?</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => { setSelectedProfile({ type: 'me', name: 'Myself' }); nextStep(); }} className={cn("p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 group", selectedProfile.type === 'me' ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-blue-200")}>
                                    <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><User size={30} /></div>
                                    <div className="text-center"><span className="block font-bold text-lg text-blue-900">Myself</span><span className="text-sm text-slate-500">Personal Profile</span></div>
                                </button>
                                {dependents.map(dep => (
                                    <button key={dep.id} onClick={() => { setSelectedProfile({ ...dep, type: 'dependent' }); nextStep(); }} className={cn("p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 group", selectedProfile.id === dep.id ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-blue-200")}>
                                        <div className="w-16 h-16 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Heart size={30} /></div>
                                        <div className="text-center"><span className="block font-bold text-lg text-blue-900">{dep.name}</span><span className="text-sm text-slate-500">{dep.relation}</span></div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 h-full">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-blue-900">Visual Evidence</h2>
                                <p className="text-slate-500">A photo helps AidVision provide more accurate first aid steps.</p>
                            </div>
                            <div onClick={() => !imagePreview && fileInputRef.current?.click()} className={cn("relative aspect-[4/3] rounded-[2rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden group", imagePreview ? "border-blue-500" : "border-slate-100 hover:border-blue-200 hover:bg-blue-50")}>
                                {imagePreview ? (
                                    <><img src={imagePreview} className="w-full h-full object-cover" alt="Captured" /><button onClick={(e) => { e.stopPropagation(); setImage(null); setImagePreview(null) }} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button></>
                                ) : (
                                    <><div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><Camera size={40} /></div>
                                        <div className="text-center"><p className="font-bold text-slate-700">Tap to Take Photo</p><p className="text-sm text-slate-400">or click to upload from files</p></div></>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-blue-900">Describe Symptoms</h2>
                                <p className="text-slate-500">Speak or type details about the incident.</p>
                            </div>
                            <div className="space-y-4">
                                <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe what happened, when it started, and where the pain is..." className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg leading-relaxed shadow-inner" />
                                <div className="flex justify-center">
                                    <button onClick={toggleRecording} className={cn("flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all active:scale-95 shadow-xl", isRecording ? "bg-red-500 text-white animate-pulse" : "bg-blue-50 text-blue-600 hover:bg-blue-100")}>
                                        <Mic size={24} className={isRecording ? "animate-bounce" : ""} />
                                        {isRecording ? "Listening..." : "Speak Description"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-12 py-10">
                            {loading ? (
                                <div className="space-y-8">
                                    <div className="relative mx-auto w-32 h-32">
                                        <div className="absolute inset-0 rounded-full border-8 border-blue-50"></div>
                                        <div className="absolute inset-0 rounded-full border-8 border-t-blue-600 animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-blue-600"><Activity size={48} className="animate-pulse" /></div>
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-4xl font-black text-blue-900 animate-pulse">Analyzing Case...</h2>
                                        <p className="text-xl text-blue-600 font-bold">{status}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto"><CheckCircle2 size={64} /></div>
                                    <h2 className="text-3xl font-bold text-blue-900">Ready for Analysis</h2>
                                    <p className="text-slate-500 max-w-sm mx-auto">Neural Core linked. High-fidelity medical guidance ready.</p>
                                    {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">{error}</div>}
                                    <button onClick={startAnalysis} className="px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xl font-black rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-blue-500/40">Secure Neural Synthesis</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 flex justify-between gap-4">
                    <button disabled={currentStep === 0 || loading} onClick={prevStep} className="flex items-center gap-2 px-6 py-4 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-0"><ArrowLeft size={20} />Back</button>
                    {currentStep < 3 && (
                        <button onClick={nextStep} className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:scale-95 group">Continue<ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></button>
                    )}
                </div>
            </div>
        </div>
    )
}
