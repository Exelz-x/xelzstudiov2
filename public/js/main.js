/* XelzStudio - Main JS */
'use strict';

// ─── PARTICLES ────────────────────────────────────────────────────────────────
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = window.innerWidth < 768 ? 15 : 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${6 + Math.random() * 10}s;
      animation-delay: ${Math.random() * 8}s;
      --dx: ${(Math.random() - 0.5) * 80}px;
      width: ${1 + Math.random() * 2}px;
      height: ${1 + Math.random() * 2}px;
      background: ${Math.random() > 0.5 ? '#00f5ff' : '#7b2dff'};
    `;
    container.appendChild(p);
  }
})();

// ─── NAVBAR SCROLL ────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ─── MOBILE NAV ───────────────────────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');
if (navToggle && navMobile) {
  navToggle.addEventListener('click', () => navMobile.classList.toggle('open'));
}

// ─── CONVERTER STATE ──────────────────────────────────────────────────────────
const steps = {
  input: document.getElementById('stepInput'),
  preview: document.getElementById('stepPreview'),
  progress: document.getElementById('stepProgress'),
  done: document.getElementById('stepDone'),
};

function showStep(name) {
  Object.values(steps).forEach(el => el && el.classList.add('hidden'));
  if (steps[name]) steps[name].classList.remove('hidden');
}

function showError(msg) {
  const toast = document.getElementById('errorToast');
  const msgEl = document.getElementById('errorMsg');
  if (toast && msgEl) {
    msgEl.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 6000);
  }
}

const toastClose = document.getElementById('toastClose');
if (toastClose) {
  toastClose.addEventListener('click', () => {
    document.getElementById('errorToast')?.classList.add('hidden');
  });
}

// ─── PASTE BUTTON ─────────────────────────────────────────────────────────────
const pasteBtn = document.getElementById('pasteBtn');
if (pasteBtn && navigator.clipboard) {
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const input = document.getElementById('ytUrl');
      if (input) input.value = text;
    } catch {
      showError('Clipboard access denied. Please paste manually.');
    }
  });
} else if (pasteBtn) {
  pasteBtn.style.display = 'none';
}

// ─── FETCH INFO ───────────────────────────────────────────────────────────────
const fetchBtn = document.getElementById('fetchBtn');
if (fetchBtn) {
  fetchBtn.addEventListener('click', async () => {
    const url = document.getElementById('ytUrl')?.value?.trim();
    if (!url) { showError('Please enter a YouTube URL.'); return; }
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      showError('Please enter a valid YouTube URL.');
      return;
    }

    fetchBtn.disabled = true;
    const btnText = fetchBtn.querySelector('.btn-text');
    if (btnText) btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching…';

    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error || 'Failed to fetch info.'); return; }

      // Populate preview
      document.getElementById('trackThumb').src = data.thumbnail || '';
      document.getElementById('trackTitle').textContent = data.title || 'Unknown Title';
      document.getElementById('trackAuthor').textContent = data.author || 'Unknown Author';
      document.getElementById('trackDuration').innerHTML = `<i class="fas fa-clock"></i> ${formatDuration(data.duration)}`;

      showStep('preview');
    } catch {
      showError('Network error. Please check your connection.');
    } finally {
      fetchBtn.disabled = false;
      if (btnText) btnText.innerHTML = '<i class="fas fa-search"></i> Fetch Audio Info';
    }
  });
}

// ─── RESET ────────────────────────────────────────────────────────────────────
document.getElementById('resetBtn')?.addEventListener('click', () => showStep('input'));
document.getElementById('convertAnother')?.addEventListener('click', () => {
  const input = document.getElementById('ytUrl');
  if (input) input.value = '';
  showStep('input');
});

// ─── CONVERT ──────────────────────────────────────────────────────────────────
const convertBtn = document.getElementById('convertBtn');
if (convertBtn) {
  convertBtn.addEventListener('click', async () => {
    const url = document.getElementById('ytUrl')?.value?.trim();
    if (!url) { showError('URL missing.'); return; }

    showStep('progress');
    startProgressAnimation();

    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        let msg = 'Conversion failed. Please try again.';
        try { const d = await res.json(); msg = d.error || msg; } catch {}
        showStep('preview');
        showError(msg);
        return;
      }

      // Stream download
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      let filename = 'XelzStudio_Audio.mp3';
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match) filename = match[1];

      const objectUrl = URL.createObjectURL(blob);
      const link = document.getElementById('downloadLink');
      if (link) {
        link.href = objectUrl;
        link.download = filename;
      }

      finishProgress();
      setTimeout(() => showStep('done'), 600);

      // Revoke after download window
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);

    } catch {
      showStep('preview');
      showError('Network error during conversion. Please try again.');
    }
  });
}

// ─── PROGRESS ANIMATION ───────────────────────────────────────────────────────
let progressTimer = null;
function startProgressAnimation() {
  const bar = document.getElementById('progressBar');
  const label = document.getElementById('progressLabel');
  const ps1 = document.getElementById('ps1');
  const ps2 = document.getElementById('ps2');
  const ps3 = document.getElementById('ps3');
  if (!bar) return;

  let pct = 0;
  let phase = 1; // 1=download, 2=process, 3=ready
  clearInterval(progressTimer);

  progressTimer = setInterval(() => {
    if (phase === 1) {
      pct = Math.min(pct + 1.5, 40);
      if (pct >= 40) { phase = 2; if (label) label.textContent = 'Applying Audio Processing…'; ps2?.classList.add('active'); }
    } else if (phase === 2) {
      pct = Math.min(pct + 0.8, 80);
      if (pct >= 80) { phase = 3; if (label) label.textContent = 'Finalizing…'; ps3?.classList.add('active'); }
    } else {
      pct = Math.min(pct + 0.3, 92);
    }
    if (bar) bar.style.width = pct + '%';
  }, 80);
}

function finishProgress() {
  clearInterval(progressTimer);
  const bar = document.getElementById('progressBar');
  const ps1 = document.getElementById('ps1');
  const ps2 = document.getElementById('ps2');
  const ps3 = document.getElementById('ps3');
  if (bar) bar.style.width = '100%';
  [ps1, ps2, ps3].forEach(el => { el?.classList.add('done'); el?.classList.remove('active'); });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── FAQ ACCORDION ────────────────────────────────────────────────────────────
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  if (q) {
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  }
});

// ─── SCROLL REVEAL ────────────────────────────────────────────────────────────
const revealEls = document.querySelectorAll('.feature-card, .step-item, .faq-item');
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    obs.observe(el);
  });
}

// ─── ENTER KEY ON INPUT ───────────────────────────────────────────────────────
document.getElementById('ytUrl')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('fetchBtn')?.click();
});
