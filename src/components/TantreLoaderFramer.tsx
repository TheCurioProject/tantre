/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const WORDS = [
  { text: "BARRO", font: "font-serif italic", size: "text-5xl md:text-7xl" },
  { text: "PINCEL", font: "font-sans font-bold", size: "text-6xl md:text-8xl" },
  { text: "TIEMPO", font: "font-serif", size: "text-5xl md:text-7xl" },
  { text: "COLOR", font: "font-sans font-black tracking-widest", size: "text-4xl md:text-6xl" },
  { text: "CAFÉ", font: "font-serif italic", size: "text-7xl md:text-9xl" },
  { text: "TANTRE", font: "font-serif", size: "text-7xl md:text-9xl" },
];

const steps = (n: number) => (v: number) => Math.floor(v * n) / n;

export function TantreLoaderFramer() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(!isHome);

  useEffect(() => {
    if (!isHome) return;
    // Lock scroll and force to top so animations trigger correctly
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    // Wait for fonts to load before starting the aggressive typography animation
    document.fonts.ready.then(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= WORDS.length) {
          clearInterval(interval);
          setTimeout(() => setReady(true), 1200); // Slower pause on TANTRE before revealing
        } else {
          setIndex(currentIndex);
        }
      }, 350); // Slower, more progressive text changes

      return () => clearInterval(interval);
    });
  }, []);

  return (
    <AnimatePresence onExitComplete={() => { document.body.style.overflow = ""; }}>
      {!ready && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#181716] text-[#f5f0e8] overflow-hidden"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ 
            clipPath: "inset(0% 0% 100% 0%)",
            opacity: 0,
            scale: 1.05,
            filter: "blur(10px)",
            transition: { 
              duration: 1.2, 
              // Realistic smooth exit physics with cinematic feel
              ease: [0.76, 0, 0.24, 1],
            }
          }}
        >
          <AnimatePresence mode="popLayout">
            <motion.div 
              key={index}
              className={`absolute z-10 ${WORDS[index].font} ${WORDS[index].size} uppercase text-center`}
              initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)", y: 15 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { 
                  duration: 0.45, 
                  ease: [0.16, 1, 0.3, 1] 
                } 
              }}
              exit={{
                opacity: 0,
                scale: 1.1,
                filter: "blur(8px)",
                y: -15,
                transition: {
                  duration: 0.35,
                  ease: [0.76, 0, 0.24, 1]
                }
              }}
            >
              {WORDS[index].text}
              
              {/* Draw a rough accent on the final word */}
              {WORDS[index].text === "TANTRE" && (
                <motion.svg 
                  className="absolute -bottom-4 left-0 w-full h-4 text-[#d95198] overflow-visible"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <motion.path 
                    d="M 0 5 Q 25 8 50 5 T 100 5" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.16, 1, 0.3, 1], 
                      delay: 0.2
                    }}
                  />
                </motion.svg>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
