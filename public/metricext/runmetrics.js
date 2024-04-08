class MetricAnalyzer {
  constructor() {
    this.promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
  }
  async sendPromptToLLM(message) {
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
  async getDefaultAnalysisSets() {
    const defaultPromptList = [
      "Moderation",
      "Message",
      "Summary",
    ];
    const promises = [];
    defaultPromptList.forEach((url) => {
      promises.push((async (url) => {
        let promptQuery = await fetch("defaults/" + url + ".json");
        let defaultPrompts = await promptQuery.json();
        return defaultPrompts;
      })(url));
    });
    const defaultPrompts = await Promise.all(promises);
    const setMap = {};
    defaultPromptList.forEach((url, index) => {
      setMap[url] = defaultPrompts[index];
    });
    return setMap;
  }
  async getAnalysisSets() {
    let sets = await this.getDefaultAnalysisSets();
    let rawData = await chrome.storage.local.get('analysisSets');
    if (rawData && rawData.analysisSets && Object.keys(rawData.analysisSets).length > 0) {
      sets = rawData.analysisSets;
    }
    return sets;
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

    let prompts = [];
    let analysisSets = await this.getAnalysisSets();
    let selectedAnalysisSets = await chrome.storage.local.get("selectedAnalysisSets");
    if (promptToUse) {
      prompts = [promptToUse];
    } else if (selectedAnalysisSets && selectedAnalysisSets.selectedAnalysisSets) {
      selectedAnalysisSets = selectedAnalysisSets.selectedAnalysisSets;
      for (let set of selectedAnalysisSets) {
        if (analysisSets[set]) {
          prompts = prompts.concat(analysisSets[set]);
        }
      }
    } else {
      prompts = analysisSets["Summary"];
    }

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
  async getMetricPromptForDescription(description) {
    const newPromptAgent = `Please help form a new set guidelines for scoring content. 
    I would like one based on the following description: ${description}
    
    Here is an example of guidelines for scoring content based on political content:
    Rate the following content 0-100, regarding its political content. 
    Guideline for political metrics: Assess political content by evaluating
    the depth of political commentary, the range of political perspectives presented, and the degree of bias or impartiality. Consider the relevance of political themes to current events, historical context, and societal impact. Examine the effectiveness of conveying political messages, the use of persuasive language or rhetoric,
    and the potential for inciting debate or controversy. Take into account the diversity of political ideologies and the potential for engaging audiences
    with different political beliefs.`;

    let newPromptContent = await this.sendPromptToLLM(newPromptAgent);
    newPromptContent += `/n 
    Please respond with json and only json in this format:
    {
      "contentRating": 0
    }
    /n
    Here is the content to analyze:
    {{query}}`;
    return newPromptContent;
  }
}


function getMetricAnalysis() {
  return new MetricAnalyzer();
}