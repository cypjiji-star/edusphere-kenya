"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLogo } from "../ui/app-logo";

export function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Show splash screen for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="splash-screen"
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="relative flex items-center justify-center w-32 h-32"
          >
            <div className="absolute w-full h-full border-4 border-primary/20 rounded-full animate-pulse" />
            <AppLogo className="w-16 h-16" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 font-headline text-3xl font-bold text-primary"
          >
            EduSphere Kenya
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
