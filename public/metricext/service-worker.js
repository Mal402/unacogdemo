importScripts("./node_modules/mustache/mustache.min.js");
importScripts("./runmetrics.js");

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
            await abc.runAnalysisPrompts(text);
        }
        else if (info.menuItemId === 'analyzePage') {
            function getDom() {
                return document.body.innerText;
            }
            let scrapes = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: getDom,
            });
            let text = scrapes[0].result;
            let abc = getMetricAnalysis();
            await abc.runAnalysisPrompts(text);
        }
    });
});


