
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IndexLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-full md:w-[600px] h-auto mb-8">
        {/* Logo image with integrated aurora effect */}
        <AspectRatio ratio={16 / 6} className="bg-transparent">
          <img
            src="/lovable-uploads/9d596da8-aa99-4737-b70e-5fdb9fec0ee0.png"
            alt="Aitema X Logo"
            className="object-contain w-full h-full aurora-effect"
            style={{
              filter: "drop-shadow(0 0 10px rgba(51, 254, 166, 0.4))"
            }}
          />
        </AspectRatio>
      </div>
    </div>
  );
};

export default IndexLogo;
