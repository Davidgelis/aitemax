
import { useState, useEffect } from "react";

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Initial check
    checkSize();

    // Set up event listener
    window.addEventListener("resize", checkSize);

    // Clean up
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return { isMobile, isTablet, isDesktop };
};
