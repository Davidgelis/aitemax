
const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <h1 
        className="text-5xl font-light tracking-wider"
        style={{
          background: "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95)",
          backgroundSize: "400% 400%",
          animation: "aurora 300s ease infinite", // Changed from 15s to 300s (20x slower)
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}
      >
        AITEMA X
      </h1>
    </div>
  );
};

export default IndexLogo;
