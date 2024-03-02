export class SongSearchApp {
    running = false;
    analyze_prompt_button = document.body.querySelector(".analyze_prompt_button") as HTMLButtonElement;
    analyze_prompt_textarea = document.body.querySelector(".analyze_prompt_textarea") as HTMLTextAreaElement;
    embedding_diagram_anchor: any = document.body.querySelector(".embedding_diagram_anchor");
    full_augmented_response = document.body.querySelector(".full_augmented_response") as HTMLDivElement;
    lookupData: any = {};
    lookedUpIds: any = {};
    semanticResults: any[] = [];
    chunkNormalAPIToken = "cfbde57f-a4e6-4eb9-aea4-36d5fbbdad16";
    chunkNormalSessionId = "8umxl4rdt32x";
    chunkNormalLookupPath = "https://firebasestorage.googleapis.com/v0/b/promptplusai.appspot.com/o/projectLookups%2FiMY1WwR6NkVnNkLId5bnKT59Np42%2Fsong-demo-v1%2FbyDocument%2FDOC_ID_URIENCODED.json?alt=media";
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

    promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
    queryUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
    loaded = false;
    lookUpKeys: string[] = [];
    verboseDebugging = false;

    constructor() {
        this.analyze_prompt_button.addEventListener("click", async () => {
            await this.lookupAIDocumentChunks();
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
    async lookupAIDocumentChunks(): Promise<any[]> {
        this.full_augmented_response.innerHTML = "";
        const message = this.analyze_prompt_textarea.value.trim();

        let result = await this.getMatchingVectors(message, 10, this.chunkNormalAPIToken, this.chunkNormalSessionId);

        let html = "";
        await this.fetchDocumentsLookup(result.matches.map((match: any) => match.id));
        result.matches.forEach((match) => {
            const textFrag = this.lookupData[match.id];
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
            <audio controls>
            <source src="${match.metadata.url}" type="audio/mpeg">
            </audio>
              <br>
              <div class="verse_card_text">${this.escapeHTML(textFrag)}</div>
              </div>`;
            html += block;
        });

        this.full_augmented_response.innerHTML = html;
        let audioControls = this.full_augmented_response.querySelectorAll("audio");
        audioControls.forEach((audio: HTMLAudioElement) => {
            audio.addEventListener("play", () => {
                audioControls.forEach((otherAudio: HTMLAudioElement) => {
                    if (otherAudio !== audio) {
                        otherAudio.pause();
                    }
                });
            });
        });

        return result.matches;
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
    async getMetricsForSong(song: string) {
        let sexScore = await this.sendPromptForMetric(song, "sexual");
        let violenceScore = await this.sendPromptForMetric(song, "violent");
        let drugScore = await this.sendPromptForMetric(song, "drug");
        let politicalScore = await this.sendPromptForMetric(song, "political");
        let religionScore = await this.sendPromptForMetric(song, "religious");
        let languageScore = await this.sendPromptForMetric(song, "mature language");
        let summary: any = {};
        try {
            summary.sexScore = JSON.parse(sexScore).contentRating;
            summary.violenceScore = JSON.parse(violenceScore).contentRating;
            summary.drugScore = JSON.parse(drugScore).contentRating;
            summary.politicalScore = JSON.parse(politicalScore).contentRating;
            summary.religionScore = JSON.parse(religionScore).contentRating;
            summary.languageScore = JSON.parse(languageScore).contentRating;
        }
        catch (error) {
            summary.error = true;
            console.log(error);
        }
        return summary;
    }
    async sendPromptForMetric(song: string, subject: string) {
        let fullprompt = `Rate the following song for ${subject} content 0-10: ${song}
Please respond with json and only json in this format:
{
  "contentRating": 0
}`;
        try {
            let result = await this.sendPromptToLLM(fullprompt);
            return result;
        } catch (error) {
            console.log(song, subject, error);
            return `{
        "contentRating": 0
      }`;
        }
    }
    async sendPromptToLLM(message: string): Promise<string> {

        const apiToken = this.chunkNormalAPIToken;
        const sessionId = this.chunkNormalSessionId;
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
}
