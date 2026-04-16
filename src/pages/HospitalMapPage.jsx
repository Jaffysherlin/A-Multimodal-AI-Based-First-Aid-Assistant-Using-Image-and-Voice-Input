import { useState, useEffect } from 'react'
import {
    MapPin,
    Navigation,
    Search,
    AlertCircle,
    Activity,
    ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

export default function HospitalMapPage() {
    const [userLocation, setUserLocation] = useState(null)
    const [hospitals, setHospitals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedHospital, setSelectedHospital] = useState(null)
    const [searchRadius, setSearchRadius] = useState(5000) // 5km

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    setUserLocation({ lat: latitude, lng: longitude })
                    fetchHospitals(latitude, longitude)
                },
                (err) => {
                    console.error("Geolocation error:", err)
                    setError("Could not access your location. Using default view.")
                    const defaultLoc = { lat: 51.5074, lng: -0.1278 }
                    setUserLocation(defaultLoc)
                    fetchHospitals(defaultLoc.lat, defaultLoc.lng)
                }
            )
        } else {
            setError("Geolocation is not supported by your browser.")
            setLoading(false)
        }
    }, [searchRadius])

    const fetchHospitals = async (lat, lon) => {
        setLoading(true)
        try {
            const query = `
                [out:json];
                node(around:${searchRadius}, ${lat}, ${lon})[amenity=hospital];
                out;
            `
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
            const data = await response.json()

            const results = data.elements.map(item => ({
                id: item.id,
                name: item.tags.name || "Unnamed Hospital",
                lat: item.lat,
                lon: item.lon,
                address: item.tags['addr:street'] ? `${item.tags['addr:street']} ${item.tags['addr:housenumber'] || ''}` : 'Address unknown',
                distance: calculateDistance(lat, lon, item.lat, item.lon).toFixed(1)
            })).sort((a, b) => a.distance - b.distance)

            setHospitals(results)
        } catch (err) {
            console.error("Fetch hospitals error:", err)
            setError("Failed to fetch nearby hospitals.")
        } finally {
            setLoading(false)
        }
    }

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371 // km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Generate Google Maps Embed URL
    const getEmbedUrl = () => {
        if (selectedHospital) {
            return `https://maps.google.com/maps?q=${selectedHospital.lat},${selectedHospital.lon}&z=16&output=embed`
        }
        if (userLocation) {
            return `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=14&output=embed`
        }
        return `https://maps.google.com/maps?q=hospital&z=10&output=embed`
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
            {/* Sidebar List */}
            <div className="md:w-1/3 flex flex-col gap-6 overflow-hidden">
                <header>
                    <h1 className="text-3xl font-black text-blue-900 leading-tight">Emergency Help</h1>
                    <p className="text-slate-500 font-medium">Finding nearest medical facilities around you.</p>
                </header>

                <div className="flex gap-2">
                    {[2000, 5000, 10000].map(radius => (
                        <button
                            key={radius}
                            onClick={() => setSearchRadius(radius)}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                                searchRadius === radius
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                            )}
                        >
                            {radius / 1000}km
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-blue-400 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-50 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="font-bold animate-pulse">Scanning area...</p>
                        </div>
                    ) : hospitals.length > 0 ? (
                        hospitals.map((hosp) => (
                            <motion.div
                                key={hosp.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedHospital(hosp)}
                                className={cn(
                                    "p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden",
                                    selectedHospital?.id === hosp.id
                                        ? "bg-blue-600 border-blue-600 text-white shadow-xl translate-x-1"
                                        : "bg-white border-blue-50 hover:border-blue-200 hover:shadow-lg"
                                )}
                            >
                                <div className="relative z-10 flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Activity size={16} className={selectedHospital?.id === hosp.id ? "text-blue-100" : "text-red-500"} />
                                            <span className={cn(
                                                "text-[10px] uppercase tracking-widest font-black",
                                                selectedHospital?.id === hosp.id ? "text-blue-100" : "text-red-500"
                                            )}>Hospital</span>
                                        </div>
                                        <h3 className="font-bold text-lg leading-tight">{hosp.name}</h3>
                                        <p className={cn(
                                            "text-sm",
                                            selectedHospital?.id === hosp.id ? "text-blue-100" : "text-slate-400"
                                        )}>{hosp.address}</p>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-black shrink-0",
                                        selectedHospital?.id === hosp.id ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                                    )}>
                                        {hosp.distance} km
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lon}`, '_blank')
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all",
                                            selectedHospital?.id === hosp.id
                                                ? "bg-white text-blue-600 hover:bg-blue-50"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                        )}
                                    >
                                        <Navigation size={14} />
                                        Directions
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-10 text-center space-y-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <Search className="mx-auto text-slate-300" size={40} />
                            <p className="text-slate-500 font-medium">No results found in this range. Try increasing the search radius.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 flex items-center gap-4">
                    <AlertCircle className="text-red-500 shrink-0" size={32} />
                    <div>
                        <p className="text-red-900 font-black text-sm uppercase">Quick Note</p>
                        <p className="text-red-800/70 text-xs font-medium italic leading-relaxed">In case of life-threatening emergencies, always call 112 immediately.</p>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 bg-white rounded-[2.5rem] border border-blue-50 shadow-2xl overflow-hidden relative">
                <iframe
                    title="Hospital Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={getEmbedUrl()}
                    allowFullScreen
                ></iframe>

                {selectedHospital && (
                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
                        <div>
                            <h4 className="font-bold text-blue-900">{selectedHospital.name}</h4>
                            <p className="text-xs text-slate-500">{selectedHospital.address}</p>
                        </div>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lon}`}
                            target="_blank"
                            className="bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
                        >
                            <ExternalLink size={20} />
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
