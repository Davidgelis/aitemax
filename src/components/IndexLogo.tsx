
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="flex items-center">
        <h1 
          className="text-5xl font-balgin font-light tracking-wider uppercase"
          style={{
            background: "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95)",
            backgroundSize: "400% 400%",
            animation: "aurora 300s ease infinite", 
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontWeight: 100, // Reduced from 200 to 100 to make the font lighter
            letterSpacing: "0.3em"
          }}
        >
          AITEMA
        </h1>
        <img 
          src="/public/lovable-uploads/801ba41f-3e27-49c2-9f50-4f82fdf1115e.png" 
          alt="Logo" 
          className="h-28 ml-2" // Increased from h-24 to h-28 (20% bigger)
        />
      </div>
    </div>
  );
};

export default IndexLogo;
