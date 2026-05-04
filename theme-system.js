/**
 * PEAK QUAL — Theme System
 * Aplicar temas globales a toda la app
 * Monetización: Clientes personalizan su experiencia
 */

const THEME_CATALOG = {
  brutalist: {
    name: "Brutalist",
    label: "BRUTALIST",
    price: "FREE",
    isPremium: false,
    fonts: {
      display: "'Anton', sans-serif",
      mono: "'JetBrains Mono', monospace",
      body: "'Inter', sans-serif"
    },
    colors: {
      bg: "#F4F0E6",
      surface: "#FFFFFF",
      primary: "#0A0A0A",
      accent: "#FF4500",
      text: "#0A0A0A",
      textSecondary: "#575757",
      border: "#0A0A0A",
      success: "#4CAF50",
      warning: "#FF4500",
      error: "#FF1744"
    },
    css: `
      :root {
        --font-display: 'Anton', sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
        --font-body: 'Inter', sans-serif;
        --bg: #F4F0E6;
        --surface: #FFFFFF;
        --primary: #0A0A0A;
        --accent: #FF4500;
        --text: #0A0A0A;
        --text-secondary: #575757;
        --border: #0A0A0A;
        --border-width: 2px;
        --border-radius: 0px;
      }
      body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
      button, .btn { background: var(--primary); color: var(--bg); border: var(--border-width) solid var(--primary); }
      .card { background: var(--surface); border: var(--border-width) solid var(--border); box-shadow: 4px 4px 0 rgba(0,0,0,.2); }
    `
  },

  deco: {
    name: "Art Deco Gold",
    label: "ART DECO",
    price: "$4.99/mo",
    isPremium: true,
    fonts: {
      display: "'Cinzel', serif",
      secondary: "'Cormorant Garamond', serif",
      body: "'Inter', sans-serif"
    },
    colors: {
      bg: "#1A0F00",
      surface: "rgba(255,215,0,.08)",
      primary: "#FFD700",
      accent: "#8B6914",
      text: "#F5E6B8",
      textSecondary: "#C4A747",
      border: "#FFD70060",
      success: "#4CAF50",
      warning: "#FFD700",
      error: "#FF1744"
    },
    css: `
      :root {
        --font-display: 'Cinzel', serif;
        --font-secondary: 'Cormorant Garamond', serif;
        --font-body: 'Inter', sans-serif;
        --bg: #1A0F00;
        --surface: rgba(255,215,0,.08);
        --primary: #FFD700;
        --accent: #8B6914;
        --text: #F5E6B8;
        --text-secondary: #C4A747;
        --border: #FFD70060;
        --border-width: 1px;
        --border-radius: 2px;
      }
      body {
        background: linear-gradient(180deg, #1A0F00 0%, #0A0600 100%);
        color: var(--text);
        font-family: var(--font-body);
      }
      button, .btn {
        background: linear-gradient(135deg, #FFD700, #B8860B);
        color: #1A0F00;
        border: 1px solid #FFD70080;
        clip-path: polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%);
        box-shadow: 0 0 20px rgba(255,215,0,.3);
      }
      .card {
        background: rgba(255,215,0,.08);
        border: 1px solid #FFD70060;
        clip-path: polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%);
      }
    `
  },

  cyberpunk: {
    name: "Cyberpunk",
    label: "CYBERPUNK",
    price: "$4.99/mo",
    isPremium: true,
    fonts: {
      display: "'Audiowide', display",
      mono: "'JetBrains Mono', monospace",
      body: "'Inter', sans-serif"
    },
    colors: {
      bg: "#0a001a",
      surface: "rgba(255,0,255,.08)",
      primary: "#00FFFF",
      accent: "#FF00FF",
      text: "#00FFFF",
      textSecondary: "#FF00FF",
      border: "#00FFFF",
      success: "#00FF00",
      warning: "#FFFF00",
      error: "#FF0000"
    },
    css: `
      :root {
        --font-display: 'Audiowide', display;
        --font-mono: 'JetBrains Mono', monospace;
        --font-body: 'Inter', sans-serif;
        --bg: #0a001a;
        --surface: rgba(255,0,255,.08);
        --primary: #00FFFF;
        --accent: #FF00FF;
        --text: #00FFFF;
        --text-secondary: #FF00FF;
        --border: #00FFFF;
        --border-width: 1px;
        --border-radius: 0px;
      }
      body {
        background: repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,255,255,.04) 2px 3px),
                    radial-gradient(circle at 30% 20%, rgba(255,0,255,.2), transparent 50%),
                    radial-gradient(circle at 70% 80%, rgba(0,255,255,.2), transparent 50%),
                    linear-gradient(135deg, #0a001a 0%, #000510 100%);
        color: var(--text);
        font-family: var(--font-body);
      }
      button, .btn {
        background: linear-gradient(135deg, #FF00FF, #00FFFF);
        color: #000;
        border: 1px solid #00FFFF;
        clip-path: polygon(6% 0, 100% 0, 94% 100%, 0 100%);
        box-shadow: 0 0 20px rgba(0,255,255,.5), 0 0 40px rgba(255,0,255,.3);
        text-shadow: 0 0 10px rgba(255,255,255,.6);
      }
      .card {
        background: rgba(255,0,255,.08);
        border: 1px solid #00FFFF;
        clip-path: polygon(0 0, 100% 0, 95% 100%, 0 100%);
        box-shadow: 0 0 20px rgba(0,255,255,.3);
      }
    `
  },

  comic: {
    name: "Comic POW",
    label: "COMIC",
    price: "$2.99/mo",
    isPremium: true,
    fonts: {
      display: "'Bungee', display",
      handwriting: "'Caveat', cursive",
      body: "'Inter', sans-serif"
    },
    colors: {
      bg: "#FFEB3B",
      surface: "#FFFFFF",
      primary: "#0A0A0A",
      accent: "#FF1744",
      text: "#0A0A0A",
      textSecondary: "#575757",
      border: "#0A0A0A",
      success: "#4CAF50",
      warning: "#FF1744",
      error: "#FF1744"
    },
    css: `
      :root {
        --font-display: 'Bungee', display;
        --font-handwriting: 'Caveat', cursive;
        --font-body: 'Inter', sans-serif;
        --bg: #FFEB3B;
        --surface: #FFFFFF;
        --primary: #0A0A0A;
        --accent: #FF1744;
        --text: #0A0A0A;
        --text-secondary: #575757;
        --border: #0A0A0A;
        --border-width: 3px;
        --border-radius: 8px;
      }
      body {
        background: radial-gradient(circle 1.5px at 8px 8px, rgba(0,0,0,.3) 1px, transparent 1px),
                    linear-gradient(135deg, #FFEB3B 0%, #FFC107 100%);
        background-size: 12px 12px, 100% 100%;
        color: var(--text);
        font-family: var(--font-body);
      }
      button, .btn {
        background: var(--primary);
        color: var(--bg);
        border: var(--border-width) solid var(--primary);
        transform: rotate(-2deg);
        box-shadow: 3px 3px 0 var(--accent);
      }
      .card {
        background: var(--surface);
        border: var(--border-width) solid var(--border);
        transform: rotate(1deg);
        box-shadow: 4px 4px 0 var(--accent);
      }
    `
  }
};

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('appTheme') || 'brutalist';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeSelector();
  }

  applyTheme(themeName) {
    const theme = THEME_CATALOG[themeName];
    if (!theme) return;

    // Aplicar CSS
    const styleId = 'theme-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = theme.css;

    // Cargar fonts de Google
    this.loadFonts(theme);

    // Guardar preferencia
    localStorage.setItem('appTheme', themeName);
    this.currentTheme = themeName;

    // Actualizar botones activos
    document.querySelectorAll('[data-theme-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themBtn === themeName);
    });

    // Emit evento
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
  }

  loadFonts(theme) {
    const fontString = Object.values(theme.fonts)
      .join('|')
      .replace(/'/g, '')
      .split(',')
      .map(f => f.trim())
      .filter(f => f);

    if (fontString.length > 0) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontString.join('&family=')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }

  createThemeSelector() {
    // Buscar contenedor (si existe)
    let container = document.getElementById('theme-selector');
    if (!container) {
      container = document.createElement('div');
      container.id = 'theme-selector';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: rgba(0,0,0,.8);
        padding: 12px;
        border-radius: 8px;
        display: flex;
        gap: 8px;
        backdrop-filter: blur(10px);
      `;
      document.body.appendChild(container);
    }

    container.innerHTML = '';
    Object.keys(THEME_CATALOG).forEach(key => {
      const theme = THEME_CATALOG[key];
      const btn = document.createElement('button');
      btn.textContent = theme.label;
      btn.dataset.themBtn = key;
      btn.onclick = () => this.applyTheme(key);
      btn.style.cssText = `
        padding: 6px 12px;
        border: 1px solid #fff;
        background: ${key === this.currentTheme ? '#fff' : 'transparent'};
        color: ${key === this.currentTheme ? '#000' : '#fff'};
        cursor: pointer;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        transition: all .2s;
      `;
      if (theme.isPremium) {
        btn.textContent += ' 💎';
      }
      container.appendChild(btn);
    });
  }

  getTheme(name) {
    return THEME_CATALOG[name];
  }

  getCatalog() {
    return THEME_CATALOG;
  }
}

// Inicializar
const themeManager = new ThemeManager();
window.themeManager = themeManager;
