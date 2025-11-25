import React, { useEffect, useState } from 'react';
import { Sparkles, Gamepad2, BrainCircuit, X, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SnakeGame } from './games/SnakeGame';
import { TapGame } from './games/TapGame';
import { DinoGame } from './games/DinoGame';
import { BubbleGame } from './games/BubbleGame';

interface Props {
    onClose?: () => void;
    isThinking?: boolean;
}

export const ThinkingIndicator: React.FC<Props> = ({ onClose, isThinking = true }) => {
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { settings } = useAppStore();
  const theme = settings.theme;
  const [isDark, setIsDark] = useState(true);

  const phases = [
    "Thinking...",
    "Analyzing context...",
    "Connecting ideas...",
    "Generating response...",
    "Polishing details..."
  ];

  useEffect(() => {
    // Check screen size
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check Theme
    const checkTheme = () => {
        if (theme === 'system') {
            setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
        } else {
            setIsDark(theme === 'dark');
        }
    };
    checkTheme();
    
    // Listen for system theme changes if needed
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') setIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    const timer = setInterval(() => {
      if (isThinking) {
        setElapsed(prev => prev + 0.1);
      }
    }, 100);

    const phaseTimer = setInterval(() => {
      if (isThinking) {
        setPhase(prev => (prev + 1) % phases.length);
      }
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(phaseTimer);
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [theme, isThinking]);

  const renderGame = () => {
      if (isDark) {
          return isMobile ? <TapGame /> : <SnakeGame />;
      } else {
          return isMobile ? <BubbleGame /> : <DinoGame />;
      }
  };

  return (
    <div className="flex w-full justify-center py-6 fade-in-up">
      <div className="relative w-full max-w-xl group">
        {/* Glow Background - Adapts to Theme */}
        <div className={`absolute -inset-1 rounded-xl blur-lg opacity-75 transition-colors duration-500 ${
            isDark ? 'bg-linear-to-r from-blue-600/20 to-purple-600/20' : 'bg-linear-to-r from-blue-400/30 to-purple-400/30'
        }`}></div>
        
        {/* Arcade Card - Theme Adaptive */}
        <div className={`relative flex flex-col items-center backdrop-blur-md rounded-xl shadow-2xl border overflow-hidden transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-950/90 border-gray-800' 
              : 'bg-white/90 border-gray-200'
        }`}>
          
          {/* Header Status Bar */}
          <div className={`flex w-full items-center justify-between px-4 py-3 border-b transition-colors duration-300 ${
              isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50/80 border-gray-200'
          }`}>
             <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center h-6 w-6">
                    {isThinking ? (
                        <>
                            <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${isDark ? 'bg-blue-500/20' : 'bg-blue-400/30'}`}></div>
                            <Sparkles className={`h-4 w-4 animate-spin-slow ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                        </>
                    ) : (
                        <CheckCircle2 className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                    )}
                </div>
                <span className={`text-sm font-medium transition-all duration-500 min-w-[150px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {isThinking ? phases[phase] : "Response Ready!"}
                </span>
             </div>
             
             <div className="flex items-center gap-3">
                 <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                     isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'
                 }`}>
                     <BrainCircuit className={`h-3 w-3 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                     <span className={`font-mono text-xs tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {elapsed.toFixed(1)}s
                     </span>
                 </div>
                 
                 {/* Close Button */}
                 {onClose && (
                     <button 
                        onClick={onClose}
                        className={`p-1 rounded-full transition-colors ${
                            isDark ? 'hover:bg-gray-800 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                        }`}
                        title="Close Arcade"
                     >
                         <X className="h-4 w-4" />
                     </button>
                 )}
             </div>
          </div>

          {/* Game Container */}
          <div className={`w-full p-4 flex flex-col items-center justify-center min-h-[320px] transition-colors duration-300 ${
              isDark ? 'bg-gray-950' : 'bg-gray-100'
          }`}>
              {renderGame()}
          </div>
          
          {/* Footer */}
          <div className={`w-full py-2 border-t text-center transition-colors duration-300 ${
              isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50/80 border-gray-200'
          }`}>
             <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                <Gamepad2 className="h-3 w-3" />
                <span>Waiting Arcade Mode • {isDark ? 'Night' : 'Day'}</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
