import { prompts } from "./prompts";

export class SongSearchApp {
    running = false;
    analyze_prompt_button = document.body.querySelector(".analyze_prompt_button") as HTMLButtonElement;
    analyze_prompt_textarea = document.body.querySelector(".analyze_prompt_textarea") as HTMLTextAreaElement;
    embedding_diagram_anchor: any = document.body.querySelector(".embedding_diagram_anchor");
    full_augmented_response = document.body.querySelector(".full_augmented_response") as HTMLDivElement;
    metric_filter_select = document.body.querySelector(".metric_filter_select") as HTMLSelectElement;
    filter_container = document.body.querySelector(".filter_container") as HTMLDivElement;
    audio_visualizer = document.body.querySelector(".audio_visualizer") as HTMLDivElement;
    song_playlist = document.body.querySelector(".song_playlist") as HTMLOListElement;
    audio_player = document.body.querySelector(".audio_player") as HTMLAudioElement;
    play_song = document.body.querySelector(".play_song") as HTMLButtonElement;
    add_song = document.body.querySelector(".add_song") as HTMLButtonElement;
    play_next = document.body.querySelector(".play_next") as HTMLButtonElement;
    visualizerSettings: any = {
        source: this.audio_player,
        bgColor: "#ffffff",
        bgAlpha: 0,
        radial: true,
        ledBars: true,
        showScaleX: false,
        showScaleY: false,
        colorMode: "bar-level",
        barSpace: 0,
        radius: 0,
        lineWidth: 0.5,
        frequencyScale: "log",
    };
    songsInPlaylist: any[] = [];
    motionVisualizer: any = null;
    lookupData: any = {};
    songMatchLookup: any = {};
    lookedUpIds: any = {};
    semanticResults: any[] = [];
    selectedFilters: any[] = [];
    playlistIndex = -1;
    chunkNormalAPIToken = "cfbde57f-a4e6-4eb9-aea4-36d5fbbdad16";
    chunkNormalSessionId = "8umxl4rdt32x";
    chunkNormalLookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FHlm0AZ9mUCeWrMF6hI7SueVPbrq1%2Fsong-demo-v3%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    chunkNormaltopK = 25;
    chunkNormalincludeK = 5;

    chunkRecursiveAPIToken = "cfbde57f-a4e6-4eb9-aea4-36d5fbbdad16";
    chunkRecursiveSessionId = "8umxl4rdt32x";
    chunkRecursiveLookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FiMY1WwR6NkVnNkLId5bnKT59Np42%2Fsong-demo-v1%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    chunkRecursivetopK = 25;
    chunkRecursiveincludeK = 5;

    sentenceChunkAPIToken = "cfbde57f-a4e6-4eb9-aea4-36d5fbbdad16";
    sentenceChunkSessionId = "8umxl4rdt32x";
    sentenceChunkLookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FiMY1WwR6NkVnNkLId5bnKT59Np42%2Fsong-demo-v1%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
    sentenceChunktopK = 15;
    sentenceChunkincludeK = 3;
    metricPrompts: any[] = [];
    promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    queryUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
    loaded = false;
    lookUpKeys: string[] = [];
    verboseDebugging = false;

    constructor() {
        this.analyze_prompt_button.addEventListener("click", async () => {
            await this.lookupAIDocumentChunks();
        });
        this.analyze_prompt_textarea.addEventListener("keydown", (e: any) => {
            if (e.key === "Enter" && e.shiftKey === false) {
                e.preventDefault();
                e.stopPropagation();
                this.analyze_prompt_button.click();
            }
        });
        this.analyze_prompt_textarea.addEventListener("input", () => {
            localStorage.setItem("song_lastPrompt", this.analyze_prompt_textarea.value);
        });
        this.play_next.addEventListener("click", () => this.playNext());
        this.metric_filter_select.addEventListener("input", () => this.addMetricFilter());
        this.audio_player.addEventListener("ended", () => {
            this.playNext();
        });
        this.motionVisualizer = new (<any>window).AudioMotionAnalyzer(this.audio_visualizer, this.visualizerSettings);
        this.audio_visualizer.addEventListener("click", () => { this.motionVisualizer.toggleFullscreen(); });
        this.motionVisualizer.onCanvasResize = (reason: string) => {
            this.resizeVisualizer(reason);    
        };
        this.resizeVisualizer(); 
        this.load();
    }
    addMetricFilter() {
        const metaField = this.metric_filter_select.value;
        this.selectedFilters.push({ metaField, value: 1, operator: "$gte" });
        this.renderFilters();
        this.saveFiltersToLocalStorage();
        this.metric_filter_select.selectedIndex = 0;
    }
    resizeVisualizer(reason: string = "") { 
        let canvasWidth = this.motionVisualizer.canvas.scrollWidth;
        let canvasHeight = this.motionVisualizer.canvas.scrollHeight;

        if (canvasHeight > canvasWidth) {
            const scale = canvasHeight / canvasWidth;
            this.motionVisualizer.canvas.style.transform = `scaleY(${scale})`;
        } else {
            const scale = canvasWidth / canvasHeight;
            console.log("SCALE", scale, canvasHeight, canvasWidth);
            if (this.motionVisualizer.isFullscreen) {
                const offset = canvasWidth * (scale - 1) - (canvasWidth - canvasHeight) / 2;
                this.motionVisualizer.canvasCtx.scale(scale, 1);
                this.motionVisualizer.canvasCtx.translate(-offset, 0);
            } else {
                this.motionVisualizer.canvas.style.transform = `scaleX(${scale})`;
            }
        }
    }
    renderFilters() {
        this.filter_container.innerHTML = "";
        this.selectedFilters.forEach((filter: any, filterIndex: number) => {
            let filterDiv = document.createElement("div");
            filterDiv.innerHTML = this.selectedFilterTemplate(filter, filterIndex);
            this.filter_container.appendChild(filterDiv);
        });
        this.filter_container.querySelectorAll("button").forEach((button: HTMLButtonElement) => {
            button.addEventListener("click", () => {
                let filterIndex = Number(button.getAttribute("data-filterindex"));
                this.selectedFilters.splice(filterIndex, 1);
                this.renderFilters();
                this.saveFiltersToLocalStorage();
            });
        });
        this.filter_container.querySelectorAll("select").forEach((select: HTMLSelectElement) => {
            select.addEventListener("input", () => {
                let filterIndex = Number(select.getAttribute("data-filterindex"));
                this.selectedFilters[filterIndex].operator = select.value;
                this.saveFiltersToLocalStorage();
            });
        });
        this.filter_container.querySelectorAll("input").forEach((input: HTMLInputElement) => {
            input.addEventListener("input", () => {
                let filterIndex = Number(input.getAttribute("data-filterindex"));
                this.selectedFilters[filterIndex].value = input.value;
                this.saveFiltersToLocalStorage();
            });
        });

        let html = "<option>Choose a metric</option>";
        this.metricPrompts.forEach((prompt: any) => {
            let promptUsed = false;
            this.selectedFilters.forEach((filter: any) => {
                if (filter.metaField === prompt.id) promptUsed = true;
            });

            if (promptUsed === false) html += `<option>${prompt.id}</option>`;
        });
        this.metric_filter_select.innerHTML = html;
    }
    async getMatchingVectors(message: string, topK: number, apiToken: string, sessionId: string): Promise<any> {
        const filter: any = {};
        this.selectedFilters.forEach((selectedFilter: any) => {
            filter[selectedFilter.metaField] = { [selectedFilter.operator]: Number(selectedFilter.value) };
        });

        const body = {
            message,
            apiToken,
            sessionId,
            topK,
            filter,
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
    saveFiltersToLocalStorage() {
        localStorage.setItem("song_filters", JSON.stringify(this.selectedFilters));
    }
    savePlaylistToLocalStorage() {
        const songExport = this.songsInPlaylist.map((song: string) => this.songMatchLookup[song]);
        localStorage.setItem("song_playlist", JSON.stringify(songExport));
    }
    loadPlaylistFromLocalStorage() {
        const playlistRaw = localStorage.getItem("song_playlist");
        let playlistMap: any = [];
        if (playlistRaw) playlistMap = JSON.parse(playlistRaw);
        this.songsInPlaylist = playlistMap.map((songData: any) => songData.id);
        this.songMatchLookup = {};
        playlistMap.forEach((song: any) => {
            this.songMatchLookup[song.id] = song;
        });
        this.renderPlaylist();
    }
    load() {
        this.metricPrompts = prompts;
        this.loaded = true;

        this.hydrateFromLocalStorage();
    }
    async lookupAIDocumentChunks(): Promise<any[]> {
        this.full_augmented_response.innerHTML = "";
        const message = this.analyze_prompt_textarea.value.trim();
        let result = await this.getMatchingVectors(message, 10, this.chunkNormalAPIToken, this.chunkNormalSessionId);

        let html = "";
        await this.fetchDocumentsLookup(result.matches.map((match: any) => match.id));
        result.matches.forEach((match: any) => {
            const textFrag = this.lookupData[match.id];
            this.songMatchLookup[match.id] = match;
            if (!textFrag) {
                console.log(match.id, this.lookupData)
            }
            const dstring = match.metadata.coverDate;
            const parts = match.id.split("_");
            const docID = parts[0];
            const chunkIndex = Number(parts[2]);
            const chunkCount = parts[3];
            const block = `<div class="verse_card">
            <span style="float:right;font-size:.9em;border:solid 1px silver;padding:.2em;">Match: <b>${(match.score * 100).toFixed()}%</b><br>
            </span>
            ${match.metadata.artist} - ${match.metadata.title}
            <br>
            rom: ${match.metadata.romantic} com: ${match.metadata.comedic} lang: ${match.metadata.inappropriatelanguage} 
            <br>
            mat: ${match.metadata.mature} sea: ${match.metadata.seasonal} mot: ${match.metadata.motivational} 
            <br>
            pol: ${match.metadata.political} reli: ${match.metadata.religious} sad: ${match.metadata.sad}
            <br>
            vio: ${match.metadata.violent}
            <button class="btn btn-primary play_song" data-song="${match.id}"><i class="material-icons">play_arrow</i></button>
            <button class="btn btn-primary add_song" data-song="${match.id}"><i class="material-icons">add</i></button>
              <br>
              <div class="verse_card_text">${this.escapeHTML(textFrag)}</div>
              </div>`;
            html += block;
        });


        this.full_augmented_response.innerHTML = html;
        let addButtons = this.full_augmented_response.querySelectorAll(".add_song");
        addButtons.forEach((button: any) => {
            button.addEventListener("click", () => {
                let songId = button.getAttribute("data-song");
                this.addSongToPlaylist(songId);
            });
        });

        return result.matches;
    }
    addSongToPlaylist(song: string) {
        this.songsInPlaylist.push(song);
        this.renderPlaylist();
        this.savePlaylistToLocalStorage();
    }
    renderPlaylist() {
        this.song_playlist.innerHTML = "";
        this.songsInPlaylist.forEach((song: string) => {
            const data = this.songMatchLookup[song];
            let li = document.createElement("li");
            li.innerHTML = `<span>${data.metadata.title}</span>`;
            this.song_playlist.appendChild(li);
        });
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
            let lookupPath = this.chunkNormalLookupPath;
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
    hydrateFromLocalStorage() {
        const lastPrompt = localStorage.getItem("song_lastPrompt");
        if (lastPrompt) this.analyze_prompt_textarea.value = lastPrompt;
        this.analyze_prompt_textarea.setSelectionRange(0, this.analyze_prompt_textarea.value.length);
        const filters = localStorage.getItem("song_filters");
        if (filters) this.selectedFilters = JSON.parse(filters);
        this.renderFilters();
        this.loadPlaylistFromLocalStorage();
        this.renderPlaylist();
        this.playNext();
    }
    playNext() {
        if (this.songsInPlaylist.length === 0) return;
        this.playlistIndex++;
        const songId = this.songsInPlaylist[this.playlistIndex % this.songsInPlaylist.length];
        const songData = this.songMatchLookup[songId];
        this.audio_player.src = songData.metadata.url;
        try {
            this.audio_player.play();
        } catch (error: any) {
            console.log("FAILED TO PLAY", error);
        }
    }
    selectedFilterTemplate(filter: any, filterIndex: number): string {
        const title = filter.metaField;
        const lessThan = filter.operator === "$lte" ? "selected" : "";
        const greaterThan = filter.operator === "$gte" ? "selected" : "";
        return `<div>
       <div style="padding:4px;display: inline-block;">
         <span class="metric_filter_title">${title}</span>
       </div>
       <div style="padding:4px;display: inline-block;">
         <select class="form-select" name="" data-filterindex="${filterIndex}">
           <option value="$lte" ${lessThan}>less than</option>
           <option value="$gte" ${greaterThan}>greater than</option>
         </select>
       </div>
       <button style="float: right;" data-filterindex="${filterIndex}">
         <i class="material-icons">delete</i>
       </button>
       <br>
       <div style="padding:4px;display: inline-block;width: 340px;">
         <input type="range" class="form-range" min="0" max="10" step="1" value="${filter.value}" data-filterindex="${filterIndex}">
       </div>
     </div>`
    }
    titleCase(title: string): string {
        return title[0].toUpperCase() + title.slice(1).toLowerCase();
    }
}
