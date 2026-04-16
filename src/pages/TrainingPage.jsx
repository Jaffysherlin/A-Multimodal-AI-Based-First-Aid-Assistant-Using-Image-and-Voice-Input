import { useState } from 'react'
import {
    Heart,
    Droplet,
    Flame,
    Activity,
    Wind,
    Brain,
    ChevronRight,
    Play
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import TrainingModal from '../components/TrainingModal'

const guides = [
    {
        title: 'CPR & Chest Compressions',
        icon: Heart,
        color: 'from-red-500 to-rose-600',
        bg: 'bg-red-50',
        topics: [
            'Adult CPR Hands-Only',
            'Child & Infant CPR',
            'Using an AED',
            'Recovery Position'
        ]
    },
    {
        title: 'Severe Bleeding',
        icon: Droplet,
        color: 'from-orange-500 to-red-600',
        bg: 'bg-orange-50',
        topics: [
            'Direct Pressure',
            'Tourniquet Application',
            'Internal Bleeding Signs',
            'Puncture Wounds'
        ]
    },
    {
        title: 'Burns & Scalds',
        icon: Flame,
        color: 'from-amber-400 to-orange-500',
        bg: 'bg-amber-50',
        topics: [
            'Thermal Burns',
            'Chemical Burns',
            'Electrical Burns',
            'Sunburn Treatment'
        ]
    },
    {
        title: 'Fractures & Sprains',
        icon: Activity,
        color: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-50',
        topics: [
            'Splinting Basics',
            'R.I.C.E. Method',
            'Dislocation Care',
            'Open vs Closed Fractures'
        ]
    },
    {
        title: 'Choking Assistance',
        icon: Wind,
        color: 'from-cyan-500 to-blue-600',
        bg: 'bg-cyan-50',
        topics: [
            'Heimlich Maneuver',
            'Self-Choking Procedure',
            'Infant Back Blows',
            'Abdominal Thrusts'
        ]
    },
    {
        title: 'Head & Spinal Injuries',
        icon: Brain,
        color: 'from-purple-500 to-violet-600',
        bg: 'bg-purple-50',
        topics: [
            'Concussion Signs',
            'Neck Stabilization',
            'Scalp Wounds',
            'Skull Fracture Care'
        ]
    },
    {
        title: 'Poisoning & Overdose',
        icon: Activity,
        color: 'from-emerald-500 to-teal-600',
        bg: 'bg-emerald-50',
        topics: [
            'Ingested Poisons',
            'Drug Overdose Care',
            'Inhaled Toxins',
            'Carbon Monoxide'
        ]
    },
    {
        title: 'Extreme Temperatures',
        icon: Flame,
        color: 'from-sky-400 to-indigo-500',
        bg: 'bg-sky-50',
        topics: [
            'Heat Exhaustion',
            'Heat Stroke Care',
            'Hypothermia Basics',
            'Frostbite Treatment'
        ]
    }
]

export default function TrainingPage() {
    const [selectedGuide, setSelectedGuide] = useState(null)
    const [selectedTopic, setSelectedTopic] = useState(null)

    const handleTopicClick = (guide, topic) => {
        setSelectedGuide(guide)
        setSelectedTopic(topic)
    }

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 leading-tight">Interactive Training</h1>
                    <p className="text-slate-500 font-medium text-lg">Master life-saving skills with step-by-step interactive modules.</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl w-fit">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-blue-800">8 Modules Available</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {guides.map((guide, index) => (
                    <motion.div
                        key={guide.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-[2.5rem] border border-blue-50 shadow-xl overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className={cn("p-8 bg-gradient-to-br text-white relative overflow-hidden", guide.color)}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                <guide.icon size={120} />
                            </div>
                            <div className="relative z-10">
                                <guide.icon size={40} className="mb-4 shadow-lg" />
                                <h2 className="text-2xl font-black tracking-tight">{guide.title}</h2>
                            </div>
                        </div>
                        <div className="p-8">
                            <ul className="space-y-4">
                                {guide.topics.map(topic => (
                                    <li
                                        key={topic}
                                        onClick={() => handleTopicClick(guide, topic)}
                                        className="flex items-center justify-between text-slate-600 group/item cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                        <span className="text-sm font-bold">{topic}</span>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/item:bg-blue-50 transition-colors">
                                            <ChevronRight size={16} className="text-slate-300 group-hover/item:text-blue-500 group-hover/item:translate-x-0.5 transition-all" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleTopicClick(guide, guide.topics[0])}
                                className="w-full mt-10 py-4 bg-slate-50 text-slate-900 font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all text-sm flex items-center justify-center gap-2 group/btn shadow-sm"
                            >
                                <Play size={16} className="fill-current" />
                                Start Full Module
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedTopic && (
                    <TrainingModal
                        guide={selectedGuide}
                        topic={selectedTopic}
                        isOpen={!!selectedTopic}
                        onClose={() => {
                            setSelectedTopic(null)
                            setSelectedGuide(null)
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

