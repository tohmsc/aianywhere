const AI_TOOLS = {
  chatgpt: {
    name: "ChatGPT",
    url: "https://chat.openai.com/",
    type: "input",
    selector: 'textarea[placeholder*="Message"], div[contenteditable="true"]'
  },
  claude: {
    name: "Claude",
    url: "https://claude.ai/new",
    type: "input",
    selector: 'div[contenteditable="true"], textarea'
  },
  deepseek: {
    name: "DeepSeek",
    url: "https://chat.deepseek.com/",
    type: "input",
    selector: 'textarea, div[contenteditable="true"], input[type="text"]'
  },
  ddg: {
    name: "DuckDuckGo Chat",
    url: "https://duckduckgo.com/?q=&ia=chat",
    type: "input",
    selector: 'textarea, input[type="text"], div[contenteditable="true"]'
  },
  exa: {
    name: "Exa",
    url: "https://websets.exa.ai/",
    type: "input",
    selector: 'input[placeholder*="search" i], input[placeholder*="query" i], input[placeholder*="enter" i], input[type="search"], textarea, div[contenteditable="true"], [role="textbox"]'
  },
  gemini: {
    name: "Gemini",
    url: "https://gemini.google.com/app",
    type: "input",
    selector: 'textarea, div[contenteditable="true"], input[type="text"]'
  },
  googleai: {
    name: "Google AI Studio",
    url: "https://aistudio.google.com/prompts/new_chat",
    type: "input",
    selector: 'textarea[placeholder*="Enter a prompt"], textarea[aria-label*="prompt"], div[contenteditable="true"]'
  },
  grok: {
    name: "Grok",
    url: "https://x.com/i/grok",
    type: "input",
    selector: 'textarea[placeholder*="Ask"], div[contenteditable="true"]'
  },
  kimi: {
    name: "Kimi",
    url: "https://kimi.moonshot.cn/",
    type: "input",
    selector: 'textarea[placeholder*="输入" i], textarea[placeholder*="message" i], textarea[placeholder*="ask" i], div[class*="input" i][contenteditable="true"], div[class*="editor" i][contenteditable="true"], textarea, div[contenteditable="true"], [role="textbox"]'
  },
  mistral: {
    name: "Mistral",
    url: "https://chat.mistral.ai/",
    type: "input",
    selector: 'textarea, div[contenteditable="true"]'
  },
  perplexity: {
    name: "Perplexity",
    url: "https://www.perplexity.ai/",
    type: "input",
    selector: 'textarea[placeholder*="ask" i], textarea[placeholder*="search" i], textarea[placeholder*="question" i], div[data-placeholder], div[role="textbox"], textarea, div[contenteditable="true"], [role="textbox"]'
  },
  phind: {
    name: "Phind",
    url: "https://www.phind.com/",
    type: "input",
    selector: 'textarea, input[type="text"], div[contenteditable="true"]'
  },
  qwen: {
    name: "Qwen",
    url: "https://chat.qwen.ai/",
    type: "input", 
    selector: 'textarea, input[type="text"], div[contenteditable="true"]'
  },
  reddit: {
    name: "Reddit Answers", 
    url: "https://www.reddit.com/answers",
    type: "input",
    selector: 'textarea#innerTextArea, textarea[name="guides-search-input"], textarea[aria-labelledby="fp-input-label"], input[placeholder*="question" i], input[placeholder*="search" i], input[type="search"], input[aria-label*="search" i], form input[type="text"], [data-testid*="search"], input[name="q"], input[type="text"], textarea, div[contenteditable="true"]'
  }
};

// Emoji mapping for each AI tool (alphabetical order)
const AI_EMOJIS = {
  chatgpt: "🟢",
  claude: "🟠",
  deepseek: "🌊",
  ddg: "🦆",
  exa: "🔎",
  gemini: "🔵",
  googleai: "🔵",
  grok: "⚫",
  kimi: "🟡",
  mistral: "🔺",
  perplexity: "🔍",
  phind: "🟪",
  qwen: "🟦",
  reddit: "🔴"
};

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items for each AI tool
  Object.entries(AI_TOOLS).forEach(([key, tool]) => {
    chrome.contextMenus.create({
      id: key,
      title: `${AI_EMOJIS[key]} Send to ${tool.name}`,
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  const tool = AI_TOOLS[info.menuItemId];
  
  if (!tool || !selectedText) return;
  
  if (tool.type === "url") {
    // For URL-based tools, append text to URL
    const searchUrl = tool.url + encodeURIComponent(selectedText);
    chrome.tabs.create({ url: searchUrl });
  } else {
    // For input-based tools, open tab and inject text
    chrome.tabs.create({ url: tool.url }, (newTab) => {
      // Wait for tab to load, then inject the text
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === newTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          
          // Send message to content script to handle text injection
          chrome.tabs.sendMessage(newTab.id, {
            action: "injectText",
            text: selectedText,
            selector: tool.selector,
            toolName: tool.name
          });
        }
      });
    });
  }
});