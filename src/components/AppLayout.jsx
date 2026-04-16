import Sidebar from './Sidebar'
import { Link, useLocation } from 'react-router-dom'
import { Home, Flame, Activity, MessageSquare, User, BarChart3 } from 'lucide-react'
import { cn } from '../lib/utils'

export default function AppLayout({ children }) {
    const location = useLocation()

    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Assessment', path: '/assessment', icon: Flame },
        { name: 'Vitals', path: '/vitals', icon: Activity },
        { name: 'AidBot', path: '/askaidbot', icon: MessageSquare },
        { name: 'Metrics', path: '/benchmark', icon: BarChart3 },
        { name: 'Profile', path: '/profile', icon: User },
    ]

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-brand-mesh">
            <Sidebar />

            <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8" translate="no">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-blue-50 px-6 py-3 flex justify-between items-center z-50">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center gap-1",
                                isActive ? "text-blue-600" : "text-slate-500"
                            )}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
