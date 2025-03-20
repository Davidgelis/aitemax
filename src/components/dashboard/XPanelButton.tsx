
import { useNavigate, useLocation } from "react-router-dom";
import { PanelTopClose, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

const XPanelButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're already on the X-Panel
  const isOnXPanel = location.pathname === "/x-panel";
  
  // If we're already on X-Panel, show a button to go back to dashboard
  // If we're on another page, show the button to go to X-Panel
  const handleClick = () => {
    if (isOnXPanel) {
      navigate("/dashboard");
    } else {
      navigate("/x-panel");
    }
  };

  return (
    <Button
      variant="aurora"
      size="icon"
      className="fixed left-4 top-4 z-50 shadow-md p-2"
      onClick={handleClick}
    >
      {isOnXPanel ? (
        <ArrowLeft className="w-4 h-4" />
      ) : (
        <PanelTopClose className="w-4 h-4" />
      )}
    </Button>
  );
};

export default XPanelButton;
