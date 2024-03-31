
async function main() {
    console.log('main');
    let promptQuery = await fetch('defaultprompts.json');
    let defaultPrompts = await promptQuery.json();
    let prompts = defaultPrompts;
    let rawData = await chrome.storage.local.get('promptTemplateList');
    if (rawData.promptTemplateList && rawData.promptTemplateList.length > 0) {
        prompts = rawData.promptTemplateList;
    }
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
            { title: "Description", field: "description", editor: "textarea", headerSort: false, width: 100 },
            { title: "Prompt", field: "prompt", editor: "textarea", headerSort: false, width: 100 },

        ],
    });
    promptsTable.on("cellEdited", async (cell) => {
        let promptTemplateList = await promptsTable.getData();
        chrome.storage.local.set({promptTemplateList});
    });
    promptsTable.on("rowMoved", async (cell) => {
        let promptTemplateList = await promptsTable.getData();
        chrome.storage.local.set({promptTemplateList});
    });
    promptsTable.on("cellClick", async (e, cell) => {
        if (cell.getColumn().getField() === "delete") {
            promptsTable.deleteRow(cell.getRow());
            let promptTemplateList = await promptsTable.getData();
        chrome.storage.local.set({promptTemplateList});
        }
    });
    let addButton = document.querySelector('.add_row');
    addButton.addEventListener('click', async () => {
        promptsTable.addRow({id: '', description: '', prompt: ''});
    });
    let exportButton = document.querySelector('.export_rows');
    exportButton.addEventListener('click', async () => {
        let promptTemplateList = await promptsTable.getData();
        let blob = new Blob([JSON.stringify(promptTemplateList)], {type: "application/json"});
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
            chrome.storage.local.set({promptTemplateList});
            importButton.value = '';
        };
        reader.readAsText(file);
    });

    let resetButton = document.querySelector('.reset_default');
    resetButton.addEventListener('click', async () => {
        promptsTable.setData(defaultPrompts);
        chrome.storage.local.set({promptTemplateList: defaultPrompts});
    });
}
main();
