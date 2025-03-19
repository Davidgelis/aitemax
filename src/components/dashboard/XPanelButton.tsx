
import { useNavigate } from "react-router-dom";
import { PanelTopClose } from "lucide-react";
import { Button } from "../ui/button";

const XPanelButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="aurora"
      size="sm"
      className="fixed left-4 top-4 z-50 shadow-md flex items-center gap-2"
      onClick={() => navigate("/x-panel")}
    >
      <PanelTopClose className="w-4 h-4" />
      <span className="relative overflow-hidden">
        <span 
          className="bg-aurora-gradient bg-aurora animate-aurora bg-clip-text text-transparent"
          style={{
            backgroundSize: "400% 400%",
          }}
        >
          X Panel
        </span>
      </span>
    </Button>
  );
};

export default XPanelButton;
