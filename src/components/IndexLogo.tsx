
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-auto h-auto">
        {/* Base image */}
        <img 
          src="/public/lovable-uploads/40e505f0-8238-4229-9046-41048e7bb9f0.png" 
          alt="AITEMA X"
          className="h-120 md:h-144" // Keeping the 3x bigger size
        />
      </div>
    </div>
  );
};

export default IndexLogo;
