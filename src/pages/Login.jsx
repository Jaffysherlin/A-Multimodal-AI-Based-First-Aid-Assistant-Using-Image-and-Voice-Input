import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { motion } from 'framer-motion'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            setError('')
            setLoading(true)
            await login(email, password)
            navigate('/')
        } catch (err) {
            setError('Failed to log in. Please check your credentials.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-brand-mesh">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-blue-100 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg mb-4">
                            <Activity size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-blue-900">Welcome Back</h1>
                        <p className="text-slate-500 mt-2">Sign in to your AidVision account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-slate-500">
                        Don't have an account? {' '}
                        <Link to="/signup" className="text-blue-600 font-bold hover:underline">
                            Create one
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
