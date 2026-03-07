'use client';

import { useEffect } from 'react';
import { getBrandConfig, getCurrentBrandId } from '@/configs';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const brandId = getCurrentBrandId();
    const config = getBrandConfig(brandId);
    const color = config.colors.primary;

    // Accent colors apply to both themes
    document.documentElement.style.setProperty('--accent-primary', color);
    document.documentElement.style.setProperty('--accent-light', color);
    document.documentElement.style.setProperty('--accent-subtle', `${color}20`);

    // Apply theme-aware bg/border based on current mode
    function applyThemeColors() {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.style.setProperty('--bg-primary', config.colors.primaryDark);
        document.documentElement.style.setProperty('--bg-secondary', config.colors.primaryDark);
        document.documentElement.style.setProperty('--border-primary', config.colors.borderColor);
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', '#999999');
        document.documentElement.style.setProperty('--bg-hover', '#1A1A1A');
        document.documentElement.style.setProperty('--bg-tertiary', 'rgba(255, 255, 255, 0.02)');
      } else {
        // Light mode — explicitly set light values
        document.documentElement.style.setProperty('--bg-primary', '#f6f6f6');
        document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
        document.documentElement.style.setProperty('--border-primary', '#d0d0d0');
        document.documentElement.style.setProperty('--text-primary', '#1a1a1a');
        document.documentElement.style.setProperty('--text-secondary', '#666666');
        document.documentElement.style.setProperty('--bg-hover', '#ececec');
        document.documentElement.style.setProperty('--bg-tertiary', 'rgba(0, 0, 0, 0.02)');
      }
    }

    applyThemeColors();

    // Watch for class changes on <html> to detect theme toggle
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          applyThemeColors();
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}
