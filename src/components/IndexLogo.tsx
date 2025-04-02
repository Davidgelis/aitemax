
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-80 md:w-96 h-auto mb-8">
        {/* Logo image */}
        <AspectRatio ratio={16 / 6} className="bg-transparent">
          <img
            src="/lovable-uploads/9d596da8-aa99-4737-b70e-5fdb9fec0ee0.png"
            alt="Aitema X Logo"
            className="object-contain w-full h-full"
          />
        </AspectRatio>
        
        {/* Aurora overlay effect */}
        <div 
          className="absolute inset-0 bg-aurora-gradient bg-aurora animate-aurora opacity-30 mix-blend-overlay pointer-events-none"
          style={{ borderRadius: '8px' }}
        />
      </div>
    </div>
  );
};

export default IndexLogo;
