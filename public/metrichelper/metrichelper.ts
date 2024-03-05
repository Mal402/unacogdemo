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
    lookupData: any = {};
    lookedUpIds: any = {};
    semanticResults: any[] = [];
    promptRows: any[] = [];
    idRows: any[] = [];
    promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    queryUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
    loaded = false;
    lookUpKeys: string[] = [];
    verboseDebugging = false;

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


        this.load();
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
        this.prompt_log_console.innerHTML = "starting prompts...<br>";
        const idList = this.idRows.map((row: any) => row.id);
        (<any>window).resultsMap = {};
        const delay = ms => new Promise(res => setTimeout(res, ms));

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
                try {
                    (<any>window).resultsMap[id][this.promptRows[index].id] = value.contentRating;
                }
                catch (error) {
                    console.log("ERROR", error);
                    console.log("result", result);
                    (<any>window).resultsMap[id][this.promptRows[index].id] = 0;
                }
            });
            
            this.prompt_log_console.innerHTML += `${id} processed<br>`;
            await delay(5000);
        }
        this.prompt_log_console.innerHTML += "all prompts processed<br>";
        console.log("resultsMap", (<any>window).resultsMap);
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
    }
    async updateIDRowsDisplay() {
        this.idRows = await this.getImportDataFromDomFile(this.import_id_list_file);
        this.id_list_preview.innerHTML = this.idRows.length + " rows";
    }
    /**
 * @param { any } fileInput DOM file input element
 * @return { Promise<Array<any>> } array of data
*/
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
}
