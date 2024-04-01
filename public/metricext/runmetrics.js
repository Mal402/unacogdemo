class MetricAnalyzer {
    constructor() {
        this.promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    }

    async sendPromptToLLM(message) {
        const apiToken = 'cfbde57f-a4e6-4eb9-aea4-36d5fbbdad16';
        const sessionId = '8umxl4rdt32x';
        const body = {
            message,
            apiToken,
            sessionId,
            disableEmbedding: true,
        };
        const fetchResults = await fetch(this.promptUrl, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const promptResult = await fetchResults.json();
        if (!promptResult.success) {
            console.log("error", promptResult);
            return promptResult.errorMessage;
        } else {
            console.log(promptResult);
        }
        if (promptResult.assist.error) {
            return promptResult.assist.error.message;
        } else if (promptResult.assist.assist.error) {
            return promptResult.assist.assist.error.message;
        } else {
            return promptResult.assist.assist.choices["0"].message.content;
        }
    }

    async sendPromptForMetric(promptTemplate, query) {
        try {
            let result = Mustache.render(promptTemplate, { query });
            return result;
        } catch (error) {
            console.log(promptTemplate, query, error);
            return `{
        "contentRating": -1
      }`;
        }
    }
    async getPromptTemplateList() {
        let promptQuery = await fetch('defaultprompts.json');
        let defaultPrompts = await promptQuery.json();
        let prompts = defaultPrompts;
        let rawData = await chrome.storage.local.get('promptTemplateList');
        if (rawData.promptTemplateList && rawData.promptTemplateList.length > 0) {
            prompts = rawData.promptTemplateList;
        }
        return prompts;
    }
    async runAnalysisPrompts(text) {
        await chrome.storage.local.set({
            lastSelection: text,
            lastResult: "",
            running: true,
        });
        let prompts = await this.getPromptTemplateList();
        const runPrompt = async (prompt, text) => {
            let fullPrompt = await this.sendPromptForMetric(prompt.prompt, text);
            let result = await this.sendPromptToLLM(fullPrompt);
            return {
                prompt,
                result,
            };
        };
        let promises = [];
        for (let prompt of prompts) {
            promises.push(runPrompt(prompt, text));
        }
        let results = await Promise.all(promises);
        await chrome.storage.local.set({
            lastResult: results,
            running: false,
        });
        return results;
    }
}

function getMetricAnalysis() {
    return new MetricAnalyzer();
}