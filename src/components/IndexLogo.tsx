
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-auto h-auto">
        {/* Base image */}
        <img 
          src="/public/lovable-uploads/4a57ecc2-3abd-4837-b9bb-6e3f2187fc91.png" 
          alt="AITEMA X"
          className="h-120 md:h-144" // Increased from h-40 md:h-48 to h-120 md:h-144 (3x bigger)
        />
        
        {/* Overlay the X part with aurora effect */}
        <div 
          className="absolute top-0 right-0 w-full h-full"
          style={{
            maskImage: "url('/public/lovable-uploads/4a57ecc2-3abd-4837-b9bb-6e3f2187fc91.png')",
            WebkitMaskImage: "url('/public/lovable-uploads/4a57ecc2-3abd-4837-b9bb-6e3f2187fc91.png')",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            background: "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95, white)",
            backgroundSize: "400% 400%",
            animation: "aurora 8s ease infinite",
            opacity: 0.9,
            mixBlendMode: "screen"
          }}
        />
      </div>
    </div>
  );
};

export default IndexLogo;
