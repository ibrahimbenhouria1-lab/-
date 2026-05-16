import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-deep-space/90 flex items-center justify-center p-6 backdrop-blur-md">
      <div className="w-full max-w-md glass-card p-6 border-white/20 relative">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 bg-neon-red rounded-full text-deep-space shadow-lg hover:scale-110 active:scale-95 transition-transform"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-display font-bold tracking-tight">SCAN_STUDENT_ID</h3>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-mono">Initializing Optical Sensors...</p>
        </div>

        <div id="reader" className="overflow-hidden rounded-2xl border border-white/10 bg-black/40"></div>
        
        <div className="mt-8 flex flex-col items-center gap-2">
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-neon-blue animate-[ping_2s_infinite]" />
           </div>
           <span className="text-[10px] font-black text-neon-blue uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-neon-blue animate-pulse" />
              Pulse_Detection_Active
           </span>
        </div>
      </div>
    </div>
  );
}
