
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-full md:w-[750px] h-auto mb-8">
        {/* Logo with direct aurora effect applied */}
        <AspectRatio ratio={16 / 6} className="bg-transparent">
          <div className="w-full h-full relative">
            <img
              src="/lovable-uploads/9d596da8-aa99-4737-b70e-5fdb9fec0ee0.png"
              alt="Aitema X Logo"
              className="object-contain w-full h-full z-10 relative"
              style={{
                filter: "drop-shadow(0 0 15px rgba(51, 254, 166, 0.6))",
              }}
            />
            {/* Aurora effect as a direct overlay on the actual logo */}
            <div 
              className="absolute inset-0 bg-aurora-gradient bg-aurora animate-aurora opacity-30 mix-blend-overlay z-20 pointer-events-none"
              style={{ maskImage: `url('/lovable-uploads/9d596da8-aa99-4737-b70e-5fdb9fec0ee0.png')`, maskSize: 'contain', maskPosition: 'center', maskRepeat: 'no-repeat' }}
            />
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export default IndexLogo;
