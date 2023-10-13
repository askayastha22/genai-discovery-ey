import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';
import { decorateSearch, createSearchSummary, displaySearchResults, isRequestInProgress, GENAI_SEARCH_TITLE } from './genai-search.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const loadScript = (url, callback, type, section, defer) => {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (type) {
    script.setAttribute('type', type);
  }
  if (defer && script.src) {
    script.defer = defer;
  }
  if (section) section.append(script);
  else head.append(script);
  script.onload = callback;
  return script;
};
loadScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js", () => {
  console.log("Marked.js loaded");
});
loadScript("https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js", () => {
  console.log("Masonry.js loaded");
});
loadScript("https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js", () => {
  console.log("ImagesLoaded.js loaded");
});

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // fetch nav content
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'tools'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    const navBrand = nav.querySelector('.nav-brand');
    navBrand.innerHTML = '<a href="/"></a>';
    const navBrandLink = navBrand.querySelector('a');

    const xhrLogo = new XMLHttpRequest();
    xhrLogo.open('GET', `${window.hlx.codeBasePath}/icons/ey_logo.svg`, true);
    xhrLogo.onreadystatechange = function () {
      if (xhrLogo.readyState === 4 && xhrLogo.status === 200) {
        // On successful response, create and append the SVG element
        const svgElement = document.createElement('svg');
        svgElement.className = 'icon-logo';
        svgElement.innerHTML = xhrLogo.responseText;
        navBrandLink.append(svgElement);
      }
    };
    xhrLogo.send();

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

    decorateIcons(nav);
    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.append(navWrapper);

    // Function to toggle the modal
    function toggleModal(navButton) {
      const modal = document.getElementById('header-search-modal');
      if (modal.style.display === "block") {
        // Hide modal
        modal.classList.remove('visible');
        modal.removeAttribute('style');
        document.body.style.overflowY = '';

        // Clear search results
        document.getElementById('clearButton').classList.remove("show");
        document.getElementById('vertical-bar').classList.remove("show");

        navButton.classList.remove('active');
      } else {
        modal.classList.add('visible');
        modal.style.display = "block";
        document.body.style.overflowY = 'hidden';

        const searchBox = document.getElementById('search-box');
        const stopButtonContainer = document.querySelector('.stop-button-container');
        const regenerateButtonContainer = document.querySelector('.regenerate-button-container');
        const resultsBlock = block.querySelector('.search-results');
        
        searchBox.value = '';
        searchBox.focus();
        stopButtonContainer.classList.remove('show');
        regenerateButtonContainer.classList.remove('show');
        resultsBlock.innerHTML = '';
        resultsBlock.appendChild(createSearchSummary());

        navButton.classList.add('active');
      }
    }

    // decorate search
    const createGenAISearch = () => {
      const elem = document.getElementById('header-search-modal');
      
      if (!elem) {
        const modal = document.createElement('div');
        modal.className = 'header-search-modal';
        modal.id = 'header-search-modal';
        modal.append(decorateSearch());
        block.append(modal);

        const searchBox = document.getElementById('search-box');
        const searchBoxContainer = document.querySelector('.search-box-container');
        const resultsBlock = block.querySelector('.search-results');
        
        searchBox.addEventListener('keypress', (event) => {
          if (event.key === 'Enter') {
            searchBox.blur();

            const summaryContainer = resultsBlock.querySelector('.summary-columns');
            if (!summaryContainer) {
              resultsBlock.innerHTML = '';
              const regenerateButtonContainer = document.querySelector('.regenerate-button-container');
              regenerateButtonContainer.classList.remove('show');
            }

            displaySearchResults(searchBox.value, resultsBlock);
          }
        });

        searchBox.addEventListener('focus', () => {
          searchBoxContainer.classList.add('focused');
        });

        searchBox.addEventListener('blur', () => {
          searchBoxContainer.classList.remove('focused');
        });

        const searchButton = document.getElementById('search-button');
        searchButton.addEventListener('click', () => {
          const summaryContainer = resultsBlock.querySelector('.summary-columns');
          if (!summaryContainer) {
            resultsBlock.innerHTML = '';
            const regenerateButtonContainer = document.querySelector('.regenerate-button-container');
            regenerateButtonContainer.classList.remove('show');
          }
          displaySearchResults(searchBox.value, resultsBlock);
        });

        resultsBlock.addEventListener('click', (event) => {
          if (event.target.matches('.search-card-button') && isRequestInProgress === false) {
            console.log("Further questions clicked!");
            block.querySelector('.genai-search-container').scrollIntoView({ behavior: 'smooth' });
            searchBox.value = event.target.innerText;
            resultsBlock.innerHTML = '';
            const regenerateButtonContainer = document.querySelector('.regenerate-button-container');
            regenerateButtonContainer.classList.remove('show');
            displaySearchResults(event.target.innerText, resultsBlock);
          }
        });
      }
    };
  
    block.append(createGenAISearch());
    
    // click listener for search
    const discoverEY = nav.querySelector('header nav .nav-tools p:first-child');
    if (discoverEY) {
      discoverEY.addEventListener('click', () => {
        toggleModal(discoverEY);
      });
    }
  }
}
