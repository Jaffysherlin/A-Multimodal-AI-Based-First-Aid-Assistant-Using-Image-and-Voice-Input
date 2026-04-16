import React, { useState, useEffect } from 'react'
import {
    Users,
    Plus,
    Trash2,
    Heart,
    ChevronRight,
    UserPlus,
    Calendar,
    Activity,
    AlertCircle,
    Save,
    X,
    Pill,
    Stethoscope,
    Droplet
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export default function FamilyPage() {
    const { currentUser } = useAuth()
    const [dependents, setDependents] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [editingDependent, setEditingDependent] = useState(null)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        relation: 'Child',
        blood_type: 'Unknown',
        allergies: [],
        medications: [],
        conditions: []
    })

    const [newTag, setNewTag] = useState({ field: '', value: '' })

    useEffect(() => {
        fetchDependents()
    }, [currentUser])

    async function fetchDependents() {
        if (!currentUser) return
        try {
            setLoading(true)
            const q = query(
                collection(db, "dependents"),
                where("user_id", "==", currentUser.uid)
            )
            const querySnapshot = await getDocs(q)
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setDependents(data)
        } catch (err) {
            console.error("Error fetching dependents:", err)
            setError("Failed to load family members.")
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(e) {
        e.preventDefault()
        if (!currentUser) return
        try {
            setLoading(true)
            setError(null)

            // Clean and validate data
            const cleanData = {
                ...formData,
                age: parseInt(formData.age) || 0,
                updated_at: serverTimestamp()
            }

            if (editingDependent) {
                await updateDoc(doc(db, "dependents", editingDependent.id), cleanData)
            } else {
                await addDoc(collection(db, "dependents"), {
                    ...cleanData,
                    user_id: currentUser.uid,
                    created_at: serverTimestamp()
                })
            }
            setIsAdding(false)
            setEditingDependent(null)
            resetForm()
            fetchDependents()
        } catch (err) {
            console.error("Firestore Save Error:", err)
            setError(`Failed to save: ${err.message || 'Unknown error'}. Please check if you have internet connection and Firestore is enabled.`)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to remove this family member?")) return
        try {
            await deleteDoc(doc(db, "dependents", id))
            fetchDependents()
        } catch (err) {
            console.error("Error deleting dependent:", err)
            setError("Failed to delete member.")
        }
    }

    function resetForm() {
        setFormData({
            name: '',
            age: '',
            relation: 'Child',
            blood_type: 'Unknown',
            allergies: [],
            medications: [],
            conditions: []
        })
    }

    function startEdit(dep) {
        setEditingDependent(dep)
        setFormData({
            name: dep.name,
            age: dep.age,
            relation: dep.relation,
            blood_type: dep.blood_type || 'Unknown',
            allergies: dep.allergies || [],
            medications: dep.medications || [],
            conditions: dep.conditions || []
        })
        setIsAdding(true)
    }

    const addTag = (field) => {
        if (!newTag.value.trim()) return
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], newTag.value.trim()]
        }))
        setNewTag({ field: '', value: '' })
    }

    const removeTag = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }))
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 leading-tight">Guardian Link</h1>
                    <p className="text-slate-500 font-medium">Manage and protect profiles for your family and dependents.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => { resetForm(); setIsAdding(true); setEditingDependent(null) }}
                        className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <UserPlus size={20} />
                        Add Family Member
                    </button>
                )}
            </header>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                {isAdding ? (
                    <motion.div
                        key="member-form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-blue-50 shadow-2xl relative"
                    >
                        <button
                            onClick={() => setIsAdding(false)}
                            className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <form onSubmit={handleSave} className="space-y-8">
                            <h2 className="text-2xl font-bold text-blue-900 border-b border-slate-100 pb-4">
                                {editingDependent ? 'Update Profile' : 'New Dependent Profile'}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput
                                    label="Full Name"
                                    placeholder="Enter name"
                                    value={formData.name}
                                    onChange={v => setFormData({ ...formData, name: v })}
                                />
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Relation</label>
                                    <select
                                        value={formData.relation}
                                        onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        <option value="Child">Child</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Sibling">Sibling</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <FormInput
                                    label="Age"
                                    type="number"
                                    placeholder="Age"
                                    value={formData.age}
                                    onChange={v => setFormData({ ...formData, age: v })}
                                />
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Blood Type</label>
                                    <select
                                        value={formData.blood_type}
                                        onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <TagInput
                                    icon={AlertCircle}
                                    title="Allergies"
                                    field="allergies"
                                    items={formData.allergies}
                                    onAdd={addTag}
                                    onRemove={removeTag}
                                    color="text-amber-500"
                                    placeholder="Add allergy..."
                                    newTagValue={newTag.field === 'allergies' ? newTag.value : ''}
                                    setNewTag={v => setNewTag({ field: 'allergies', value: v })}
                                />
                                <TagInput
                                    icon={Pill}
                                    title="Medications"
                                    field="medications"
                                    items={formData.medications}
                                    onAdd={addTag}
                                    onRemove={removeTag}
                                    color="text-blue-500"
                                    placeholder="Add medication..."
                                    newTagValue={newTag.field === 'medications' ? newTag.value : ''}
                                    setNewTag={v => setNewTag({ field: 'medications', value: v })}
                                />
                                <TagInput
                                    icon={Stethoscope}
                                    title="Conditions"
                                    field="conditions"
                                    items={formData.conditions}
                                    onAdd={addTag}
                                    onRemove={removeTag}
                                    color="text-purple-500"
                                    placeholder="Add condition..."
                                    newTagValue={newTag.field === 'conditions' ? newTag.value : ''}
                                    setNewTag={v => setNewTag({ field: 'conditions', value: v })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-8 py-4 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    <Save size={20} />
                                    {editingDependent ? 'Update Profile' : 'Save Member'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="member-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {loading ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-blue-50 border-t-blue-500 rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-medium">Loading family profiles...</p>
                            </div>
                        ) : dependents.length > 0 ? (
                            dependents.map((dep, i) => (
                                <motion.div
                                    key={dep.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 text-slate-50 group-hover:text-blue-50 transition-colors">
                                        <Heart size={80} fill="currentColor" />
                                    </div>

                                    <div className="relative z-10 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl">
                                                {dep.name[0]}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(dep)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    <Activity size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dep.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-blue-900 leading-tight">{dep.name}</h3>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                <span>{dep.relation}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>{dep.age} years old</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                {dep.blood_type}
                                            </span>
                                            {dep.allergies?.length > 0 && (
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                    {dep.allergies.length} Allergies
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full bg-white/50 border-4 border-dashed border-slate-100 rounded-[3rem] p-20 text-center flex flex-col items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-slate-50 text-slate-200 flex items-center justify-center">
                                    <Users size={60} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-blue-900 mb-2">Build your Care Network</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto">Add children, parents, or elderly relatives to ensure they get age-specific AI guidance in emergencies.</p>
                                </div>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl hover:bg-blue-700 transition-all"
                                >
                                    Add Your First Member
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function FormInput({ label, value, onChange, placeholder, type = "text" }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
        </div>
    )
}

function TagInput({ title, items, onAdd, onRemove, field, icon: Icon, color, placeholder, newTagValue, setNewTag }) {
    return (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
                <Icon size={18} className={color} />
                <h3 className="text-sm font-bold text-blue-900">{title}</h3>
            </div>

            <div className="flex gap-2">
                <input
                    value={newTagValue}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd(field))}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
                <button
                    type="button"
                    onClick={() => onAdd(field)}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg text-xs text-slate-700 shadow-sm animate-in zoom-in-50 duration-200">
                        {item}
                        <button type="button" onClick={() => onRemove(field, i)} className="text-slate-300 hover:text-red-500">
                            <X size={12} />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    )
}
