class MainPageApp {
    constructor(extCommon) {        this.extCommon = extCommon;
        this.extCommon.initCommonDom();
        
        this.api_token_input = document.querySelector('.api_token_input');
        this.session_id_input = document.querySelector('.session_id_input');
        this.api_token_input.addEventListener('input', async (e) => {
            let apiToken = this.api_token_input.value;
            chrome.storage.local.set({ apiToken });
        });
        this.session_id_input.addEventListener('input', async (e) => {
            let sessionId = this.session_id_input.value;
            chrome.storage.local.set({ sessionId });
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
        this.wizard_input_prompt = document.querySelector('.wizard_input_prompt');
        this.show_prompt_dialouge = document.querySelector('.show_prompt_dialouge');
        this.prompt_row_index = document.querySelector('.prompt_row_index');
        this.show_prompt_dialouge.addEventListener('click', async () => {
            this.prompt_setname_input.value = '';
            this.prompt_id_input.value = '';
            this.prompt_description.value = '';
            this.prompt_type.value = '';
            this.prompt_template_text.value = '';
            this.prompt_row_index.value = -1;
            this.wizard_input_prompt.value = '';
            this.prompt_id_input.focus();
            this.getAnalysisSetNameList();
        });
        this.generate_metric_prompt = document.querySelector('.generate_metric_prompt');
        this.generate_metric_prompt.addEventListener('click', async () => {
            let text = this.wizard_input_prompt.value;
            this.prompt_template_text.value = `generating prompt...`;
            document.getElementById('wizard-prompt-tab').click();
            let newPrompt = '';
            if (this.prompt_type.value === 'metric') {
                newPrompt = await this.extCommon.getMetricPromptForDescription(text);
            } else if (this.prompt_type.value === 'keywords') {
                newPrompt = await this.extCommon.getKeywordPromptForDescription(text);
            } else if (this.prompt_type.value === 'shortsummary') { 
                newPrompt = await this.extCommon.getSummaryPromptForDescription(text);
                console.log('shortSummary', newPrompt);
            };
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
            let promptId = this.prompt_id_input.value.trim();
            let promptDescription = this.prompt_description.value.trim();
            let promptSuggestion = this.wizard_input_prompt.value.trim();
            let promptType = this.prompt_type.value;
            let promptTemplate = this.prompt_template_text.value.trim();
            let setName = this.prompt_setname_input.value.trim();
            if (!promptId || !promptType || !promptTemplate || !setName) {
                alert('Please fill out all fields to add a prompt to the library.');
                e.preventDefault();
                document.querybyId('wizard-config-tab').click();
                return;
            }
            let prompt = { id: promptId, description: promptDescription, prompttype: promptType, prompt: promptTemplate, setName, promptSuggestion };
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
            this.wizard_input_prompt.value = '';

            await chrome.storage.local.set({ masterAnalysisList: promptTemplateList });
            this.hydrateAllPromptRows();
            var myModalEl = document.getElementById('promptWizard');
            var modal = bootstrap.Modal.getInstance(myModalEl)
            modal.hide();
        });
        
        this.query_source_text = document.querySelector('.query_source_text');
        this.initPromptTable();
        this.hydrateAllPromptRows();

        chrome.storage.local.onChanged.addListener(() => {
            this.paintData();
        });
        this.paintData();
    }
    async hydrateAllPromptRows() {
        let allPrompts = await this.extCommon.getAnalysisPrompts();
        this.promptsTable.setData(allPrompts);
    }
    initPromptTable() {
        this.promptsTable = new Tabulator(".prompt_list_editor", {
            layout: "fitDataStretch",
            movableRows: true,
            groupBy: "setName",
            //            groupStartOpen: [false],
            groupHeader: (value, count, data, group) => {
                return value + "<span style='margin-left:10px;'>(" + count + " item)</span>";
            },
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
                    field: "edit",
                    headerSort: false,
                    formatter: () => {
                        return `<i class="material-icons">edit</i>`;
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
                    title: "Type", field: "prompttype",
                    headerSort: false,
                },
         //       { title: "Description", field: "description", headerSort: false, width: 100 },
                { title: "Prompt", field: "prompt", headerSort: false, width: 100 },

            ],
        });
        this.promptsTable.on("cellClick", async (e, cell) => {
            if (cell.getColumn().getField() === "delete") {
                if (this.promptsTable.getDataCount() <= 1) {
                    alert('You must have at least one prompt in the library.');
                } else {
                    if (confirm('Are you sure you want to delete this row?')) {
                        this.promptsTable.deleteRow(cell.getRow());
                        this.savePromptTableData();
                    }
                }
            }
            if (cell.getColumn().getField() === "testone") {
                const row = cell.getRow();
                const prompt = row.getData();

                let text = this.query_source_text.value;
                let result = await this.extCommon.runAnalysisPrompts(text, 'Manual', prompt);
            }
            if (cell.getColumn().getField() === "edit") {
                    const row = cell.getRow();
                    const prompt = row.getData();
                    this.show_prompt_dialouge.click();
                    this.prompt_id_input.value = prompt.id;
                    this.prompt_description.value = prompt.description;
                    this.prompt_type.value = prompt.prompttype;
                    this.prompt_template_text.value = prompt.prompt;
                    this.prompt_setname_input.value = prompt.setName;
                    this.wizard_input_prompt.value = prompt.suggestion;
                    let rowIndex = row.getPosition(true);
                    this.prompt_row_index.value = rowIndex;
                    this.getAnalysisSetNameList();
            }
        });

        this.promptsTable.on("rowMoved", async (cell) => {
            this.savePromptTableData();
        });
    }
    async getAnalysisSetNameList() {
        let html = '';
        let promptSetNames = await this.extCommon.getAnalysisSetNames();
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
        await this.extCommon.runAnalysisPrompts(text, 'user input');
        this.extCommon.renderDisplay();
    }
    async paintData() {
        await this.extCommon.paintAnalysisTab();
        this.renderSettingsTab();
        this.renderHistoryDisplay();
    }
    async renderSettingsTab() {
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
                entryHtml += this.extCommon.getHTMLforPromptResult(result);
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

window.addEventListener('DOMContentLoaded', async (event) => {
    let module = await import('./extensioncommon.js');
    window.extensionCommon = new module.AnalyzerExtensionCommon();
    window.appMainPage = new MainPageApp(window.extensionCommon);
});