
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
            fontWeight: 100, // Maintaining the lightest possible weight
            letterSpacing: "0.3em",
            opacity: 0.9, // Adding slight opacity to make it appear thinner
            textShadow: "0 0 1px rgba(255,255,255,0.2)" // Adding a subtle text shadow for thinner appearance
          }}
        >
          AITEMA
        </h1>
        <img 
          src="/public/lovable-uploads/801ba41f-3e27-49c2-9f50-4f82fdf1115e.png" 
          alt="Logo" 
          className="h-28 ml-2" // Maintaining the 20% bigger size from previous update
        />
      </div>
    </div>
  );
};

export default IndexLogo;
