import React, { useContext } from 'react';
import { FourSquare } from 'react-loading-indicators';
import ColorModeContext from '../../context/ColorModeContext';

/**
 * Loading component using react-loading-indicators FourSquare
 * Honors Tailwind light/dark theme via ColorModeContext
 */
const Loading = ({ fullScreen = true, size = 'md', showText = false, message = 'Loading' }) => {
  const { mode } = useContext(ColorModeContext) || {};
  const isDark = mode === 'dark';

  // Map our size prop to library sizes
  const sizeMap = {
    sm: 'small',
    md: 'medium',
    lg: 'large',
  };

  // Theme-based color: dark -> white, light -> requested green/gray
  const color = isDark ? '#ffffff' : '#202220';

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50/80 via-white/80 to-slate-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm'
    : 'flex items-center justify-center';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center justify-center gap-2">
        <FourSquare
          color={color}
          size={sizeMap[size] || 'medium'}
          text=""
          textColor=""
        />

        {showText && (
          <div className="text-center mt-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Please wait…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loading;
