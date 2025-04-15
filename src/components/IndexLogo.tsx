
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-full md:w-[750px] h-auto mb-0">
        <AspectRatio ratio={16 / 6} className="bg-transparent">
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Base image - now visible with opacity 1 */}
            <img 
              src="/lovable-uploads/d3f0ce86-b60c-4c7a-81cc-4bb140e56118.png" 
              alt="Aitema X Logo"
              className="max-h-full max-w-full object-contain"
            />
            
            {/* Aurora effect overlay as a second layer */}
            <div 
              className="absolute inset-0 bg-aurora-gradient bg-aurora animate-aurora z-10"
              style={{ 
                maskImage: `url('/lovable-uploads/d3f0ce86-b60c-4c7a-81cc-4bb140e56118.png')`, 
                maskSize: 'contain', 
                maskPosition: 'center', 
                maskRepeat: 'no-repeat',
                WebkitMaskImage: `url('/lovable-uploads/d3f0ce86-b60c-4c7a-81cc-4bb140e56118.png')`,
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMask: 'url("/lovable-uploads/d3f0ce86-b60c-4c7a-81cc-4bb140e56118.png") center / contain no-repeat',
                opacity: 0.7 // Reduced from 1 to allow the base image to show through
              }}
            />
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export default IndexLogo;
