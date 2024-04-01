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
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: addRunningIndicator,
            args: ['Running...']
        });
        let text = '';
        let result = {};
        if (info.menuItemId === 'analyzeSelection') {
            text = info.selectionText;
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
            let abc = getMetricAnalysis();
            result = await abc.runAnalysisPrompts(text);
        }
        function addRunningIndicator(html) {
            let existing = document.querySelector('.running_status');
            if (existing) {
                existing.remove();
            }
            let div = document.createElement('div');
            div.classList.add('running_status');
            div.style.position = 'fixed';
            div.style.bottom = '0';
            div.style.left = '0';
            div.style.padding = '10px';
            div.style.backgroundColor = 'gray';
            div.style.zIndex = '100000';
            div.innerHTML = html;
            document.body.appendChild(div);
            let dismissButton = document.createElement('button');
            dismissButton.innerHTML = 'Dismiss';
            dismissButton.addEventListener('click', () => {
                document.querySelector('.running_status').remove();
            });
            div.appendChild(dismissButton);
        }
        let abc = getMetricAnalysis();
        console.log("super result",result);
        let def = '';
        result.results.forEach((result) => {
            def += abc.getHTMLforPromptResult(result);
        });

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: addRunningIndicator,
            args: [def]
        });
    });
});

