
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-full md:w-[750px] h-auto mb-0">
        {/* Logo container - width reduced from 1500px to 750px (50% smaller) */}
        <AspectRatio ratio={16 / 6} className="bg-transparent">
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Base image for structure */}
            <img 
              src="/lovable-uploads/39093f0c-3a23-4a15-911d-eb4a315e2eb1.png" 
              alt="Aitema X Logo"
              className="max-h-full max-w-full object-contain"
            />
            
            {/* Aurora effect overlay with improved masking to prevent black outlines */}
            <div 
              className="absolute inset-0 bg-aurora-gradient bg-aurora animate-aurora z-10"
              style={{ 
                maskImage: `url('/lovable-uploads/39093f0c-3a23-4a15-911d-eb4a315e2eb1.png')`, 
                maskSize: 'contain', 
                maskPosition: 'center', 
                maskRepeat: 'no-repeat',
                maskMode: 'alpha',
                WebkitMaskImage: `url('/lovable-uploads/39093f0c-3a23-4a15-911d-eb4a315e2eb1.png')`,
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
                // Fix: Change WebkitMaskMode to a supported format
                WebkitMask: 'url("/lovable-uploads/39093f0c-3a23-4a15-911d-eb4a315e2eb1.png") center / contain no-repeat',
                opacity: 0.9
              }}
            />
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export default IndexLogo;
