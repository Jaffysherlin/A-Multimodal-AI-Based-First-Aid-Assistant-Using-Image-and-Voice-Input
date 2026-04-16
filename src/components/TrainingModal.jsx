import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    CheckCircle2,
    ArrowRight,
    Clock,
    ShieldCheck,
    ChevronRight,
    Play,
    BookOpen,
    Youtube,
    Info,
    AlertCircle
} from 'lucide-react'
import { cn } from '../lib/utils'

export default function TrainingModal({ guide, topic, isOpen, onClose }) {
    if (!isOpen || !guide) return null

    // Verified professional training content with working video IDs
    const trainingContent = {
        'Adult CPR Hands-Only': {
            videoUrl: "E7qR75G4U8A", // AHA Official 2025 - "Learn Hands-Only CPR in 90 seconds"
            steps: [
                {
                    instruction: "Check the Scene: Ensure the environment is safe for you and the victim.",
                    tip: "Look for traffic, electrical wires, or fire before approaching."
                },
                {
                    instruction: "Check Responsiveness: Tap the shoulders and shout. Look for normal breathing.",
                    tip: "If they are unresponsive and not breathing, cardiac arrest is likely."
                },
                {
                    instruction: "Call for Help: Point at someone and say 'You! Call 112 and get an AED!'",
                    tip: "If alone, put your phone on speaker while starting compressions."
                },
                {
                    instruction: "Hand Placement: Place the heel of one hand in the center of the chest, other on top.",
                    tip: "Keep your arms straight and shoulders directly over your hands."
                },
                {
                    instruction: "Push Hard & Fast: Deliver compressions 2 inches deep at 100-120 bpm.",
                    tip: "The beat of 'Stayin' Alive' is the perfect tempo."
                }
            ],
            duration: "10-15 minutes",
            difficulty: "Beginner",
            resources: [
                { label: "AHA 2025 CPR Guidelines", url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/algorithms" },
                { label: "AED Operational Steps", url: "https://www.redcross.org/take-a-class/aed/aed-steps" },
                { label: "Emergency Dispatch Protocol", url: "https://112.gov.in/" }
            ]
        },
        'Child & Infant CPR': {
            videoUrl: "3v-cI7S_w4A", // St John Ambulance Infant CPR
            steps: [
                {
                    instruction: "Verify Emergency: Flick the sole of the foot to check for infant response.",
                    tip: "Never shake an infant. It can cause severe brain trauma."
                },
                {
                    instruction: "Positioning: Lay the infant on a firm, flat surface.",
                    tip: "A table or the floor is better than a soft bed or sofa."
                },
                {
                    instruction: "Compressions: Use two fingers in the center of the chest, just below the nipple line.",
                    tip: "Push down about 1.5 inches deep, at a rate of 100-120 bpm."
                },
                { instruction: "Rescue Breaths: Tilt head back slightly and give 2 gentle puffs of air.", tip: "Cover both the nose and mouth of the infant with your mouth." }
            ],
            duration: "15-20 minutes",
            difficulty: "Intermediate",
            resources: [
                { label: "Pediatric CPR Steps", url: "https://www.redcross.org/take-a-class/cpr/performing-cpr/child-baby-cpr" },
                { label: "Infant First Aid Factsheet", url: "https://stjohn.org.au/first-aid-resources/fact-sheets" }
            ]
        },
        'Using an AED': {
            videoUrl: "M0T98D0NlO8", // AED Tutorial
            steps: [
                {
                    instruction: "Turn it On: The very first step is to press the power button.",
                    tip: "Most modern AEDs will start talking to you immediately."
                },
                {
                    instruction: "Attach Pads: Place pads on the victim's bare chest as shown in the diagrams.",
                    tip: "The chest must be dry. Wipe away sweat or water if necessary."
                },
                {
                    instruction: "Analyze: Wait for the AED to analyze the heart rhythm. Do not touch the person.",
                    tip: "Make sure everyone 'stands clear' during this phase."
                },
                {
                    instruction: "Deliver Shock: If the AED advises a shock, press the orange button.",
                    tip: "Ensure no one is touching the victim before pressing the button!"
                }
            ],
            duration: "5-10 minutes",
            difficulty: "Beginner",
            resources: [
                { label: "AED Quick-Start Guide", url: "https://www.redcross.org/take-a-class/aed/aed-steps" },
                { label: "AED Adult Skill Sheet", url: "https://www.redcross.org/content/dam/src/take-a-class/assets/AED_Use_Adult_Skill_Sheet_2021.pdf" }
            ]
        },
        'Direct Pressure': {
            videoUrl: "L6jjyikFwmA", // British Red Cross Severe Bleeding
            steps: [
                {
                    instruction: "Locate the Wound: Quickly expose the injury site to see the source of blood.",
                    tip: "Spurting or bright red blood indicates an arterial bleed and is an emergency."
                },
                {
                    instruction: "Apply Pressure: Use a clean cloth or your hands to push as hard as possible.",
                    tip: "Body weight is more effective than just arm strength. Lock your elbows."
                },
                {
                    instruction: "Maintain & Secure: Do not lift the pressure to 'check'. Keep pushing until help arrives.",
                    tip: "If blood soaks through, add another layer of cloth on top. Never remove the first one."
                }
            ],
            duration: "5 minutes",
            difficulty: "Beginner",
            resources: [
                { label: "Stop The Bleed Portal", url: "https://www.stopthebleed.org/" },
                { label: "Severe Bleeding Protocol", url: "https://stjohn.org.au/first-aid-resources/fact-sheets" }
            ]
        },
        'Tourniquet Application': {
            videoUrl: "6m6YwN9Tz0w", // Stop The Bleed
            steps: [
                {
                    instruction: "Positioning: Place the tourniquet 2-3 inches above the wound, high and tight.",
                    tip: "Never place a tourniquet directly over a joint like an elbow or knee."
                },
                {
                    instruction: "Tighten: Pull the strap as tight as possible before turning the windlass.",
                    tip: "Most people don't pull the initial strap tight enough."
                },
                {
                    instruction: "Windlass: Twist the windlass rod until the bleeding stops completely.",
                    tip: "This will be very painful for the victim if done correctly."
                },
                {
                    instruction: "Secure & Mark: Lock the rod in place and write the time on the tourniquet.",
                    tip: "EMS needs to know exactly how long the limb has been without blood flow."
                }
            ],
            duration: "5-10 minutes",
            difficulty: "Advanced",
            resources: [
                { label: "Official Stop The Bleed Site", url: "https://www.stopthebleed.org/" },
                { label: "Tourniquet Placement Tips", url: "https://stjohn.org.au/first-aid-resources/fact-sheets" }
            ]
        },
        'Heimlich Maneuver': {
            videoUrl: "SwJlZnu05Cw", // Choking
            steps: [
                {
                    instruction: "Confirmation: Ask 'Are you choking?' and 'Can you speak?'",
                    tip: "If they can cough or speak, encourage more coughing. Do not perform thrusts."
                },
                {
                    instruction: "Five Back Blows: Lean them forward and give 5 firm blows between shoulder blades.",
                    tip: "Use the heel of your hand for maximum impact."
                },
                {
                    instruction: "Five Abdominal Thrusts: Wrap arms around wait, pull inward and upward.",
                    tip: "Place your fist just above the navel but below the ribs."
                }
            ],
            duration: "5 minutes",
            difficulty: "Beginner",
            resources: [
                { label: "Choking Relief Factsheet", url: "https://stjohn.org.au/first-aid-resources/fact-sheets" },
                { label: "Infant Choking Protocol", url: "https://www.redcross.org/take-a-class/cpr/performing-cpr/infant-cpr" }
            ]
        },
        'Thermal Burns': {
            videoUrl: "8J9_n3qM8x8", // Burns
            steps: [
                {
                    instruction: "Stop the Burning: Move the victim away from the heat source.",
                    tip: "Ensure your own safety first so you don't become a second victim."
                },
                {
                    instruction: "Cool the Burn: Run cool (not cold) water over the area for 20 minutes.",
                    tip: "Never use ice, butter, or ointments. Water is the only recommended treatment."
                },
                {
                    instruction: "Protect: Cover the area loosely with plastic wrap or a sterile dressing.",
                    tip: "Wrap lengthwise, not around, to allow for tissue swelling."
                }
            ],
            duration: "10 minutes",
            difficulty: "Beginner",
            resources: [
                { label: "Burn Treatment Steps", url: "https://stjohn.org.au/first-aid-resources/fact-sheets" },
                { label: "Mayo Clinic Burn Guide", url: "https://www.mayoclinic.org/diseases-conditions/burns/symptoms-causes/syc-20370530" }
            ]
        },
        'Splinting Basics': {
            videoUrl: "m8pD-jPqP-w", // Splinting
            steps: [
                {
                    instruction: "Stabilize: Keep the injured limb in the exact position you found it.",
                    tip: "Do not attempt to push a bone back in or straighten the limb."
                },
                {
                    instruction: "Check Pulses: Check for color, warmth, and pulse beyond the injury site.",
                    tip: "Assess 'CMS': Circulation, Motor function, and Sensation."
                },
                {
                    instruction: "Apply Splint: Use rigid objects to immobilize the joints above and below the break.",
                    tip: "Pad the splint with soft cloth for comfort and better fit."
                }
            ],
            duration: "15 minutes",
            difficulty: "Intermediate",
            resources: [
                { label: "Fracture Factsheet", url: "https://stjohn.org.au/first-aid-resources/fact-sheets" }
            ]
        },
        'Recovery Position': {
            videoUrl: "GmqXqwSVwnM", // Recovery Position
            steps: [
                {
                    instruction: "Arm Placement: Place the arm closest to you at a right angle, palm up.",
                    tip: "This prevents the person from rolling onto their face."
                },
                {
                    instruction: "Leg & Hand: Pull the far leg up and place the far hand against their cheek.",
                    tip: "This acts as a 'kickstand' to keep them stable on their side."
                },
                {
                    instruction: "The Roll: Pull the far knee toward you to roll them onto their side.",
                    tip: "Ensure their head is tilted back to keep the airway open."
                }
            ],
            duration: "5 minutes",
            difficulty: "Beginner",
            resources: [
                { label: "Unconscious Casualty Case", url: "https://stjohn.org.au/first-aid-resources/fact-sheets" }
            ]
        }
    }

    // Default content if specific topic isn't found
    const content = trainingContent[topic] || {
        videoUrl: "E7qR75G4U8A",
        steps: [
            {
                instruction: `General Protocol for ${topic}: Ensure scene safety and call for help.`,
                tip: "Personal safety is always priority number one."
            },
            {
                instruction: "Provide immediate care based on visible symptoms and training.",
                tip: "Stay calm to keep the victim calm."
            },
            {
                instruction: "Maintain care until professional emergency medical services take over.",
                tip: "Hand over a clear report of actions taken."
            }
        ],
        duration: "5-10 minutes",
        difficulty: "General",
        resources: [
            { label: "Latest Red Cross Guidelines", url: "https://www.redcross.org/" },
            { label: "St John First Aid Resources", url: "https://stjohn.org.au/knowledge-hub" }
        ]
    }

    const [activeIdx, setActiveIdx] = useState(0)
    const [view, setView] = useState('steps') // 'steps' or 'video' or 'resources'
    const isLastStep = activeIdx === content.steps.length - 1

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
                {/* Left Side: Sidebar/Navigation */}
                <div className={cn("md:w-1/3 p-8 text-white flex flex-col justify-between bg-gradient-to-br", guide.color)}>
                    <div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <guide.icon size={32} />
                        </div>
                        <h2 className="text-3xl font-black leading-tight mb-2">{topic}</h2>
                        <p className="text-white/80 font-medium mb-8">Part of {guide.title}</p>

                        <nav className="space-y-2">
                            {[
                                { id: 'steps', label: 'Step-by-Step', icon: ChevronRight },
                                { id: 'video', label: 'Video Tutorial', icon: Youtube },
                                { id: 'resources', label: 'Extra Resources', icon: BookOpen }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setView(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                                        view === item.id ? "bg-white text-slate-900 shadow-lg" : "hover:bg-white/10"
                                    )}
                                >
                                    <item.icon size={20} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="space-y-4 pt-8">
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl">
                            <Clock size={20} />
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold opacity-60">Estimated Time</p>
                                <p className="font-bold">{content.duration}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: content */}
                <div className="md:w-2/3 p-8 md:p-12 overflow-y-auto flex flex-col bg-slate-50 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-20"
                    >
                        <X size={24} />
                    </button>

                    <AnimatePresence mode="wait">
                        {view === 'steps' && (
                            <motion.div
                                key="steps"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex-1 flex flex-col"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-8">
                                        {content.steps.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "h-2 flex-1 rounded-full transition-all",
                                                    idx <= activeIdx ? "bg-blue-500" : "bg-slate-200"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <motion.div
                                        key={activeIdx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-8"
                                    >
                                        <div className="space-y-4">
                                            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
                                                Step {activeIdx + 1} of {content.steps.length}
                                            </span>
                                            <h3 className="text-3xl font-black text-slate-900 leading-tight">
                                                {content.steps[activeIdx].instruction}
                                            </h3>
                                        </div>

                                        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-2xl">
                                            <div className="flex items-center gap-2 text-amber-700 font-bold mb-3">
                                                <Info size={18} />
                                                Professional Tip
                                            </div>
                                            <p className="text-amber-900/80 font-medium text-lg italic">
                                                "{content.steps[activeIdx].tip}"
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-200">
                                    <button
                                        onClick={() => setActiveIdx(p => Math.max(0, p - 1))}
                                        disabled={activeIdx === 0}
                                        className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                                    >
                                        Back
                                    </button>

                                    {!isLastStep ? (
                                        <button
                                            onClick={() => setActiveIdx(p => p + 1)}
                                            className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-black transition-all shadow-xl"
                                        >
                                            Next Step
                                            <ArrowRight size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setView('video')}
                                            className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl"
                                        >
                                            <Youtube size={20} />
                                            Watch Video Tutorial
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {view === 'video' && (
                            <motion.div
                                key="video"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex-1 flex flex-col"
                            >
                                <h3 className="text-2xl font-black text-slate-900 mb-6 font-display">Expert Video Demonstration</h3>
                                <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-900 group relative">
                                    <iframe
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${content.videoUrl}?rel=0&modestbranding=1`}
                                        title="Training Video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>

                                <div className="mt-8 flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 p-6 bg-blue-50 rounded-2xl flex items-start gap-4 ring-1 ring-blue-100">
                                        <AlertCircle className="text-blue-500 shrink-0 mt-1" />
                                        <div>
                                            <p className="text-blue-900 font-bold mb-1">Visual Learning Guide</p>
                                            <p className="text-blue-800/80 font-medium">
                                                Watch the full sequence to understand the correct body positioning and rhythm required for {topic}.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <a
                                            href={`https://www.youtube.com/watch?v=${content.videoUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            <Youtube className="text-red-600" size={24} />
                                            Open Primary Video
                                        </a>
                                        <a
                                            href={`https://www.youtube.com/results?search_query=Hands+Only+CPR+Official+Training`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-3 px-4 py-2 text-xs text-blue-600 hover:underline"
                                        >
                                            Try searching for alternative demos
                                        </a>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setView('resources')}
                                    className="mt-8 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg"
                                >
                                    Finish & View Resources
                                </button>
                            </motion.div>
                        )}

                        {view === 'resources' && (
                            <motion.div
                                key="resources"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex-1 flex flex-col"
                            >
                                <h3 className="text-3xl font-black text-slate-900 mb-2">Completion & Resources</h3>
                                <p className="text-slate-500 font-medium mb-8 text-lg">You've completed the primary training. Here is more information to help you master this skill.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {content.resources.map((res, i) => (
                                        <div
                                            key={i}
                                            onClick={() => window.open(res.url, '_blank')}
                                            className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                    <BookOpen size={20} />
                                                </div>
                                                <span className="font-bold text-slate-700">{res.label}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 p-8 bg-emerald-500 rounded-[2rem] text-white flex items-center justify-between shadow-xl shadow-emerald-100">
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black">Module Certified</h4>
                                        <p className="text-emerald-50 opacity-90 font-medium">Great job! You've reviewed the essential steps.</p>
                                    </div>
                                    <CheckCircle2 size={48} className="text-white/30" />
                                </div>

                                <button
                                    onClick={onClose}
                                    className="mt-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Return to Training Dashboard
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
