"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  useEffect(() => {
    if (previousPathname !== pathname) {
      setLoading(true);
    }
  }, [pathname, previousPathname]);

  useEffect(() => {
    if (loading) {
      // When loading is true, we set a timeout to hide the loader.
      // This simulates the end of a page load.
      const timer = setTimeout(() => {
        setLoading(false);
        setPreviousPathname(pathname);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [loading, pathname]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="loader-overlay"
          className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative flex items-center justify-center w-24 h-24"
          >
            <div className="absolute w-full h-full border-4 border-primary/20 rounded-full" />
            <div className="absolute w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <GraduationCap className="w-10 h-10 text-primary" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
