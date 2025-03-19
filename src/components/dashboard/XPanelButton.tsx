
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
        <span className="bg-gradient-to-r from-[#041524] via-[#33fea6] to-white bg-clip-text text-transparent animate-aurora">X Panel</span>
      </span>
    </Button>
  );
};

export default XPanelButton;
