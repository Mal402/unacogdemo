const metricAnalyzerObject = getMetricAnalysis();

async function main() {
    let prompts = await metricAnalyzerObject.getPromptTemplateList();
    let promptsTable = new Tabulator(".prompt_list_editor", {
        data: prompts,
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
    promptsTable.on("cellEdited", async (cell) => {
        let promptTemplateList = await promptsTable.getData();
        chrome.storage.local.set({ promptTemplateList });
    });
    promptsTable.on("rowMoved", async (cell) => {
        let promptTemplateList = await promptsTable.getData();
        chrome.storage.local.set({ promptTemplateList });
    });
    promptsTable.on("cellClick", async (e, cell) => {
        if (cell.getColumn().getField() === "delete") {
            promptsTable.deleteRow(cell.getRow());
            let promptTemplateList = await promptsTable.getData();
            chrome.storage.local.set({ promptTemplateList });
        }
    });
    let addButton = document.querySelector('.add_row');
    addButton.addEventListener('click', async () => {
        promptsTable.addRow({ id: '', description: '', prompt: '' });
    });
    let exportButton = document.querySelector('.export_rows');
    exportButton.addEventListener('click', async () => {
        let promptTemplateList = await promptsTable.getData();
        let blob = new Blob([JSON.stringify(promptTemplateList)], { type: "application/json" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'promptTemplateList.json';
        a.click();
        URL.revokeObjectURL(url);
    });
    let importButton = document.querySelector('.import_rows');
    importButton.addEventListener('change', async (e) => {
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.onload = async (e) => {
            let promptTemplateList = JSON.parse(e.target.result);
            promptsTable.setData(promptTemplateList);
            chrome.storage.local.set({ promptTemplateList });
            importButton.value = '';
        };
        reader.readAsText(file);
    });
    let runButton = document.querySelector('.compute_metrics');
    runButton.addEventListener('click', async () => {
        runMetrics();
    });
    let selectPrompt = document.querySelector('.default_prompt_select');
    selectPrompt.addEventListener('click', async (e) => {
        let selectedIndex = selectPrompt.selectedIndex;
        if (selectedIndex === 1) {
            let promptQuery = await fetch('promptsmoderation.json');
            let defaultPrompts = await promptQuery.json();
            promptsTable.setData(defaultPrompts);
            chrome.storage.local.set({ promptTemplateList: defaultPrompts });
        }
        else if (selectedIndex === 2) {
            let promptQuery = await fetch('promptsmessage.json');
            let defaultPrompts = await promptQuery.json();
            promptsTable.setData(defaultPrompts);
            chrome.storage.local.set({ promptTemplateList: defaultPrompts });
        }
        else if (selectedIndex === 3) {
            let promptQuery = await fetch('promptssummary.json');
            let defaultPrompts = await promptQuery.json();
            promptsTable.setData(defaultPrompts);
            chrome.storage.local.set({ promptTemplateList: defaultPrompts });
        }
    });

    fillLastResultData();
    watchRunningFlag();
}

async function runMetrics() {
    let text = document.querySelector('.query_source_text').value;
    let result = await metricAnalyzerObject.runAnalysisPrompts(text);
    renderOutputDisplay();
}

async function renderOutputDisplay() {
    let lastResult = await chrome.storage.local.get('lastResult');
    let html = '';
    if (lastResult && lastResult.lastResult) {
        lastResult.lastResult.forEach((result) => {
            html += metricAnalyzerObject.getHTMLforPromptResult(result);
        });
    }
    document.querySelector('.analysis_display').innerHTML = html;
}

function watchRunningFlag() {
    chrome.storage.local.onChanged.addListener(fillLastResultData);
    fillLastResultData();
}

async function fillLastResultData() {
    let running = await chrome.storage.local.get('running');
    if (running && running.running) {
        document.querySelector('.running_status').innerHTML = 'Running...';
    } else {
        document.querySelector('.running_status').innerHTML = '';
    }

    let lastSelection = await chrome.storage.local.get('lastSelection');
    lastSelection = lastSelection.lastSelection || "";
    document.querySelector(".query_source_text").value = lastSelection;
    renderOutputDisplay();
    renderHistoryDisplay();
}

async function renderHistoryDisplay() {
    let history = await chrome.storage.local.get('history');
    history = history.history || [];
    let html = '';
    history.forEach((entry) => {
        html += `<div>${entry.text}</div>`;
        entry.results.forEach((result) => {
            html += metricAnalyzerObject.getHTMLforPromptResult(result);
        });
    });
    document.querySelector('.history_display').innerHTML = html;
}

main();