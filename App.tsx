
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { WatermarkControls } from './components/WatermarkControls';
import { WatermarkSettings, ProcessedImage } from './types';
import { applyWatermarkToImage, readFileAsDataURL } from './utils/watermark';
import { Download, Trash2, RefreshCw, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const App: React.FC = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [batchErrorResults, setBatchErrorResults] = useState<{ total: number; success: number; failures: { id: string; name: string; error: string }[] } | null>(null);
  
  // Controls settings with persistence
  const [settings, setSettings] = useState<WatermarkSettings>(() => {
    try {
        const saved = localStorage.getItem('maasai-watermark-settings');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return {
        opacity: 80,
        scale: 20,
        position: 'bottom-right',
        margin: 3,
        outputFormat: 'image/jpeg',
        shadow: false,
        brightness: 100,
        contrast: 100,
        saturation: 100,
    };
  });

  const handleSaveSettings = () => {
      try {
          localStorage.setItem('maasai-watermark-settings', JSON.stringify(settings));
      } catch (e) {
          console.error("Failed to save settings", e);
          // Fallback if local storage is full or disabled, though rare in modern context
      }
  };

  // Preview Image ID (to show a large preview of one processed image)
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Handle source images upload
  const handleImagesSelected = (files: File[]) => {
    const newImages: ProcessedImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      originalFile: file,
      previewUrl: '',
      status: 'pending',
    }));
    
    setImages((prev) => [...prev, ...newImages]);
    
    // Auto-select first image for preview if none selected
    if (!activePreviewId && newImages.length > 0) {
      setActivePreviewId(newImages[0].id);
    }
  };

  // Handle logo upload
  const handleLogoSelected = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setLogo(file);
      const url = await readFileAsDataURL(file);
      setLogoPreview(url);
    }
  };

  // Debounce the live preview generation
  useEffect(() => {
    if (!activePreviewId || !logo) {
        setPreviewResult(null);
        setPreviewError(null);
        return;
    }

    const imageToPreview = images.find(img => img.id === activePreviewId);
    if (!imageToPreview) return;

    // If the image already has an error from batch processing, display that instead of retrying immediately
    // unless the user changes settings, which would trigger this effect again.
    
    const generatePreview = async () => {
        try {
            setPreviewError(null);
            const url = await applyWatermarkToImage(imageToPreview.originalFile, logo, settings);
            setPreviewResult(url);
        } catch (e) {
            console.error(e);
            setPreviewError(e instanceof Error ? e.message : "Failed to generate preview");
            setPreviewResult(null);
        }
    };

    const timer = setTimeout(generatePreview, 200); // 200ms debounce
    return () => clearTimeout(timer);

  }, [settings, activePreviewId, logo, images]); 

  // Execute Batch Processing
  const executeBatchProcessing = async () => {
    if (!logo || images.length === 0) return;
    
    setShowConfirmModal(false);
    setBatchErrorResults(null);
    setIsProcessing(true);
    
    // Process all images
    const processed = await Promise.all(images.map(async (img) => {
        try {
            const url = await applyWatermarkToImage(img.originalFile, logo, settings);
            return { ...img, previewUrl: url, status: 'done' as const, errorMessage: undefined };
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Processing failed due to unknown error.";
            return { ...img, status: 'error' as const, errorMessage: msg };
        }
    }));

    setImages(processed);
    setIsProcessing(false);

    // Calculate Results
    const failures = processed
        .filter(img => img.status === 'error')
        .map(img => ({ 
            id: img.id, 
            name: img.originalFile.name, 
            error: img.errorMessage || "Unknown Error" 
        }));
    
    const successCount = processed.length - failures.length;

    if (failures.length > 0) {
        setBatchErrorResults({
            total: processed.length,
            success: successCount,
            failures
        });
    }

    // Trigger Downloads for Successful Images
    processed.forEach((img, index) => {
        if (img.status === 'done' && img.previewUrl) {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = img.previewUrl;
                
                // Determine extension
                let ext = 'jpg';
                if (settings.outputFormat === 'image/png') ext = 'png';
                else if (settings.outputFormat === 'image/webp') ext = 'webp';

                // Strip original extension
                const originalName = img.originalFile.name.substring(0, img.originalFile.name.lastIndexOf('.')) || img.originalFile.name;
                link.download = `watermarked-${originalName}.${ext}`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 200); 
        }
    });
  };

  // Check before processing
  const handleProcessClick = () => {
      if (!logo || images.length === 0) return;

      if (images.length > 10) {
          setShowConfirmModal(true);
      } else {
          executeBatchProcessing();
      }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (activePreviewId === id) {
        setActivePreviewId(null);
        setPreviewResult(null);
        setPreviewError(null);
    }
  };

  const resetAll = () => {
      setImages([]);
      setLogo(null);
      setLogoPreview(null);
      setActivePreviewId(null);
      setPreviewResult(null);
      setPreviewError(null);
      setBatchErrorResults(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Large Batch Detected</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You are about to process <span className="font-bold text-gray-900">{images.length} images</span>. 
              This operation might take some time and will initiate multiple file downloads.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeBatchProcessing}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition-colors flex items-center gap-2"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Results / Error Summary Modal */}
      {batchErrorResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
              <div className="bg-red-100 p-3 rounded-full text-red-600">
                <AlertCircle size={24} />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-gray-900">Processing Completed with Errors</h3>
                  <p className="text-sm text-gray-500">
                      {batchErrorResults.success} successful, {batchErrorResults.failures.length} failed
                  </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 overflow-y-auto custom-scrollbar flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-2 uppercase tracking-wide">Failed Images</h4>
                <ul className="space-y-3">
                    {batchErrorResults.failures.map((fail) => (
                        <li key={fail.id} className="text-sm border-b border-red-100 pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-red-900 block">{fail.name}</span>
                            <span className="text-red-700 block mt-1 bg-white/50 p-2 rounded">{fail.error}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="flex gap-3 justify-end flex-shrink-0">
              <button 
                onClick={() => setBatchErrorResults(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 shadow-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Sidebar: Controls & Uploads */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Logo Uploader */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-6 bg-red-600 rounded-full mr-2"></span>
                    1. Upload Logo
                </h2>
                {logoPreview ? (
                    <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-red-200 bg-red-50 p-4 text-center">
                        <img src={logoPreview} alt="Logo" className="h-24 mx-auto object-contain" />
                        <button 
                            onClick={() => { setLogo(null); setLogoPreview(null); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                        <p className="text-xs text-red-600 mt-2 font-medium">{logo?.name}</p>
                    </div>
                ) : (
                    <ImageUploader 
                        onFilesSelected={handleLogoSelected} 
                        multiple={false} 
                        label="Drop Logo Here"
                        compact={true}
                        colorTheme="red"
                    />
                )}
            </div>

            {/* Settings */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-shuka-red opacity-10 rounded-bl-3xl"></div>

                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center relative z-10">
                    <span className="w-2 h-6 bg-blue-600 rounded-full mr-2"></span>
                    2. Customize
                </h2>
                <WatermarkControls 
                    settings={settings} 
                    onChange={setSettings} 
                    onSave={handleSaveSettings}
                    disabled={!logo || images.length === 0}
                />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                 <button
                    onClick={handleProcessClick}
                    disabled={!logo || images.length === 0 || isProcessing}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform flex items-center justify-center gap-2
                        ${!logo || images.length === 0 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 hover:scale-[1.02]'
                        }`}
                 >
                    {isProcessing ? (
                        <>
                            <RefreshCw className="animate-spin" /> Processing...
                        </>
                    ) : (
                        <>
                            <Download size={24} /> Download All
                        </>
                    )}
                 </button>
                 
                 {images.length > 0 && (
                     <button
                        onClick={resetAll}
                        className="w-full py-3 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors flex items-center justify-center gap-2"
                     >
                         <Trash2 size={16} /> Clear All
                     </button>
                 )}
            </div>
        </div>

        {/* Right Area: Preview & List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Main Preview Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 min-h-[400px] flex flex-col relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-blue-600 z-10"></div>
                 
                 {images.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-12">
                        <div className="w-full max-w-md">
                            <ImageUploader onFilesSelected={handleImagesSelected} colorTheme="blue" label="Upload Photos to Watermark" />
                        </div>
                     </div>
                 ) : (
                    <div className="flex-1 bg-gray-100 rounded-xl relative overflow-hidden flex items-center justify-center m-4">
                        {/* Background pattern for transparency checks */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {activePreviewId && previewError ? (
                            <div className="flex flex-col items-center justify-center text-center p-8 bg-white/80 backdrop-blur rounded-xl border-2 border-red-100 shadow-xl max-w-sm z-20">
                                <div className="bg-red-100 p-4 rounded-full mb-4">
                                    <AlertCircle size={40} className="text-red-600" />
                                </div>
                                <h3 className="font-bold text-xl text-gray-800 mb-2">Preview Failed</h3>
                                <p className="text-gray-600 text-sm mb-4">{previewError}</p>
                                <p className="text-xs text-gray-400">Try using a smaller image or a different format.</p>
                            </div>
                        ) : activePreviewId && previewResult ? (
                            <img 
                                src={previewResult} 
                                alt="Preview" 
                                className="max-w-full max-h-[500px] object-contain shadow-xl relative z-10" 
                            />
                        ) : activePreviewId ? (
                            <div className="flex flex-col items-center text-gray-400">
                                <RefreshCw className="animate-spin mb-2" size={32} />
                                <p>Generating Preview...</p>
                            </div>
                        ) : (
                            <p className="text-gray-400">Select an image to preview</p>
                        )}
                    </div>
                 )}
            </div>

            {/* Thumbnails List */}
            {images.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                        <span>Photos ({images.length})</span>
                        <ImageUploader 
                            onFilesSelected={handleImagesSelected} 
                            compact 
                            multiple 
                            label="Add More"
                            colorTheme="blue"
                        />
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {images.map((img) => (
                            <div 
                                key={img.id}
                                onClick={() => setActivePreviewId(img.id)}
                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group
                                    ${activePreviewId === img.id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}
                                    ${img.status === 'error' ? 'border-red-400 bg-red-50 ring-2 ring-red-100' : ''}
                                `}
                            >
                                <img 
                                    src={URL.createObjectURL(img.originalFile)} 
                                    alt="Thumbnail" 
                                    className={`w-full h-full object-cover ${img.status === 'error' ? 'opacity-50 grayscale' : ''}`}
                                />
                                
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                                >
                                    <X size={12} />
                                </button>

                                {img.status === 'done' && (
                                    <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full z-10">
                                        <Download size={10} />
                                    </div>
                                )}

                                {img.status === 'error' && (
                                    <div 
                                        className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-[1px]" 
                                        title={img.errorMessage}
                                    >
                                         <AlertCircle size={28} className="text-red-600 drop-shadow-sm" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-auto py-6 bg-gray-900 text-gray-400 text-center text-sm border-t-4 border-shuka-blue">
        <p>&copy; {new Date().getFullYear()} Maasai Watermark Tool. Built with precision and culture.</p>
      </footer>
    </div>
  );
};

export default App;
