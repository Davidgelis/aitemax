
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
          <img 
            src="/public/lovable-uploads/801ba41f-3e27-49c2-9f50-4f82fdf1115e.png" 
            alt="Logo" 
            className="h-36" 
            style={{
              filter: "hue-rotate(15deg) saturate(1.2)",
              mixBlendMode: "multiply",
              background: "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95)",
              backgroundSize: "400% 400%",
              animation: "aurora 15s ease infinite",
              borderRadius: "2px"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default IndexLogo;
