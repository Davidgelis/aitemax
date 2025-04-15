
const Logo = () => {
  return <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative mb-6" style={{
      width: '240px',
      height: '240px'
    }}>
        {/* Removed the aurora circle background */}
        <img alt="Aitema X Logo" style={{
        width: '240px',
        height: '240px'
      }} className="relative z-10" src="/lovable-uploads/da976391-c1a9-4636-a10c-5ededed67d65.png" />
      </div>
      <h1 className="text-4xl font-light tracking-wider" style={{
      background: "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95)",
      backgroundSize: "400% 400%",
      animation: "aurora 300s ease infinite",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text"
    }}>
        AITEMA X
      </h1>
    </div>;
};
export default Logo;
