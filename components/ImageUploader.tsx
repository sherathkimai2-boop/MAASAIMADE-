import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  label?: string;
  multiple?: boolean;
  accept?: string;
  compact?: boolean;
  colorTheme?: 'red' | 'blue';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onFilesSelected, 
  label = "Upload Images", 
  multiple = true,
  accept = "image/*",
  compact = false,
  colorTheme = 'red'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const borderColor = isDragging 
    ? (colorTheme === 'red' ? 'border-red-600 bg-red-50' : 'border-blue-600 bg-blue-50')
    : 'border-gray-300 hover:border-gray-400 bg-white';

  const iconColor = colorTheme === 'red' ? 'text-red-600' : 'text-blue-600';

  return (
    <div 
      className={`border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer group ${borderColor} ${compact ? 'p-4' : 'p-10'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input 
        type="file" 
        ref={inputRef} 
        className="hidden" 
        multiple={multiple} 
        accept={accept}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
          }
        }}
      />
      
      <div className="flex flex-col items-center justify-center text-center">
        <div className={`p-3 rounded-full mb-3 transition-transform group-hover:scale-110 ${colorTheme === 'red' ? 'bg-red-100' : 'bg-blue-100'}`}>
          {multiple ? <Upload className={iconColor} size={compact ? 20 : 32} /> : <ImageIcon className={iconColor} size={compact ? 20 : 32} />}
        </div>
        <h3 className={`font-semibold text-gray-800 ${compact ? 'text-sm' : 'text-lg'}`}>
          {label}
        </h3>
        {!compact && (
          <p className="text-gray-500 mt-2 text-sm">
            Drag & drop or click to browse
          </p>
        )}
      </div>
    </div>
  );
};