export class MetricHelperApp {
    running = false;
    prompt_upload_button = document.body.querySelector(".prompt_upload_button") as HTMLButtonElement;
    import_prompt_list_file = document.body.querySelector(".import_prompt_list_file") as HTMLInputElement;
    prompt_list_preview = document.body.querySelector(".prompt_list_preview") as HTMLDivElement;
    id_upload_button = document.body.querySelector(".id_upload_button") as HTMLButtonElement;
    import_id_list_file = document.body.querySelector(".import_id_list_file") as HTMLInputElement;
    id_list_preview = document.body.querySelector(".id_list_preview") as HTMLDivElement;
    run_prompts_button = document.body.querySelector(".run_prompts_button") as HTMLButtonElement;
    session_api_token = document.body.querySelector(".session_api_token") as HTMLInputElement;
    session_id = document.body.querySelector(".session_id") as HTMLInputElement;
    session_lookup_path = document.body.querySelector(".session_lookup_path") as HTMLInputElement;
    prompt_log_console = document.body.querySelector(".prompt_log_console") as HTMLDivElement;
    next_button = document.body.querySelector(".next_button") as HTMLButtonElement;
    download_results_button = document.querySelector(".download_results_button") as HTMLButtonElement;
    lookupData: any = {};
    lookedUpIds: any = {};
    semanticResults: any[] = [];
    promptRows: any[] = [];
    idRows: any[] = [];
    resultRows: any[] = [];
    promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    queryUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
    loaded = false;
    lookUpKeys: string[] = [];
    verboseDebugging = false;
    promptTable: any = null;
    idTable: any = null;
    consoleTable: any = null;

    constructor() {
        this.run_prompts_button.addEventListener("click", () => {
            this.runPrompts();
        });
        this.import_prompt_list_file.addEventListener("change", () => {
            this.updatePromptRowsDisplay();
        });
        this.id_upload_button.addEventListener("click", () => {
            this.import_id_list_file.click();
        });
        this.import_id_list_file.addEventListener("change", () => {
            this.updateIDRowsDisplay();
        });
        this.prompt_upload_button.addEventListener("click", () => {
            this.import_prompt_list_file.click();
        });
        this.next_button.addEventListener("click", () => {
            this.nextTab();
        });
        this.download_results_button.addEventListener("click", () => {
            const csvText = (window as any).Papa.unparse(this.semanticResults, { header: true, });
            const csvContent = "data:text/csv;charset=utf-8," + csvText;
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "results.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        });
        this.paintPromptTable();
        this.paintIdTable();
        this.paintConsole();
        this.load();
    }
    paintPromptTable(data: any[] = []) {
        if (!this.promptTable) {
            this.promptTable = new (window as any).Tabulator(".prompt_table_preview", {
                height: "311px",
                layout: "fitDataStretch",
                responsiveLayout: "collapse",
                columns: [
                    { title: "Id", field: "id", width: 200, headerSort: false },
                    {
                        title: "Prompt", field: "prompt", headerSort: false,
                        formatter: "textarea",
                    },
                ],
                data,
            });
        } else {
            this.promptTable.setData(data);
        }
    }
    paintIdTable(data: any[] = []) {
        if (!this.idTable) {
            this.idTable = new (window as any).Tabulator(".document_table_preview", {
                height: "311px",
                layout: "fitDataStretch",
                responsiveLayout: "collapse",
                columns: [
                    { title: "Id", field: "id", width: 200, headerSort: false},
                    { title: "Text", field: "text", headerSort: false },
                ],
                data,
            });
        } else {
            this.idTable.setData(data);
        }
    }
    paintConsole() {
        const data = this.semanticResults.reverse();
        if (!this.consoleTable) {
            this.consoleTable = new (window as any).Tabulator(".console_table_preview", {
                height: "622px",
                layout: "fitDataStretch",
                responsiveLayout: "collapse",
                columns: [
                    { title: "source id", field: "sourceId", width: 200, headerSort: false},
                    { title: "prompt id", field: "promptId", width: 200, headerSort: false},
                    { title: "result", field: "result", headerSort: false },
                ],
                data,
            });
        } else {
            this.consoleTable.setData(data);
        }
    }
    async getMatchingVectors(message: string, topK: number, apiToken: string, sessionId: string): Promise<any> {
        const body = {
            message,
            apiToken,
            sessionId,
            topK,
        };
        const fetchResults = await fetch(this.queryUrl, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        return await fetchResults.json();
    }
    load() {
    }
    async fetchDocumentsLookup(idList: string[]) {
        const promises: any[] = [];
        const docIdMap: any = {};
        idList.forEach((chunkId: string) => {
            const parts = chunkId.split("_");
            let docId = parts[0];
            if (this.lookedUpIds[docId] !== true)
                docIdMap[docId] = true;
        });
        Object.keys(docIdMap).forEach((id: string) => promises.push(this.loadDocumentLookup(id)));
        let chunkMaps = await Promise.all(promises);
        chunkMaps.forEach((chunkMap: any) => {
            Object.keys(chunkMap).forEach((chunkId: string) => {
                this.lookupData[chunkId] = chunkMap[chunkId];
            });
        });
        Object.assign(this.lookedUpIds, docIdMap);
        this.lookUpKeys = Object.keys(this.lookupData).sort();
    }
    async loadDocumentLookup(docId: string): Promise<any> {
        try {
            let lookupPath = this.session_lookup_path.value;
            lookupPath = lookupPath.replace("DOC_ID_URIENCODED", docId);
            console.log(lookupPath);
            const r = await fetch(lookupPath);
            const result = await r.json();
            return result;
        } catch (error: any) {
            console.log("FAILED TO FETCH CHUNK MAP", docId, error);
            return {};
        }
    }
    escapeHTML(str: string): string {
        if (!str) str = "";
        return str.replace(/[&<>'"]/g,
            (match) => {
                switch (match) {
                    case "&": return "&amp;";
                    case "<": return "&lt;";
                    case ">": return "&gt;";
                    case "'": return "&#39;";
                    case "\"": return "&quot;";
                }

                return match;
            });
    }
    async sendPromptForMetric(promptTemplate: string, query: string) {
        const promptT = (<any>window).Handlebars.compile(promptTemplate);
        let merge = {
            query,
        };
        const fullPrompt = (<any>promptT)(merge);

        try {
            let result = await this.sendPromptToLLM(fullPrompt);
            return result;
        } catch (error) {
            console.log(promptTemplate, query, error);
            return `{
        "contentRating": -1
      }`;
        }
    }
    async runPrompts() {
        this.prompt_log_console.innerHTML = `<div class="alert alert-primary mt-3" role="alert">
        processing metric prompts...</div>`;
        const idList = this.idRows.map((row: any) => row.id);
        (<any>window).resultsMap = {};
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        this.semanticResults = [];
        this.paintConsole();
        await this.fetchDocumentsLookup(idList);
        for (let c = 0, l = idList.length; c < l; c++) {
            let id = idList[c];
            const promises: any[] = [];
            const song = this.lookupData[id];
            this.promptRows.forEach((promptRow: any) => {
                let promptTemplate = promptRow.prompt;
                promises.push(this.sendPromptForMetric(promptTemplate, song));
            });
            const results = await Promise.all(promises);
            results.forEach((result: any, index: number) => {
                if (!(<any>window).resultsMap[id]) {
                    (<any>window).resultsMap[id] = {};
                }
                const value = JSON.parse(result);
                let rating = -1;
                try {
                    (<any>window).resultsMap[id][this.promptRows[index].id] = value.contentRating;
                    rating = value.contentRating;
                }
                catch (error) {
                    console.log("ERROR", error);
                    console.log("result", result);
                    (<any>window).resultsMap[id][this.promptRows[index].id] = -1;
                }

                this.semanticResults.push({
                    sourceId: id,
                    promptId: this.promptRows[index].id,
                    result: rating,
                });
            });
            this.paintConsole();
            await delay(5000);
        }
        this.prompt_log_console.innerHTML += `<div class="alert alert-primary mt-3" role="alert">
        all prompts processed</div>`;
    }
    async sendPromptToLLM(message: string): Promise<string> {

        const apiToken = this.session_api_token.value;
        const sessionId = this.session_id.value;
        const body = {
            message,
            apiToken,
            sessionId,
            disableEmbedding: true,
        };
        const fetchResults = await fetch(this.promptUrl, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const promptResult = await fetchResults.json();
        if (!promptResult.success) {
            console.log("error", promptResult);
            return promptResult.errorMessage;
        } else {
            console.log(promptResult);
        }
        if (promptResult.assist.error) {
            return promptResult.assist.error.message;
        } else if (promptResult.assist.assist.error) {
            return promptResult.assist.assist.error.message;
        } else {
            return promptResult.assist.assist.choices["0"].message.content;
        }
    }
    async updatePromptRowsDisplay() {
        this.promptRows = await this.getImportDataFromDomFile(this.import_prompt_list_file);
        this.prompt_list_preview.innerHTML = this.promptRows.length + " rows";
        this.promptTable.setData(this.promptRows);
    }
    async updateIDRowsDisplay() {
        this.idRows = await this.getImportDataFromDomFile(this.import_id_list_file);
        this.id_list_preview.innerHTML = this.idRows.length + " rows";
        this.idTable.setData(this.idRows);
    }
    async getImportDataFromDomFile(fileInput: any): Promise<Array<any>> {
        if (!fileInput.files[0]) {
            return [];
        }

        const fileContent = await fileInput.files[0].text();
        let formatFilter = "json";
        if (fileInput.files[0].name.slice(-4).toLowerCase() === ".csv") formatFilter = "csv";

        try {
            let records: Array<any> = [];
            if (formatFilter === "json") {
                records = JSON.parse(fileContent);
            } else {
                const result = (window as any).Papa.parse(fileContent, {
                    header: true,
                });
                records = result.data;
            }

            return records;
        } catch (importError) {
            console.log("Import ERROR", importError);
            return [];
        }
    }
    nextTab() {
        const tabs = Array.prototype.slice.call(document.querySelectorAll('.nav-item .nav-link'));
        const activeTab = tabs.find(tab => tab.classList.contains('active'));
        const nextTab = tabs[(tabs.indexOf(activeTab) + 1) % tabs.length];
        nextTab.click();
    }
}
