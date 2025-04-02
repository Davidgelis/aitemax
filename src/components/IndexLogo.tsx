
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-full md:w-[1500px] h-auto mb-0">
        {/* Logo with aurora effect completely replacing the colors */}
        <AspectRatio ratio={16 / 6} className="bg-transparent">
          <div className="w-full h-full relative">
            {/* We'll use the PNG as a mask only, not showing the original colors */}
            <div 
              className="absolute inset-0 bg-aurora-gradient bg-aurora animate-aurora z-10"
              style={{ 
                maskImage: `url('/lovable-uploads/5d804d23-e4d2-4330-9bfa-d6fd89cdc94b.png')`, 
                maskSize: 'contain', 
                maskPosition: 'center', 
                maskRepeat: 'no-repeat',
                WebkitMaskImage: `url('/lovable-uploads/5d804d23-e4d2-4330-9bfa-d6fd89cdc94b.png')`,
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
