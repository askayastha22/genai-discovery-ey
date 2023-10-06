const GENAI_SEARCH_TITLE = "Discover EY";
const GENAI_SEARCH_WARNING = `${GENAI_SEARCH_TITLE} is powered by experimental Generative AI, information quality may vary.`;
const API_ENDPOINT = "spire-dev.corp.ethos14-stage-va7.ethos.adobe.net";

const sampleQuestions = [
  "What is the primary purpose of IFRS?",
  "How is IFRS different from generally accepted accounting principles (GAAP)?",
  "How does the adoption of IFRS impact a company's financial statements?",
  "Can a company use IFRS for some financial statements and US GAAP for others?",
  "How does IFRS differ from other accounting standards, such as GAAP?",
  "Can you explain the concept of other comprehensive income (OCI) and how it is presented in the financial statements under IFRS?",
  "Can you describe the purpose of the IFRS conceptual framework?",
  "Can you explain the fundamental qualitative characteristics of financial information according to the IFRS conceptual framework?",
  "How does the IFRS conceptual framework address the conceptual overlap between different financial reporting standards?",
  "Can you explain the concept of materiality in the context of financial reporting?",
  "Can you describe the principle of substance over form in the context of financial reporting?",
  "Can you explain the going concern concept in the context of financial reporting?"
];

const capabilities = [
  "Uses semantic search to find relevant answers",
  "Utilizes trusted data sources to generate responses",
  "Declines irrelevant and inappropriate queries",
]

const limitations = [
  "Does not support keyword matching",
  "Does not support complex queries",
  "May occasionally generate incorrect information",
]

let isRequestInProgress = false;

function removeAllEventListeners(element) {
  const clone = element.cloneNode(true);
  element.parentNode.replaceChild(clone, element);
}

function showRegenerateButton(resultsBlock) {
  // Show regenerate button container and add a click event listener
  const regenerateButtonContainer = document.querySelector('.regenerate-button-container');
  regenerateButtonContainer.classList.add('show');
  let regenerateButton = regenerateButtonContainer.querySelector('.regenerate-button');
  removeAllEventListeners(regenerateButton);
  regenerateButton = regenerateButtonContainer.querySelector('.regenerate-button');
  regenerateButton.addEventListener('click', () => {
    regenerateButtonContainer.classList.remove('show');

    const searchBox = document.getElementById('search-box');
    resultsBlock.innerHTML = '';
    displaySearchResults(searchBox.value, resultsBlock);
  });
}

const fetchStreamingResults = async (index, query, resultsBlock) => {
  if (query === '') {
    return {
      result: 'Please enter a search query.'
    }
  } else {
    document.getElementById("clearButton").classList.add("show");
    document.getElementById("vertical-bar").classList.add("show");
  }

  // Adobe Internal Endpoint
  const socket = new WebSocket(`wss://${API_ENDPOINT}/api/query`);
  
  // BambooHR Endpoint
  // const socket = new WebSocket('wss://spire-bhr-temp-pub.ethos14-stage-va7.ethos.adobe.net/api/query');

  socket.addEventListener('open', function(event) {
    console.log('WebSocket connection established');

    const messageToSend = JSON.stringify({"query": query, "index": index});
    socket.send(messageToSend);
  });

  socket.addEventListener('message', function(event) {
    console.log('Message from server ', event);
    const message = JSON.parse(event.data);
    
    updateStreamingSearchCard(resultsBlock, message, socket);
  });

  socket.addEventListener('error', function(error) {
    console.error('WebSocket error:', error);
  });

  socket.addEventListener('close', function(event) {
    console.log('WebSocket connection closed');
  });

  // Show stop button container and add a click event listener
  const stopButtonContainer = document.querySelector('.stop-button-container');
  stopButtonContainer.classList.add('show');
  let stopButton = stopButtonContainer.querySelector('.stop-button');
  removeAllEventListeners(stopButton);
  stopButton = stopButtonContainer.querySelector('.stop-button');
  stopButton.addEventListener('click', () => {
    // Close the WebSocket connection
    socket.close();

    // Remove the cursor animation element
    const cursorAnimation = resultsBlock.querySelector('.cursor-animation');
    cursorAnimation.classList.add('hide');

    // Remove the loading message element
    const loadingMessage = resultsBlock.querySelector('.loading-message');
    if (loadingMessage) {
      resultsBlock.removeChild(loadingMessage);
    }

    // Remove the stop button container
    stopButtonContainer.classList.remove('show');

    const summaryContainer = resultsBlock.querySelector('.summary-columns');
    if (!summaryContainer) {
      showRegenerateButton(resultsBlock);
    }
  });
};

// Randomly select three questions from an array
const getRandomQuestions = (questions) => {
  const randomQuestions = [];
  while (randomQuestions.length < 3) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestion = questions[randomIndex];
    if (!randomQuestions.includes(randomQuestion)) {
      randomQuestions.push(randomQuestion);
    }
  }
  return randomQuestions;
}

const decorateSearch = () => {
  // Create the <main> element
  const mainElement = document.createElement('div');
  mainElement.setAttribute('id', 'search-main');

  // Create the outer <div> element with class and data attributes
  const outerDivElement = document.createElement('div');
  outerDivElement.setAttribute('class', 'section genai-search-container');
  outerDivElement.setAttribute('data-section-status', 'loaded');

  // Create the inner <div> element with class attribute
  const innerDivElement = document.createElement('div');
  innerDivElement.setAttribute('class', 'default-content-wrapper');

  // Create the <h1> element with id attribute and text content
  const h1Element = document.createElement('h1');
  h1Element.setAttribute('id', 'search');
  const h1Text = document.createTextNode("Discover");
  h1Element.appendChild(h1Text);

  // const xhrLogo = new XMLHttpRequest();
  // xhrLogo.open('GET', `${window.hlx.codeBasePath}/icons/logo.svg`, true);
  // xhrLogo.onreadystatechange = function () {
  //   if (xhrLogo.readyState === 4 && xhrLogo.status === 200) {
  //     // On successful response, create and append the SVG element
  //     const svgElement = document.createElement('svg');
  //     svgElement.className = 'icon-logo';
  //     svgElement.innerHTML = xhrLogo.responseText;
  //     h1Element.insertAdjacentHTML('afterend', svgElement.outerHTML);
  //   }
  // };
  // xhrLogo.send();

  // Append the <h1> element to the inner <div> element
  // innerDivElement.appendChild(h1Element);

  // Create the second inner <div> element with class attribute
  const secondInnerDivElement = document.createElement('div');
  secondInnerDivElement.setAttribute('class', 'search-wrapper');

  // Create the search block <div> element with data attributes
  const searchDivElement = document.createElement('div');
  searchDivElement.setAttribute('class', 'search block');
  searchDivElement.setAttribute('data-block-name', 'search');
  searchDivElement.setAttribute('data-block-status', 'loaded');

  // Create the search box <div> element
  const searchBoxDivElement = document.createElement('div');
  searchBoxDivElement.setAttribute('class', 'search-box-container');

  // Create the search input <input> element with id and placeholder attributes
  const searchInput = document.createElement('input');
  searchInput.setAttribute('id', 'search-box');
  searchInput.setAttribute('type', 'text');
  searchInput.setAttribute('placeholder', 'Ask a question...');

  // Create clear button <button> element with id and image element
  const clearButton = document.createElement('button');
  clearButton.setAttribute('id', 'clearButton');
  clearButton.setAttribute('type', 'button');
  clearButton.innerHTML = '&#10005;';

  const verticalBar = document.createElement('span');
  verticalBar.setAttribute('id', 'vertical-bar');
  verticalBar.setAttribute('class', 'vertical-bar');

  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim() !== "") {
      clearButton.classList.add("show");
      verticalBar.classList.add("show");
    } else {
      clearButton.classList.remove("show");
      verticalBar.classList.remove("show");
    }
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim() !== "") {
      clearButton.classList.add("show");
      verticalBar.classList.add("show");
    }
  });

  clearButton.addEventListener("click", () => {
    searchInput.value = '';
    searchInput.focus();
    clearButton.classList.remove("show");
    verticalBar.classList.remove("show");
  });

  // Create the search button <button> element with id and image element
  const searchButton = document.createElement('button');
  searchButton.setAttribute('id', 'search-button');
  searchButton.setAttribute('type', 'button');
  // const imageElement = document.createElement('img');
  // imageElement.src = `${window.hlx.codeBasePath}/icons/search.svg`;
  // imageElement.alt = 'Search';
  // imageElement.className = 'icon-search';
  // Create an AJAX request to fetch the SVG file
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${window.hlx.codeBasePath}/icons/send.svg`, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // On successful response, create and append the SVG element
      const svgElement = document.createElement('svg');
      svgElement.className = 'icon-search';
      svgElement.innerHTML = xhr.responseText;
      searchButton.appendChild(svgElement);
    }
  };
  xhr.send();
  // searchButton.appendChild(imageElement);

  // Append the search input <input> element to the search box <div> element
  searchBoxDivElement.appendChild(searchInput);
  searchBoxDivElement.appendChild(clearButton);
  searchBoxDivElement.appendChild(verticalBar);
  searchBoxDivElement.appendChild(searchButton);

  // Append the search box <div> element to the search block <div> element
  searchDivElement.appendChild(searchBoxDivElement);

  // Create the stop generating button <button> element
  const stopButtonContainer = document.createElement('div');
  stopButtonContainer.className = 'stop-button-container';
  const stopButton = document.createElement('button');
  stopButton.className = 'stop-button';
  stopButton.textContent = 'Stop generating';
  const xhr1 = new XMLHttpRequest();
  xhr1.open('GET', `${window.hlx.codeBasePath}/icons/stop.svg`, true);
  xhr1.onreadystatechange = function () {
    if (xhr1.readyState === 4 && xhr1.status === 200) {
      // On successful response, create and append the SVG element
      const svgElement = document.createElement('svg');
      svgElement.innerHTML = xhr1.responseText;
      const firstChild = stopButton.firstChild;
      stopButton.insertBefore(svgElement, firstChild);
    }
  };
  xhr1.send();
  stopButtonContainer.appendChild(stopButton);

  // Create the regenerate response button <button> element
  const regenerateButtonContainer = document.createElement('div');
  regenerateButtonContainer.className = 'regenerate-button-container';
  const regenerateButton = document.createElement('button');
  regenerateButton.className = 'regenerate-button';
  regenerateButton.textContent = 'Regenerate response';
  const xhr2 = new XMLHttpRequest();
  xhr2.open('GET', `${window.hlx.codeBasePath}/icons/regenerate.svg`, true);
  xhr2.onreadystatechange = function () {
    if (xhr2.readyState === 4 && xhr2.status === 200) {
      // On successful response, create and append the SVG element
      const svgElement = document.createElement('svg');
      svgElement.innerHTML = xhr2.responseText;
      const firstChild = regenerateButton.firstChild;
      regenerateButton.insertBefore(svgElement, firstChild);
    }
  };
  xhr2.send();
  regenerateButtonContainer.appendChild(regenerateButton);

  // Append the stop generating button <button> element to the search block <div> element
  searchDivElement.appendChild(stopButtonContainer);
  searchDivElement.appendChild(regenerateButtonContainer);

  // Create the search results <div> element with am-region attribute
  const searchResultsDivElement = document.createElement('div');
  searchResultsDivElement.setAttribute('class', 'search-results');
  searchResultsDivElement.setAttribute('am-region', 'Search');

  // Append the search results <div> element to the search block <div> element
  searchDivElement.appendChild(searchResultsDivElement);

  // Append the inner <div> elements and search block <div> element to the outer <div> element
  outerDivElement.appendChild(innerDivElement);
  outerDivElement.appendChild(secondInnerDivElement);
  secondInnerDivElement.appendChild(searchDivElement);

  // Append the outer <div> element to the <main> element
  mainElement.appendChild(outerDivElement);

  // Append the <main> element to the body of the document
  document.body.appendChild(mainElement);

  return mainElement;
}

const createStreamingSearchCard = (resultsBlock) => {
  const card = document.createElement('div');
  card.className = 'search-card';
  card.classList.add('response-animation');
  card.innerHTML = `<div class="search-card-container"><div class="search-card-warning"><img src="${window.hlx.codeBasePath}/icons/ai_generate.svg"><p>${GENAI_SEARCH_WARNING}</p></div><article></article></div>`;

  resultsBlock.innerHTML = card.outerHTML;
}

const updateStreamingSearchCard = (resultsBlock, response, socket) => {  
  const article = resultsBlock.querySelector('.search-card article');

  // Create the div if it doesn't exist
  if (!article && response.type === 'streaming') {
    console.log('Creating new search card');
    createStreamingSearchCard(resultsBlock);

    // Get search-card-container elements
    const cardContainer = resultsBlock.querySelector('.search-card');

    // Trigger the animation by adding the 'show' class
    cardContainer.classList.add('show');

    // Create the cursor animation element
    const cursorAnimation = document.createElement('span');
    cursorAnimation.className = 'cursor-animation';
    resultsBlock.querySelector('.search-card-container').appendChild(cursorAnimation);
  }

  // If the div already exists, update its content with the new message
  // resultsBlock.querySelector('.search-card article').innerHTML = marked.parse(response.result);
  if (article) {
    article.innerHTML = marked.parse(response.result);
  }

  // Add target="_blank" to all anchor tags
  const card = resultsBlock.querySelector('.search-card');
  const anchorTags = card?.querySelectorAll('a');

  anchorTags?.forEach((anchorTag) => {
    // Replace the url in the href attribute
    const url = anchorTag.getAttribute('href');
    anchorTag.setAttribute('href', `/articles?id=${url.replace('.xml', '')}`);
    anchorTag.setAttribute('target', '_blank');
  });

  // Loop through result.questions and create a button for each
  if (response.type === 'end') {
    // Remove the cursor animation element
    const cursorAnimation = resultsBlock.querySelector('.cursor-animation');
    cursorAnimation.classList.add('hide');

    if (response.questions?.length > 0) {
      // Add the divider and further questions heading
      const divider = document.createElement('div');
      divider.className = 'divider';
      const h4 = document.createElement('h4');
      h4.textContent = 'Further Questions';
      card.appendChild(divider);
      card.appendChild(h4);
    }

    const paragraph = document.createElement('p');
    paragraph.className = 'search-card-buttons';
    response.questions?.forEach((question) => {
      const button = document.createElement('button');
      button.className = 'search-card-button';
      button.textContent = question;
      paragraph.appendChild(button);
    });

    card.appendChild(paragraph);
    resultsBlock.appendChild(createLinksCard(response));

    // Remove the stop button container
    const stopButtonContainer = document.querySelector('.stop-button-container');
    stopButtonContainer.classList.remove('show');
    showRegenerateButton(resultsBlock);

    // Masonry layout
    const masonry = new Masonry(".links-card-container ul", {
      itemSelector: ".links-card-container ul li",
      columnWidth: ".links-card-container ul li", // Set to a specific selector or number if needed
      gutter: 50, // Adjust the gap between items
      horizontalOrder: true, // Preserve the left-to-right order of items
      fitWidth: true
    });

    imagesLoaded('.links-card-container', () => {
      masonry.layout();
    });
  }
}

const createSearchCard = (results) => {
  const card = document.createElement('div');
  card.className = 'search-card';
  card.innerHTML = `<div class="search-card-container"><article>${marked.parse(results.result)}</article></div><div class="divider"></div><h4>Further Questions</h4>`;

  // Add target="_blank" to all anchor tags
  const anchorTags = card.querySelectorAll('a');

  anchorTags.forEach((anchorTag) => {
    anchorTag.setAttribute('target', '_blank');
  });

  // Loop through result.questions and create a button for each
  const paragraph = document.createElement('p');
  paragraph.className = 'search-card-buttons';
  results.questions?.forEach((question) => {
    const button = document.createElement('button');
    button.className = 'search-card-button';
    button.textContent = question;
    paragraph.appendChild(button);
  });
  card.appendChild(paragraph);

  return card.outerHTML;
}

const createLinksCard = (results) => {
  const linksContainer = document.createElement("div");
  linksContainer.className = "links-card-container";
  linksContainer.classList.add('response-animation');

  // Trigger the animation by adding the 'show' class
  linksContainer.classList.add('show');
  const list = document.createElement("ul");

  results.links?.forEach((link) => {
    const listItem = document.createElement("li");

    if (link.thumbnail !== '') {
      const thumbnailElement = document.createElement('img');
      thumbnailElement.src = link.thumbnail;
      thumbnailElement.alt = link.name;
      listItem.appendChild(thumbnailElement);
    }

    const linkInfoElement = document.createElement('div');
    linkInfoElement.className = 'link-info';

    linkInfoElement.innerHTML = `<a href="/articles?id=${link.url.replace('.xml', '')}" target="_blank">${link.name}</a>`;
    
    listItem.appendChild(linkInfoElement);
    listItem.addEventListener('click', () => {
      window.open(`/articles?id=${link.url.replace('.xml', '')}`, '_blank');
    });
    list.appendChild(listItem);
  })

  linksContainer.appendChild(list);

  return linksContainer;
}

const createSummaryColumn = (icon, title, list, type) => {
  const summaryColumnDiv = document.createElement("div");
  summaryColumnDiv.className = "summary-column";

  const titleElement = document.createElement("h5");
  titleElement.textContent = title;

  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${window.hlx.codeBasePath}/icons/${icon}.svg`, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // On successful response, create and append the SVG element
      const svgElement = document.createElement('svg');
      svgElement.className = 'icon-search';
      svgElement.innerHTML = xhr.responseText;

      const firstChild = titleElement.firstChild;
      titleElement.insertBefore(svgElement, firstChild);
    }
  };
  xhr.send();

  const items = document.createElement("ul");
  items.className = "summary-items";

  list.forEach((text) => {
    const item = document.createElement("li");
    item.className = 'summary-item';
    item.textContent = text;
    if (type === "button") {
      item.classList.add('hand-cursor');
      item.addEventListener('click', () => {
        if (isRequestInProgress === false) {
          const searchBox = document.getElementById('search-box');
          searchBox.value = text;
          displaySearchResults(text, document.querySelector('.search-results'));
        }
        
      })
    }
    items.appendChild(item);
  })

  summaryColumnDiv.appendChild(titleElement);
  summaryColumnDiv.appendChild(items);

  return summaryColumnDiv;
}

const createSearchSummary = () => {
  const summaryColumns = document.createElement("div");
  summaryColumns.className = "summary-columns";

  const summaryColumn1 = createSummaryColumn("examples", "Examples", getRandomQuestions(sampleQuestions), "button");
  const summaryColumn2 = createSummaryColumn("capabilities", "Capabilities", capabilities, "list");
  const summaryColumn3 = createSummaryColumn("limitations", "Limitations", limitations, "list");

  summaryColumns.appendChild(summaryColumn1);
  summaryColumns.appendChild(summaryColumn2);
  summaryColumns.appendChild(summaryColumn3);

  return summaryColumns;
}

const fetchResults = async (index, query) => {
  if (query === '') {
    return {
      result: 'Please enter a search query.'
    }
  } else {
    document.getElementById("clearButton").classList.add("show");
    document.getElementById("vertical-bar").classList.add("show");
  }

  const apiURLBase = "https://spire-dev.corp.ethos14-stage-va7.ethos.adobe.net"; // Internal Endpoint
  // const apiURLBase = "https://spire-pp-temp-pub.ethos14-stage-va7.ethos.adobe.net"; // External Endpoint
  const apiURL = apiURLBase + `/api/index/${index}/search`;
  const answer = await fetch(`${apiURL}?q=${query}`).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Sorry, something went wrong. Please try again later.');
    }
  }).catch((error) => {
    console.log(error);
    return {
      result: 'Sorry, something went wrong. Please try again later.'
    }
  });

  return answer;
};

async function displaySearchResults(query, resultsBlock) {
  if (isRequestInProgress) {
    // A request is already in progress, so do not proceed.
    return;
  }
  isRequestInProgress = true;

  // Create the loading message element
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'loading-message';
  loadingMessage.textContent = 'Gathering sources...';

  // Create the cursor animation element
  const cursorAnimation = document.createElement('span');
  cursorAnimation.className = 'cursor-animation';
  loadingMessage.appendChild(cursorAnimation);
  // resultsBlock.appendChild(loadingMessage);
  const firstChild = resultsBlock.firstChild;
  resultsBlock.insertBefore(loadingMessage, firstChild);

  const results = await fetchStreamingResults('ey', query, resultsBlock);
  isRequestInProgress = false;
  
  // Assuming the response has a `result` property
  if (results && results.result) {
    // console.log(results.result);
    resultsBlock.innerHTML = createSearchCard(results);
    // resultsBlock.innerHTML += createLinksCard(results);
  } else {
    console.log('Invalid response format'); // Handle the case where the response does not have the expected structure
  }

  // Get search-card-container elements
  const cardContainer = resultsBlock.querySelector('.search-card');
  cardContainer?.classList.add('response-animation');

  // Trigger the animation by adding the 'show' class after a small delay
  cardContainer?.classList.add('show');
  // setTimeout(() => {
  //   cardContainer.classList.add('show');
  // }, 100);
}

export { decorateSearch, createSearchSummary, displaySearchResults, isRequestInProgress, GENAI_SEARCH_TITLE, API_ENDPOINT };