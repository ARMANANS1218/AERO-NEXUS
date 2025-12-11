import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import LaserFlow from "../../components/effects/LaserFlow";
import { ArrowRight, Users, BarChart3, Shield } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen bg-gray-950 overflow-hidden">

      {/* Laser Background */}
      <div className="fixed inset-0 z-0">
        <LaserFlow
          className="w-screen h-svh translate-x-16 "
          horizontalBeamOffset={0.05}
          color="#6366F1"
          flowSpeed={0.45}
          verticalSizing={3.2}
          fogIntensity={0.8}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="fixed inset-0 z-10 bg-gradient-to-b 
                      from-gray-950/60 via-gray-950/40 to-gray-950/85 pointer-events-none" />

      {/* CONTENT */}
      <div className="relative z-20 flex flex-col items-center 
                      justify-start min-h-screen px-6 pt-36 pb-24">

        {/* Animated Heading */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="text-center font-extrabold leading-tight mb-6 drop-shadow-xl"
        >
          <span className="text-4xl sm:text-5xl md:text-6xl text-white block">
            Welcome to
          </span>

          {/* Glowing Animated BITMAX Name */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-5xl sm:text-6xl md:text-7xl 
                       bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400
                       bg-clip-text text-transparent 
                       drop-shadow-[0_0_25px_rgba(168,85,247,0.7)] 
                       font-extrabold tracking-tight block mt-3"
          >
            BITMAX LIVE CHAT CRM
          </motion.span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-gray-300 text-lg sm:text-xl text-center max-w-2xl"
        >
          A unified platform for real-time support, advanced analytics,
          and intelligent team collaboration.
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full max-w-4xl px-2"
        >
          {[
            {
              title: "Live Chat Support",
              icon: <Users className="w-9 h-9 text-indigo-400 mx-auto mb-3" />,
              desc: "Real-time messaging with instant customer engagement"
            },
            {
              title: "Query Resolution",
              icon: <BarChart3 className="w-9 h-9 text-purple-400 mx-auto mb-3" />,
              desc: "Smart ticket system for tracking & resolving issues"
            },
            {
              title: "Ticket Management",
              icon: <Shield className="w-9 h-9 text-pink-400 mx-auto mb-3" />,
              desc: "Organized workflow with priority & status tracking"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 150 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 p-5 
                         rounded-xl text-center shadow-lg hover:shadow-indigo-500/20 
                         transition-all duration-300 cursor-pointer"
            >
              {item.icon}
              <h3 className="text-white font-semibold text-lg">{item.title}</h3>
              <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.7 }}
          onClick={() => navigate("/login")}
          className="group relative mt-14 px-10 py-4 bg-gradient-to-r 
                     from-indigo-600 to-purple-600 text-white text-lg 
                     font-semibold rounded-full shadow-xl 
                     hover:scale-105 transition-all duration-300 flex items-center gap-3"
        >
          <span>GET STARTED</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all duration-300" />

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r 
                          from-indigo-400 to-purple-400 opacity-0 
                          group-hover:opacity-30 blur-xl transition-all duration-300" />
        </motion.button>

        {/* Bottom Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mt-8 text-gray-400 text-sm"
        >
          Empower your team • Resolve queries faster • Scale effortlessly
        </motion.p>
      </div>

      {/* Decorative Glow Blobs */}
      <div className="hidden md:block absolute top-10 right-20 
                      w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="hidden md:block absolute bottom-16 left-16 
                      w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
    </div>
  );
}
