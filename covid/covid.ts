export class CovidDemoApp {
    running = false;
    analyze_prompt_button = document.body.querySelector(".analyze_prompt_button") as HTMLButtonElement;
    lookup_verse_response_feed = document.body.querySelector(".lookup_verse_response_feed") as HTMLDivElement;
    summary_details = document.body.querySelector(".summary_details") as HTMLDivElement;
    full_augmented_response = document.body.querySelector(".full_augmented_response") as HTMLDivElement;
    analyze_prompt_textarea = document.body.querySelector(".analyze_prompt_textarea") as HTMLTextAreaElement;
    lookup_chapter_response_feed: any = document.body.querySelector(".lookup_chapter_response_feed");
    nav_link = document.body.querySelectorAll(".nav-link");
    btn_close = document.body.querySelector(".btn-close") as HTMLButtonElement;
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
    lookupData: any = {};
    lookedUpIds: any = {};
    semanticResults: any[] = [];
    chunk300APIToken = "12781bbc-5d71-4359-831b-377e06d4a27b";
    chunk300SessionId = "cyf1pd1l4wpc";
    chunk300LookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FHlm0AZ9mUCeWrMF6hI7SueVPbrq1%2Fcovid-list-v3%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    chunk300topK = 25;
    chunk300includeK = 5;

    promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    queryUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
    loaded = false;
    lookUpKeys: string[] = [];

    constructor() {
        this.load();
        this.analyze_prompt_button.addEventListener("click", () => this.analyzePrompt());
        this.prompt_template_select_preset.addEventListener("input", () => this.populatePromptTemplates());
        this.embedding_type_select.addEventListener("input", () => this.updateRAGImages());

        this.full_augmented_prompt_button.addEventListener("click", () => this.clearMenusAndPopups());
        this.full_augmented_response_button.addEventListener("click", () => this.clearMenusAndPopups());
        this.augmented_template_button.addEventListener("click", () => this.clearMenusAndPopups());

        this.analyze_prompt_textarea.addEventListener("input", () => this.saveLocalStorage());
        this.prompt_template_text_area.addEventListener("input", () => this.saveLocalStorage());
        this.document_template_text_area.addEventListener("input", () => this.saveLocalStorage());

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
        if (this.embedding_type_select.selectedIndex === 0) {
            this.embedding_diagram_img.src = "img/rag_basic.png";
            this.embedding_diagram_anchor.href = "img/rag_basic.png";
        }
        if (this.embedding_type_select.selectedIndex === 1) {
            this.embedding_diagram_img.src = "img/rag_stb.png";
            this.embedding_diagram_anchor.href = "img/rag_stb.png";
        }
    }
    hydrateFromLocalStorage() {
        const lastPrompt = localStorage.getItem("covid_lastPrompt");
        if (lastPrompt) this.analyze_prompt_textarea.value = lastPrompt;
        const promptTemplate = localStorage.getItem("covid_promptTemplate");
        if (promptTemplate) this.prompt_template_text_area.value = promptTemplate;
        const documentTemplate = localStorage.getItem("covid_documentTemplate");
        if (documentTemplate) this.document_template_text_area.value = documentTemplate;

        let templateIndex = localStorage.getItem("covid_templateIndex") || 0;
        this.prompt_template_select_preset.selectedIndex = templateIndex as number;
        let queryIndex = localStorage.getItem("covid_queryIndex") || 0;
        this.embedding_type_select.selectedIndex = queryIndex as number;

        if (!promptTemplate) this.populatePromptTemplates(templateIndex as number, true);
    }
    clearMenusAndPopups() {
        this.btn_close.click();
    }
    updateEmbeddingOptionsDisplay() {
        let includeK = Number(this[this.dataSourcePrefix() + "includeK"]);
        this.embed_distinct_chunks_option.innerHTML = `Embed ${includeK}  Document Chunks`;
        this.embed_sequential_chunks_option.innerHTML = `Embed 1 Chunk with ${includeK} Additional Contexts`;
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
        if (!message) {
            alert("please supply a message");
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
        this.full_augmented_response.innerHTML += "Similar document chunks retrieved...<br><br>";

        this.full_augmented_response.innerHTML = await this.sendPromptToLLM();
        this.full_augmented_response.innerHTML +=
            `<br><div class="d-flex flex-column link-primary" style="white-space:normal;"><a class="response_verse_link p-2" href="see verses">Top Search Results
    </a><a class="response_detail_link p-2" href="see details">Prompt Details</a></div>`;

        const verseLink = this.full_augmented_response.querySelector(".response_verse_link") as HTMLAnchorElement;
        verseLink.addEventListener("click", (e: any) => {
            e.preventDefault();
            (<any>(document.getElementById("source_view_button"))).click();
        });
        const detailLink = this.full_augmented_response.querySelector(".response_detail_link") as HTMLAnchorElement;
        detailLink.addEventListener("click", (e: any) => {
            e.preventDefault();
            (<any>(document.getElementById("full_augmented_prompt_button"))).click();
        });

        this.analyze_prompt_button.removeAttribute("disabled");
        this.analyze_prompt_button.innerHTML = `<span class="material-icons-outlined mt-1">
    send
    </span>`;
        this.running = false;
        document.body.classList.add("complete");
        document.body.classList.remove("running");
    }
    dataSourcePrefix(): string {
        // let prefix = localStorage.getItem("datachunk_source_size");
        // if (prefix) return prefix as string;
        return "chunk300";
    }
    load() {
        this.loaded = true;
        const l: any = document.querySelector(".loading_screen")
        l.style.display = "none";
        const m: any = document.querySelector(".tab_main_content");
        m.style.display = "flex";
        this.analyze_prompt_textarea.focus();
        this.analyze_prompt_textarea.select();
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

        let html = '<span class="small text-muted">Most Relevant Chunks...</span><br>';
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
              <a href="${match.metadata.url}" target="_blank">${match.metadata.title}</a> ${chunkIndex}/${chunkCount}<div style="text-align:right">${d}</div><br>
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
      <label>Full Raw Prompt</label>: <div class="raw_prompt">${prompt}</div><br>`;

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
            return promptResult.assist.error;
        } else {
            return promptResult.assist.assist.choices["0"].message.content;
        }
    }
    async embedPrompt(prompt: string, matches: any[]): Promise<string> {
        const embedIndex = this.embedding_type_select.selectedIndex;
        const promptTemplate = this.prompt_template_text_area.value;
        const documentTemplate = this.document_template_text_area.value;
        const promptT = (<any>window).Handlebars.compile(promptTemplate);
        const docT = (<any>window).Handlebars.compile(documentTemplate);
        let documentsEmbedText = "";
        if (embedIndex === 0) {
            let includeK = Number(this[this.dataSourcePrefix() + "includeK"]);
            const includes = matches.slice(0, includeK);
            await this.fetchDocumentsLookup(includes.map((match: any) => match.id));
            includes.forEach((match: any, index: number) => {
                const merge = Object.assign({}, match.metadata);
                merge.id = match.id;
                merge.matchIndex = index;
                merge.text = this.lookupData[match.id];

                console.log(merge);
                documentsEmbedText += (<any>docT)(merge);
            });
        } else if (embedIndex === 1) {
            const match = matches[0];
            await this.fetchDocumentsLookup([match.id]);
            const merge = Object.assign({}, match.metadata);
            merge.id = match.id;
            merge.matchIndex = 0;
            const lookUpIndex = this.lookUpKeys.indexOf(match.id);

            let includeK = Number(this[this.dataSourcePrefix() + "includeK"]);
            let firstIndex = lookUpIndex - Math.floor(includeK / 2);
            let lastIndex = lookUpIndex + Math.ceil(includeK / 2);
            if (firstIndex < 0) firstIndex = 0;
            if (lastIndex > this.lookUpKeys.length - 1) lastIndex = this.lookUpKeys.length - 1;
            const parts = match.id.split("_");
            const docID = parts[0];
            console.log("this is merge object", merge, firstIndex, lastIndex, docID);
            for (let i = firstIndex; i <= lastIndex; i++) {
                const chunkKey = this.lookUpKeys[i];
                if (chunkKey.indexOf(docID) === 0) {
                    merge.text += this.lookupData[chunkKey] + "\n";
                }
            }
            documentsEmbedText += (<any>docT)(merge);
        }

        const mainMerge = {
            documents: documentsEmbedText,
            prompt,
        };
        return (<any>promptT)(mainMerge);
    }
    populatePromptTemplates(templateIndex: number = -1, noSave = false) {
        if (templateIndex < 0) templateIndex = this.prompt_template_select_preset.selectedIndex;

        this.prompt_template_text_area.value = promptTemplates[templateIndex].mainPrompt;
        this.document_template_text_area.value = promptTemplates[templateIndex].documentPrompt;
        if (!noSave) this.saveLocalStorage();
    }

    saveLocalStorage() {
        localStorage.setItem("covid_templateIndex", this.prompt_template_select_preset.selectedIndex);
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