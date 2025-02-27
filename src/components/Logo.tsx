
const Logo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <img
        src="/lovable-uploads/fadbfaa4-8431-4d47-bff3-c38a1517cfe1.png"
        alt="Aitema X Logo"
        style={{ width: '240px', height: '240px' }}
        className="mb-6"
      />
      <h1 
        className="text-4xl font-light tracking-wider"
        style={{
          background: "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95)",
          backgroundSize: "400% 400%",
          animation: "aurora 15s ease infinite",
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

export default Logo;
