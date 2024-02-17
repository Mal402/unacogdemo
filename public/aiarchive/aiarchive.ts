export class AIArchiveDemoApp {
    running = false;
    analyze_prompt_button = document.body.querySelector(".analyze_prompt_button") as HTMLButtonElement;
    lookup_verse_response_feed = document.body.querySelector(".lookup_verse_response_feed") as HTMLDivElement;
    summary_details = document.body.querySelector(".summary_details") as HTMLDivElement;
    full_augmented_response = document.body.querySelector(".full_augmented_response") as HTMLDivElement;
    analyze_prompt_textarea = document.body.querySelector(".analyze_prompt_textarea") as HTMLTextAreaElement;
    lookup_chapter_response_feed = document.body.querySelector(".lookup_chapter_response_feed") as HTMLDivElement;
    nav_link = document.body.querySelectorAll(".nav-link");
    augmented_template_button = document.body.querySelector("#augmented_template_button") as HTMLButtonElement;
    embedding_type_select = document.body.querySelector(".embedding_type_select") as HTMLSelectElement;
    embedding_diagram_img = document.body.querySelector(".embedding_diagram_img") as HTMLImageElement;
    embedding_diagram_anchor = document.body.querySelector(".embedding_diagram_anchor") as HTMLAnchorElement;
    prompt_template_text_area = document.body.querySelector(".prompt_template_text_area") as HTMLTextAreaElement;
    document_template_text_area = document.body.querySelector(".document_template_text_area") as HTMLTextAreaElement;
    prompt_template_select_preset = document.body.querySelector(".prompt_template_select_preset") as HTMLSelectElement;
    reset_template_options_button = document.body.querySelector(".reset_template_options_button") as HTMLButtonElement;
    datachunk_source_size_buttons = document.body.querySelectorAll(`[name="datachunk_source_size"]`);
    embed_distinct_chunks_option = document.body.querySelector(".embed_distinct_chunks_option") as HTMLOptionElement;
    embed_sequential_chunks_option = document.body.querySelector(".embed_sequential_chunks_option") as HTMLOptionElement;
    embed_sequential_chunks2_option = document.body.querySelector(".embed_sequential_chunks2_option") as HTMLOptionElement;
    lookupData: any = {};
    lookedUpIds: any = {};
    semanticResults: any[] = [];
    chunk100APIToken = "8b9e7b73-cad1-44c7-9a3b-07eb6914bc1a";
    chunk100SessionId = "h3gb1s7uxt02";
    chunk100LookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FHlm0AZ9mUCeWrMF6hI7SueVPbrq1%2Far-arxiv-full-100%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    chunk100topK = 25;
    chunk100includeK = 15;

    chunk200APIToken = "96b0d708-ec04-4da5-bcf3-783ffc5329eb";
    chunk200SessionId = "x5m51v87x7g8";
    chunk200LookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FiMY1WwR6NkVnNkLId5bnKT59Np42%2Far-arxiv-full%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    chunk200topK = 25;
    chunk200includeK = 10;

    chunk300APIToken = "7f585847-9c4b-4da8-99e8-4102408f1564";
    chunk300SessionId = "2pa7jvukf892";
    chunk300LookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2Farxivchunkedv2%2FDOC_ID_URIENCODED.json?alt=media";
    chunk300topK = 25;
    chunk300includeK = 8;

    chunk400APIToken = "8168ca87-2017-49ad-a8f3-bba00683e7de";
    chunk400SessionId = "ppdbgryy52mn";
    chunk400LookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FHlm0AZ9mUCeWrMF6hI7SueVPbrq1%2Far-arxiv-full-400%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    chunk400topK = 25;
    chunk400includeK = 5;

    promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    queryUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
    loaded = false;
    lookUpKeys: string[] = [];

    constructor() {
        this.load();
        this.analyze_prompt_button.addEventListener("click", () => this.analyzePrompt());
        this.prompt_template_select_preset.addEventListener("input", () => this.populatePromptTemplates());
        this.embedding_type_select.addEventListener("input", () => this.updateRAGImages());

        this.analyze_prompt_textarea.addEventListener("input", () => this.saveLocalStorage());
        this.prompt_template_text_area.addEventListener("input", () => this.saveLocalStorage());
        this.document_template_text_area.addEventListener("input", () => this.saveLocalStorage());

        this.analyze_prompt_textarea.addEventListener("keydown", (e: any) => {
            if (e.key === "Enter" && e.shiftKey === false) {
                e.preventDefault();
                e.stopPropagation();
                this.analyze_prompt_button.click();
            }
        });
        this.reset_template_options_button.addEventListener("click", (e: Event) => {
            e.preventDefault();
            localStorage.clear();
            location.reload();
        });
        this.analyze_prompt_textarea.focus();
        this.analyze_prompt_textarea.select();

        this.datachunk_source_size_buttons.forEach((btn: any) => btn.addEventListener("input", () => {
            localStorage.setItem("ai_datachunk_source_size", btn.value);
            this.load();
        }));

        this.hydrateFromLocalStorage();
        this.updateEmbeddingOptionsDisplay();
        this.updateRAGImages();
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
    updateEmbeddingOptionsDisplay() {
        let includeK = Number(this[this.dataSourcePrefix() + "includeK"]);
        let halfK = Math.ceil(includeK / 2);
        this.embed_distinct_chunks_option.innerHTML = `Embed ${includeK}  Document Chunks`;
        this.embed_sequential_chunks_option.innerHTML = `Embed ${halfK} Chunks with ${halfK} Additional Contexts`;
        this.embed_sequential_chunks2_option.innerHTML = `Embed 1 Chunk with ${includeK} Additional Contexts`;
    }
    updateRAGImages() {
        if (this.embedding_type_select.selectedIndex === 0) {
            this.embedding_diagram_img.src = "img/rag_basic.svg";
            this.embedding_diagram_anchor.href = "img/rag_basic.svg";
        } else  {
            this.embedding_diagram_img.src = "img/rag_stb.svg";
            this.embedding_diagram_anchor.href = "img/rag_stb.svg";
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
    dataSourcePrefix(): string {
        let prefix = localStorage.getItem("ai_datachunk_source_size");
        if (prefix) return prefix as string;
        return "chunk400";
    }
    async load() {
        this.loaded = true;
        this.lookupData = {};
        this.lookedUpIds = {};
        this.updateEmbeddingOptionsDisplay();
    }
    hydrateFromLocalStorage() {
        const lastPrompt = localStorage.getItem("ai_lastPrompt");
        if (lastPrompt) this.analyze_prompt_textarea.value = lastPrompt;
        this.analyze_prompt_textarea.setSelectionRange(0, this.analyze_prompt_textarea.value.length);
        const promptTemplate = localStorage.getItem("ai_promptTemplate");
        if (promptTemplate) this.prompt_template_text_area.value = promptTemplate;
        const documentTemplate = localStorage.getItem("ai_documentTemplate");
        if (documentTemplate) this.document_template_text_area.value = documentTemplate;

        if (!promptTemplate) {
            this.populatePromptTemplates(0, true);
        }
        let queryIndex = localStorage.getItem("ai_queryIndex") || 0;
        this.embedding_type_select.selectedIndex = queryIndex as number;
        let chunkSize = this.dataSourcePrefix();
        this.datachunk_source_size_buttons.forEach((btn: any) => {
            if (btn.value === chunkSize) btn.checked = true;
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
            const dstring = match.metadata.published;
            const d = dstring.slice(0, 4) + "-" + dstring.slice(4, 6) + "-" + dstring.slice(6, 8);
            const parts = match.id.split("_");
            const docID = parts[0];
            const chunkIndex = Number(parts[1]);
            const chunkCount = parts[2];
            const block = `<div class="verse_card">
            <span style="float:right;font-size:.9em;border:solid 1px silver;padding:.2em;">Match: <b>${(match.score * 100).toFixed()}%</b><br>
            ${d}
            </span>
            ${chunkIndex}/${chunkCount}
            <a href="${match.metadata.url}" target="_blank">${match.metadata.title}</a>
              <br>
              <div class="verse_card_text">${textFrag}</div>
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
    async loadDocumentLookup(docId: string): Promise<any> {
        try {
            let lookupPath = this[this.dataSourcePrefix() + "LookupPath"];
            lookupPath = lookupPath.replace("DOC_ID_URIENCODED", docId);
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
                    text += this.lookupData[chunkKey] + "\n";
                }
            }
        }
        return text;
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
        localStorage.setItem("ai_queryIndex", this.embedding_type_select.selectedIndex.toString());
        localStorage.setItem("ai_lastPrompt", this.analyze_prompt_textarea.value);
        localStorage.setItem("ai_promptTemplate", this.prompt_template_text_area.value);
        localStorage.setItem("ai_documentTemplate", this.document_template_text_area.value);
    }
}

const promptTemplates = [
    {
        mainPrompt: `You are an AI research assistant. Your job is to answer my prompt based on the context information provided below:
---------------------
{{documents}}
---------------------
Answer the following prompt:
{{prompt}}`,
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
        mainPrompt: `Context information is below.
---------------------
{{documents}}
---------------------
Given the context information and not prior knowledge, answer the query.
Query: {{prompt}}
Answer:`,
        documentPrompt: `({{title}}):
  {{text}}
  `,
    },
];