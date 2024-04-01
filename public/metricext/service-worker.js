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
        await chrome.storage.local.set({
            lastSelection: "",
            lastResult: "",
            running: true,
        });
        if (info.menuItemId === 'analyzeSelection') {
            let text = info.selectionText;
            await chrome.storage.local.set({
                lastSelection: text,
            });
            let abc = getMetricAnalysis();
            let fullPrompt = await abc.sendPromptForMetric(abc.defaultPromptTemplate, text);
            let result = await abc.sendPromptToLLM(fullPrompt);
            await chrome.storage.local.set({
                lastResult: result,
            });
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
            await chrome.storage.local.set({
                lastSelection: text,
            });
            let abc = getMetricAnalysis();
            let fullPrompt = await abc.sendPromptForMetric(abc.defaultPromptTemplate, text);
            let result = await abc.sendPromptToLLM(fullPrompt);
            await chrome.storage.local.set({
                lastResult: result,
            });
        }
        chrome.storage.local.set({
            running: false,
        });
    });
});


