
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
    promptsTable.on("cellClick", (e, cell) => {
        if (column.getField() === "delete") {
            promptsTable.deleteRow(cell.getRow());
        }
    });
}
main();
