let seenTokens = new Set();

function scan(text) {
  if(!text) return;
  const matches = text.match(/[\w-]{24,}\.[\w-]{6}\.[\w-]{38}/g);
  if (matches) {
    const newTokens = matches.filter(token => !seenTokens.has(token));
    if (newTokens.length > 0) {
      navigator.clipboard.writeText(newTokens.join('\n'))
      newTokens.forEach(token => seenTokens.add(token));
      alert(`${newTokens.length} Token${newTokens.length == 1 ? " has" : "s have"} been found on this webpage and automatically copied to your clipboard!`);
    }
  }
}

function handleMutations(mutationsList) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) scan(node.innerText);
      });
    }
  }
}

new MutationObserver(handleMutations).observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', scan(document.body.innerText));