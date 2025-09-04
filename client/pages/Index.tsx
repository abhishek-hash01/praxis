import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Index() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Floating background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-10 w-32 h-32 bg-praxis-green/10 rounded-full blur-xl"
              animate={{
                x: mousePosition.x * 0.02,
                y: mousePosition.y * 0.02,
              }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
            <motion.div
              className="absolute bottom-20 right-10 w-48 h-48 bg-praxis-blue/10 rounded-full blur-xl"
              animate={{
                x: mousePosition.x * -0.03,
                y: mousePosition.y * -0.03,
              }}
              transition={{ type: "spring", stiffness: 30, damping: 20 }}
            />
          </div>
          
          <motion.div 
            className="container py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <motion.h1 
                className="font-heading text-4xl md:text-6xl font-bold leading-tight tracking-tight"
                variants={itemVariants}
              >
                Trade skills. <span className="text-transparent bg-clip-text bg-gradient-to-r from-praxis-green to-praxis-blue">Build community.</span>
              </motion.h1>
              <motion.p 
                className="mt-5 text-white/80 text-lg max-w-xl"
                variants={itemVariants}
              >
                Praxis is the skill-swap platform where designers, developers, artists, and makers exchange expertise. Learn faster, pay nothing.
              </motion.p>
              <motion.div 
                className="mt-8 flex flex-col sm:flex-row gap-3"
                variants={itemVariants}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/auth" className="btn-primary">Get started free</Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a href="#how" className="btn-secondary">How it works</a>
                </motion.div>
              </motion.div>
              <motion.div 
                className="mt-8 flex items-center gap-6 text-sm text-white/70"
                variants={containerVariants}
              >
                <motion.div className="flex items-center gap-2" variants={itemVariants}>
                  <CheckCircle2 className="text-praxis-green" /> No fees
                </motion.div>
                <motion.div className="flex items-center gap-2" variants={itemVariants}>
                  <MessageSquare className="text-praxis-green" /> Built-in chat
                </motion.div>
                <motion.div className="flex items-center gap-2" variants={itemVariants}>
                  <Sparkles className="text-praxis-green" /> Smart matching
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div 
              className="relative"
              variants={itemVariants}
            >
              <motion.div 
                className="glass-card p-6 md:p-8"
                animate={{
                  y: [0, -10, 0],
                  rotateY: [0, 5, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ 
                  scale: 1.02,
                  rotateY: 10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="h-12 w-12 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  />
                  <div>
                    <p className="text-white/80">You matched with</p>
                    <p className="font-heading text-xl">Ava – UX Design</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <motion.div 
                    className="glass-card p-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-white/70">You can teach</p>
                    <p className="font-medium">React, Tailwind</p>
                  </motion.div>
                  <motion.div 
                    className="glass-card p-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-white/70">You want to learn</p>
                    <p className="font-medium">UX Research</p>
                  </motion.div>
                </div>
                <div className="mt-6 flex gap-3">
                  <motion.button 
                    className="btn-secondary w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Pass
                  </motion.button>
                  <motion.button 
                    className="btn-primary w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Say hi
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* How it works */}
        <motion.section 
          id="how" 
          className="container py-16 md:py-24"
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
          variants={containerVariants}
        >
          <motion.h2 
            className="font-heading text-3xl md:text-4xl font-semibold text-center"
            variants={itemVariants}
          >
            How it works
          </motion.h2>
          <motion.div 
            className="mt-10 grid md:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {[
              { title: "Create your profile", desc: "Add your skills to teach and to learn. Praxis matches you with complementary peers.", step: "01" },
              { title: "Swipe & match", desc: "Swipe through profiles. When both agree, it's a match.", step: "02" },
              { title: "Chat & swap", desc: "Schedule sessions, exchange knowledge, and leave reviews.", step: "03" },
            ].map((card, index) => (
              <motion.div 
                key={card.step} 
                className="glass-card p-6 group cursor-pointer"
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                custom={index}
              >
                <div className="text-sm text-white/60">
                  Step {card.step}
                </div>
                <div className="mt-2 font-heading text-xl group-hover:text-praxis-green transition-colors">
                  {card.title}
                </div>
                <p className="mt-2 text-white/70">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Features */}
        <motion.section 
          id="features" 
          className="container py-16 md:py-24"
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.2 }}
          variants={containerVariants}
        >
          <motion.h2 
            className="font-heading text-3xl md:text-4xl font-semibold text-center"
            variants={itemVariants}
          >
            Features that empower
          </motion.h2>
          <motion.div 
            className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {[
              { title: "Smart matching", desc: "Our algorithm pairs what you teach with what you want to learn.", icon: "✨" },
              { title: "Modern chat", desc: "Real-time chat with clean, friendly bubbles.", icon: "💬" },
              { title: "Skill tags", desc: "Add skills with beautiful tags and filters.", icon: "🏷️" },
              { title: "Reputation", desc: "Reviews and endorsements build trust.", icon: "⭐" },
              { title: "Privacy-first", desc: "Your data stays yours with granular controls.", icon: "🔒" },
              { title: "Mobile-first", desc: "Designed for phones with a bottom navbar.", icon: "📱" },
            ].map((f, index) => (
              <motion.div 
                key={f.title} 
                className="glass-card p-6 group cursor-pointer"
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                custom={index}
              >
                <motion.div 
                  className="text-2xl group-hover:scale-125 transition-transform duration-300"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {f.icon}
                </motion.div>
                <div className="mt-3 font-heading text-xl group-hover:text-praxis-blue transition-colors">
                  {f.title}
                </div>
                <p className="mt-2 text-white/70">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Testimonials */}
        <motion.section 
          id="testimonials" 
          className="container py-16 md:py-24"
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.6 }}
          variants={containerVariants}
        >
          <motion.h2 
            className="font-heading text-3xl md:text-4xl font-semibold text-center"
            variants={itemVariants}
          >
            Loved by learners
          </motion.h2>
          <motion.div 
            className="mt-10 grid md:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {["Praxis helped me swap React for UX research in a week!", "Met amazing makers and leveled up fast.", "I taught 3D modeling and learned copywriting—win-win!"].map((t, i) => (
              <motion.div 
                key={i} 
                className="glass-card p-6 group cursor-pointer"
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.02,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                custom={i}
              >
                <p className="text-white/80 group-hover:text-white transition-colors">
                  "{t}"
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <motion.div 
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-praxis-purple to-praxis-blue"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  />
                  <div>
                    <div className="font-medium">Member #{i + 1}</div>
                    <div className="text-xs text-white/60">Praxis community</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  );
}
