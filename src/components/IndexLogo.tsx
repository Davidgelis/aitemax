
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-auto h-auto">
        {/* Base image */}
        <img 
          src="/public/lovable-uploads/4926a3f1-54e3-44f2-81a1-a6f6d768275b.png" 
          alt="AITEMA X"
          className="h-120 md:h-144" // Keeping the 3x bigger size
        />
        
        {/* Overlay with aurora effect */}
        <div 
          className="absolute top-0 right-0 w-full h-full"
          style={{
            maskImage: "url('/public/lovable-uploads/4926a3f1-54e3-44f2-81a1-a6f6d768275b.png')",
            WebkitMaskImage: "url('/public/lovable-uploads/4926a3f1-54e3-44f2-81a1-a6f6d768275b.png')",
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
