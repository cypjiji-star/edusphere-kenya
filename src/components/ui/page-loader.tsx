
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== window.location.pathname) {
        setLoading(true);
      }
    };
    const handleComplete = () => {
      setLoading(false);
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      // Check if it's a link, has an href, isn't a new tab, and is an internal navigation
      if (link && link.href && link.target !== '_blank' && new URL(link.href).origin === window.location.origin) {
        if (new URL(link.href).pathname !== window.location.pathname) {
          handleStart(link.href);
        }
      }
    };

    // Listen for link clicks to start loading
    document.addEventListener("click", handleLinkClick);

    // This effect runs on route change, which means the new page is ready
    handleComplete();
    
    return () => {
      document.removeEventListener("click", handleLinkClick);
    };

  }, [pathname]);

  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="loader"
          className="fixed inset-0 flex items-center justify-center bg-background z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
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
