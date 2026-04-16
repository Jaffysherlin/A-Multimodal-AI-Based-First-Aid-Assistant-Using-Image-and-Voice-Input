import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot
} from 'firebase/firestore'
import { db } from './lib/firebase'
import {
    PlusCircle,
    MessageCircle,
    Activity as ActivityIcon,
    User as UserIcon,
    BookOpen,
    History,
    Calendar,
    ChevronRight,
    MapPin,
    AlertTriangle
} from 'lucide-react'
import AppLayout from './components/AppLayout'
import { useAuth } from './lib/AuthContext'
import { cn } from './lib/utils'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProfilePage from './pages/ProfilePage'
import TrainingPage from './pages/TrainingPage'
import AidBotPage from './pages/AidBotPage'
import AssessmentWizard from './pages/AssessmentWizard'
import GuidancePage from './pages/GuidancePage'
import HistoryPage from './pages/HistoryPage'
import DiagnosticPage from './pages/DiagnosticPage'
import HospitalMapPage from './pages/HospitalMapPage'
import FamilyPage from './pages/FamilyPage'
import EmergencySOSPage from './pages/EmergencySOSPage'
import VitalsPulsePage from './pages/VitalsPulsePage'
import BenchmarkPage from './pages/BenchmarkPage'
import { warmupAI } from './lib/localAI'

function App() {
    const { currentUser } = useAuth()

    useEffect(() => {
        // Automatically wake up the local AI engines on launch
        warmupAI();
    }, [])

    if (!currentUser) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        )
    }

    return (
        <AppLayout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/assessment" element={<AssessmentWizard />} />
                <Route path="/guidance/:incidentId" element={<GuidancePage />} />
                <Route path="/askaidbot" element={<AidBotPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/training" element={<TrainingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/diagnostic" element={<DiagnosticPage />} />
                <Route path="/hospitals" element={<HospitalMapPage />} />
                <Route path="/family" element={<FamilyPage />} />
                <Route path="/sos" element={<EmergencySOSPage />} />
                <Route path="/vitals" element={<VitalsPulsePage />} />
                <Route path="/benchmark" element={<BenchmarkPage />} />
            </Routes>
        </AppLayout>
    )
}

function Home() {
    const { currentUser } = useAuth()
    const [recentIncidents, setRecentIncidents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!currentUser) return

        const q = query(
            collection(db, "incidents"),
            where("user_id", "==", currentUser.uid)
            // Removed orderBy to avoid immediate index requirement
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (b.created_date?.seconds || 0) - (a.created_date?.seconds || 0))
                .slice(0, 3)
            setRecentIncidents(data)
            setLoading(false)
        }, (err) => {
            console.error("Home Firestore Error:", err)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    return (
        <div className="space-y-8">
            <section className="bg-white/80 backdrop-blur-md p-10 rounded-[2rem] border border-blue-100 shadow-2xl relative overflow-hidden group">
                {/* Floating SOS Button - Top Right */}
                <Link
                    to="/sos"
                    className="absolute top-6 right-6 z-20 group/sos"
                >
                    <div className="relative">
                        {/* Pulsing ring animation */}
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>

                        {/* Main button */}
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl shadow-red-500/50 flex flex-col items-center justify-center text-white hover:scale-110 active:scale-95 transition-all border-4 border-white">
                            <AlertTriangle size={28} className="mb-0.5" />
                            <span className="text-[10px] font-black uppercase tracking-tight">SOS</span>
                        </div>
                    </div>
                </Link>

                <div className="absolute top-0 right-0 p-8 text-blue-100 group-hover:text-blue-200/50 transition-colors">
                    <ActivityIcon size={180} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 leading-tight">
                        Welcome back, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                            {currentUser?.displayName || 'Hero'}
                        </span>
                    </h1>
                    <p className="text-xl text-blue-800 mb-8 max-w-xl">
                        Get instant AI guidance for any medical emergency or first aid situation.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/assessment"
                            className="px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                        >
                            <PlusCircle size={24} />
                            Start Emergency Assessment
                        </Link>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-blue-900 px-2">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <QuickActionCard
                        icon={MessageCircle}
                        title="Ask AidBot"
                        desc="Chat with AI for first aid"
                        path="/askaidbot"
                        color="bg-purple-500"
                    />
                    <QuickActionCard
                        icon={BookOpen}
                        title="Training Guides"
                        desc="Learn first aid basics"
                        path="/training"
                        color="bg-emerald-500"
                    />
                    <QuickActionCard
                        icon={MapPin}
                        title="Find Hospitals"
                        desc="Nearest medical help"
                        path="/hospitals"
                        color="bg-cyan-500"
                    />
                    <QuickActionCard
                        icon={ActivityIcon}
                        title="Vital Pulse"
                        desc="Measure heart & HRV"
                        path="/vitals"
                        color="bg-red-500"
                    />
                    <QuickActionCard
                        icon={UserIcon}
                        title="Profile"
                        desc="Manage health info"
                        path="/profile"
                        color="bg-blue-500"
                    />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-bold text-blue-900">Recent Incidents</h2>
                        <Link to="/history" className="text-sm font-bold text-blue-600 hover:underline">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {Array.isArray(recentIncidents) && recentIncidents.map((incident) => (
                            <Link
                                key={incident.id}
                                to={`/guidance/${incident.id}`}
                                className="flex items-center gap-4 p-4 bg-white/50 border border-blue-50 rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 overflow-hidden">
                                    {incident.image_url ? (
                                        <img src={incident.image_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <ActivityIcon size={24} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-blue-900 group-hover:text-blue-600 transition-colors">
                                        {incident.ai_analysis?.diagnosis || 'Status Pending'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Calendar size={12} />
                                        {incident.created_date?.toDate ? incident.created_date.toDate().toLocaleDateString() : 'Just now'}
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                        {(!recentIncidents || recentIncidents.length === 0) && !loading && (
                            <div className="bg-white/50 border border-blue-100 border-dashed rounded-3xl p-12 text-center">
                                <p className="text-blue-400 italic">No recent incidents found.</p>
                            </div>
                        )}
                        {loading && (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-blue-900 px-2">Health Profile</h2>
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform">
                            <UserIcon size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-white mb-6 font-medium leading-relaxed">Complete your health profile to get better AI assessments.</p>
                            <Link to="/profile" className="block text-center py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
                                Update Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function QuickActionCard({ icon: Icon, title, desc, path, color }) {
    return (
        <Link to={path} className="group transition-all">
            <div className="bg-white p-6 rounded-[1.5rem] border border-blue-50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all h-full flex flex-col items-center text-center">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-inner", color)}>
                    <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
            </div>
        </Link>
    )
}

export default App
