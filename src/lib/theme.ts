// Theme utility functions
export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const savedTheme = localStorage.getItem('theme') as Theme;
  if (savedTheme) return savedTheme;

  // Check if document has theme class
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (document.documentElement.classList.contains('light')) return 'light';

  return 'light';
}

export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  // Remove existing theme classes
  document.documentElement.classList.remove('light', 'dark');
  // Add new theme class
  document.documentElement.classList.add(theme);

  // Update body classes
  document.body.className = `min-h-screen transition-colors duration-300 ${theme === 'light'
      ? 'bg-white text-gray-900'
      : 'bg-white text-gray-900'
    }`;

  // Save to localStorage
  localStorage.setItem('theme', theme);

  // Dispatch custom event for other components to listen to
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

export function toggleTheme(): Theme {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const theme = getTheme();
  setTheme(theme);
}
