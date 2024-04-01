importScripts("./node_modules/mustache/mustache.min.js");
importScripts("./metricanalysis.js");

chrome.runtime.onInstalled.addListener(async () => {
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
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === 'analyzeSelection') {
            let text = info.selectionText;
            let abc = getMetricAnalysis();
            let fullPrompt = await abc.sendPromptForMetric(abc.defaultPromptTemplate, text);
            let result = await abc.sendPromptToLLM(fullPrompt);
            console.log("result", result);
        }
        /*
        else if (info.menuItemId === 'analyzePage') {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: getBrowserPageText
            }, (results) => {
                console.log("results", results);
                const pageText = results[0].result;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: analyzePage,
                    args: [pageText]
                });
            });
        }
         */
    });
});


