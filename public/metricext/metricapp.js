/*
import {
    encode,
} from "gpt-tokenizer";
*/
const metricAnalyzerObject = getMetricAnalysis();

class MetricSidePanelApp {
    constructor() {
        this.api_token_input = document.querySelector('.api_token_input');
        this.session_id_input = document.querySelector('.session_id_input');
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

        this.importButton = document.querySelector('.import_rows');
        this.importButton.addEventListener('click', () => {
            document.getElementById('file_input').click();
        });
        this.fileInput = document.getElementById('file_input');
        this.fileInput.addEventListener('change', async (e) => {
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.onload = async (e) => {
                let promptTemplateList = JSON.parse(e.target.result);
                await chrome.storage.local.set({ masterAnalysisList: promptTemplateList });
                this.hydrateAllPromptRows();
                this.fileInput.value = ''; // Reset the file input value
            };
            reader.readAsText(file);
        });
        this.exportButton = document.querySelector('.export_rows');
        this.exportButton.addEventListener('click', async () => {
            let promptTemplateList = await this.promptsTable.getData();
            let blob = new Blob([JSON.stringify(promptTemplateList)], { type: "application/json" });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = 'allprompts.json';
            a.click();
            URL.revokeObjectURL(url);
        });
        this.clearStorageButton = document.querySelector('.reset_chrome_storage');
        this.clearStorageButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all data? This will clear your session key. If you have custom prompts, download first.')) {
                await chrome.storage.local.clear();
                location.reload();
            }
        });
        this.api_token_input.addEventListener('input', async (e) => {
            let apiToken = this.api_token_input.value;
            chrome.storage.local.set({ apiToken });
        });
        this.session_id_input.addEventListener('input', async (e) => {
            let sessionId = this.session_id_input.value;
            chrome.storage.local.set({ sessionId });
        });
        this.add_prompt_row = document.querySelector('.add_prompt_row');
        this.prompt_row_index = document.querySelector('.prompt_row_index');
        this.add_prompt_row.addEventListener('click', async () => {
            this.prompt_setname_input.value = '';
            this.prompt_id_input.value = '';
            this.prompt_description.value = '';
            this.prompt_type.value = '';
            this.prompt_template_text.value = '';
            this.prompt_row_index.value = -1;
            this.prompt_id_input.focus();
            this.getAnalysisSetNameList();
        });
        this.generate_metric_prompt = document.querySelector('.generate_metric_prompt');
        this.generate_metric_prompt.addEventListener('click', async () => {
            let newPromptDetail = prompt('Describe the metric you want to generate a prompt for:', '');
            let newPrompt = await metricAnalyzerObject.getMetricPromptForDescription(newPromptDetail);
            this.prompt_template_text.value = newPrompt;
        });
        this.test_metric_container = document.querySelector('.test_metric_container');
        this.session_anchor_label = document.querySelector('.session_anchor_label');
        this.session_anchor = document.querySelector('.session_anchor');
        this.status_text = document.querySelector('.status_text');
        this.create_prompt_tab = document.getElementById('create-prompt-tab');
        this.prompt_id_input = document.querySelector('.prompt_id_input');
        this.prompt_description = document.querySelector('.prompt_description');
        this.prompt_type = document.querySelector('.prompt_type');
        this.prompt_template_text = document.querySelector('.prompt_template_text');
        this.user_prompt_library = document.querySelector('.user_prompt_library');
        this.add_to_library_button = document.querySelector('.add_to_library_button');
        this.prompt_setname_input = document.querySelector('.prompt_setname_input');
        this.input_datalist_prompt_list = document.querySelector('#input_datalist_prompt_list');
        this.add_to_library_button.addEventListener('click', async (e) => {
            let promptId = this.prompt_id_input.value;
            let promptDescription = this.prompt_description.value;
            let promptType = this.prompt_type.value;
            let promptTemplate = this.prompt_template_text.value;
            let setName = this.prompt_setname_input.value;
            if (!promptId || !promptType || !promptTemplate || !setName) {
                alert('Please fill out all fields to add a prompt to the library.');
                e.preventDefault();
                return;
            }
            let prompt = { id: promptId, description: promptDescription, prompttype: promptType, prompt: promptTemplate, setName };
            let promptTemplateList = await this.promptsTable.getData();
            let existingIndex = Number(this.prompt_row_index.value) - 1;
            if (existingIndex >= 0) {
                promptTemplateList[existingIndex] = prompt;
            } else {
                promptTemplateList.push(prompt);
            }
            this.prompt_id_input.value = '';
            this.prompt_description.value = '';
            this.prompt_type.value = '';
            this.prompt_template_text.value = '';

            await chrome.storage.local.set({ masterAnalysisList: promptTemplateList });
            this.hydrateAllPromptRows();
            var myModalEl = document.getElementById('promptWizard');
            var modal = bootstrap.Modal.getInstance(myModalEl)
            modal.hide();
        });

        this.initPromptTable();
        this.hydrateAllPromptRows();

        chrome.storage.local.onChanged.addListener(() => {
            this.paintData();
        });

        this.paintData();
    }
    async hydrateAllPromptRows() {
        let allPrompts = await metricAnalyzerObject.getAnalysisPrompts();
        console.log('allPrompts', allPrompts);
        this.promptsTable.setData(allPrompts);
    }
    initPromptTable() {
        this.rowContextMenu = [
            {
                label: "Delete",
                action: (e, row) => {
                    const prompt = row.getData();
                    if (this.promptsTable.getDataCount() <= 1) {
                        alert('You must have at least one prompt in the library.');
                    } else {
                        if (confirm('Are you sure you want to delete this row?')) {
                            row.getRow().delete();
                            this.savePromptTableData();
                        }
                    }
                }
            }, {
                label: "Test",
                action: async (e, row) => {
                    const prompt = row.getRow().getData();
                    let text = this.query_source_text.value;
                    let result = await metricAnalyzerObject.runAnalysisPrompts(text, 'Manual', prompt);
                    this.renderOutputDisplay('test_metric_container');
                }
            }, {
                label: "Edit",
                action: async (e, row) => {
                    const prompt = row.getRow().getData();
                    this.add_prompt_row.click();
                    this.prompt_id_input.value = prompt.id;
                    this.prompt_description.value = prompt.description;
                    this.prompt_type.value = prompt.prompttype;
                    this.prompt_template_text.value = prompt.prompt;
                    this.prompt_setname_input.value = prompt.setName;
                    let rowIndex = row.getRow().getPosition(true);
                    this.prompt_row_index.value = rowIndex;
                    this.getAnalysisSetNameList();

                }
            },
        ];
        this.promptsTable = new Tabulator(".prompt_list_editor", {
            layout: "fitDataStretch",
            movableRows: true,
            groupBy: "setName",
            //            groupStartOpen: [false],
            groupHeader: (value, count, data, group) => {
                return value + "<span style='margin-left:10px;'>(" + count + " item)</span>";
            },
            columns: [
                {
                    title: "",
                    field: "contextMenu",
                    headerSort: false,
                    clickMenu: this.rowContextMenu,
                    formatter: () => {
                        return `<i class="material-icons">more_vert</i>`;
                    },
                    hozAlign: "center",
                },
                { title: "Id", field: "id", headerSort: false, width: 100 },
                {
                    title: "Type", field: "prompttype",
                    headerSort: false,
                },
                { title: "Description", field: "description", headerSort: false, width: 100 },
                { title: "Prompt", field: "prompt", headerSort: false, width: 100 },

            ],
        });
        this.promptsTable.on("rowMoved", async (cell) => {
            this.savePromptTableData();
        });
        this.promptsTable.on("rowSelectionChanged", (dataArray, rows, selected, deselected) => {
            if (!dataArray || dataArray.length === 0) return;
            let data = dataArray[0];
            this.prompt_id_input.value = data.id;
            this.prompt_description.value = data.description;
            this.prompt_type.value = data.prompttype;
            this.prompt_template_text.value = data.prompt;
        });
    }
    async getAnalysisSetNameList() {
        let html = '';
        let promptSetNames = await metricAnalyzerObject.getAnalysisSetNames();
        promptSetNames.forEach((setName) => {
            html += `<option>${setName}</option>`;
        });
        this.input_datalist_prompt_list.innerHTML = html;
    }


    async savePromptTableData() {
        let masterAnalysisList = await this.promptsTable.getData();
        chrome.storage.local.set({ masterAnalysisList });
    }
    async runMetrics() {
        let text = this.query_source_text.value;
        await metricAnalyzerObject.runAnalysisPrompts(text, 'user input');
        this.renderOutputDisplay();
    }
    async renderOutputDisplay(className = 'analysis_display') {
        let lastResult = await chrome.storage.local.get('lastResult');
        let html = '';
        if (lastResult && lastResult.lastResult) {
            lastResult.lastResult.forEach((result) => {
                html += metricAnalyzerObject.getHTMLforPromptResult(result);
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

        let sessionConfig = await chrome.storage.local.get('sessionId');
        if (sessionConfig && sessionConfig.sessionId) {
            document.querySelector('.no_session_key').style.display = 'none';
            this.session_anchor_label.innerHTML = 'Use link to visit Unacog Session: ';
            this.session_anchor.innerHTML = `Visit Session ${sessionConfig.sessionId}`;
            this.session_anchor.href = `https://unacog.com/session/${sessionConfig.sessionId}`;
            document.querySelector('#api-config-tab i').classList.remove('api-key-warning');
        } else {
            document.querySelector('.no_session_key').style.display = 'block';
            this.session_anchor_label.innerHTML = 'Visit Unacog:';
            this.session_anchor.innerHTML = `Get Started`;
            this.session_anchor.href = `https://unacog.com/help/#metricextension`;
            document.querySelector('#api-config-tab i').classList.add('api-key-warning');
        }


        let sessionId = await chrome.storage.local.get('sessionId');
        sessionId = sessionId.sessionId || '';
        this.session_id_input.value = sessionId;

        let apiToken = await chrome.storage.local.get('apiToken');
        apiToken = apiToken.apiToken || '';
        this.api_token_input.value = apiToken;

        let lastSelection = await chrome.storage.local.get('lastSelection');
        lastSelection = lastSelection.lastSelection || "";
        this.query_source_text.value = lastSelection;
        this.updateQuerySourceDetails();

        this.renderOutputDisplay();
        this.renderHistoryDisplay();

        const setNames = await metricAnalyzerObject.getAnalysisSetNames();
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

    async renderHistoryDisplay() {
        let history = await chrome.storage.local.get('history');
        history = history.history || [];
        let historyHtml = '';
        for (let i = 0; i < history.length; i++) {
            let entry = history[i];
            let historyPrompt = "";
            try {
                let result = entry.result;
                if (!result) result = entry.results[0];
                historyPrompt = `${result.prompt.id}: ${this.truncateText(result.prompt.prompt, 50)}`;
            } catch (e) {
                historyPrompt = "Error loading prompt";
                console.error(e);
            }
            let entryHtml = `
            <div class="history_entry">
              <div class="history_index">${i + 1}</div>
              <div class="history_content">
                <div class="history_header">
                  <span class="history_date">${this.showGmailStyleDate(entry.runDate)}</span>
                  <span class="url_display">${entry.url}</span>
                </div>
                <div class="history_preview">
                  <div class="history_text">${this.truncateText(entry.text, 80)}</div>
                  <div class="history_prompt">${historyPrompt}</div>
                </div>
                <div class="history_results">
          `;
            for (let result of entry.results) {
                entryHtml += metricAnalyzerObject.getHTMLforPromptResult(result);
            }
            entryHtml += `
                </div>
              </div>
            </div>
            <hr class="history_separator">
          `;
            historyHtml += entryHtml;
        }
        document.querySelector('.history_display').innerHTML = historyHtml;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.slice(0, maxLength) + '...';
    }

    formatAMPM(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? "0" + minutes : minutes;
        return hours + ":" + minutes + " " + ampm;
    }

    showGmailStyleDate(ISOdate, amFormat = false) {
        let date = new Date(ISOdate);
        if (Date.now() - date.getTime() < 24 * 60 * 60 * 1000) {
            if (amFormat) return BaseApp.formatAMPM(date);

            let result = this.formatAMPM(date);
            return result;
        }

        return date.toLocaleDateString("en-us", {
            month: "short",
            day: "numeric",
        });
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    window.metricAppInstance = new MetricSidePanelApp();
});