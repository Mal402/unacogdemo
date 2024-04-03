const metricAnalyzerObject = getMetricAnalysis();
class MetricSidePanelApp {
    constructor() {
        this.api_token_input = document.querySelector('.api_token_input');
        this.session_id_input = document.querySelector('.session_id_input');

        this.runButton = document.querySelector('.compute_metrics');
        this.runButton.addEventListener('click', async () => {
            this.runMetrics();
        });
        this.addButton = document.querySelector('.add_row');
        this.addButton.addEventListener('click', async () => {
            this.promptsTable.addRow({ id: '', description: '', prompt: '' });
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
        });
        this.api_token_input.addEventListener('input', async (e) => {
            let apiToken = this.api_token_input.value;
            chrome.storage.local.set({ apiToken });
        });
        this.session_id_input.addEventListener('input', async (e) => {
            let sessionId = this.session_id_input.value;
            chrome.storage.local.set({ sessionId });
        });
        this.session_anchor_label = document.querySelector('.session_anchor_label');
        this.session_anchor = document.querySelector('.session_anchor');
        
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
            rowHeader: { headerSort: false, resizable: false, minWidth: 30, width: 30, rowHandle: true, formatter: "handle" },
            columns: [
                { title: "Id", field: "id", editor: "textarea", headerSort: false, width: 100 },
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
                    title: "Type", field: "prompttype", editor: "list", editorParams: {
                        values:
                        {
                            "metric": "Metric",
                            "json": "JSON",
                            "text": "Text"
                        }
                    }
                },
                { title: "Description", field: "description", editor: "textarea", headerSort: false, width: 100 },
                { title: "Prompt", field: "prompt", editor: "textarea", headerSort: false, width: 100 },

            ],
        });
        this.promptsTable.on("cellEdited", async (cell) => {
            let promptTemplateList = await this.promptsTable.getData();
            chrome.storage.local.set({ promptTemplateList });
        });
        this.promptsTable.on("rowMoved", async (cell) => {
            let promptTemplateList = await this.promptsTable.getData();
            chrome.storage.local.set({ promptTemplateList });
        });
        this.promptsTable.on("cellClick", async (e, cell) => {
            if (cell.getColumn().getField() === "delete") {
                this.promptsTable.deleteRow(cell.getRow());
                let promptTemplateList = await this.promptsTable.getData();
                chrome.storage.local.set({ promptTemplateList });
            }
        });
    }

    async runMetrics() {
        let text = document.querySelector('.query_source_text').value;
        let result = await metricAnalyzerObject.runAnalysisPrompts(text);
        this.renderOutputDisplay();
    }

    async renderOutputDisplay() {
        let lastResult = await chrome.storage.local.get('lastResult');
        let html = '';
        if (lastResult && lastResult.lastResult) {
            lastResult.lastResult.forEach((result) => {
                html += metricAnalyzerObject.getHTMLforPromptResult(result);
            });
        }
        document.querySelector('.analysis_display').innerHTML = html;
    }

    async paintData() {
        let running = await chrome.storage.local.get('running');
        if (running && running.running) {
            document.querySelector('.running_status').innerHTML = 'Running...';
        } else {
            document.querySelector('.running_status').innerHTML = '';
        }
        let sessionConfig = await chrome.storage.local.get('sessionId');
        if (sessionConfig && sessionConfig.sessionId) {
            document.querySelector('.no_session_key').style.display = 'none';
            this.session_anchor_label.innerHTML = 'Use link to visit Unacog Session: ';
            this.session_anchor.innerHTML = `Visit Session ${sessionConfig.sessionId}`;
            this.session_anchor.href = `https://unacog.com/session/${sessionConfig.sessionId}`;
        } else {
            document.querySelector('.no_session_key').style.display = 'block';
            this.session_anchor_label.innerHTML = 'Visit Unacog:';
            this.session_anchor.innerHTML = `Get Started`;
            this.session_anchor.href = `https://unacog.com/help/#metricextension`;
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
        let html = '';
        const recentResults = history;
        recentResults.forEach((entry, index) => {
            const resultNumber = index + 1;
            html += `<div class="history_entry">
                        <span class="history_label">Result ${resultNumber}</span> &nbsp; &nbsp;
                        <div class="history_text">
                        ${entry.text}
                        </div>
                        <hr class="history_separator">`;
            entry.results.forEach((result) => {
                html += metricAnalyzerObject.getHTMLforPromptResult(result);
            });
            html += `</div>`;
            if (index < recentResults.length - 1) {
                html += `<hr class="history_separator">`;
            }
        });
        document.querySelector('.history_display').innerHTML = html;
    }
}



window.addEventListener('DOMContentLoaded', async () => {
    window.appInstance = new MetricSidePanelApp();
});