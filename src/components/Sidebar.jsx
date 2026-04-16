import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    Home,
    Flame,
    MessageSquare,
    History,
    BookOpen,
    User,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Activity,
    Phone,
    MapPin,
    Settings,
    Users,
    AlertTriangle,
    BarChart3
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'

const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Emergency', path: '/assessment', icon: Flame },
    { name: 'Vitals', path: '/vitals', icon: Activity },
    { name: 'Ask AidBot', path: '/askaidbot', icon: MessageSquare },
    { name: 'Training', path: '/training', icon: BookOpen },
    { name: 'Hospitals', path: '/hospitals', icon: MapPin },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Metrics Lab', path: '/benchmark', icon: BarChart3 },
    { name: 'Diagnostics', path: '/diagnostic', icon: Settings },
]

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const location = useLocation()
    const { logout } = useAuth()

    return (
        <div
            className={cn(
                "hidden md:flex h-screen bg-white border-r border-blue-100 flex-col transition-all duration-300 shadow-xl z-20 sticky top-0",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    <Activity size={24} />
                </div>
                {!collapsed && (
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-700 bg-clip-text text-transparent">
                        AidVision
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-50 text-blue-600 font-semibold"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                            )}
                        >
                            <item.icon size={22} className={cn(
                                "shrink-0",
                                isActive ? "text-blue-600" : "group-hover:text-blue-600"
                            )} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 space-y-2">
                {/* Emergency Button */}
                <a
                    href="tel:112"
                    className={cn(
                        "w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-95",
                        collapsed ? "px-0" : "px-4"
                    )}
                >
                    <Phone size={20} />
                    {!collapsed && <span>CALL 112</span>}
                </a>

                {/* Logout */}
                <button
                    onClick={logout}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all",
                        collapsed ? "justify-center" : "justify-start"
                    )}
                >
                    <LogOut size={22} />
                    {!collapsed && <span>Logout</span>}
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center py-2 text-slate-400 hover:text-blue-600 mt-2"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
        </div>
    )
}
