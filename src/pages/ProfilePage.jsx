import React, { useState, useEffect } from 'react'
import {
    User,
    Droplet,
    AlertTriangle,
    Pill,
    Stethoscope,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    Phone,
    Users
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { useLocation } from 'react-router-dom'
import FamilyPageContent from './FamilyPage'

export default function ProfilePage() {
    const { currentUser } = useAuth()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile') // 'profile' or 'family'
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)
    const [profile, setProfile] = useState({
        blood_type: 'Unknown',
        allergies: [],
        medications: [],
        medical_conditions: [],
        emergency_contacts: []
    })

    useEffect(() => {
        let isMounted = true;
        let profileTimeout;

        async function fetchProfile() {
            if (!currentUser) {
                setLoading(false)
                return
            }

            profileTimeout = setTimeout(() => {
                if (isMounted) {
                    setError("Synchronization is taking longer than expected. Please check your connection.")
                    setLoading(false)
                }
            }, 8000)

            try {
                setLoading(true)
                const docRef = doc(db, "health_profiles", currentUser.uid)
                const docSnap = await getDoc(docRef)

                if (isMounted) {
                    if (docSnap.exists()) {
                        setProfile(docSnap.data())
                    } else {
                        console.log("Profile not found - using defaults")
                    }
                }
            } catch (err) {
                console.error("Firestore Error:", err)
                if (isMounted) setError("Connection failed. Please check your Firebase rules.")
            } finally {
                if (isMounted) {
                    clearTimeout(profileTimeout)
                    setLoading(false)
                }
            }
        }

        fetchProfile()
        return () => {
            isMounted = false
            clearTimeout(profileTimeout)
        }
    }, [currentUser])

    async function handleSave() {
        if (!currentUser) return
        try {
            setSaving(true)
            setError(null)
            const docRef = doc(db, "health_profiles", currentUser.uid)
            // Use setDoc with merge: true so it creates the doc if it doesn't exist
            await setDoc(docRef, profile, { merge: true })
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            console.error("Error saving profile:", err)
            setError("Failed to save profile. Please check your internet connection and Firebase rules.")
        } finally {
            setSaving(false)
        }
    }

    const addItem = (field, value) => {
        if (!value.trim()) return
        setProfile(prev => ({
            ...prev,
            [field]: [...prev[field], value]
        }))
    }

    const removeItem = (field, index) => {
        setProfile(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }))
    }

    const addContact = () => {
        setProfile(prev => ({
            ...prev,
            emergency_contacts: [...prev.emergency_contacts, { name: '', relationship: '', phone: '' }]
        }))
    }

    const updateContact = (index, field, value) => {
        const newContacts = [...profile.emergency_contacts]
        newContacts[index][field] = value
        setProfile(prev => ({ ...prev, emergency_contacts: newContacts }))
    }

    if (loading) return (
        <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-blue-500 font-medium">Synchronizing health data...</p>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="ml-auto underline font-bold">Retry</button>
                </div>
            )}

            {/* Tabbed Header */}
            <header className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-blue-900">Health Management</h1>
                    <p className="text-slate-500">Manage your health profile and family members</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={cn(
                            "px-6 py-3 font-bold transition-all relative",
                            activeTab === 'profile'
                                ? "text-blue-600"
                                : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <User size={20} />
                            <span>My Profile</span>
                        </div>
                        {activeTab === 'profile' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('family')}
                        className={cn(
                            "px-6 py-3 font-bold transition-all relative",
                            activeTab === 'family'
                                ? "text-blue-600"
                                : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Users size={20} />
                            <span>Family</span>
                        </div>
                        {activeTab === 'family' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                            />
                        )}
                    </button>
                </div>
            </header>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'profile' ? (
                    <motion.div
                        key="profile-tab"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Blood Type */}
                            <Section icon={Droplet} title="Blood Type" color="text-red-500">
                                <select
                                    value={profile.blood_type}
                                    onChange={(e) => setProfile(p => ({ ...p, blood_type: e.target.value }))}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </Section>

                            {/* Array Sections */}
                            <ArraySection
                                icon={AlertTriangle}
                                title="Allergies"
                                field="allergies"
                                items={profile.allergies}
                                onAdd={addItem}
                                onRemove={removeItem}
                                color="text-amber-500"
                                placeholder="e.g. Peanuts, Latex"
                            />

                            <ArraySection
                                icon={Pill}
                                title="Medications"
                                field="medications"
                                items={profile.medications}
                                onAdd={addItem}
                                onRemove={removeItem}
                                color="text-blue-500"
                                placeholder="e.g. Aspirin, Insulin"
                            />

                            <ArraySection
                                icon={Stethoscope}
                                title="Medical Conditions"
                                field="medical_conditions"
                                items={profile.medical_conditions}
                                onAdd={addItem}
                                onRemove={removeItem}
                                color="text-purple-500"
                                placeholder="e.g. Asthma, Diabetes"
                            />
                        </div>

                        {/* Emergency Contacts */}
                        <section className="bg-white p-8 rounded-[2rem] border border-blue-50 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                        <Phone size={22} />
                                    </div>
                                    <h2 className="text-xl font-bold text-blue-900">Emergency Contacts</h2>
                                </div>
                                <button
                                    onClick={addContact}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {profile.emergency_contacts.map((contact, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={index}
                                        className="grid grid-cols-1 md:grid-cols-10 gap-4 p-4 bg-slate-50 rounded-2xl relative group"
                                    >
                                        <div className="md:col-span-3">
                                            <input
                                                placeholder="Name"
                                                value={contact.name}
                                                onChange={(e) => updateContact(index, 'name', e.target.value)}
                                                className="w-full p-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <input
                                                placeholder="Relationship"
                                                value={contact.relationship}
                                                onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                                                className="w-full p-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <input
                                                placeholder="Phone Number"
                                                value={contact.phone}
                                                onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                                className="w-full p-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                            />
                                        </div>
                                        <div className="md:col-span-1 flex items-center justify-center">
                                            <button
                                                onClick={() => removeItem('emergency_contacts', index)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                {profile.emergency_contacts.length === 0 && (
                                    <p className="text-center text-slate-400 py-4 italic">No emergency contacts added yet.</p>
                                )}
                            </div>
                        </section>

                        {/* Save Button for Profile Tab */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : success ? <><CheckCircle2 size={20} /> Saved</> : <><Save size={20} /> Save Profile</>}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="family-tab"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <FamilyPageContent />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function Section({ icon: Icon, title, children, color }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
                <Icon size={20} className={color} />
                <h2 className="text-lg font-bold text-blue-900">{title}</h2>
            </div>
            {children}
        </div>
    )
}

function ArraySection({ icon: Icon, title, items, onAdd, onRemove, color, placeholder, field }) {
    const [input, setInput] = useState('')

    const handleAdd = () => {
        onAdd(field, input)
        setInput('')
    }

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <Icon size={20} className={color} />
                <h2 className="text-lg font-bold text-blue-900">{title}</h2>
            </div>

            <div className="flex gap-2 mb-4">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder={placeholder}
                    className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm"
                />
                <button
                    onClick={handleAdd}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                    {items.map((item, i) => (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm group"
                        >
                            {item}
                            <button onClick={() => onRemove(field, i)} className="text-slate-400 hover:text-red-500">
                                <Trash2 size={14} />
                            </button>
                        </motion.span>
                    ))}
                </AnimatePresence>
                {items.length === 0 && <p className="text-xs text-slate-400 italic">None added</p>}
            </div>
        </div>
    )
}
