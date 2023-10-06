import { API_ENDPOINT } from '../../blocks/header/genai-search.js';


export default async function decorate(block) {
  const usp = new URLSearchParams(window.location.search);
  const articleId = usp.get('id') || '';

  const response = await fetch(`https://${API_ENDPOINT}/static/IFRS//${articleId}.html`);
  // Check if the response is successful (status code 200)
  if (response.ok) {
    const htmlString = await response.text();

    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    // Copy the body element's content to the block
    block.innerHTML = tempDiv.innerHTML;
  } else {
    console.error(`Failed to fetch HTML. Status code: ${response.status}`);
  }
}
