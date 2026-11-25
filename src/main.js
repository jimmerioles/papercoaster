import './style.css';

const appRoot = document.querySelector('#app');
const uiRoot = document.querySelector('#ui');
const caseStudyRoot = document.querySelector('#case-study');

let appReady = false;
let caseStudyReady = false;

function isCaseStudyRoute() {
  return window.location.hash.replace(/\/+$/, '') === '#/case-study';
}

async function showCaseStudy() {
  document.documentElement.classList.add('case-study-route');
  appRoot.hidden = true;
  uiRoot.hidden = true;
  caseStudyRoot.hidden = false;

  window.dispatchEvent(new CustomEvent('papercoaster:route', { detail: 'case-study' }));

  if (!caseStudyReady) {
    const { mountCaseStudy } = await import('./case-study.js');
    mountCaseStudy(caseStudyRoot);
    caseStudyReady = true;
  }

  document.title = 'Papercoaster case study · Draw the line. Feel the drop.';
  window.scrollTo({ top: 0, left: 0 });
  document.body.scrollLeft = 0;
  document.documentElement.scrollLeft = 0;

  requestAnimationFrame(() => {
    caseStudyRoot.querySelector('#case-study-main')?.focus({ preventScroll: true });
  });
}

async function showApp({ focusCaseStudyLink = false } = {}) {
  document.documentElement.classList.remove('case-study-route');
  appRoot.hidden = false;
  uiRoot.hidden = false;
  caseStudyRoot.hidden = true;
  document.title = 'Papercoaster';

  if (!appReady) {
    await import('./app.js');
    appReady = true;
  }

  window.dispatchEvent(new CustomEvent('papercoaster:route', { detail: 'app' }));

  if (focusCaseStudyLink) {
    requestAnimationFrame(() => {
      const link = [...document.querySelectorAll('[data-case-study-link]')].find(
        (candidate) => !candidate.closest('.screen')?.classList.contains('hidden'),
      );
      link?.focus({ preventScroll: true });
    });
  }
}

async function applyRoute({ focusCaseStudyLink = false } = {}) {
  if (isCaseStudyRoute()) {
    await showCaseStudy();
  } else {
    await showApp({ focusCaseStudyLink });
  }
}

window.addEventListener('hashchange', () => {
  applyRoute({ focusCaseStudyLink: true });
});

await applyRoute();
