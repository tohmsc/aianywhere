chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "injectText") {
    injectTextIntoInput(request.text, request.selector, request.toolName);
  }
});

function injectTextIntoInput(text, selector, toolName) {
  // Wait a bit for the page to fully load
  setTimeout(() => {
    const inputElement = findInputElement(selector);
    
    if (inputElement) {
      // Clear existing content and set new text
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        inputElement.value = text;
        inputElement.focus();
        
        // Trigger input events
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        
      } else if (inputElement.contentEditable === 'true') {
        // Handle contenteditable divs
        inputElement.textContent = text;
        inputElement.focus();
        
        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputElement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        
        // Trigger input events
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      console.log(`Could not find input element for ${toolName}`);
      // Fallback: try to find any input after a delay
      setTimeout(() => {
        const fallbackInput = document.querySelector('textarea, input[type="text"], div[contenteditable="true"]');
        if (fallbackInput) {
          injectTextIntoInput(text, 'textarea, input[type="text"], div[contenteditable="true"]', toolName);
        }
      }, 2000);
    }
  }, 1000);
}

function findInputElement(selector) {
  // Try multiple selectors in order of preference
  const selectors = [
    selector,
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="prompt" i]', 
    'textarea[placeholder*="ask" i]',
    'div[contenteditable="true"]',
    'textarea',
    'input[type="text"]'
  ];
  
  for (const sel of selectors) {
    const element = document.querySelector(sel);
    if (element && isVisible(element)) {
      return element;
    }
  }
  
  return null;
}

function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
}