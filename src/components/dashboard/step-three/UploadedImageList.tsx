
// Create a basic implementation for the UploadedImageList component
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UploadedImage } from "../types";

interface UploadedImageListProps {
  images: UploadedImage[];
  onRemove?: (id: string) => void;
}

export const UploadedImageList: React.FC<UploadedImageListProps> = ({ 
  images, 
  onRemove 
}) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-medium">Uploaded Images</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <CardContent className="p-2">
              <img 
                src={image.url} 
                alt={`Uploaded image ${image.id}`} 
                className="w-full h-32 object-cover rounded"
              />
              {onRemove && (
                <button 
                  onClick={() => onRemove(image.id)} 
                  className="w-full mt-1 text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
