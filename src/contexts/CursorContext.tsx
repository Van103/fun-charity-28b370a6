import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CursorType = 'angel' | 'diamond' | 'heart' | 'baby' | 'star' | 'crown' | 'default';

interface CursorOption {
  id: CursorType;
  name: string;
  nameVi: string;
  cursor: string;
  cursorHover: string;
  particleColor: string;
  particleColorAlt: string;
}

export const CURSOR_OPTIONS: CursorOption[] = [
  {
    id: 'angel',
    name: 'Purple Angel',
    nameVi: 'Thiên thần tím',
    cursor: '/cursors/angel-purple.svg',
    cursorHover: '/cursors/angel-gold.svg',
    particleColor: 'rgba(201, 162, 61, 1)',
    particleColorAlt: 'rgba(255, 215, 100, 1)',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    nameVi: 'Kim cương',
    cursor: '/cursors/diamond-purple.svg',
    cursorHover: '/cursors/diamond-gold.svg',
    particleColor: 'rgba(147, 51, 234, 1)',
    particleColorAlt: 'rgba(168, 85, 247, 1)',
  },
  {
    id: 'heart',
    name: 'Heart',
    nameVi: 'Trái tim',
    cursor: '/cursors/heart-pink.svg',
    cursorHover: '/cursors/heart-gold.svg',
    particleColor: 'rgba(236, 72, 153, 1)',
    particleColorAlt: 'rgba(244, 114, 182, 1)',
  },
  {
    id: 'baby',
    name: 'Baby',
    nameVi: 'Em bé',
    cursor: '/cursors/baby.svg',
    cursorHover: '/cursors/baby.svg',
    particleColor: 'rgba(255, 182, 193, 1)',
    particleColorAlt: 'rgba(135, 206, 235, 1)',
  },
  {
    id: 'star',
    name: 'Star',
    nameVi: 'Ngôi sao',
    cursor: '/cursors/star.svg',
    cursorHover: '/cursors/star.svg',
    particleColor: 'rgba(255, 215, 0, 1)',
    particleColorAlt: 'rgba(255, 165, 0, 1)',
  },
  {
    id: 'crown',
    name: 'Crown',
    nameVi: 'Vương miện',
    cursor: '/cursors/crown.svg',
    cursorHover: '/cursors/crown.svg',
    particleColor: 'rgba(201, 162, 61, 1)',
    particleColorAlt: 'rgba(147, 51, 234, 1)',
  },
  {
    id: 'default',
    name: 'Default',
    nameVi: 'Mặc định',
    cursor: 'auto',
    cursorHover: 'pointer',
    particleColor: 'rgba(201, 162, 61, 1)',
    particleColorAlt: 'rgba(255, 215, 100, 1)',
  },
];

interface CursorContextType {
  cursorType: CursorType;
  setCursorType: (type: CursorType) => void;
  particlesEnabled: boolean;
  setParticlesEnabled: (enabled: boolean) => void;
  currentCursor: CursorOption;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const CursorProvider = ({ children }: { children: ReactNode }) => {
  const [cursorType, setCursorTypeState] = useState<CursorType>(() => {
    const saved = localStorage.getItem('cursorType');
    return (saved as CursorType) || 'angel';
  });

  const [particlesEnabled, setParticlesEnabledState] = useState(() => {
    const saved = localStorage.getItem('cursorParticles');
    return saved !== 'false';
  });

  const currentCursor = CURSOR_OPTIONS.find(c => c.id === cursorType) || CURSOR_OPTIONS[0];

  const setCursorType = (type: CursorType) => {
    setCursorTypeState(type);
    localStorage.setItem('cursorType', type);
  };

  const setParticlesEnabled = (enabled: boolean) => {
    setParticlesEnabledState(enabled);
    localStorage.setItem('cursorParticles', String(enabled));
  };

  // Apply cursor styles dynamically
  useEffect(() => {
    const styleId = 'custom-cursor-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    if (cursorType === 'default') {
      styleEl.textContent = '';
    } else {
      const timestamp = Date.now();
      styleEl.textContent = `
        *, *::before, *::after {
          cursor: url('${currentCursor.cursor}?v=${timestamp}') 16 16, auto !important;
        }
        a, button, [role="button"], input, textarea, select, 
        [tabindex]:not([tabindex="-1"]), .cursor-pointer,
        a *, button *, [role="button"] * {
          cursor: url('${currentCursor.cursorHover}?v=${timestamp}') 16 16, pointer !important;
        }
      `;
    }

    return () => {
      if (styleEl && cursorType === 'default') {
        styleEl.textContent = '';
      }
    };
  }, [cursorType, currentCursor]);

  return (
    <CursorContext.Provider value={{
      cursorType,
      setCursorType,
      particlesEnabled,
      setParticlesEnabled,
      currentCursor,
    }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};
