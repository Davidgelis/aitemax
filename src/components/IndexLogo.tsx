
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="flex items-center">
        <img 
          src="/public/lovable-uploads/33d2b401-4f0d-4cb3-80a7-bbe01dd9f991.png" 
          alt="AITEMA"
          className="h-[76.8rem] md:h-[96rem]" // Reduced by 20% from h-96(24rem)/h-120(30rem)
        />
        <div className="relative ml-1"> {/* Changed from ml-2 to ml-1 (50% closer) */}
          <div 
            className="h-[57.6rem] w-[57.6rem] bg-aurora-gradient bg-aurora animate-aurora" // Reduced by 20% from h-72(18rem)/w-72(18rem)
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
