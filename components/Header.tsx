import React from 'react';
import { Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full relative shadow-md">
      {/* Decorative Top Band (Maasai Beads Colors) */}
      <div className="h-2 w-full flex">
        <div className="flex-1 bg-yellow-400"></div>
        <div className="flex-1 bg-blue-600"></div>
        <div className="flex-1 bg-green-600"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-black"></div>
      </div>
      
      {/* Main Header */}
      <div className="bg-shuka-red text-white py-6 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
            <Layers size={32} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Maasai Watermark</h1>
            <p className="text-red-100 text-xs md:text-sm font-light tracking-widest uppercase opacity-90">
              Bulk Image Processor
            </p>
          </div>
        </div>
        
        {/* Simple decorative circle resembling beadwork */}
        <div className="hidden md:flex gap-1">
             {[...Array(5)].map((_, i) => (
                 <div key={i} className={`w-3 h-3 rounded-full ${['bg-yellow-400', 'bg-blue-500', 'bg-green-500', 'bg-white', 'bg-black'][i % 5]}`}></div>
             ))}
        </div>
      </div>
    </header>
  );
};