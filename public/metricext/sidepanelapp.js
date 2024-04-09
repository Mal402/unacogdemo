class SidePanelApp {
    constructor(extCommon) {
        this.extCommon = extCommon;
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
                    let selectedAnalysisSets = [];
                    this.analysis_set_slimselect.render.main.values.querySelectorAll('.ss-value')
                        .forEach((item) => {
                            selectedAnalysisSets.push(item.innerText);
                        });
                    if (selectedAnalysisSets.length <= 1) {
                        this.analysis_set_select.classList.add('slimselect_onevalue');
                    } else {
                        this.analysis_set_select.classList.remove('slimselect_onevalue');
                    }
                    await chrome.storage.local.set({ selectedAnalysisSets });
                },
            },
        });

        this.query_source_text = document.querySelector(".query_source_text");
        this.query_source_text.addEventListener('input', async (e) => {
            this.updateQuerySourceDetails();
        });

        this.query_source_action = document.querySelector(".query_source_action");
        this.query_source_action.addEventListener('click', async (e) => {
            let index = this.query_source_action.selectedIndex;
            if (index > 0) {
                if (index === 1) {
                    this.runMetrics();
                } else if (index === 2) {
                    this.query_source_text.select();
                    navigator.clipboard.writeText(this.query_source_text.value);
                } else if (index === 3) {
                    function getSelection() {
                        return document.getSelection().toString();
                    }
                    let tabResults = await chrome.tabs.query({ active: true, currentWindow: true });
                    let tab = tabResults[0];
                    let scrapes = await chrome.scripting.executeScript({
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
                    let tabResults = await chrome.tabs.query({ active: true, currentWindow: true });
                    let tab = tabResults[0];
                    let scrapes = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: getDom,
                    });
                    let text = scrapes[0].result;
                    text = text.slice(0, 20000);
                    this.query_source_text.value = text;
                    this.runMetrics();
                }
            }
            this.query_source_action.selectedIndex = 0;
        });

        this.show_main_page_btn = document.querySelector('.show_main_page_btn');
        if (this.show_main_page_btn) {
            this.show_main_page_btn.addEventListener('click', () => {
                chrome.tabs.create({ url: 'main.html' });
            });
        }

        chrome.storage.local.onChanged.addListener(() => {
            this.paintData();
        });

        this.paintData();
    }
    async runMetrics() {
        let text = this.query_source_text.value;
        await this.extCommon.runAnalysisPrompts(text, 'user input');
        this.renderOutputDisplay();
    }
    async renderOutputDisplay(className = 'analysis_display') {
        let lastResult = await chrome.storage.local.get('lastResult');
        let html = '';
        if (lastResult && lastResult.lastResult) {
            lastResult.lastResult.forEach((result) => {
                html += this.extCommon.getHTMLforPromptResult(result);
            });
        }
        document.querySelector('.' + className).innerHTML = html;
    }
    async paintData() {
        let running = await chrome.storage.local.get('running');
        if (running && running.running) {
            document.body.classList.add("extension_running");
            document.body.classList.remove("extension_not_running");
        } else {
            document.body.classList.remove("extension_running");
            document.body.classList.add("extension_not_running");
        }

        let lastSelection = await chrome.storage.local.get('lastSelection');
        lastSelection = lastSelection.lastSelection || "";
        this.query_source_text.value = lastSelection;
        this.updateQuerySourceDetails();

        this.renderOutputDisplay();

        const setNames = await this.extCommon.getAnalysisSetNames();
        let html = "";
        setNames.forEach((setName) => {
            html += `<option value="${setName}">${setName}</option>`;
        });
        let selectedAnalysisSets = await chrome.storage.local.get("selectedAnalysisSets");
        let slimOptions = [];
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
            let indexMap = {};
            domSelections.forEach((item, index) => {
                indexMap[item.innerText] = index;
            });
            let setOrder = selectedAnalysisSets.selectedAnalysisSets;
            setOrder.forEach((setName, index) => {
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
    updateQuerySourceDetails() {
        let lastSelection = this.query_source_text.value;
        this.query_source_tokens_length.innerHTML = lastSelection.length + ' characters';

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
}

window.addEventListener('DOMContentLoaded', async (event) => {
    let module = await import('./extensioncommon.js');
    window.extensionCommon = new module.AnalyzerExtensionCommon();
    window.appSidePanel = new SidePanelApp(window.extensionCommon);
});