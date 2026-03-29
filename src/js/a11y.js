const html = document.documentElement

// ── Restore preferences ───────────────────────────────────────────
// Called on every astro:page-load because ViewTransitions copies <html>
// attributes from the incoming page, which resets any classes we set.
function restorePrefs() {
  const motionPref = localStorage.getItem('reduce-motion')
  if (motionPref === '1') {
    // User explicitly enabled reduce-motion
    html.classList.add('reduce-motion')
  } else if (motionPref === '0') {
    // User explicitly disabled — override OS preference
    html.classList.remove('reduce-motion')
  } else {
    // No stored preference — respect the OS setting
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      html.classList.add('reduce-motion')
    }
  }

  if (localStorage.getItem('high-contrast') === '1') {
    html.classList.add('high-contrast')
  } else {
    html.classList.remove('high-contrast')
  }
}

function syncButtonState() {
  const motionBtn   = document.getElementById('a11y-motion')
  const contrastBtn = document.getElementById('a11y-contrast')
  if (motionBtn)   motionBtn.setAttribute('aria-pressed', String(html.classList.contains('reduce-motion')))
  if (contrastBtn) contrastBtn.setAttribute('aria-pressed', String(html.classList.contains('high-contrast')))
}

function toggleReduceMotion() {
  const on = !html.classList.contains('reduce-motion')
  if (on) {
    localStorage.setItem('reduce-motion', '1')
    // Reload so GSAP init is skipped cleanly from the top
    window.location.reload()
  } else {
    // Store '0' — explicit user override, survives OS-preference checks
    localStorage.setItem('reduce-motion', '0')
    html.classList.remove('reduce-motion')
    syncButtonState()
  }
}

function toggleHighContrast() {
  const on = !html.classList.contains('high-contrast')
  html.classList.toggle('high-contrast', on)
  if (on) {
    localStorage.setItem('high-contrast', '1')
  } else {
    localStorage.removeItem('high-contrast')
  }
  syncButtonState()
}

function onClick(e) {
  const target = e.target
  if (target.id === 'a11y-motion')   toggleReduceMotion()
  if (target.id === 'a11y-contrast') toggleHighContrast()
}

export function initA11y() {
  // Re-apply stored prefs — ViewTransitions resets <html> attrs on each nav
  restorePrefs()
  syncButtonState()
  document.addEventListener('click', onClick)
}

export function cleanupA11y() {
  document.removeEventListener('click', onClick)
}
