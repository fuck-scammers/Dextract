let seenTokens = new Set();

async function scan(text) {
  if(window.location.hostname == 'github.com') return;
  await new Promise(resolve => setTimeout(resolve, 100));
  if(!text) return;
  const matches = text.match(/[\w-]{24,}\.[\w-]{6}\.[\w-]{38}/g);
  if (matches) {
    const newTokens = matches.filter(token => !seenTokens.has(token));
    if (newTokens.length > 0) {
      navigator.clipboard.writeText(newTokens.join('\n'))
      newTokens.forEach(token => seenTokens.add(token));
      try{
      if(newTokens.length == 1){
        [type, response, username] = await validate(newTokens[0])
        if(type == "USER" || type == "BOT"){
          alert("1 Valid token has been extracted from this page!");
          return;
        }
      }
    }catch(error){/* Oh no! */}
      alert(`${newTokens.length} Token${newTokens.length == 1 ? " has" : "s have"} been found on this webpage and automatically copied to your clipboard!`);
    }}
  const webhooks = text.match(/https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+/g)
  if(webhooks){
    const newHooks = webhooks.filter(webhook => !seenTokens.has(webhook));
    if(newHooks.length > 0){
      navigator.clipboard.writeText(newHooks.join('\n'))
      newHooks.forEach(webhook => seenTokens.add(webhook))
      try{
        if(newHooks.length == 1){
          response = await fetch(newHooks[0])
          if(response.status != 404 && response.status != 429){
            alert("1 Valid webhook has been extracted from this page!");
            return;
          }
        }
      }catch(error){/* Oh no! */}
      alert(`${newHooks.length} Webhook${newHooks.length == 1 ? " has" : "s have"} been found on this webpage and automatically copied to your clipboard!`)
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


async function validate(token) {
  token = token.trim();
  try {
      let response = await fetch('https://discord.com/api/users/@me', {headers: {'Authorization': 'Bot ' + token.replace(/\n/g, '').replace(/‏/g, '')}});
      if(response.status == 429) return ["RATELIMIT", "429", null];
      if (response.status !== 401) {
          return ["BOT", response.status.toString(), (await response.json()).username];
      } else {
          response = await fetch('https://discord.com/api/users/@me', {headers: {'Authorization': token.replace(/\n/g, '').replace(/‏/g, '')}});
          if (response.status !== 401) {
              return ["USER", response.status.toString(), (await response.json()).username];
          } else {
              return ["INVALID", response.status.toString(), null];
          }
      }
  } catch (error) {
      return ["ERROR", error.toString(), null];
  }
}
