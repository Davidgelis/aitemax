
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="flex items-center">
        <h1 
          className="text-5xl font-balgin uppercase"
          style={{
            color: "#084b49", // Solid color replacing the aurora gradient
            fontWeight: 100, // Very thin weight to match the reference
            letterSpacing: "0.25em", // Increased letter spacing to match reference
            opacity: 0.9,
            textShadow: "0 0 1px rgba(255,255,255,0.2)",
            fontFamily: "'Helvetica', 'Arial', sans-serif" // Clean sans-serif font similar to reference
          }}
        >
          AITEMA
        </h1>
        <div className="relative ml-2">
          <div 
            className="h-47 w-47 bg-aurora-gradient bg-aurora animate-aurora"
            style={{
              height: "47px", // Keep the 30% increase from previous change
              width: "47px", // Keep the 30% increase from previous change
              WebkitMaskImage: "url('/public/lovable-uploads/801ba41f-3e27-49c2-9f50-4f82fdf1115e.png')",
              maskImage: "url('/public/lovable-uploads/801ba41f-3e27-49c2-9f50-4f82fdf1115e.png')",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default IndexLogo;
