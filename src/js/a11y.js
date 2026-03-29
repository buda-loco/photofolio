const html = document.documentElement

function syncButtonState() {
  const motionBtn   = document.getElementById('a11y-motion')
  const contrastBtn = document.getElementById('a11y-contrast')
  if (motionBtn)   motionBtn.setAttribute('aria-pressed',   String(html.classList.contains('reduce-motion')))
  if (contrastBtn) contrastBtn.setAttribute('aria-pressed', String(html.classList.contains('high-contrast')))
}

function toggleReduceMotion() {
  const on = !html.classList.contains('reduce-motion')
  if (on) {
    localStorage.setItem('reduce-motion', '1')
    // Reload so GSAP init is skipped cleanly from the top
    window.location.reload()
  } else {
    localStorage.removeItem('reduce-motion')
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
  syncButtonState()
  document.addEventListener('click', onClick)
}

export function cleanupA11y() {
  document.removeEventListener('click', onClick)
}
