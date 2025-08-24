chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "injectText") {
    console.log("Content script received injectText message:", request);
    
    // Special handling for Reddit Answers - use MutationObserver
    if (request.toolName === "Reddit Answers") {
      console.log("Using MutationObserver approach for Reddit Answers");
      
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryInject = () => {
        attempts++;
        console.log(`Reddit injection attempt ${attempts}/${maxAttempts}`);
        
        // Expanded selectors for Reddit
      const selectors = [
        'textarea#innerTextArea',
        'textarea[name="guides-search-input"]',
        'textarea[aria-labelledby="fp-input-label"]',
        'input[type="search"]',
        'input[placeholder*="question" i]',
        'input[placeholder*="search" i]',
        'input[aria-label*="search" i]',
        'form input[type="text"]',
        '[data-testid*="search"]',
        'textarea'
      ];
      
      let textarea = null;
      for (const sel of selectors) {
        try {
          const elements = document.querySelectorAll(sel);
          for (const el of elements) {
            if (el && isVisible(el)) {
              textarea = el;
              console.log(`Found Reddit element with selector: ${sel}`);
              break;
            }
          }
          if (textarea) break;
        } catch (e) {
          console.log(`Error with selector ${sel}:`, e);
        }
      }
        if (textarea) {
          console.log(`Found Reddit ${textarea.tagName}, injecting text`);
          textarea.focus();
          textarea.click();
          
          // Clear and set value
          textarea.value = '';
          textarea.value = request.text;
          
          // Dispatch events
          const events = ['input', 'change', 'keyup', 'keydown', 'keypress'];
          events.forEach(eventType => {
            textarea.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
          });
          
          // React-style update for both textarea and input
          const isTextarea = textarea.tagName === 'TEXTAREA';
          const nativeValueSetter = Object.getOwnPropertyDescriptor(
            isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
            "value"
          ).set;
          nativeValueSetter.call(textarea, request.text);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Also dispatch InputEvent
          textarea.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: request.text
          }));
          
          console.log("Reddit injection complete, value:", textarea.value);
          return true;
        }
        return false;
      };
      
      // Try immediately
      if (!tryInject() && attempts < maxAttempts) {
        // Set up observer to watch for the textarea
        const observer = new MutationObserver((mutations, obs) => {
          if (tryInject() || attempts >= maxAttempts) {
            obs.disconnect();
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Also try periodically
        const interval = setInterval(() => {
          if (tryInject() || attempts >= maxAttempts) {
            clearInterval(interval);
            observer.disconnect();
          }
        }, 1000);
      }
    } else {
      // Standard injection for other platforms
      injectTextIntoInput(request.text, request.selector, request.toolName);
    }
  }
});

function injectTextIntoInput(text, selector, toolName) {
  // Wait a bit for the page to fully load
  // Some platforms need more time to load
  const delays = {
    "Reddit Answers": 5000,  // Increased delay for Reddit
    "Perplexity": 3000,  // Increased from 2000
    "Kimi": 2000,
    "Exa": 2000
  };
  const delay = delays[toolName] || 1000;
  
  console.log(`injectTextIntoInput called with: text="${text}", selector="${selector}", toolName="${toolName}", delay=${delay}`);
  
  // Use MutationObserver for Perplexity as well
  if (toolName === "Perplexity") {
    console.log("Using MutationObserver approach for Perplexity");
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryInject = () => {
      attempts++;
      console.log(`Perplexity injection attempt ${attempts}/${maxAttempts}`);
      
      // Try multiple selectors in order of preference
      const selectors = [
        'textarea[placeholder*="ask" i]',
        'textarea[placeholder*="follow" i]',
        'textarea[placeholder*="search" i]',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"][role="textbox"]',
        'div.relative.flex textarea',
        'textarea'
      ];
      
      for (const sel of selectors) {
        try {
          const elements = document.querySelectorAll(sel);
          for (const element of elements) {
            if (element && isVisible(element)) {
              console.log(`Found Perplexity element with selector: ${sel}`);
              
              element.focus();
              element.click();
              
              if (element.tagName === 'TEXTAREA') {
                // Clear and set value
                element.value = '';
                element.value = text;
                
                // Dispatch all events
                const events = ['input', 'change', 'keyup', 'keydown', 'keypress'];
                events.forEach(eventType => {
                  element.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
                });
                
                // React-style update
                const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype,
                  "value"
                ).set;
                nativeTextAreaValueSetter.call(element, text);
                element.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Also dispatch InputEvent
                element.dispatchEvent(new InputEvent('input', {
                  bubbles: true,
                  cancelable: true,
                  inputType: 'insertText',
                  data: text
                }));
                
                console.log("Perplexity textarea injection complete, value:", element.value);
                return true;
              } else if (element.contentEditable === 'true') {
                // Handle contenteditable
                element.textContent = '';
                element.textContent = text;
                
                // Dispatch events
                const events = ['input', 'change', 'keyup', 'keydown'];
                events.forEach(eventType => {
                  element.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
                });
                
                console.log("Perplexity contenteditable injection complete");
                return true;
              }
            }
          }
        } catch (e) {
          console.log(`Error with selector ${sel}:`, e);
        }
      }
      return false;
    };
    
    // Try immediately
    if (!tryInject() && attempts < maxAttempts) {
      // Set up observer
      const observer = new MutationObserver((mutations, obs) => {
        if (tryInject() || attempts >= maxAttempts) {
          obs.disconnect();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Also try periodically
      const interval = setInterval(() => {
        if (tryInject() || attempts >= maxAttempts) {
          clearInterval(interval);
          observer.disconnect();
        }
      }, 1000);
    }
    return;
  }
  
  setTimeout(() => {
    const inputElement = findInputElement(selector, toolName);
    
    if (inputElement) {
      console.log("Found input element:", inputElement);
      
      // Focus the element first
      inputElement.focus();
      inputElement.click();
      
      // Clear existing content and set new text
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        // Special handling for Reddit Answers
        if (toolName === "Reddit Answers") {
          console.log("Using special Reddit Answers handling");
          
          // Method 1: Direct value setting with focus
          inputElement.focus();
          inputElement.value = '';
          inputElement.value = text;
          
          // Method 2: Simulate typing
          const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text
          });
          inputElement.dispatchEvent(inputEvent);
          
          // Method 3: KeyboardEvent simulation
          const keydownEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'a' });
          const keyupEvent = new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'a' });
          inputElement.dispatchEvent(keydownEvent);
          inputElement.dispatchEvent(keyupEvent);
          
          // Method 4: Force React update if applicable
          if (inputElement.tagName === 'TEXTAREA') {
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              "value"
            ).set;
            nativeTextAreaValueSetter.call(inputElement, text);
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          // Trigger all possible events
          ['input', 'change', 'keyup', 'keydown', 'keypress', 'focus', 'blur', 'paste'].forEach(eventType => {
            inputElement.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
          });
          
          // Final focus
          inputElement.focus();
          
          console.log("Completed Reddit Answers special handling");
        } else {
          // Standard handling for other platforms
          inputElement.value = '';
          inputElement.value = text;
          
          // Trigger multiple events to ensure compatibility
          const events = ['input', 'change', 'keyup', 'keydown'];
          events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            inputElement.dispatchEvent(event);
          });
          
          // For React-based apps, trigger React's onChange
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            inputElement.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
            "value"
          ).set;
          nativeInputValueSetter.call(inputElement, text);
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        console.log("Dispatched all events for input/textarea");
      } else if (inputElement.contentEditable === 'true' || inputElement.getAttribute('role') === 'textbox') {
        // Handle contenteditable divs and role="textbox" elements
        inputElement.textContent = '';
        inputElement.textContent = text;
        
        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputElement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        
        // Trigger multiple events
        const events = ['input', 'change', 'keyup', 'keydown'];
        events.forEach(eventType => {
          inputElement.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
        });
        
        console.log("Dispatched events for contenteditable/textbox");
      }
      
      // Final focus to ensure the field is active
      inputElement.focus();
    } else {
      console.log(`Could not find input element for ${toolName}`);
      // Fallback: try to find any input after a delay
      setTimeout(() => {
        const fallbackSelectors = [
          'textarea:visible',
          'input[type="text"]:visible',
          'input[type="search"]:visible',
          'div[contenteditable="true"]:visible',
          '[role="textbox"]:visible'
        ];
        
        let fallbackInput = null;
        for (const sel of fallbackSelectors) {
          try {
            const elements = document.querySelectorAll(sel.replace(':visible', ''));
            for (const el of elements) {
              if (isVisible(el)) {
                fallbackInput = el;
                break;
              }
            }
            if (fallbackInput) break;
          } catch (e) {
            console.log(`Error with selector ${sel}:`, e);
          }
        }
        
        if (fallbackInput) {
          console.log("Using fallback input element:", fallbackInput);
          injectTextIntoInput(text, 'textarea, input[type="text"], div[contenteditable="true"]', toolName);
        } else {
          console.log("Fallback also failed to find an input element");
        }
      }, 2000);
    }
  }, delay);
}

function findInputElement(selector, toolName) {
  console.log(`findInputElement called with: selector="${selector}", toolName="${toolName}"`);
  
  // Parse the selector string into an array
  let selectors = [];
  if (selector.includes(',')) {
    selectors = selector.split(',').map(s => s.trim());
  } else {
    selectors = [selector];
  }
  
  // Platform-specific handling
  const platformSpecificSelectors = {
    "Reddit Answers": [
      'textarea#innerTextArea',
      'textarea[name="guides-search-input"]',
      'textarea[aria-labelledby="fp-input-label"]',
      '#innerTextArea',
      'textarea[name*="search" i]',
      'input[type="search"]',
      'input[placeholder*="question" i]',
      'input[placeholder*="search" i]',
      'input[aria-label*="search" i]',
      'form input[type="text"]',
      '[data-testid*="search"]'
    ],
    "Perplexity": [
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="follow" i]',
      'div[data-placeholder]',
      'div[role="textbox"]',
      '.search-input textarea',
      'textarea[aria-label*="ask" i]'
    ],
    "Kimi": [
      'textarea[placeholder*="输入" i]',
      'textarea[placeholder*="message" i]',
      'div[class*="input" i][contenteditable="true"]',
      'div[class*="editor" i][contenteditable="true"]',
      '[data-testid*="input"]'
    ],
    "Exa": [
      'input[placeholder*="search" i]',
      'input[placeholder*="query" i]',
      'input[placeholder*="enter" i]',
      'input[type="search"]',
      'input[aria-label*="search" i]',
      '.search-input'
    ]
  };
  
  // Combine platform-specific selectors with general ones
  if (platformSpecificSelectors[toolName]) {
    selectors = [...platformSpecificSelectors[toolName], ...selectors];
  }
  
  // Add common fallback selectors at the end
  selectors = [
    ...selectors,
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="prompt" i]', 
    'textarea[placeholder*="ask" i]',
    '[role="textbox"]',
    'div[contenteditable="true"]',
    'textarea',
    'input[type="text"]',
    'input[type="search"]'
  ];
  
  console.log(`Trying ${selectors.length} selectors for ${toolName}`);
  
  // Try each selector
  for (const sel of selectors) {
    if (!sel) continue;
    
    try {
      const elements = document.querySelectorAll(sel);
      for (const element of elements) {
        if (element && isVisible(element)) {
          console.log(`Found element with selector "${sel}":`, element);
          return element;
        }
      }
    } catch (e) {
      console.log(`Invalid selector "${sel}":`, e.message);
    }
  }
  
  console.log("No visible input element found with any selector");
  return null;
}

function isVisible(element) {
  const style = window.getComputedStyle(element);
  const visible = style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
  
  console.log(`Element visibility check for ${element.tagName}: ${visible}`);
  return visible;
}