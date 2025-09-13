
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== window.location.pathname) {
        setLoading(true);
      }
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && link.target !== '_blank' && new URL(link.href).origin === window.location.origin) {
        if (new URL(link.href).pathname !== window.location.pathname) {
          handleStart(link.href);
        }
      }
    };

    if (isClient) {
      document.addEventListener("click", handleLinkClick);
    }
    
    return () => {
      if (isClient) {
        document.removeEventListener("click", handleLinkClick);
      }
    };
  }, [isClient]);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  if (!isClient) {
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
