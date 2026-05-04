// Peak Qual Design Themes
// Kinetic Obsidian | Kinetic Volt 1 | Kinetic Volt 2

const THEMES = {
  obsidian: {
    name: "Kinetic Obsidian",
    description: "Cybernetic Brutalism",
    colors: {
      primary: "#39FF14",      // Electric Lime
      secondary: "#6A0DAD",    // Secondary Depth
      background: "#07070F",   // Void Black
      surface: "#111118",
      surfaceContainer: "#1C1B1B",
      onSurface: "#E5E2E1",
    },
    fonts: {
      display: "'Space Grotesk', system-ui",
      body: "'Inter', system-ui",
    },
    css: `
      :root {
        --primary: #39FF14;
        --secondary: #6A0DAD;
        --bg: #07070F;
        --surface: #111118;
        --surface-low: #1C1B1B;
        --surface-high: #2A2A2A;
        --on-surface: #E5E2E1;
        --font-display: 'Space Grotesk', system-ui;
        --font-body: 'Inter', system-ui;
      }
      body { background: var(--bg); color: var(--on-surface); }
      button { background: var(--primary); color: var(--bg); }
    `
  },

  volt1: {
    name: "Kinetic Volt 1",
    description: "HUD Performance",
    colors: {
      primary: "#39FF14",      // Volt Green
      secondary: "#8B5CF6",    // Cyber Purple
      background: "#0E0E0E",   // Deep Space
      surface: "#1C1B1B",
      surfaceContainer: "#2A2A2A",
      onSurface: "#E5E2E1",
    },
    fonts: {
      display: "'Space Grotesk', system-ui",
      body: "'Inter', system-ui",
    },
    css: `
      :root {
        --primary: #39FF14;
        --secondary: #8B5CF6;
        --bg: #0E0E0E;
        --surface: #1C1B1B;
        --surface-low: #1C1B1B;
        --surface-high: #2A2A2A;
        --on-surface: #E5E2E1;
        --font-display: 'Space Grotesk', system-ui;
        --font-body: 'Inter', system-ui;
      }
      body { background: var(--bg); color: var(--on-surface); }
      button { background: var(--primary); color: var(--bg); }
    `
  },

  volt2: {
    name: "Kinetic Volt 2",
    description: "Hyper-Performance Noir",
    colors: {
      primary: "#39FF14",      // Electric Lime
      secondary: "#6A0DAD",    // System Intelligence
      background: "#0E0E0E",   // Deep Obsidian
      surface: "#1C1B1B",
      surfaceContainer: "#2A2A2A",
      onSurface: "#E5E2E1",
    },
    fonts: {
      display: "'Space Grotesk', system-ui",
      body: "'Inter', system-ui",
    },
    css: `
      :root {
        --primary: #39FF14;
        --secondary: #6A0DAD;
        --bg: #0E0E0E;
        --surface: #1C1B1B;
        --surface-low: #1C1B1B;
        --surface-high: #2A2A2A;
        --on-surface: #E5E2E1;
        --font-display: 'Space Grotesk', system-ui;
        --font-body: 'Inter', system-ui;
      }
      body { background: var(--bg); color: var(--on-surface); }
      button { background: var(--primary); color: var(--bg); }
    `
  }
};

// Gestión de temas
function setTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return;

  // Guardar preferencia
  localStorage.setItem('theme', themeName);

  // Aplicar CSS variables
  const style = document.getElementById('theme-style') || document.createElement('style');
  style.id = 'theme-style';
  style.textContent = theme.css;
  document.head.appendChild(style);

  // Actualizar selector
  document.querySelectorAll('.theme-option').forEach(el => {
    el.classList.toggle('active', el.dataset.theme === themeName);
  });
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'obsidian';
  setTheme(saved);
  return saved;
}

// Exportar
window.THEMES = THEMES;
window.setTheme = setTheme;
window.loadTheme = loadTheme;
