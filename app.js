:root {
  color-scheme: light;
  --color-bg: #f7f4ec;
  --color-surface: #ffffff;
  --color-surface-muted: #eef3ed;
  --color-border: #d8ded4;
  --color-text: #17231d;
  --color-muted: #5c6b62;
  --color-primary: #1f6f4a;
  --color-primary-strong: #145438;
  --color-primary-soft: #dcefe5;
  --color-accent: #c4832f;
  --color-danger: #b63b3b;
  --color-info: #2f6f9f;
  --shadow-sm: 0 1px 2px rgb(23 35 29 / 0.08);
  --shadow-md: 0 12px 30px rgb(23 35 29 / 0.12);
  --radius-sm: 6px;
  --radius-md: 8px;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --sidebar-width: 17rem;
  --header-height: 4.25rem;
  --bottom-nav-height: 4.5rem;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --color-bg: #101612;
  --color-surface: #18221c;
  --color-surface-muted: #202d25;
  --color-border: #33443a;
  --color-text: #edf5ef;
  --color-muted: #b5c4ba;
  --color-primary: #6fc795;
  --color-primary-strong: #97deb2;
  --color-primary-soft: #233d2f;
  --color-accent: #e5a850;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.22);
  --shadow-md: 0 16px 35px rgb(0 0 0 / 0.28);
}
