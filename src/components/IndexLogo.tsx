
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-full md:w-[750px] h-auto mb-0">
        <AspectRatio ratio={16 / 6} className="bg-transparent">
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Base image - now visible with opacity 1 */}
            <img 
              src="/lovable-uploads/8e3194ea-b661-47d6-8cfa-0b407ead657a.png" 
              alt="Aitema X Logo"
              className="max-h-full max-w-full object-contain"
            />
            
            {/* Aurora effect overlay as a second layer */}
            <div 
              className="absolute inset-0 bg-aurora-gradient bg-aurora animate-aurora z-10"
              style={{ 
                maskImage: `url('/lovable-uploads/8e3194ea-b661-47d6-8cfa-0b407ead657a.png')`, 
                maskSize: 'contain', 
                maskPosition: 'center', 
                maskRepeat: 'no-repeat',
                WebkitMaskImage: `url('/lovable-uploads/8e3194ea-b661-47d6-8cfa-0b407ead657a.png')`,
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMask: 'url("/lovable-uploads/8e3194ea-b661-47d6-8cfa-0b407ead657a.png") center / contain no-repeat',
                opacity: 0.7 // Reduced opacity to allow the base image to show through
              }}
            />
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export default IndexLogo;
