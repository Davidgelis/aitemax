
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="flex items-center">
        <img 
          src="/public/lovable-uploads/33d2b401-4f0d-4cb3-80a7-bbe01dd9f991.png" 
          alt="AITEMA"
          className="h-96 md:h-120" // Changed from h-48 md:h-60 to h-96 md:h-120 (2x bigger)
        />
        <div className="relative ml-2">
          <div 
            className="h-72 w-72 bg-aurora-gradient bg-aurora animate-aurora" // Changed from h-36 w-36 to h-72 w-72 (2x bigger)
            style={{
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
