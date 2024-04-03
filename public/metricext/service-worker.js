importScripts("./node_modules/mustache/mustache.min.js");
importScripts("./runmetrics.js");

chrome.runtime.onInstalled.addListener(async () => {
    chrome.tabs.create({ url: 'startpage.html' });
    chrome.contextMenus.create({
        id: 'analyzeSelection',
        title: 'Analyze selection',
        type: 'normal',
        contexts: ['selection']
    });
    chrome.contextMenus.create({
        id: 'analyzePage',
        title: 'Analyze page',
        type: 'normal',
        contexts: ['page']
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    chrome.sidePanel.open({ tabId: tab.id });

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: paintInDocumentHTMLResultDisplay,
        args: ['Running...']
    });
    let text = '';
    let result = {};
    if (info.menuItemId === 'analyzeSelection') {
        text = info.selectionText;
        text = text.slice(0, 20000);
        let abc = getMetricAnalysis();
        result = await abc.runAnalysisPrompts(text);
    }
    else if (info.menuItemId === 'analyzePage') {
        function getDom() {
            return document.body.innerText;
        }
        let scrapes = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getDom,
        });
        text = scrapes[0].result;
        text = text.slice(0, 20000);
        let abc = getMetricAnalysis();
        result = await abc.runAnalysisPrompts(text);
    }
    async function paintInDocumentHTMLResultDisplay(html) {
        let existing = document.querySelector('.running_status');
        if (existing) {
            existing.remove();
        }
        function getCSSString() {
            return `
            <style>
        .running_status{
            max-height: 25vh;
            overflow: auto;
        }
          .prompt_result {
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 4px;
            display: inline-block;
          }
        
          .prompt_header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
          }
        
          .prompt_id {
            font-weight: bold;
          }
        
          .result_content {
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 14px;
          }
        
          .metric_score {
            font-size: 18px;
            color: #007bff;
            margin-left: 4px;
          }
        
          .metric_bar {
            height: 10px;
            background-color: #e0e0e0;
            border-radius: 5px;
            overflow: hidden;
          }
        
          .metric_fill {
            height: 100%;
            background-color: #007bff;
          }
        
          .text_result,
          .metric_result,
          .json_result {
            background-color: #f0f0f0;
          }
        
          .error_result {
            background-color: #ffe0e0;
          }
        </style>`
        };

        let showResultsInPage = await chrome.storage.local.get('showResultsInPage');
        if (showResultsInPage && showResultsInPage.showResultsInPage === 'true') {
            let div = document.createElement('div');
            div.classList.add('running_status');
            div.style.position = 'fixed';
            div.style.bottom = '0';
            div.style.left = '0';
            div.style.padding = '10px';
            div.style.backgroundColor = 'gray';
            div.style.zIndex = '100000';
            div.innerHTML = html + getCSSString();
            document.body.appendChild(div);
            let dismissButton = document.createElement('button');
            dismissButton.innerHTML = 'Dismiss';
            dismissButton.addEventListener('click', () => {
                document.querySelector('.running_status').remove();
            });
            div.appendChild(dismissButton);
        }

    }
    let abc = getMetricAnalysis();
    console.log("super result", result);
    let def = '';
    result.results.forEach((result) => {
        def += abc.getHTMLforPromptResult(result);
    });

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: paintInDocumentHTMLResultDisplay,
        args: [def]
    });
});

chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessageExternal.addListener(
    async (request, sender, sendResponse) => {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.sessionId) {
            await chrome.storage.local.set({
                sessionId: request.sessionId,
                apiToken: request.apiToken
            });
            sendResponse({ success: "key set" });
        }
    }
);

