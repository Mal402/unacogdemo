
import { AnalyzerExtensionCommon } from "./extensioncommon.js";
function loadExtensionCommonObject() {
    return new AnalyzerExtensionCommon();
}
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
        let abc = await loadExtensionCommonObject();
        result = await abc.runAnalysisPrompts(text, tab.url);
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
        let abc = await loadExtensionCommonObject();
        result = await abc.runAnalysisPrompts(text, tab.url);
    }
    
    let abc = await loadExtensionCommonObject();
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

chrome.action.onClicked.addListener(async (tab) => {
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

