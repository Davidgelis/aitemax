
import { useNavigate } from "react-router-dom";
import { PanelTopClose } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

const XPanelButton = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPosition = window.scrollY;
      
      // Hide button when scrolling down, show when scrolling up
      if (currentScrollPosition > lastScrollPosition + 50) {
        setIsVisible(false);
      } else if (currentScrollPosition < lastScrollPosition - 10) {
        setIsVisible(true);
      }
      
      setLastScrollPosition(currentScrollPosition);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollPosition]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/x-panel");
  };

  return (
    <Button
      variant="aurora"
      size="icon"
      className={`fixed left-4 top-4 z-50 shadow-md p-2 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleButtonClick}
    >
      <PanelTopClose className="w-4 h-4" />
    </Button>
  );
};

export default XPanelButton;
