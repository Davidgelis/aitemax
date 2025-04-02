
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="flex items-center">
        <img 
          src="/public/lovable-uploads/33d2b401-4f0d-4cb3-80a7-bbe01dd9f991.png" 
          alt="AITEMA"
          className="h-48 md:h-60" // Changed from h-16 md:h-20 to h-48 md:h-60 (3x bigger)
        />
        <div className="relative ml-2">
          <div 
            className="h-36 w-36 bg-aurora-gradient bg-aurora animate-aurora"
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
