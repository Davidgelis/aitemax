
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="flex items-center">
        <h1 
          className="text-5xl font-balgin uppercase"
          style={{
            color: "#084b49", // Solid color replacing the aurora gradient
            fontWeight: 100,
            letterSpacing: "0.6em",
            opacity: 0.9,
            textShadow: "0 0 1px rgba(255,255,255,0.2)"
          }}
        >
          AITEMA
        </h1>
        <div className="relative ml-2">
          <div 
            className="h-[46.8px] w-[46.8px] bg-aurora-gradient bg-aurora animate-aurora"
            style={{
              WebkitMaskImage: "url('/public/lovable-uploads/801ba41f-3e27-49c2-9f50-4f82fdf1115e.png')",
              maskImage: "url('/public/lovable-uploads/801ba41f-3e27-49c2-9f50-4f82fdf1115e.png')",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              transform: "scale(1.3)", // Increasing size by 30%
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default IndexLogo;
