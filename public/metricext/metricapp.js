const metricAnalyzerObject = getMetricAnalysis();
class MetricSidePanelApp {
    constructor() {
        this.api_token_input = document.querySelector('.api_token_input');
        this.session_id_input = document.querySelector('.session_id_input');

        this.runButton = document.querySelector('.compute_metrics');
        this.runButton.addEventListener('click', async () => {
            this.runMetrics();
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
                this.promptsTable.setData(promptTemplateList);
                chrome.storage.local.set({ promptTemplateList });
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
            a.download = 'promptTemplateList.json';
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
        this.selectPrompt = document.querySelector('.default_prompt_select');
        this.selectPrompt.addEventListener('click', async (e) => {
            let selectedIndex = this.selectPrompt.selectedIndex;
            if (selectedIndex === 0) return;
            if (confirm('Are you sure you want to load the default prompts? This will overwrite any custom prompts you have.') === false) {
                this.selectPrompt.selectedIndex = 0;
                return;
            }
            if (selectedIndex === 1) {
                let promptQuery = await fetch('promptsmoderation.json');
                let defaultPrompts = await promptQuery.json();
                this.promptsTable.setData(defaultPrompts);
                chrome.storage.local.set({ promptTemplateList: defaultPrompts });
            }
            else if (selectedIndex === 2) {
                let promptQuery = await fetch('promptsmessage.json');
                let defaultPrompts = await promptQuery.json();
                this.promptsTable.setData(defaultPrompts);
                chrome.storage.local.set({ promptTemplateList: defaultPrompts });
            }
            else if (selectedIndex === 3) {
                let promptQuery = await fetch('promptssummary.json');
                let defaultPrompts = await promptQuery.json();
                this.promptsTable.setData(defaultPrompts);
                chrome.storage.local.set({ promptTemplateList: defaultPrompts });
            }
            this.selectPrompt.selectedIndex = 0;
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
        this.add_prompt_row.addEventListener('click', async () => {
            this.prompt_id_input.value = '';
            this.prompt_description.value = '';
            this.prompt_type.value = '';
            this.prompt_template_text.value = '';
            this.prompt_id_input.focus();
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
        this.add_to_library_button.addEventListener('click', async () => {
            let promptId = this.prompt_id_input.value;
            let promptDescription = this.prompt_description.value;
            let promptType = this.prompt_type.value;
            let promptTemplate = this.prompt_template_text.value;
            let prompt = { id: promptId, description: promptDescription, prompttype: promptType, prompt: promptTemplate };
            let promptTemplateList = await this.promptsTable.getData();
            let existingIndex = -1;
            promptTemplateList.forEach((existingPrompt, index) => {
                if (existingPrompt.id === promptId) {
                    existingIndex = index;
                }
            });
            if (existingIndex >= 0) {
                promptTemplateList[existingIndex] = prompt;
            } else {
                promptTemplateList.push(prompt);
            }
            chrome.storage.local.set({ promptTemplateList });
            this.promptsTable.setData(promptTemplateList);
            this.prompt_id_input.value = '';
            this.prompt_description.value = '';
            this.prompt_type.value = '';
            this.prompt_template_text.value = '';
        });

        this.initPromptTable();

        chrome.storage.local.onChanged.addListener(() => {
            this.paintData();
        });

        this.paintData();
    }

    initPromptTable() {
        this.promptsTable = new Tabulator(".prompt_list_editor", {
            layout: "fitDataStretch",
            movableRows: true,
            selectableRows: 1,
            rowHeader: { headerSort: false, resizable: false, minWidth: 30, width: 30, rowHandle: true, formatter: "handle" },
            columns: [
                { title: "Id", field: "id", headerSort: false, width: 100 },
                {
                    title: "",
                    field: "delete",
                    headerSort: false,
                    formatter: () => {
                        return `<i class="material-icons">delete</i>`;
                    },
                    hozAlign: "center",
                    width: 30,
                },
                {
                    title: "",
                    field: "testone",
                    headerSort: false,
                    formatter: () => {
                        return `<i class="material-icons">bolt</i>`;
                    },
                    hozAlign: "center",
                    width: 30,
                },
                {
                    title: "",
                    field: "edit",
                    headerSort: false,
                    formatter: () => {
                        return `<i class="material-icons">edit</i>`;
                    },
                    hozAlign: "center",
                    width: 30,
                },
                {
                    title: "Type", field: "prompttype"
                },
                { title: "Description", field: "description", headerSort: false, width: 100 },
                { title: "Prompt", field: "prompt", headerSort: false, width: 100 },

            ],
        });
        this.promptsTable.on("rowMoved", async (cell) => {
            let promptTemplateList = await this.promptsTable.getData();
            chrome.storage.local.set({ promptTemplateList });
        });
        this.promptsTable.on("cellClick", async (e, cell) => {
            if (cell.getColumn().getField() === "delete") {
                if (this.promptsTable.getDataCount() <= 1) {
                    alert('You must have at least one prompt in the library.');
                } else {
                    if (confirm('Are you sure you want to delete this row?')) {
                        this.promptsTable.deleteRow(cell.getRow());
                        let promptTemplateList = await this.promptsTable.getData();
                        chrome.storage.local.set({ promptTemplateList });
                    }
                }
            }
            if (cell.getColumn().getField() === "testone") {
                let prompt = cell.getRow().getData();
                let text = document.querySelector('.query_source_text').value;
                let result = await metricAnalyzerObject.runAnalysisPrompts(text, 'Manual', prompt);
                this.renderOutputDisplay('test_metric_container');
            }
            if (cell.getColumn().getField() === "edit") {
                let prompt = cell.getRow().getData();
                this.add_prompt_row.click();
                this.prompt_id_input.value = prompt.id;
                this.prompt_description.value = prompt.description;
                this.prompt_type.value = prompt.prompttype;
                this.prompt_template_text.value = prompt.prompt;
            }
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


    async runMetrics() {
        let text = document.querySelector('.query_source_text').value;
        let result = await metricAnalyzerObject.runAnalysisPrompts(text, 'user input');
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
            this.runButton.disabled = true;
            this.runButton.classList.add('processing');
            this.status_text.textContent = 'Running...';
            this.status_text.style.display = 'flex';
        } else {
            this.runButton.disabled = false;
            this.runButton.classList.remove('processing');
            this.status_text.textContent = '';
            this.status_text.style.display = 'none';
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
        document.querySelector(".query_source_text").value = lastSelection;
        this.renderOutputDisplay();
        this.renderHistoryDisplay();
        let prompts = await metricAnalyzerObject.getPromptTemplateList();
        this.promptsTable.setData(prompts);
    }

    async renderHistoryDisplay() {
        let history = await chrome.storage.local.get('history');
        history = history.history || [];
        let historyHtml = '';
        for (let i = 0; i < history.length; i++) {
            let entry = history[i];
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
                  <div class="history_prompt">${entry.results[0].prompt.id}: ${this.truncateText(entry.results[0].prompt.prompt, 50)}</div>
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



window.addEventListener('DOMContentLoaded', async () => {
    window.appInstance = new MetricSidePanelApp();
});