export class CovidDemoApp {
    running = false;
    analyze_prompt_button = document.body.querySelector(".analyze_prompt_button") as HTMLButtonElement;
    lookup_verse_response_feed = document.body.querySelector(".lookup_verse_response_feed") as HTMLDivElement;
    summary_details = document.body.querySelector(".summary_details") as HTMLDivElement;
    full_augmented_response = document.body.querySelector(".full_augmented_response") as HTMLDivElement;
    analyze_prompt_textarea = document.body.querySelector(".analyze_prompt_textarea") as HTMLTextAreaElement;
    lookup_chapter_response_feed: any = document.body.querySelector(".lookup_chapter_response_feed");
    nav_link = document.body.querySelectorAll(".nav-link");
    source_view_button = document.body.querySelector("#source_view_button") as HTMLButtonElement;
    full_augmented_prompt_button = document.body.querySelector("#full_augmented_prompt_button") as HTMLButtonElement;
    augmented_template_button = document.body.querySelector("#augmented_template_button") as HTMLButtonElement;
    full_augmented_response_button = document.body.querySelector("#full_augmented_response_button") as HTMLButtonElement;
    embedding_type_select: any = document.body.querySelector(".embedding_type_select");
    embedding_diagram_img: any = document.body.querySelector(".embedding_diagram_img");
    embedding_diagram_anchor: any = document.body.querySelector(".embedding_diagram_anchor");
    prompt_template_text_area: any = document.body.querySelector(".prompt_template_text_area");
    document_template_text_area: any = document.body.querySelector(".document_template_text_area");
    prompt_template_select_preset: any = document.body.querySelector(".prompt_template_select_preset");
    reset_template_options_button: any = document.body.querySelector(".reset_template_options_button");
    embed_distinct_chunks_option: any = document.body.querySelector(".embed_distinct_chunks_option");
    embed_sequential_chunks_option: any = document.body.querySelector(".embed_sequential_chunks_option");
    embed_sequential_chunks2_option = document.body.querySelector(".embed_sequential_chunks2_option") as HTMLOptionElement;
    datachunk_source_size_buttons = document.body.querySelectorAll(`[name="datachunk_source_size"]`);
    datachunking_details = document.body.querySelector(".datachunking_details") as HTMLSpanElement;
    lookupData: any = {};
    lookedUpIds: any = {};
    semanticResults: any[] = [];
    chunkNormalAPIToken = "012be1c3-94c8-4593-bf9a-9b7711d734cb";
    chunkNormalSessionId = "tuoakebhqb08";
    chunkNormalLookupPath = "https://firebasestorage.googleapis.com/v0/b/unacog-68ebf.appspot.com/o/projectLookups%2FpDIh5p9CdXe1j5SN6deCqVrCsQw2%2Fcoviddocs%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    chunkNormaltopK = 25;
    chunkNormalincludeK = 5;

    chunkRecursiveAPIToken = "56f7323b-9abe-4b96-afed-1f4c0153d507";
    chunkRecursiveSessionId = "clxafhh1nwt3";
    chunkRecursiveLookupPath = "https://firebasestorage.googleapis.com/v0/b/unacog-68ebf.appspot.com/o/projectLookups%2FpDIh5p9CdXe1j5SN6deCqVrCsQw2%2Fcovidrecursive1%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    chunkRecursivetopK = 25;
    chunkRecursiveincludeK = 5;

    promptUrl = `https://us-central1-unacog-68ebf.cloudfunctions.net/lobbyApi/session/external/message`;
    queryUrl = `https://us-central1-unacog-68ebf.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
    loaded = false;
    lookUpKeys: string[] = [];
    verboseDebugging = false;

    constructor() {
        this.load();
        this.analyze_prompt_button.addEventListener("click", () => this.analyzePrompt());
        this.prompt_template_select_preset.addEventListener("input", () => this.populatePromptTemplates());
        this.embedding_type_select.addEventListener("input", () => this.updateRAGImages());

        this.analyze_prompt_textarea.addEventListener("input", () => this.saveLocalStorage());
        this.prompt_template_text_area.addEventListener("input", () => this.saveLocalStorage());
        this.document_template_text_area.addEventListener("input", () => this.saveLocalStorage());

        this.datachunk_source_size_buttons.forEach((btn: any) => btn.addEventListener("input", () => {
            localStorage.setItem("covid_datachunk_source_size", btn.value);
            this.load();
        }));

        this.reset_template_options_button.addEventListener("click", (e: Event) => {
            e.preventDefault();
            localStorage.clear();
            location.reload();
        });
        this.analyze_prompt_textarea.addEventListener("keydown", (e: any) => {
            if (e.key === "Enter" && e.shiftKey === false) {
                e.preventDefault();
                e.stopPropagation();
                this.analyze_prompt_button.click();
            }
        });
        this.hydrateFromLocalStorage();
        this.updateEmbeddingOptionsDisplay();
        this.updateRAGImages();
        this.analyze_prompt_textarea.focus();
        this.analyze_prompt_textarea.select();
    }
    updateRAGImages() {
        let chunkType = localStorage.getItem("covid_datachunk_source_size");
        if (chunkType === "chunkRecursive") {
            this.datachunking_details.innerHTML = "Max Size: 300 tokens / 20 overlap";
        } else {
            this.datachunking_details.innerHTML = "Sentence blocks sized 300 tokens";
        }

        if (this.embedding_type_select.selectedIndex === 0) {
            this.embedding_diagram_img.src = "img/rag_basic.svg";
            this.embedding_diagram_anchor.href = "img/rag_basic.svg";
        } else {
            this.embedding_diagram_img.src = "img/rag_stb.svg";
            this.embedding_diagram_anchor.href = "img/rag_stb.svg";
        }
    }
    hydrateFromLocalStorage() {
        const lastPrompt = localStorage.getItem("covid_lastPrompt");
        if (lastPrompt) this.analyze_prompt_textarea.value = lastPrompt;
        const promptTemplate = localStorage.getItem("covid_promptTemplate");
        if (promptTemplate) this.prompt_template_text_area.value = promptTemplate;
        const documentTemplate = localStorage.getItem("covid_documentTemplate");
        if (documentTemplate) this.document_template_text_area.value = documentTemplate;

        let queryIndex = localStorage.getItem("covid_queryIndex") || 0;
        this.embedding_type_select.selectedIndex = queryIndex as number;
        let chunkSize = this.dataSourcePrefix();
        this.datachunk_source_size_buttons.forEach((btn: any) => {
            if (btn.value === chunkSize) btn.checked = true;
        });
        if (!promptTemplate) this.populatePromptTemplates(0, true);
    }
    updateEmbeddingOptionsDisplay() {
        let includeK = Number(this[this.dataSourcePrefix() + "includeK"]);
        let halfK = Math.ceil(includeK / 2);
        this.embed_distinct_chunks_option.innerHTML = `Embed ${includeK}  Document Chunks`;
        this.embed_sequential_chunks_option.innerHTML = `Embed ${halfK} Chunks with ${halfK} Additional Contexts`;
        this.embed_sequential_chunks2_option.innerHTML = `Embed 1 Chunk with ${includeK} Additional Contexts`;
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
    async analyzePrompt() {
        if (this.running) {
            alert("already running");
            return;
        }
        const message = this.analyze_prompt_textarea.value.trim();
        if (!message || message.length < 10) {
            alert("please supply a message of at least 10 characters");
            return [];
        }
        this.analyze_prompt_button.setAttribute("disabled", "");
        this.analyze_prompt_button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span class="visually-hidden">Loading...</span>`;
        this.summary_details.innerHTML = "Compiling Prompt...";
        this.running = true;

        document.body.classList.remove("initial");
        document.body.classList.add("running");
        document.body.classList.remove("complete");

        this.full_augmented_response.innerHTML = "Processing Query...<br><br>";
        this.semanticResults = await this.lookupAIDocumentChunks();


        this.full_augmented_response.innerHTML +=
            `<a class="response_verse_link p-2 mt-4" href="see verses">Top k Search Results</a> retrieved...
<a class="response_detail_link p-2" href="see details">Prompt Details</a>`;
        this._addFeedHandlers();

        this.full_augmented_response.innerHTML = await this.sendPromptToLLM();
        this.full_augmented_response.innerHTML +=
            `<br><div class="d-flex flex-column link-primary" style="white-space:normal;">
<a class="response_verse_link p-2 mt-4" href="see verses">Top k Search Results</a>
<a class="response_detail_link p-2" href="see details">Prompt Details</a></div>`;
        this._addFeedHandlers();

        this.analyze_prompt_button.removeAttribute("disabled");
        this.analyze_prompt_button.innerHTML = `<span class="material-icons-outlined mt-1">
    send
    </span>`;
        this.running = false;
        document.body.classList.add("complete");
        document.body.classList.remove("running");
    }
    _addFeedHandlers() {
        const verseLink = this.full_augmented_response.querySelector(".response_verse_link") as HTMLAnchorElement;
        if (verseLink) {
            verseLink.addEventListener("click", (e: Event) => {
                e.preventDefault();
                const sourcesModal: any = document.querySelector("#sourcesModal");
                (new (<any>window).bootstrap.Modal(sourcesModal)).show();
            });
        }
        const detailLink = this.full_augmented_response.querySelector(".response_detail_link") as HTMLAnchorElement;
        if (detailLink) {
            detailLink.addEventListener("click", (e: Event) => {
                e.preventDefault();
                const fullPromptModal: any = document.querySelector("#fullPromptModal");
                (new (<any>window).bootstrap.Modal(fullPromptModal)).show();
            });
        }
    }
    dataSourcePrefix(): string {
        let prefix = localStorage.getItem("covid_datachunk_source_size");
        if (prefix) return prefix as string;
        return "chunkNormal";
    }
    load() {
        this.loaded = true;
        this.lookedUpIds = {};
        this.lookupData = {};
        this.updateEmbeddingOptionsDisplay();
        this.updateRAGImages();
        this.analyze_prompt_textarea.focus();
        this.analyze_prompt_textarea.select();
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
    async lookupAIDocumentChunks(): Promise<any[]> {
        this.lookup_verse_response_feed.innerHTML = "";
        const message = this.analyze_prompt_textarea.value.trim();

        let topK = Number(this[this.dataSourcePrefix() + "topK"]);
        let result = await this.getMatchingVectors(message, topK, this[this.dataSourcePrefix() + "APIToken"], this[this.dataSourcePrefix() + "SessionId"]);
        if (!result.success) {
            console.log("error", result);
            this.full_augmented_response.innerHTML = result.errorMessage;
            return [];
        } else {
            console.log(result);
        }

        let html = "";
        await this.fetchDocumentsLookup(result.matches.map((match: any) => match.id));
        result.matches.forEach((match) => {
            const textFrag = this.lookupData[match.id];
            if (!textFrag) {
                console.log(match.id, this.lookupData)
            }
            const dstring = match.metadata.coverDate;
            const d = dstring.slice(0, 4) + "-" + dstring.slice(5, 7) + "-" + dstring.slice(8, 10);
            const parts = match.id.split("_");
            const docID = parts[0];
            const chunkIndex = Number(parts[2]);
            const chunkCount = parts[3];
            const block = `<div class="verse_card">
            <span style="float:right;font-size:.9em;border:solid 1px silver;padding:.2em;">Match: <b>${(match.score * 100).toFixed()}%</b><br>
            ${d}
            </span>
            ${chunkIndex}/${chunkCount}
            <a href="${match.metadata.url}" target="_blank">${match.metadata.title}</a>
              <br>
              <div class="verse_card_text">${this.escapeHTML(textFrag)}</div>
              </div>`;
            html += block;
        });

        this.lookup_verse_response_feed.innerHTML = html;

        return result.matches;
    }
    async sendPromptToLLM(): Promise<string> {
        this.saveLocalStorage();
        const message = this.analyze_prompt_textarea.value.trim();
        if (!message) {
            return "please supply a message";
        }

        const prompt = await this.embedPrompt(message, this.semanticResults);
        const diagram = this.embedding_diagram_img.src;
        this.summary_details.innerHTML = `<a target="_blank" class="embedding_diagram_anchor" href="${diagram}"><img style="width:100px;float:right" class="embedding_diagram_img" src="${diagram}" alt=""></a>
      <div class="raw_prompt">${prompt}</div><br>`;

        const apiToken = this[this.dataSourcePrefix() + "APIToken"];
        const sessionId = this[this.dataSourcePrefix() + "SessionId"];
        const body = {
            message: prompt,
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
    getSmallToBig(matchId: string, includeK: number): string {
        const lookUpIndex = this.lookUpKeys.indexOf(matchId);
        let firstIndex = lookUpIndex - Math.floor(includeK / 2);
        let lastIndex = lookUpIndex + Math.ceil(includeK / 2);
        if (firstIndex < 0) firstIndex = 0;
        if (lastIndex > this.lookUpKeys.length - 1) lastIndex = this.lookUpKeys.length - 1;
        const parts = matchId.split("_");
        const docID = parts[0];
        let text = "";
        for (let i = firstIndex; i <= lastIndex; i++) {
            const chunkKey = this.lookUpKeys[i];
            if (!chunkKey) continue;
            if (chunkKey.indexOf(docID) === 0) {
                if (this.lookupData[chunkKey]) {
                    text += this.annexChunkWithoutOverlap(text, this.lookupData[chunkKey]);
                }
            }
        }
        return text;
    }
    annexChunkWithoutOverlap(text: string, chunkText: string, searchDepth = 500): string {
        let startPos = -1;
        const l = Math.min(chunkText.length - 1, searchDepth);
        for (let nextPos = 1; nextPos < l; nextPos++) {
            const existingOverlap = text.slice(-1 * nextPos);
            const nextOverlap = chunkText.slice(0, nextPos);
            if (existingOverlap === nextOverlap) {
                startPos = nextPos;
                // break;
            }
        }
        if (startPos > 0) {
            if (this.verboseDebugging)
                console.log("overlap", chunkText.slice(0, startPos), startPos);
            return text + chunkText.slice(startPos) + " ";
        }
        if (this.verboseDebugging)
            console.log("no overlap");
        return text + chunkText + " ";
    }
    async embedPrompt(prompt: string, matches: any[]): Promise<string> {
        const embedIndex = this.embedding_type_select.selectedIndex;
        const promptTemplate = this.prompt_template_text_area.value;
        const documentTemplate = this.document_template_text_area.value;
        const promptT = (<any>window).Handlebars.compile(promptTemplate);
        const docT = (<any>window).Handlebars.compile(documentTemplate);
        let documentsEmbedText = "";
        let includeK = Number(this[this.dataSourcePrefix() + "includeK"]);
        let halfK = Math.ceil(includeK / 2);
        if (embedIndex === 0) {
            const includes = matches.slice(0, includeK);
            await this.fetchDocumentsLookup(includes.map((match: any) => match.id));
            includes.forEach((match: any, index: number) => {
                const merge = Object.assign({}, match.metadata);
                merge.id = match.id;
                merge.matchIndex = index;
                merge.text = this.lookupData[match.id];
                merge.prompt = prompt;
                if (!merge.text) {
                    console.log("missing merge", match.id, this.lookupData)
                    merge.text = "";
                }
                merge.text = merge.text.replaceAll("\n", " ");
                documentsEmbedText += (<any>docT)(merge);
            });
        } else if (embedIndex === 1) {
            const includes = matches.slice(0, halfK);
            await this.fetchDocumentsLookup(includes.map((match: any) => match.id));
            includes.forEach((match: any, index: number) => {
                const merge = Object.assign({}, match.metadata);
                merge.id = match.id;
                merge.matchIndex = index;
                merge.text = this.getSmallToBig(match.id, halfK);
                merge.prompt = prompt;
                if (!merge.text) {
                    console.log("missing merge", match.id, this.lookupData)
                    merge.text = "";
                }
                merge.text = merge.text.replaceAll("\n", " ");
                documentsEmbedText += (<any>docT)(merge);
            });
        } else if (embedIndex === 2) {
            const match = matches[0];
            await this.fetchDocumentsLookup([match.id]);
            const merge = Object.assign({}, match.metadata);
            merge.id = match.id;
            merge.matchIndex = 0;
            merge.prompt = prompt;
            merge.text = this.getSmallToBig(match.id, includeK);
            merge.text = merge.text.replaceAll("\n", " ");
            documentsEmbedText += (<any>docT)(merge);
        }

        const mainMerge = {
            documents: documentsEmbedText,
            prompt,
        };
        return (<any>promptT)(mainMerge);
    }
    populatePromptTemplates(templateIndex: number = -1, noSave = false) {
        if (templateIndex < 0) templateIndex = this.prompt_template_select_preset.selectedIndex - 1;

        this.prompt_template_text_area.value = promptTemplates[templateIndex].mainPrompt;
        this.document_template_text_area.value = promptTemplates[templateIndex].documentPrompt;
        if (!noSave) this.saveLocalStorage();
    }

    saveLocalStorage() {
        localStorage.setItem("covid_queryIndex", this.embedding_type_select.selectedIndex);
        localStorage.setItem("covid_lastPrompt", this.analyze_prompt_textarea.value);
        localStorage.setItem("covid_promptTemplate", this.prompt_template_text_area.value);
        localStorage.setItem("covid_documentTemplate", this.document_template_text_area.value);
    }
    async loadDocumentLookup(docId: string): Promise<any> {
        try {
            let lookupPath = this[this.dataSourcePrefix() + "LookupPath"];
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
    async fetchDocumentsLookup(idList: string[]) {
        const promises: any[] = [];
        const docIdMap: any = {};
        idList.forEach((chunkId: string) => {
            const parts = chunkId.split("_");
            let docId = parts[0] + "_" + parts[1];
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
}

const promptTemplates = [
    {
        mainPrompt: `Given the context information below and without prior knowledge, please answer the query.
Context:{{documents}}

Query: {{prompt}}
Overall Response to Query based on all documents:

In addition, respond for each document using the following format:
Title:
Summary:`,
        documentPrompt: `({{title}}):
  {{text}}
  `,
    },
    {
        mainPrompt: `Answer the question based on the context below.
Context:\n
{{documents}}\n
Question: {{prompt}}\n
Answer:`,
        documentPrompt: `Question: {{prompt}}
Answer: {{text}}\n`,
    },
    {
        mainPrompt: `Given the context information below and without prior knowledge, please answer the query.
Context:{{documents}}
Query: {{prompt}}

Provide title and a list of keywords for each document:`,
        documentPrompt: `({{title}}):
  {{text}}
  `,
    },
];