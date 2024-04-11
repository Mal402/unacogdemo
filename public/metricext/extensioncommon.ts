import Mustache from 'mustache';
import SlimSelect from 'slim-select';

export class AnalyzerExtensionCommon {
  promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
  chrome: any;
  query_source_text: any;
  query_source_text_length: any;
  query_source_tokens_length: any;
  previousSlimOptions = '';
  analysis_set_slimselect: any;
  analysis_set_select: any;
  query_source_action: any;

  constructor(chrome: any) {
    this.chrome = chrome;

  }
  async processPromptUsingUnacogAPI(message: string): Promise<any> {
    let apiToken = await this.chrome.storage.local.get('apiToken');
    apiToken = apiToken.apiToken || '';
    let sessionId = await this.chrome.storage.local.get('sessionId');
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
    let resultMessage = 'unknown error';
    let error = true;
    if (!promptResult.success) {
      console.log("error", promptResult);
      resultMessage = promptResult.errorMessage;
    } else {
      console.log(promptResult);
    }
    if (promptResult.assist.error) {
      resultMessage = promptResult.assist.error.message;
    } else if (promptResult.assist.assist.error) {
      resultMessage = promptResult.assist.assist.error.message;
    } else {
      resultMessage = promptResult.assist.assist.choices["0"].message.content;
      error = false;
    }
    return {
      resultMessage,
      originalPrompt: message,
      promptResult,
      error,
    }
  }
  async sendPromptForMetric(promptTemplate: string, query: string) {
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
  async getDefaultAnalysisPrompts() {
    const defaultPromptList = [
      "Moderation",
      "Message",
      "Summary",
    ];
    const promises: any[] = [];
    defaultPromptList.forEach((url) => {
      promises.push((async (url) => {
        let promptQuery = await fetch("/defaults/" + url + ".json");
        let defaultPrompts = await promptQuery.json();
        const allPrompts: any[] = [];
        defaultPrompts.forEach((prompt: any) => {
          prompt.setName = url;
          allPrompts.push(prompt);
        });
        return allPrompts;
      })(url));
    });
    const defaultPrompts = await Promise.all(promises);
    const resultPrompts: any[] = [];
    defaultPrompts.forEach((promptList, index) => {
      promptList.forEach((prompt: any) => {
        resultPrompts.push(prompt);
      });
    });
    return resultPrompts;
  }
  async getAnalysisPrompts() {
    let prompts = await this.getDefaultAnalysisPrompts();
    let rawData = await this.chrome.storage.local.get('masterAnalysisList');
    if (rawData && rawData.masterAnalysisList && Object.keys(rawData.masterAnalysisList).length > 0) {
      prompts = rawData.masterAnalysisList;
    }
    return prompts;
  }
  async getAnalysisSetNames() {
    let allPrompts = await this.getAnalysisPrompts();
    let analysisSets: any = {};
    allPrompts.forEach((prompt) => {
      if (!analysisSets[prompt.setName]) {
        analysisSets[prompt.setName] = [];
      }
      analysisSets[prompt.setName].push(prompt);
    });

    return Object.keys(analysisSets);
  }
  async runAnalysisPrompts(text: string, url = "", promptToUse = null) {
    const runDate = new Date().toISOString();
    let running = await this.chrome.storage.local.get('running');
    if (running && running.running) {
      return;
    }
    await this.chrome.storage.local.set({
      lastSelection: text,
      lastResult: "",
      running: true,
    });

    let prompts: any = [];
    let analysisPrompts: any = await this.getAnalysisPrompts();
    let selectedAnalysisSets: any = await this.chrome.storage.local.get("selectedAnalysisSets");
    if (promptToUse) {
      prompts = [promptToUse];
    } else if (selectedAnalysisSets && selectedAnalysisSets.selectedAnalysisSets) {
      selectedAnalysisSets = selectedAnalysisSets.selectedAnalysisSets;
      for (let set of selectedAnalysisSets) {
        let localPrompts = analysisPrompts.filter((prompt: any) => prompt.setName === set);
        localPrompts.forEach((prompt: any) => {
          prompts.push(prompt);
        });
      }
    }

    const runPrompt = async (prompt: any, text: string) => {
      let fullPrompt = await this.sendPromptForMetric(prompt.prompt, text);
      let result = await this.processPromptUsingUnacogAPI(fullPrompt);
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
    let history = await this.chrome.storage.local.get('history');
    history = history.history || [];
    let historyEntry = {
      text,
      results,
      runDate,
      url
    };
    history.unshift(historyEntry);
    history = history.slice(0, 10);
    await this.chrome.storage.local.set({
      lastResult: results,
      running: false,
      history,
    });
    return historyEntry;
  }
  getHTMLforPromptResult(result: any) {
    const usageText = `<span class="token_usage_span">Token Usage: ${result.result.promptResult.ticketResults.usage_credits}</span>`;
    if (result.prompt.prompttype === 'text') {
      return `
          <div class="prompt_result text_result">
            <div class="prompt_header">
              <span class="prompt_id">${result.prompt.id}</span>
            </div>
            <div class="result_content">${result.result.resultMessage}</div>
            <div class="result_usage">${usageText}</div>
          </div>
        `;
    } else if (result.prompt.prompttype === 'metric') {
      try {
        let json = JSON.parse(result.result.resultMessage);
        let metric = json.contentRating;
        return `
            <div class="prompt_result metric_result">
              <span class="prompt_id">${result.prompt.id}</span>
              <span class="metric_score">${metric}</span>
              <div class="metric_bar">
                <div class="metric_fill" style="width: ${metric * 10}%;"></div>
              </div>
              <div class="result_usage">${usageText}</div>
            </div>
          `;
      } catch (error) {
        return `
            <div class="prompt_result error_result">
              <div class="prompt_header">
                <span class="prompt_id">${result.prompt.id}</span>
              </div>
              <pre class="result_content">${result.result.resultMessage}</pre>
            </div>
          `;
      }
    } else {
      let resultDisplay = '';
      try {
        resultDisplay = JSON.stringify(JSON.parse(result.result.resultMessage), null, 2);
      } catch (error) {
        resultDisplay = result.result.resultMessage;
      }
      return `
          <div class="prompt_result json_result">
            <div class="prompt_header">
              <span class="prompt_id">${result.prompt.id}</span>
            </div>
            <pre class="result_content">${resultDisplay}</pre>
            <div class="result_usage">${usageText}</div>
          </div>
        `;
    }
  }
  async getSummaryPromptForDescription(description: string): Promise<string> {
    const newPromptAgent = `Please help me form a concise set of guidenlines for summarizing content based on the following description: ${description}`;
    let newPromptContent = (await this.processPromptUsingUnacogAPI(newPromptAgent)).resultMessage;
    newPromptContent += `
  This summary should be no longer than 50 or more words. Use the following format to answer:
  Summary: [summary of content]
  Here is the content to analyze:
  {{query}}`;
    return newPromptContent;
  }
  async getKeywordPromptForDescription(description: string): Promise<string> {
    const newPromptAgent = `Please help form a concise set guidelines for keywords using following description: ${description}
    `;

    let newPromptContent = (await this.processPromptUsingUnacogAPI(newPromptAgent)).resultMessage;
    newPromptContent += `Use the following format to answer, include up to 5: Keywords: [keyword1], [keyword2], [keyword3], ...
    Here is the content to analyze:
    {{query}}
    `;
    return newPromptContent;
  }
  async getMetricPromptForDescription(description: string): Promise<string> {
    const newPromptAgent = `Please help form a new concise set guidelines for scoring content.
    I would like one based on the following description: ${description}
    
    Here is an example of guidelines for scoring content based on political content:
    Rate the following content 0-100, regarding its political content. 
    Guideline for political metrics: Assess political content by evaluating the depth of political commentary, the range of political perspectives presented, and the degree of bias or impartiality. Consider the relevance of political themes to current events, historical context, and societal impact. Examine the effectiveness of conveying political messages, the use of persuasive language or rhetoric, and the potential for inciting debate or controversy. Take into account the diversity of political ideologies and the potential for engaging audiences with different political beliefs.`;

    let newPromptContent = (await this.processPromptUsingUnacogAPI(newPromptAgent)).resultMessage;
    newPromptContent += ` 
    Please respond with json and only json in this format:
    {
      "contentRating": 0
    }
    
    Here is the content to analyze:
    {{query}}`;
    return newPromptContent;
  }
  async renderDisplay(className = 'analysis_display') {
    let lastResult = await this.chrome.storage.local.get('lastResult');
    let html = '';
    if (lastResult && lastResult.lastResult) {
      lastResult.lastResult.forEach((result: any) => {
        html += this.getHTMLforPromptResult(result);
      });
    }
    (<any>document.querySelector('.' + className)).innerHTML = html;
  }
  updateQuerySourceDetails() {
    let lastSelection = this.query_source_text.value;
    this.query_source_text_length.innerHTML = lastSelection.length + ' characters';

    /*
let tokenCount = "N/A";
try {
tokenCount = encode(text).length.toString() + " tokens";
} catch (err) {
let cleanText = "";
if (text) cleanText = text;
cleanText = cleanText.replace(/[^a-z0-9\s]/gi, "");

tokenCount = encode(text).length.toString() + " tokens";
}
this.query_source_tokens_length.innerHTML = tokenCount;
*/
  }
  async paintAnalysisTab() {
    let running = await this.chrome.storage.local.get('running');
    if (running && running.running) {
      document.body.classList.add("extension_running");
      document.body.classList.remove("extension_not_running");
    } else {
      document.body.classList.remove("extension_running");
      document.body.classList.add("extension_not_running");
    }

    let lastSelection = await this.chrome.storage.local.get('lastSelection');
    lastSelection = lastSelection.lastSelection || "";
    this.query_source_text.value = lastSelection;
    this.updateQuerySourceDetails();

    this.renderDisplay();

    const setNames = await this.getAnalysisSetNames();
    let html = "";
    setNames.forEach((setName) => {
      html += `<option value="${setName}">${setName}</option>`;
    });
    let selectedAnalysisSets = await this.chrome.storage.local.get("selectedAnalysisSets");
    let slimOptions: any[] = [];
    setNames.forEach((setName) => {
      slimOptions.push({ text: setName, value: setName });
    });
    const slimOptionsString = JSON.stringify(slimOptions);
    if (this.previousSlimOptions !== slimOptionsString) {
      this.analysis_set_slimselect.setData(slimOptions);
      this.previousSlimOptions = slimOptionsString;
    }

    if (selectedAnalysisSets && selectedAnalysisSets.selectedAnalysisSets) {
      this.analysis_set_slimselect.setSelected(selectedAnalysisSets.selectedAnalysisSets);
      let domSelections = this.analysis_set_slimselect.render.main.values.querySelectorAll('.ss-value');
      let indexMap: any = {};
      domSelections.forEach((item: any, index: any) => {
        indexMap[item.innerText] = index;
      });
      let setOrder = selectedAnalysisSets.selectedAnalysisSets;
      setOrder.forEach((setName: any, index: any) => {
        let domIndex = indexMap[setName];
        if (domSelections[domIndex]) {
          this.analysis_set_slimselect.render.main.values.appendChild(domSelections[domIndex]);
        }
      });
    }
    if (this.analysis_set_slimselect.getSelected().length === 0) {
      this.analysis_set_slimselect.setSelected([setNames[0]]);
    }
  }
  async initCommonDom() {
    this.analysis_set_select = document.querySelector('.analysis_set_select');
    this.query_source_text = document.querySelector(".query_source_text");
    this.query_source_text_length = document.querySelector('.query_source_text_length');
    this.query_source_tokens_length = document.querySelector('.query_source_tokens_length');
    this.analysis_set_select = document.querySelector('.analysis_set_select');
    this.analysis_set_slimselect = new SlimSelect({
      select: '.analysis_set_select',
      settings: {
        showSearch: false,
        placeholderText: 'Select Analysis Set(s)',
        keepOrder: true,
        hideSelected: true,
        minSelected: 1,
        closeOnSelect: false,
      },
      events: {
        afterChange: async (newVal) => {
          let selectedAnalysisSets: any[] = [];
          this.analysis_set_slimselect.render.main.values.querySelectorAll('.ss-value')
            .forEach((item: any) => {
              selectedAnalysisSets.push(item.innerText);
            });
          if (selectedAnalysisSets.length <= 1) {
            this.analysis_set_select.classList.add('slimselect_onevalue');
          } else {
            this.analysis_set_select.classList.remove('slimselect_onevalue');
          }
          await this.chrome.storage.local.set({ selectedAnalysisSets });
        },
      },
    });

    this.query_source_text.addEventListener('input', async (e: Event) => {
      this.updateQuerySourceDetails();
    });

    this.query_source_action = document.querySelector(".query_source_action");
    if (this.query_source_action) {
      this.query_source_action.addEventListener('click', async (e: Event) => {
        let index = this.query_source_action.selectedIndex;
        this.query_source_action.selectedIndex = 0;
        await  this.querySourceTextFromDom(index);
      });
    }
  }

  async querySourceTextFromDom(index: any) {
    if (index > 0) {
      if (index === 1) {
        this.runMetrics();
      } else if (index === 2) {
        this.query_source_text.select();
        navigator.clipboard.writeText(this.query_source_text.value);
      } else if (index === 3) {
        function getSelection() {
          return document.getSelection()?.toString();
        }
        let tabResults = await this.chrome.tabs.query({ active: true, currentWindow: true });
        let tab = tabResults[0];
        let scrapes = await this.chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getSelection,
        });
        let text = scrapes[0].result;
        text = text.slice(0, 20000);
        this.query_source_text.value = text;
        this.runMetrics();
      } else if (index === 4) {
        function getDom() {
          return document.body.innerText;
        }
        let tabResults = await this.chrome.tabs.query({ active: true, currentWindow: true });
        let tab = tabResults[0];
        let scrapes = await this.chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getDom,
        });
        let text = scrapes[0].result;
        text = text.slice(0, 20000);
        this.query_source_text.value = text;
        this.runMetrics();
      }
    }
  }

  async runMetrics() {
    let text = this.query_source_text.value;
    await this.runAnalysisPrompts(text, 'user input');
  }
}
