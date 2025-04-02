
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-full md:w-[1500px] h-auto mb-2">
        {/* Logo with aurora effect completely replacing the colors */}
        <AspectRatio ratio={16 / 6} className="bg-transparent">
          <div className="w-full h-full relative">
            {/* We'll use the PNG as a mask only, not showing the original colors */}
            <div 
              className="absolute inset-0 bg-aurora-gradient bg-aurora animate-aurora z-10"
              style={{ 
                maskImage: `url('/lovable-uploads/9d596da8-aa99-4737-b70e-5fdb9fec0ee0.png')`, 
                maskSize: 'contain', 
                maskPosition: 'center', 
                maskRepeat: 'no-repeat',
                WebkitMaskImage: `url('/lovable-uploads/9d596da8-aa99-4737-b70e-5fdb9fec0ee0.png')`,
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat'
              }}
            />
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export default IndexLogo;
