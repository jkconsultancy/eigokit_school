import { API_URL } from '../config';

let cachedTheme = null;

export const loadTheme = async (schoolId) => {
  if (!schoolId) return null;
  
  try {
    const response = await fetch(`${API_URL}/api/theming/${schoolId}`);
    const theme = await response.json();
    cachedTheme = theme;
    applyTheme(theme);
    return theme;
  } catch (error) {
    console.error('Failed to load theme:', error);
    return null;
  }
};

export const applyTheme = (theme) => {
  if (!theme) return;

  const root = document.documentElement;
  
  // Apply colors
  if (theme.primary_color) {
    root.style.setProperty('--primary-color', theme.primary_color);
  }
  if (theme.secondary_color) {
    root.style.setProperty('--secondary-color', theme.secondary_color);
  }
  if (theme.accent_color) {
    root.style.setProperty('--accent-color', theme.accent_color);
  }
  if (theme.background_color) {
    root.style.setProperty('--background-color', theme.background_color);
  }
  
  // Apply font family
  if (theme.font_family) {
    root.style.setProperty('--font-family', theme.font_family);
    
    // Load Google Font if needed
    if (theme.font_family.includes('Google') || 
        ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito']
          .some(font => theme.font_family.includes(font))) {
      loadGoogleFont(theme.font_family);
    }
  }
  
  // Apply favicon
  if (theme.favicon_url) {
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = theme.favicon_url;
  }
  
  // Apply app icon (for PWA/manifest)
  if (theme.app_icon_url) {
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = theme.app_icon_url;
  }
};

const loadGoogleFont = (fontFamily) => {
  const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  const existingLink = document.querySelector(`link[href*="${fontName}"]`);
  
  if (!existingLink) {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
};

export const getTheme = () => cachedTheme;

