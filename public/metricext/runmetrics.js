class MetricAnalyzer {
    constructor() {
        this.promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    }

    async sendPromptToLLM(message) {
        //  const apiToken = 'cfbde57f-a4e6-4eb9-aea4-36d5fbbdad16';
        //  const sessionId = '8umxl4rdt32x';
        let apiToken = await chrome.storage.local.get('apiToken');
        apiToken = apiToken.apiToken || '';
        let sessionId = await chrome.storage.local.get('sessionId');
        sessionId = sessionId.sessionId || '';

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
        let promptQuery = await fetch('promptsmoderation.json');
        let defaultPrompts = await promptQuery.json();
        let prompts = defaultPrompts;
        let rawData = await chrome.storage.local.get('promptTemplateList');
        if (rawData.promptTemplateList && rawData.promptTemplateList.length > 0) {
            prompts = rawData.promptTemplateList;
        }
        return prompts;
    }
    async runAnalysisPrompts(text, url = "", promptToUse = null) {
      const runDate = new Date().toISOString();
      let running = await chrome.storage.local.get('running');
      if (running && running.running) {
          return;
      }
      await chrome.storage.local.set({
          lastSelection: text,
          lastResult: "",
          running: true,
      });
  
      let prompts = promptToUse ? [promptToUse] : await this.getPromptTemplateList();
  
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
      let history = await chrome.storage.local.get('history');
      history = history.history || [];
      let historyEntry = {
          text,
          results,
          runDate,
          url
      };
      history.unshift(historyEntry);
      history = history.slice(0, 10);
      await chrome.storage.local.set({
          lastResult: results,
          running: false,
          history,
      });
      return historyEntry;
  }

    getHTMLforPromptResult(result) {
      if (result.prompt.prompttype === 'text') {
          return `
          <div class="prompt_result text_result">
            <div class="prompt_header">
              <span class="prompt_id">${result.prompt.id}</span>
            </div>
            <div class="result_content">${result.result}</div>
          </div>
        `;
      } else if (result.prompt.prompttype === 'metric') {
          try {
              let json = JSON.parse(result.result);
              let metric = json.contentRating;
              return `
            <div class="prompt_result metric_result">
              <span class="prompt_id">${result.prompt.id}</span>
              <span class="metric_score">${metric}</span>
              <div class="metric_bar">
                <div class="metric_fill" style="width: ${metric * 10}%;"></div>
              </div>
            </div>
          `;
          } catch (error) {
              return `
            <div class="prompt_result error_result">
              <div class="prompt_header">
                <span class="prompt_id">${result.prompt.id}</span>
              </div>
              <pre class="result_content">${result.result}</pre>
            </div>
          `;
          }
      } else {
        let resultDisplay = '';
        try {
          resultDisplay = JSON.stringify(JSON.parse(result.result), null, 2);
        } catch (error) {
          resultDisplay = result.result;
        }
          return `
          <div class="prompt_result json_result">
            <div class="prompt_header">
              <span class="prompt_id">${result.prompt.id}</span>
            </div>
            <pre class="result_content">${resultDisplay}</pre>
          </div>
        `;
      }
  }
}


function getMetricAnalysis() {
    return new MetricAnalyzer();
}