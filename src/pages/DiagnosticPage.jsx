import React, { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Play, AlertTriangle, Activity } from 'lucide-react'
import { db, storage } from '../lib/firebase'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'

export default function DiagnosticPage() {
    const [bertStatus, setBertStatus] = useState('idle')
    const [visionStatus, setVisionStatus] = useState('idle')
    const [ollamaStatus, setOllamaStatus] = useState('idle')
    const [researchServerStatus, setResearchServerStatus] = useState('idle')
    const [firebaseStatus, setFirebaseStatus] = useState('idle')
    const [firebaseWriteStatus, setFirebaseWriteStatus] = useState('idle')
    const [error, setError] = useState(null)

    async function testLocalAI() {
        setBertStatus('loading')
        setVisionStatus('loading')
        setOllamaStatus('loading')
        setError(null)

        // Test Local BERT & Vision (Stage 1 & 2)
        try {
            const { loadLocalModels } = await import('../lib/localAI')
            await loadLocalModels();
            setBertStatus('success');
            setVisionStatus('success');
        } catch (err) {
            setBertStatus('error');
            setVisionStatus('error');
            console.error("Local Model Load Error:", err);
        }

        // Test Ollama (Stage 3)
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            if (response.ok) {
                const data = await response.json();
                if (data.models && data.models.some(m => m.name.includes('qwen2.5:0.5b'))) {
                    setOllamaStatus('success');
                } else {
                    setOllamaStatus('error');
                    setError("Ollama is active, but 'qwen2.5:0.5b' is missing. Please run 'ollama run qwen2.5:0.5b'.");
                }
            } else { setOllamaStatus('error'); }
        } catch (err) {
            setOllamaStatus('error');
            console.warn("Ollama is offline.");
        }

        // Test Research Server (Stage 4)
        setResearchServerStatus('loading');
        try {
            const response = await fetch('http://localhost:8000/docs'); // FastAPI docs check
            if (response.ok) {
                setResearchServerStatus('success');
            } else {
                setResearchServerStatus('error');
            }
        } catch (err) {
            setResearchServerStatus('error');
        }
    }

    async function testFirebase() {
        setFirebaseStatus('loading')
        try {
            const q = query(collection(db, "incidents"), limit(1))
            await getDocs(q)
            setFirebaseStatus('success')
        } catch (err) {
            console.error(err)
            setFirebaseStatus('error')
            setError(`Firebase Read Error: ${err.message}`)
        }
    }

    async function testFirebaseWrite() {
        setFirebaseWriteStatus('loading')
        try {
            const { addDoc, deleteDoc, doc } = await import('firebase/firestore')
            const testRef = await addDoc(collection(db, "connection_tests"), {
                timestamp: new Date().toISOString(),
                test: "write_check"
            })
            await deleteDoc(doc(db, "connection_tests", testRef.id))
            setFirebaseWriteStatus('success')
        } catch (err) {
            console.error(err)
            setFirebaseWriteStatus('error')
            setError(`Firebase Write Error: ${err.message}. This usually means your Firestore Security Rules are blocking writes or the 'dependents' collection isn't allowed.`)
        }
    }

    const [storageStatus, setStorageStatus] = useState('idle')
    async function testStorage() {
        setStorageStatus('loading')
        try {
            const storageRef = ref(storage, 'test_connection.txt')
            // Just getting metadata or a non-existent URL to check connectivity/config
            await getDownloadURL(storageRef).catch(e => {
                if (e.code === 'storage/object-not-found') return true // Bucket exists, but file doesn't (Success for config)
                throw e
            })
            setStorageStatus('success')
        } catch (err) {
            console.error(err)
            setStorageStatus('error')
            setError(`Firebase Storage Error: ${err.message}. Please ensure Firebase Storage is enabled in console.`)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-10 space-y-8" translate="no">
            <header className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-blue-900">Edge Intelligence Diagnostics</h1>
                <p className="text-slate-500 font-medium">Validation of local BERT, MobileNet, and Qwen2.5-0.5B pipelines.</p>
            </header>

            <div className="grid gap-6">
                {/* Local AI Integrity */}
                <div className="bg-white p-6 rounded-3xl border border-blue-50 shadow-xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-lg font-bold">Local AI Integrity</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-sm font-bold text-slate-700">Stage 1: BERT Triage Engine</span>
                            <StatusBadge status={bertStatus} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-sm font-bold text-slate-700">Stage 2: MobileNet Vision Pipe</span>
                            <StatusBadge status={visionStatus} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-sm font-bold text-slate-700">Stage 3: Ollama (Qwen2.5-0.5B)</span>
                            <StatusBadge status={ollamaStatus} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-sm font-bold text-slate-700">Stage 4: Research Server (TSM Hybrid)</span>
                            <StatusBadge status={researchServerStatus} />
                        </div>
                    </div>

                    <button
                        onClick={testLocalAI}
                        disabled={bertStatus === 'loading'}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200"
                    >
                        {bertStatus === 'loading' ? <Loader2 className="animate-spin mx-auto" /> : 'Run Integrity Analysis'}
                    </button>
                </div>

                {/* Firebase Read Test */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${firebaseStatus === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                <Play size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Firestore Read Access</h2>
                        </div>
                        <StatusBadge status={firebaseStatus} />
                    </div>
                    <p className="text-sm text-slate-500">Tests if you can read data from the database.</p>
                    <button
                        onClick={testFirebase}
                        disabled={firebaseStatus === 'loading'}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        {firebaseStatus === 'loading' ? <Loader2 className="animate-spin" /> : 'Test Read Access'}
                    </button>
                </div>

                {/* Firebase Write Test */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${firebaseWriteStatus === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                <Play size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Firestore Write Access</h2>
                        </div>
                        <StatusBadge status={firebaseWriteStatus} />
                    </div>
                    <p className="text-sm text-slate-500">Tests if your Security Rules allow creating new records (Required for Guardian Link).</p>
                    <button
                        onClick={testFirebaseWrite}
                        disabled={firebaseWriteStatus === 'loading'}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        {firebaseWriteStatus === 'loading' ? <Loader2 className="animate-spin" /> : 'Test Write Access'}
                    </button>
                </div>

                {/* Storage Test */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${storageStatus === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                <Play size={20} />
                            </div>
                            <h2 className="text-lg font-bold">Firebase Storage</h2>
                        </div>
                        <StatusBadge status={storageStatus} />
                    </div>
                    <p className="text-sm text-slate-500">Tests if Photo Storage is enabled in your project.</p>
                    <button
                        onClick={testStorage}
                        disabled={storageStatus === 'loading'}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        {storageStatus === 'loading' ? <Loader2 className="animate-spin" /> : 'Run Storage Test'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl text-red-600 space-y-2">
                    <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-widest">
                        <AlertTriangle size={16} />
                        Diagnostic Error
                    </div>
                    <p className="text-sm font-mono whitespace-pre-wrap">{error}</p>
                    <div className="mt-4 p-4 bg-white/50 rounded-xl space-y-2">
                        <p className="font-bold text-xs">Recommended Solutions:</p>
                        <ul className="text-xs list-disc pl-4 space-y-1">
                            <li>Ensure <strong>Ollama</strong> is installed and running on <code>localhost:11434</code>.</li>
                            <li>Run <code>ollama run llama3</code> to pull the required LLM weights.</li>
                            <li>Wait for <strong>Transformers.js</strong> to download BERT (~50MB) and MobileNet (~20MB) to your browser cache.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ status }) {
    if (status === 'idle') return <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase">Ready</span>
    if (status === 'loading') return <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase animate-pulse text-center flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Testing</span>
    if (status === 'success') return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Pass</span>
    if (status === 'error') return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase flex items-center gap-1"><XCircle size={12} /> Fail</span>
}
