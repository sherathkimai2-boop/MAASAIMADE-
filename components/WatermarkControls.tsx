
import React, { useState } from 'react';
import { WatermarkSettings } from '../types';
import { AlignCenter, AlignLeft, AlignRight, LayoutGrid, ArrowUpLeft, ArrowDownRight, ArrowUpRight, ArrowDownLeft, FileType, Check, Wand2, Save } from 'lucide-react';

interface WatermarkControlsProps {
  settings: WatermarkSettings;
  onChange: (settings: WatermarkSettings) => void;
  onSave: () => void;
  disabled?: boolean;
}

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({ settings, onChange, onSave, disabled }) => {
  const [justSaved, setJustSaved] = useState(false);
  
  const update = (key: keyof WatermarkSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const resetEnhancements = () => {
      onChange({
          ...settings,
          brightness: 100,
          contrast: 100,
          saturation: 100
      });
  };

  const handleSave = () => {
      onSave();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      
      {/* Position Grid */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Position</label>
        <div className="grid grid-cols-3 gap-2">
            {[
                { id: 'top-left', icon: ArrowUpLeft },
                { id: 'top-right', icon: ArrowUpRight },
                { id: 'tiled', icon: LayoutGrid },
                { id: 'center', icon: AlignCenter },
                { id: 'bottom-left', icon: ArrowDownLeft },
                { id: 'bottom-right', icon: ArrowDownRight },
            ].map((pos) => (
                <button
                    key={pos.id}
                    onClick={() => update('position', pos.id)}
                    className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        settings.position === pos.id 
                        ? 'border-red-600 bg-red-50 text-red-600' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-500'
                    }`}
                    title={pos.id.replace('-', ' ')}
                >
                    <pos.icon size={20} />
                </button>
            ))}
        </div>
      </div>

      {/* Scale Slider */}
      <div>
        <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Size</label>
            <span className="text-sm font-mono text-gray-500">{settings.scale}%</span>
        </div>
        <input 
            type="range" 
            min="5" 
            max="100" 
            value={settings.scale} 
            onChange={(e) => update('scale', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
        />
      </div>

      {/* Opacity Slider */}
      <div>
        <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Opacity</label>
            <span className="text-sm font-mono text-gray-500">{settings.opacity}%</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="100" 
            value={settings.opacity} 
            onChange={(e) => update('opacity', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Margin Slider */}
      <div className={settings.position === 'tiled' ? 'opacity-30 pointer-events-none' : ''}>
        <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Margin</label>
            <span className="text-sm font-mono text-gray-500">{settings.margin}%</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="20" 
            value={settings.margin} 
            onChange={(e) => update('margin', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
        />
      </div>
      
      {/* Enhancements Section */}
      <div className="border-t border-dashed border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
             <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <Wand2 size={16} className="text-purple-600" /> 
                Enhancements
             </label>
             {(settings.brightness !== 100 || settings.contrast !== 100 || settings.saturation !== 100) && (
                 <button onClick={resetEnhancements} className="text-xs text-red-500 hover:text-red-700 font-medium">Reset</button>
             )}
        </div>
        
        <div className="space-y-4">
            {/* Brightness */}
            <div>
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Brightness</label>
                    <span className="text-xs font-mono text-gray-400">{settings.brightness}%</span>
                </div>
                <input 
                    type="range" min="50" max="150" value={settings.brightness} 
                    onChange={(e) => update('brightness', Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
            </div>

            {/* Contrast */}
            <div>
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Contrast</label>
                    <span className="text-xs font-mono text-gray-400">{settings.contrast}%</span>
                </div>
                <input 
                    type="range" min="50" max="150" value={settings.contrast} 
                    onChange={(e) => update('contrast', Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
            </div>

            {/* Saturation */}
            <div>
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Saturation</label>
                    <span className="text-xs font-mono text-gray-400">{settings.saturation}%</span>
                </div>
                <input 
                    type="range" min="0" max="200" value={settings.saturation} 
                    onChange={(e) => update('saturation', Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
            </div>
        </div>
      </div>

      {/* Style Extras (Shadow) */}
      <div className="border-t border-dashed border-gray-200 pt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Style</label>
          <button 
              onClick={() => update('shadow', !settings.shadow)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  settings.shadow
                  ? 'border-gray-800 bg-gray-50 text-gray-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
          >
              <span className="font-medium">Drop Shadow</span>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.shadow ? 'bg-gray-800 border-gray-800 text-white' : 'border-gray-300 bg-white'}`}>
                  {settings.shadow && <Check size={14} />}
              </div>
          </button>
      </div>

      {/* Output Format Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Output Format</label>
        <div className="grid grid-cols-3 gap-2">
            {[
                { id: 'image/jpeg', label: 'JPEG' },
                { id: 'image/png', label: 'PNG' },
                { id: 'image/webp', label: 'WEBP' },
            ].map((format) => (
                <button
                    key={format.id}
                    onClick={() => update('outputFormat', format.id)}
                    className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        settings.outputFormat === format.id 
                        ? 'border-blue-600 bg-blue-50 text-blue-600' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                >
                    {format.label}
                </button>
            ))}
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="pt-2">
          <button
            onClick={handleSave}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                justSaved 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
              {justSaved ? (
                  <>
                    <Check size={16} /> Saved Default Settings
                  </>
              ) : (
                  <>
                    <Save size={16} /> Save Settings as Default
                  </>
              )}
          </button>
      </div>

    </div>
  );
};
