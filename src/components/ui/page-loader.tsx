
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start loader when pathname changes
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 700); // smooth transition
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key={pathname}
          className="fixed inset-0 flex items-center justify-center bg-background z-[9999]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Premium Spinner */}
          <motion.div
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
