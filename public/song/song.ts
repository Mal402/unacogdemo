import { prompts } from "./metrics";
import { configs as visualizers } from "./visualizers";

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
    add_song = document.body.querySelector(".add_song") as HTMLButtonElement;
    play_next = document.body.querySelector(".play_next") as HTMLButtonElement;
    chunk_select = document.body.querySelector(".chunk_select") as HTMLSelectElement;
    song_title_container = document.body.querySelector(".song_title_container") as HTMLDivElement;
    song_title_click_wrapper = document.body.querySelector(".song_title_click_wrapper") as HTMLDivElement;
    show_search_overlay = document.body.querySelector(".show_search_overlay") as HTMLButtonElement;
    closed_caption_btn = document.body.querySelector(".closed_caption_btn") as HTMLButtonElement;
    ui_container = document.body.querySelector(".ui_container") as HTMLDivElement;
    full_display_lyrics = document.body.querySelector(".full_display_lyrics") as HTMLDivElement;
    lyric_overlay = document.body.querySelector(".lyric_overlay") as HTMLDivElement;
    visualizer_select = document.body.querySelector(".visualizer_select") as HTMLSelectElement;
    close_search_overlay = document.body.querySelector(".close_search_overlay") as HTMLButtonElement;
    searchShowing = false;
    songsInPlaylist: any[] = [];
    motionVisualizer: any = null;
    lookupData: any = {};
    songMatchLookup: any = {};
    lookedUpIds: any = {};
    semanticResults: any[] = [];
    selectedFilters: any[] = [];
    playlistIndex = -1;
    songChunkMeta = {
        apiToken: "cfbde57f-a4e6-4eb9-aea4-36d5fbbdad16",
        sessionId: "8umxl4rdt32x",
        lookupPath: "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FHlm0AZ9mUCeWrMF6hI7SueVPbrq1%2Fsong-demo-v3%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media",
        topK: 25,
    }
    stanzaChunkMeta = {
        apiToken: "b0a5f137-b5ff-4b78-8074-79a3f775a212",
        sessionId: "prg66uadseer",
        lookupPath: "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FHlm0AZ9mUCeWrMF6hI7SueVPbrq1%2Fsong-demo-v6-4-1%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media",
        topK: 25,
    }
    verseChunkMeta = {
        apiToken: "6b71e856-1dee-4f9d-bd53-64b6adafc592",
        sessionId: "bsec9cwrpl72",
        lookupPath: "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FHlm0AZ9mUCeWrMF6hI7SueVPbrq1%2Fsong-demo-v6-verse%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media",
        topK: 25,
    }
    doubleStanzaChunkMeta = {
        apiToken: "3b09a640-7f63-4776-becc-7deab9b9507c",
        sessionId: "ux4odeb8jqu7",
        lookupPath: "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FHlm0AZ9mUCeWrMF6hI7SueVPbrq1%2Fsong-demo-v3-double-stanze%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media",
        topK: 25,
    }
    metricPrompts: any[] = [];
    metricPromptMap: any = {};
    promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    queryUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
    loaded = false;
    lookUpKeys: string[] = [];
    verboseDebugging = false;
    runningQuery = false;
    displayDocHtmlDoc: any = {};
    constructor() {
        this.analyze_prompt_button.addEventListener("click", async () => {
            this.analyze_prompt_button.disabled = true;
            this.analyze_prompt_button.innerHTML = "...";
            await this.lookupAIDocumentChunks();
            this.analyze_prompt_button.disabled = false;
            this.analyze_prompt_button.innerHTML = `<i class="material-icons">search</i>`;
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

        let vOptionList = "";
        visualizers.forEach((config: any, index: number) => {
            vOptionList += `<option value="${index}">${config.name}</option>`;
        });
        this.visualizer_select.innerHTML = vOptionList;
        let vIndex = Number(localStorage.getItem("song_visualizer"));
        if (!vIndex) vIndex = 0;
        this.visualizer_select.selectedIndex = vIndex;
        this.visualizer_select.addEventListener("input", () => {
            const vIndex = this.visualizer_select.selectedIndex;
            localStorage.setItem("song_visualizer", vIndex.toString());
            this.updateMotionVisualizer();
        });

        this.updateMotionVisualizer();
        this.chunk_select.addEventListener("input", () => {
            localStorage.setItem("song_filterSize", this.chunk_select.value);
            this.lookupData = {};
            this.lookedUpIds = {};
        });
        this.song_title_click_wrapper.addEventListener("click", () => {
            this.showOverlay("playlist", true);
        });
        this.closed_caption_btn.addEventListener("click", () => {
            this.showOverlay("lyrics", true);
        });
        this.show_search_overlay.addEventListener("click", () => {
            this.showOverlay("search", true);
        });
        this.close_search_overlay.addEventListener("click", () => {
            this.showOverlay("none");
        });

        window.addEventListener("resize", () => {
            this.resizeVisualizer();
        });

        window.addEventListener("keydown", (e: any) => {
            if (this.searchShowing === true) return;
            if (e.key === "ArrowRight") {
                this.playNext();
            }
            if (e.key === "ArrowLeft") {
                this.playNext(this.playlistIndex - 2);
            }
            if (e.key === "ArrowDown") {
                this.audio_player.currentTime -= 5;
            }
            if (e.key === "ArrowUp") {
                this.audio_player.currentTime += 5;
            }
            if (e.key === " ") {
                if (this.audio_player.paused) this.audio_player.play();
                else this.audio_player.pause();
            }
            if (e.key === "s") {
                this.show_search_overlay.click();
            }
            if (e.key === "l") {
                this.closed_caption_btn.click();
            }
            if (e.key === "p") {
                this.song_title_click_wrapper.click();
            }
            if (e.key === ".") {
                this.visualizer_select.selectedIndex += 1;
                if (this.visualizer_select.selectedIndex === -1) this.visualizer_select.selectedIndex = 0;
                this.visualizer_select.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (e.key === ",") {
                this.visualizer_select.selectedIndex -= 1;
                if (this.visualizer_select.selectedIndex === -1) this.visualizer_select.selectedIndex = this.visualizer_select.options.length - 1;
                this.visualizer_select.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        const introModalDom = document.getElementById('hello_modal') as HTMLElement;
        const introModal = new (window as any).bootstrap.Modal(introModalDom);
        introModalDom.addEventListener('hidden.bs.modal', (e: Event) => {
            this.load();
        });
        introModal.show();

        setInterval(() => {
            this.polledUpdateStatus();
        }, 10);
    }
    updateMotionVisualizer() {
        let vIndex = Number(localStorage.getItem("song_visualizer"));
        if (!vIndex) vIndex = 0;
        const config: any = visualizers[vIndex];
        config.source = this.audio_player;
        if (!this.motionVisualizer) {
            this.motionVisualizer = new (<any>window).AudioMotionAnalyzer(this.audio_visualizer, config);
        } else {
            this.motionVisualizer.setOptions(undefined);
            this.motionVisualizer.setOptions(config);
        }

        this.resizeVisualizer();
    }
    polledUpdateStatus() {
        if (this.audio_player.paused) return;
        const playedAmt = this.audio_player.currentTime / this.audio_player.duration;
        const fullHeight = this.full_display_lyrics.scrollHeight;
        const containerHeight = this.lyric_overlay.clientHeight;
        const scrollAmt = (fullHeight - containerHeight) * playedAmt;
        this.lyric_overlay.scrollTo(0, scrollAmt);
    }
    showOverlay(overlayName: string = "none", toggle = false) {
        const overlays = ["none", "playlist", "lyrics", "search"];
        overlays.forEach((overlay: string) => {
            if (overlay === overlayName) {
                if (document.body.classList.contains(overlay) === false) {
                    if (overlayName === "search") this.searchShowing = true;
                    document.body.classList.add(overlay);
                } else if (toggle === true) {
                    document.body.classList.remove(overlay);
                }
            } else {
                document.body.classList.remove(overlay);
            }
        });
    }
    addMetricFilter() {
        const metaField = this.metric_filter_select.value;
        this.selectedFilters.push({ metaField, value: 1, operator: "$gte" });
        this.renderFilters();
        this.saveFiltersToLocalStorage();
        this.metric_filter_select.selectedIndex = 0;
    }
    resizeVisualizer(reason: string = "") {
        let canvasWidth = this.motionVisualizer.canvas.width;
        let canvasHeight = this.motionVisualizer.canvas.height;

        if (this.motionVisualizer.isFullscreen) {
            document.body.classList.add("fullscreen");
        } else {
            document.body.classList.remove("fullscreen");
        }
        if (canvasHeight > canvasWidth) {
            const scale = canvasHeight / canvasWidth;
            if (this.motionVisualizer.isFullscreen) {
                const offset = (canvasHeight * scale - canvasHeight) / 2;
                this.motionVisualizer.canvasCtx.translate(0, -offset);
                this.motionVisualizer.canvasCtx.scale(1, scale);
            } else {
                this.motionVisualizer.canvas.style.transform = `scaleY(${scale})`;
            }
        } else {
            const scale = canvasWidth / canvasHeight;
            if (this.motionVisualizer.isFullscreen) {
                const offset = (canvasWidth * scale - canvasWidth) / 2;
                this.motionVisualizer.canvasCtx.translate(-offset, 0);
                this.motionVisualizer.canvasCtx.scale(scale, 1);
            } else {
                this.motionVisualizer.canvas.style.transform = `scaleX(${scale})`;
            }
        }
    }
    renderFilters() {
        this.filter_container.innerHTML = "";
        this.selectedFilters.forEach((filter: any, filterIndex: number) => {
            let filterDiv = document.createElement("div");
            filterDiv.classList.add("filter-element");
            filterDiv.innerHTML = this.selectedFilterTemplate(filter, filterIndex);
            this.filter_container.appendChild(filterDiv);
        });
        this.filter_container.querySelectorAll(".delete-button").forEach((button) => {
            (button as HTMLButtonElement).addEventListener("click", () => {
                let filterIndex = Number(button.getAttribute("data-filterindex"));
                this.selectedFilters.splice(filterIndex, 1);
                this.renderFilters();
                this.saveFiltersToLocalStorage();
            });
        });
        this.filter_container.querySelectorAll(".filter-select select").forEach((select: Element) => {
            select.addEventListener("input", () => {
                let filterIndex = Number(select.getAttribute("data-filterindex"));
                this.selectedFilters[filterIndex].operator = (select as any).value;
                this.saveFiltersToLocalStorage();
            });
        });
        this.filter_container.querySelectorAll(".filter-value select").forEach((select: Element) => {
            select.addEventListener("input", () => {
                let filterIndex = Number(select.getAttribute("data-filterindex"));
                this.selectedFilters[filterIndex].value = (select as any).value;
                this.saveFiltersToLocalStorage();
            });
        });
        let html = "<option>metric...</option>";
        this.metricPrompts.forEach((prompt: any) => {
            let promptUsed = false;
            this.selectedFilters.forEach((filter: any) => {
                if (filter.metaField === prompt.id) promptUsed = true;
            });
            if (promptUsed === false) html += `<option value="${prompt.id}">${prompt.title}</option>`;
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
        this.lookupData = {};
        this.lookedUpIds = {};
        this.metricPromptMap = {};
        this.metricPrompts.forEach((prompt: any) => {
            this.metricPromptMap[prompt.id] = prompt;
        });
        this.hydrateFromLocalStorage();
    }
    getChunkSizeMeta(): any {
        const chunkSize = this.chunk_select.value;
        if (chunkSize === "verse") return this.verseChunkMeta;
        if (chunkSize === "stanza") return this.stanzaChunkMeta;
        if (chunkSize === "doublestanza") return this.doubleStanzaChunkMeta;
        return this.songChunkMeta;
    }
    generateDisplayText(matchId: string, highlight = false): string {
        const chunkSize = this.chunk_select.value;
        if (chunkSize === "verse") {
            const parts = matchId.split("_");
            const docID = parts[0];
            const chunkIndex = Number(parts[parts.length - 2]) - 1;
            const chunkCount = Number(parts[parts.length - 1]);
            let html = "";
            for (let i = 0; i < chunkCount; i++) {
                const paddedChunkIndex = (i + 1).toString().padStart(5, "0");
                const chunkId = `${docID}_${paddedChunkIndex}_${chunkCount}`;
                const chunkHTML = this.lookupData[chunkId];
                if (chunkHTML) {
                    if (i === chunkIndex && highlight) html += `<span class="verse_chunk_highlight">${chunkHTML}</span>\n`;
                    else html += chunkHTML + "\n";
                }
            }
            return html;
        }
        if (chunkSize === "stanza") {
            const parts = matchId.split("_");
            const docID = parts[0];
            const chunkIndex = Number(parts[parts.length - 2]) - 1;
            const chunkCount = Number(parts[parts.length - 1]);
            let html = "";
            for (let i = 0; i < chunkCount; i++) {
                const paddedChunkIndex = (i + 1).toString().padStart(5, "0");
                const chunkId = `${docID}_${paddedChunkIndex}_${chunkCount}`;
                const rawText = this.lookupData[chunkId];
                let chunkLines = rawText.split("\n");
                chunkLines.forEach((line: string, lineIndex: number) => {
                    chunkLines[lineIndex] = line.trim();
                });
                if (i !== 0) {
                    chunkLines.splice(0, 1);
                    if (i === chunkIndex + 1 && highlight) {
                        chunkLines[0] = `<span class="stanza_chunk_overlap">${chunkLines[0]}</span>`;
                    }
                }
                if (i !== chunkCount - 1) {
                    chunkLines.splice(-1, 1);
                    if (i === chunkIndex - 1 && highlight) {
                        let lastIndex = chunkLines.length - 1;
                        chunkLines[lastIndex] = `<span class="stanza_chunk_overlap">${chunkLines[lastIndex]}</span>`;
                    }
                }
                const chunkHTML = chunkLines.join("\n");
                if (chunkHTML) {
                    if (i === chunkIndex && highlight) html += `<span class="stanza_chunk_highlight">${chunkHTML}</span>\n`;
                    else html += chunkHTML + "\n";
                }
            }
            return html;
        }
        if (chunkSize === "doublestanza") {
            const parts = matchId.split("_");
            const docID = parts[0];
            const chunkIndex = Number(parts[parts.length - 2]) - 1;
            const chunkCount = Number(parts[parts.length - 1]);
            let html = "";
            for (let i = 0; i < chunkCount; i++) {
                const paddedChunkIndex = (i + 1).toString().padStart(5, "0");
                const chunkId = `${docID}_${paddedChunkIndex}_${chunkCount}`;
                const rawText = this.lookupData[chunkId];
                let chunkLines = rawText.split("\n");
                chunkLines.forEach((line: string, lineIndex: number) => {
                    chunkLines[lineIndex] = line.trim();
                });
                if (i !== 0) {
                    chunkLines.splice(0, 2);
                    if (i === chunkIndex + 1 && highlight) {
                        chunkLines[0] = `<span class="stanza_chunk_overlap">${chunkLines[0]}\n${chunkLines[1]}</span>`;
                    }
                }
                if (i !== chunkCount - 1) {
                    chunkLines.splice(-2, 2);
                    if (i === chunkIndex - 1 && highlight) {
                        let lastIndex = chunkLines.length - 1;
                        chunkLines[lastIndex] = `<span class="stanza_chunk_overlap">${chunkLines[lastIndex - 1]}\n${chunkLines[lastIndex]}</span>`;
                    }
                }
                const chunkHTML = chunkLines.join("\n");
                if (chunkHTML) {
                    if (i === chunkIndex && highlight) html += `<span class="stanza_chunk_highlight">${chunkHTML}</span>\n`;
                    else html += chunkHTML + "\n";
                }
            }
            return html;
        }
        const displayDocHTML = this.lookupData[matchId];
        return displayDocHTML;
    }
    async lookupAIDocumentChunks() {
        if (this.runningQuery === true) return;
        this.full_augmented_response.innerHTML = `<span class="text-light">Search running...</span>`;
        this.runningQuery = true;
        const message = this.analyze_prompt_textarea.value.trim();
        const chunkSizeMeta = this.getChunkSizeMeta();
        let result = await this.getMatchingVectors(message, chunkSizeMeta.topK, chunkSizeMeta.apiToken, chunkSizeMeta.sessionId);
        if (result.success === false) {
            console.log("FAILED TO FETCH", result);
            this.full_augmented_response.innerHTML = "Error fetching results. Please refer to console for details.";
            this.runningQuery = false;
            return;
        }

        let html = "";
        await this.fetchDocumentsLookup(result.matches.map((match: any) => match.id));
        result.matches.forEach((match: any) => {
            this.songMatchLookup[match.id] = match;
            let displayDocHTML = this.generateDisplayText(match.id, true);
            match.fullText = this.generateDisplayText(match.id);
            if (!displayDocHTML) {
                console.log(match.id, this.lookupData)
            }

            const generateSongCard = (match: any) => {
                const categories = ['romantic', 'comedic', 'inappropriatelanguage', 'mature', 'seasonal', 'motivational', 'political', 'religious', 'sad', 'violent'];
                let catString = `<span class="badge bg-success"><b>${(match.score * 100).toFixed()}%</b></span>`;
                categories.forEach(category => {
                    if (match.metadata[category] !== 0) {
                        catString += `
                          <span class="badge bg-primary me-1">${category}: ${match.metadata[category]}</span>`;
                    }
                });
                return `
                  <div class="song_card card mb-1 text-white" data-songcardid="${match.id}" style="background:rgba(50, 50, 50, .25);">
                    <div class="card-body match-card">
                      <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title" style="flex:1">${match.metadata.artist} - ${match.metadata.title}</h5>
                        <button class="btn play_song me-2 text-white" data-song="${match.id}">
                        <i class="material-icons">play_arrow</i>
                      </button>
                      <button class="btn add_song text-white" data-song="${match.id}">
                        <i class="material-icons">playlist_add</i>
                      </button>
                    </div>
                    <div style="display:flex; flex-direction:row;">
                        <div style="flex:1">${catString}</div>
                        <div>
                            <button class="btn show_lyrics_modal text-white" data-song="${match.id}">
                               <i class="material-icons">lyrics</i>
                            </button>
                        </div>
                    </div>
                    </div>
                </div>`;
            }
            let block = generateSongCard(match);
            this.displayDocHtmlDoc[match.id] = displayDocHTML;
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
        let playButtons = this.full_augmented_response.querySelectorAll(".play_song");
        playButtons.forEach((button: any) => {
            button.addEventListener("click", () => {
                let songId = button.getAttribute("data-song");
                this.addPlayNow(songId);
            });
        });

        let lyricButtons = this.full_augmented_response.querySelectorAll(".show_lyrics_modal");
        lyricButtons.forEach((button: any) => {
            button.addEventListener("click", () => {
                let songId = button.getAttribute("data-song");
                let displayHTML = this.displayDocHtmlDoc[songId];
                this.showLyricsModal(songId, displayHTML);
            });
        });


        this.runningQuery = false;
        return;
    }
    showLyricsModal(songId: string, displayHTML: string) {
        if (displayHTML === "") displayHTML = this.generateDisplayText(songId);
        const modalDom = document.getElementById('lyrics_modal') as HTMLElement;
        const modal = new (window as any).bootstrap.Modal(modalDom);
        let contentDiv = modalDom.querySelector(".lyrics_modal_content") as HTMLDivElement;
        contentDiv.innerHTML = displayHTML;
        modal.show();
    }
    addPlayNow(song: string) {
        if (this.songsInPlaylist.includes(song) === false) this.songsInPlaylist.unshift(song);
        this.playlistIndex = this.songsInPlaylist.indexOf(song);
        this.audio_player.src = this.songMatchLookup[song].metadata.url;
        this.audio_player.play();
        this.renderPlaylist();
        this.savePlaylistToLocalStorage();
    }
    addSongToPlaylist(song: string) {
        this.songsInPlaylist.push(song);
        this.renderPlaylist();
        this.savePlaylistToLocalStorage();
    }
    removeSongFromPlaylist(songIndex: string) {
        let songIndexNum = Number(songIndex);
        this.songsInPlaylist.splice(songIndexNum, 1);
        if (this.playlistIndex === songIndexNum) {
            this.playlistIndex--;
            if (this.playlistIndex < 0) this.playlistIndex = 0;
            this.playNext(this.playlistIndex);
        }
        if (this.playlistIndex > songIndexNum) this.playlistIndex--;
        this.renderPlaylist();
        this.savePlaylistToLocalStorage();
    }
    renderPlaylist() {
        this.song_playlist.innerHTML = "";
        this.songsInPlaylist.forEach((song: string, songIndex: number) => {
            const data = this.songMatchLookup[song];
            let li = document.createElement("li");
            li.classList.add("song_playlist_item");
            li.classList.add("list-group-item");
            if (this.playlistIndex === songIndex) li.classList.add("selected");
            li.innerHTML = `<div style="display:flex; flex-direction:row;color:#fff"><div style="flex:1;">${data.metadata.title}</div>
            <button class="btn playlist_buttons play_song_playlist" data-songindex="${songIndex}"><i class="material-icons">play_arrow</i></button>
            <button class="btn playlist_buttons remove_song" data-songindex="${songIndex}"><i class="material-icons">delete</i></button>
            <div>`;
            this.song_playlist.appendChild(li);
        });
        let remove_buttons = this.song_playlist.querySelectorAll(".remove_song");
        remove_buttons.forEach((button: any) => {
            button.addEventListener("click", () => {
                this.removeSongFromPlaylist(button.getAttribute("data-songindex"));
            });
        });
        let play_buttons = this.song_playlist.querySelectorAll(".play_song_playlist");
        play_buttons.forEach((button: any) => {
            button.addEventListener("click", () => {
                this.playNext(Number(button.getAttribute("data-songindex")));
            });
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
            let lookupPath = this.getChunkSizeMeta().lookupPath;
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
        const songFilterSize = localStorage.getItem("song_filterSize");
        if (songFilterSize) this.chunk_select.value = songFilterSize;
        if (this.chunk_select.selectedIndex === -1) this.chunk_select.selectedIndex = 0;
        const listIndex = localStorage.getItem("song_listIndex");
        if (listIndex) this.playlistIndex = Number(listIndex) - 1;
        this.renderFilters();
        this.loadPlaylistFromLocalStorage();
        this.renderPlaylist();
        this.playNext();
    }
    playNext(songIndex: number = -1) {
        if (this.songsInPlaylist.length === 0) return;
        if (songIndex !== -1)
            this.playlistIndex = songIndex
        else
            this.playlistIndex++;
        this.playlistIndex = this.playlistIndex % this.songsInPlaylist.length;
        const songId = this.songsInPlaylist[this.playlistIndex];
        const songData = this.songMatchLookup[songId];
        this.audio_player.src = songData.metadata.url;
        try {
            this.audio_player.play();
        } catch (error: any) {
            console.log("FAILED TO PLAY", error);
        }
        this.renderPlaylist();
        this.song_title_container.innerHTML = `${songData.metadata.title} - ${songData.metadata.artist}`;

        this.full_display_lyrics.innerHTML = songData.fullText;
        localStorage.setItem("song_listIndex", this.playlistIndex.toString());
    }
    selectedFilterTemplate(filter: any, filterIndex: number): string {
        const title = this.metricPromptMap[filter.metaField].title;
        const lessThan = filter.operator === "$lte" ? "selected" : "";
        const greaterThan = filter.operator === "$gte" ? "selected" : "";
        return `<div class="filter-header">
                    <span class="metric-filter-title">${title}</span>
                    </div>
                    <div class="filter-body">
                    <div class="filter-select">
                        <select class="bg-dark text-white" data-filterindex="${filterIndex}">
                        <option value="$lte" ${lessThan}>≤</option>
                        <option value="$gte" ${greaterThan}>≥</option>
                        </select>
                    </div>
                    <div class="filter-value">
                        <select class="bg-dark text-white" data-filterindex="${filterIndex}">
                        ${Array.from({ length: 11 }, (_, i) => `<option value="${i}" ${Number(filter.value) === i ? 'selected' : ''}>${i}</option>`).join('')}
                        </select>
                    </div>
                    </div>
                    <button class="delete-button bg-dark text-white" data-filterindex="${filterIndex}">
                    <i class="material-icons">close</i>
                    </button>`;
    }
    titleCase(title: string): string {
        return title[0].toUpperCase() + title.slice(1).toLowerCase();
    }
}
