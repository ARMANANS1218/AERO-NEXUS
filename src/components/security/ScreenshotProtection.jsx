import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * ScreenshotProtection Component
 * 
 * Prevents users from taking screenshots using various methods:
 * 1. Keyboard shortcuts (PrtScn, Win+Shift+S, etc.)
 * 2. Context menu (right-click)
 * 3. Developer tools detection
 * 
 * Note: Complete screenshot prevention is impossible in browsers,
 * but this provides multiple layers of deterrence.
 */
export default function ScreenshotProtection({ children }) {
  const [showWarning, setShowWarning] = useState(false);
  const [hideContent, setHideContent] = useState(false);

  useEffect(() => {
    let devToolsOpen = false;
    let hideTimeout = null;

    // Function to temporarily hide content
    const triggerContentHide = () => {
      // Immediately add blur to body
      document.body.classList.add('screenshot-blocking');
      
      setHideContent(true);
      setShowWarning(true);
      
      // Clear any existing timeout
      if (hideTimeout) clearTimeout(hideTimeout);
      
      // Hide content for 3 seconds
      hideTimeout = setTimeout(() => {
        document.body.classList.remove('screenshot-blocking');
        setHideContent(false);
        setShowWarning(false);
      }, 3000);
    };

    // ========== 1. Prevent PrintScreen and Windows Snip shortcuts ==========
    const handleKeyDown = (e) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        navigator?.clipboard?.writeText(''); // Clear clipboard
        toast.error('Screenshots are disabled for security reasons', {
          autoClose: 3000,
          toastId: 'screenshot-blocked'
        });
        triggerContentHide();
        return false;
      }

      // Windows Snipping Tool: Win + Shift + S
      if (e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toast.error('Screen capture is disabled for security reasons', {
          autoClose: 3000,
          toastId: 'screenshot-blocked'
        });
        triggerContentHide();
        return false;
      }

      // macOS screenshots: Cmd + Shift + 3/4/5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        toast.error('Screenshots are disabled for security reasons', {
          autoClose: 3000,
          toastId: 'screenshot-blocked'
        });
        triggerContentHide();
        return false;
      }

      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (DevTools)
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
        toast.warning('Developer tools are restricted', {
          autoClose: 2000,
          toastId: 'devtools-blocked'
        });
        return false;
      }
    };

    // ========== 2. Disable right-click context menu ==========
    // DISABLED BY REQUEST: Allow right-click for all roles.
    // Keep implementation commented for easy re-enable later.
    // const handleContextMenu = (e) => {
    //   e.preventDefault();
    //   toast.info('Right-click is disabled for security', {
    //     autoClose: 2000,
    //     toastId: 'rightclick-blocked'
    //   });
    //   return false;
    // };

    // ========== 3. Detect DevTools opening ==========
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          toast.warning('Developer tools detected. Please close them.', {
            autoClose: 5000,
            toastId: 'devtools-open'
          });
        }
      } else {
        devToolsOpen = false;
      }
    };

    // ========== 4. Prevent text selection and copy - DISABLED ==========
    // Copy and paste are now enabled by user request
    // const handleSelectStart = (e) => {
    //   // Allow selection in input fields
    //   if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    //     return true;
    //   }
    //   // Prevent selection elsewhere (makes screen capture less useful)
    //   e.preventDefault();
    //   return false;
    // };

    // const handleCopy = (e) => {
    //   // Allow copy in input fields
    //   if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    //     return true;
    //   }
    //   e.preventDefault();
    //   toast.info('Copy is restricted for security', {
    //     autoClose: 2000,
    //     toastId: 'copy-blocked'
    //   });
    //   return false;
    // };

    // ========== 5. Detect when window loses focus - REMOVED ==========
    // NOTE: handleBlur removed to prevent false positives on tab switching
    
    // ========== 7. Handle visibility change - REMOVED ==========
    // NOTE: handleVisibilityChange removed to prevent false positives on tab switching

    // ========== 6. Prevent dragging images ==========
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Add all listeners (blur, visibilitychange, copy, and paste removed to prevent false positives)
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyDown);
    // document.addEventListener('contextmenu', handleContextMenu); // DISABLED to allow right-click
    // document.addEventListener('selectstart', handleSelectStart); // DISABLED to allow selection
    // document.addEventListener('copy', handleCopy); // DISABLED to allow copy/paste
    document.addEventListener('dragstart', handleDragStart);
    // document.addEventListener('visibilitychange', handleVisibilityChange); // REMOVED
    // window.addEventListener('blur', handleBlur); // REMOVED

    // DevTools detection interval
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyDown);
      // document.removeEventListener('contextmenu', handleContextMenu); // DISABLED to allow right-click
      // document.removeEventListener('selectstart', handleSelectStart); // DISABLED to allow selection
      // document.removeEventListener('copy', handleCopy); // DISABLED to allow copy/paste
      document.removeEventListener('dragstart', handleDragStart);
      // document.removeEventListener('visibilitychange', handleVisibilityChange); // REMOVED
      // window.removeEventListener('blur', handleBlur); // REMOVED
      clearInterval(devToolsInterval);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Blank Screen Overlay (when screenshot detected) */}
      {hideContent && (
        <div className="fixed inset-0 z-[99999] bg-white dark:bg-gray-950">
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-8xl">🚫</div>
            <div className="bg-red-600 text-white px-8 py-4 rounded-lg shadow-2xl text-2xl font-bold text-center">
              SCREENSHOT BLOCKED
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg text-center max-w-md">
              Screen capture is disabled for security reasons.<br />
              Content will return in a moment.
            </p>
          </div>
        </div>
      )}

      {/* Warning Flash Overlay */}
      {showWarning && !hideContent && (
        <div className="fixed inset-0 z-[9999] pointer-events-none bg-red-500/20 animate-pulse">
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-600 text-white px-8 py-4 rounded-lg shadow-2xl text-xl font-bold">
              🚫 SCREENSHOT BLOCKED
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`relative z-10 w-full h-full transition-all duration-200 ${hideContent ? 'opacity-0 blur-3xl scale-95' : 'opacity-100 blur-0 scale-100'}`}>
        {children}
      </div>

      {/* Additional CSS-based protection */}
      <style>{`
        /* Prevent text selection for sensitive content */
        .screenshot-protected * {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        /* Allow selection in input fields */
        .screenshot-protected input,
        .screenshot-protected textarea {
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
        }

        /* Prevent image dragging */
        .screenshot-protected img {
          pointer-events: none;
          -webkit-user-drag: none;
          user-drag: none;
        }

        /* Add blur filter on body when screenshot detected */
        body.screenshot-blocking {
          filter: blur(50px);
          transition: filter 0.1s ease-out;
        }
      `}</style>
    </div>
  );
}
