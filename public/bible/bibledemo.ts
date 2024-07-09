export class BibleDemoApp {
  running = false;
  analyze_prompt_button = document.body.querySelector(".analyze_prompt_button") as HTMLButtonElement;
  lookup_verse_response_feed = document.body.querySelector(".lookup_verse_response_feed") as HTMLDivElement;
  summary_details = document.body.querySelector(".summary_details") as HTMLDivElement;
  full_augmented_response = document.body.querySelector(".full_augmented_response") as HTMLDivElement;
  analyze_prompt_textarea = document.body.querySelector(".analyze_prompt_textarea") as HTMLTextAreaElement;
  lookup_chapter_response_feed = document.body.querySelector(".lookup_chapter_response_feed") as HTMLDivElement;
  nav_link = document.body.querySelectorAll(".nav-link");
  btn_close = document.body.querySelector(".btn-close") as HTMLButtonElement;
  full_augmented_prompt_button = document.body.querySelector("#full_augmented_prompt_button") as HTMLButtonElement;
  full_augmented_response_button = document.body.querySelector("#full_augmented_response_button") as HTMLButtonElement;
  augmented_template_button = document.body.querySelector("#augmented_template_button") as HTMLButtonElement;
  embedding_type_select = document.body.querySelector(".embedding_type_select") as HTMLSelectElement;
  embedding_diagram_img = document.body.querySelector(".embedding_diagram_img") as HTMLImageElement;
  embedding_diagram_anchor = document.body.querySelector(".embedding_diagram_anchor") as HTMLAnchorElement;
  embedding_diagram_img_caption: any = document.body.querySelector(".embedding_diagram_img_caption");
  prompt_template_text_area = document.body.querySelector(".prompt_template_text_area") as HTMLTextAreaElement;
  document_template_text_area = document.body.querySelector(".document_template_text_area") as HTMLTextAreaElement;
  prompt_template_select_preset = document.body.querySelector(".prompt_template_select_preset") as HTMLSelectElement;
  reset_template_options_button = document.body.querySelector(".reset_template_options_button") as HTMLButtonElement;
  bibleData: any[] = [];
  byVerseAPIToken = "e1fb3fa9-6bd4-43a1-874f-ed2be00cc619";
  byVerseSessionId = "fj9r703hi53q";
  byChapterToken = "5a098b7a-ad8a-4127-aba6-59c5aad1e447";
  byChapterSessionId = "un74d9y24fk5";
  promptUrl = `https://us-central1-unacog-68ebf.cloudfunctions.net/lobbyApi/session/external/message`;
  queryUrl = `https://us-central1-unacog-68ebf.cloudfunctions.net/lobbyApi/session/external/vectorquery`;
  loaded = false;

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

    this.hydrateFromLocalStorage();
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
    await Promise.all([
      await this.lookupChapters(),
      await this.lookupChaptersByVerse(),
    ]);
    this.full_augmented_response.innerHTML += `<a class="response_chapter_link p-2" href="see chapter">Top Chapters</a> retrieved...
<br><a class="response_verse_link p-2 mt-4" href="see verses">Top Verses</a> retrieved...

<a class="response_detail_link p-2" href="see details">Prompt Details</a> 
    <br><br>`;
    this._addHandlersToFeed();
    this.full_augmented_response.innerHTML = await this.sendPromptToLLM();
    this.full_augmented_response.innerHTML +=
      `<br><div class="d-flex flex-column link-primary" style="white-space:normal;">
<a class="response_verse_link p-2 mt-4" href="see verses">Top Verses</a>
<a class="response_chapter_link p-2" href="see chapter">Top Chapters</a>
<a class="response_detail_link p-2" href="see details">Prompt Details</a>
</div>`;
    this._addHandlersToFeed();

    this.analyze_prompt_button.removeAttribute("disabled");
    this.analyze_prompt_button.innerHTML = `<span class="material-icons-outlined">
      send
      </span>`;
    this.running = false;
    document.body.classList.add("complete");
    document.body.classList.remove("running");
  }
  _addHandlersToFeed() {
    const verseLink = this.full_augmented_response.querySelector(".response_verse_link");
    if (verseLink) {
      verseLink.addEventListener("click", (e: any) => {
        e.preventDefault();
        const sourcesModal: any = document.querySelector("#sourcesModal");
        (new (<any>window).bootstrap.Modal(sourcesModal)).show();
      });
    }
    const chapterLink = this.full_augmented_response.querySelector(".response_chapter_link");
    if (chapterLink) {
      chapterLink.addEventListener("click", (e: any) => {
        e.preventDefault();
        const chaptersModal: any = document.querySelector("#chaptersModal");
        (new (<any>window).bootstrap.Modal(chaptersModal)).show();
      });
    }
    const detailLink = this.full_augmented_response.querySelector(".response_detail_link");
    if (detailLink) {
      detailLink.addEventListener("click", (e: any) => {
        e.preventDefault();
        const fullPromptModal: any = document.querySelector("#fullPromptModal");
        (new (<any>window).bootstrap.Modal(fullPromptModal)).show();
      });
    }
  }
  updateRAGImages() {
    if (this.embedding_type_select.selectedIndex === 0) {
      this.embedding_diagram_img.src = "img/ragVerses.svg";
      this.embedding_diagram_anchor.href = "img/ragVerses.svg";
      this.embedding_diagram_img_caption.innerHTML = "Embed top matching verses";
    } else if (this.embedding_type_select.selectedIndex === 1) {
      this.embedding_diagram_img.src = "img/ragChunks.svg";
      this.embedding_diagram_anchor.href = "img/ragChunks.svg";
      this.embedding_diagram_img_caption.innerHTML = "Match most relevant verse, embed surrounding verses";
    } else if (this.embedding_type_select.selectedIndex === 2) {
       this.embedding_diagram_img.src = "img/ragChapterVerses.svg";
      this.embedding_diagram_anchor.href = "img/ragChapterVerses.svg";
      this.embedding_diagram_img_caption.innerHTML = "Match most relevant verse, embed full chapter";
    } else if (this.embedding_type_select.selectedIndex === 3) {
      this.embedding_diagram_img.src = "img/ragChapters.svg";
      this.embedding_diagram_anchor.href = "img/ragChapters.svg";
      this.embedding_diagram_img_caption.innerHTML = "Embed top matching chapter";
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
  async load() {
    const bibleDataResponse = await fetch("flattenedbible.json");
    this.bibleData = await bibleDataResponse.json();
    this.loaded = true;
    const abc: any = document.getElementById("full_augmented_response");
    abc.style.display = "";
    this.analyze_prompt_textarea.focus();
    this.analyze_prompt_textarea.select();
  }
  hydrateFromLocalStorage() {
    const lastPrompt = localStorage.getItem("lastPrompt");
    if (lastPrompt) this.analyze_prompt_textarea.value = lastPrompt;
    let promptTemplate = localStorage.getItem("promptTemplate");
    if (!promptTemplate) promptTemplate = promptTemplates[0].mainPrompt;
    if (promptTemplate) this.prompt_template_text_area.value = promptTemplate;
    let documentTemplate = localStorage.getItem("documentTemplate");
    if (!documentTemplate) documentTemplate = promptTemplates[0].documentPrompt;
    if (documentTemplate) this.document_template_text_area.value = documentTemplate;

    let queryIndex = localStorage.getItem("queryIndex") || 0;
    this.embedding_type_select.selectedIndex = queryIndex as number;
    if (!promptTemplate) this.populatePromptTemplates(0, true);
  }
  async lookupChaptersByVerse() {
    this.lookup_verse_response_feed.innerHTML = "";
    const message = this.analyze_prompt_textarea.value.trim();

    let result = await this.getMatchingVectors(message, 10, this.byVerseAPIToken, this.byVerseSessionId);
    if (!result.success) {
      console.log("error", result);
      this.full_augmented_response.innerHTML = result.errorMessage;
      return;
    }

    let html = "";
    result.matches.forEach((match) => {
      const verse = this.getVerse(match.metadata.bookIndex, match.metadata.chapterIndex, match.metadata.verseIndex).text;
      const block = `<div class="verse_card">
            <a data-bookindex="${match.metadata.bookIndex}" data-link="book">${match.metadata.book}</a> 
            <a data-bookindex="${match.metadata.bookIndex}" data-link="chapter"
                      data-chapterindex="${match.metadata.chapterIndex}">${Number(match.metadata.chapterIndex) + 1}</a>:
            <span data-bookindex="${match.metadata.bookIndex}" data-link="verse"
            data-chapterindex="${match.metadata.chapterIndex}"
            data-verseindex="${match.metadata.verseIndex}">${Number(match.metadata.verseIndex) + 1}</span>
            <span style="float: right;">Match: ${(match.score * 100).toFixed()}%</span>
              <br>
              <div class="small-caps">${verse}</div>
            </div>`;
      html += block;
    });
    this.lookup_verse_response_feed.innerHTML = html;

    this.lookup_verse_response_feed.querySelectorAll("a").forEach(((a: any) => a.addEventListener("click", (e: any) => {
      e.preventDefault();
      if (a.dataset.link === "book") {
        const bookIndex = Number(a.dataset.bookindex);
        alert(bookIndex)
      }
      if (a.dataset.link === "chapter") {
        const bookIndex = Number(a.dataset.bookindex);
        const chapterIndex = Number(a.dataset.chapterindex);
        alert(bookIndex + " : " + chapterIndex);
      }
      if (a.dataset.link === "verse") {
        const bookIndex = Number(a.dataset.bookindex);
        const chapterIndex = Number(a.dataset.chapterindex);
        const verseIndex = Number(a.dataset.verseindex);
        alert(bookIndex + " : " + chapterIndex + " : " + verseIndex);
      }
    })));
  }
  async lookupChapters(): Promise<void> {
    this.lookup_chapter_response_feed.innerHTML = "";
    const message = this.analyze_prompt_textarea.value.trim();
    if (!message) {
      alert("please supply a message");
      return;
    }

    let result = await this.getMatchingVectors(message, 5, this.byChapterToken, this.byChapterSessionId);
    if (!result.success) {
      console.log("error", result);
      this.full_augmented_response.innerHTML = result.errorMessage;
      return;
    }

    let html = "";
    result.matches.forEach((match) => {
      const verse = this.getChapter(match.metadata.bookIndex, match.metadata.chapterIndex, match.metadata.verseIndex).text;

      const block = `<div class="verse_card">
          <a data-bookindex="${match.metadata.bookIndex}" data-link="book">${match.metadata.book}</a>
          <span data-bookindex="${match.metadata.bookIndex}" data-link="chapter"
                    data-chapterindex="${match.metadata.chapterIndex}">${Number(match.metadata.chapterIndex) + 1}</span>
          <span style="float: right;">Match: ${(match.score * 100).toFixed()}%</span>
            <hr>
            <div class="small-caps">${verse}</div>
          </div>`;
      html += block;
    });

    this.lookup_chapter_response_feed.innerHTML = html;

    this.lookup_chapter_response_feed.querySelectorAll("a").forEach((a => a.addEventListener("click", (e) => {
      e.preventDefault();
      if (a.dataset.link === "book") {
        const bookIndex = Number(a.dataset.bookindex);
        alert(bookIndex);
      }
      if (a.dataset.link === "chapter") {
        const bookIndex = Number(a.dataset.bookindex);
        const chapterIndex = Number(a.dataset.chapterindex);
        alert(bookIndex + " : " + chapterIndex);
      }
    })));
  }
  getChapter(bookIndex: string, chapterIndex: string, verseIndex = -1): any {
    let verses = this.bibleData.filter((verse) => {
      if (verse.bookIndex.toString() === bookIndex &&
        verse.chapterIndex.toString() === chapterIndex)
        return true;
      return false;
    });
    verses = verses.sort((a, b) => {
      if (Number(a.verseIndex) > Number(b.verseIndex)) return 1;
      if (Number(a.verseIndex) < Number(b.verseIndex)) return -1;
      return 0;
    });

    let html = "";
    let text = "";
    verses.forEach((verse) => {
      let selectedClass = verse.verseIndex.toString() === verseIndex.toString() ? " selected" : "";
      html += `<span class="verse_line ${selectedClass}">${verse.verse}</span>&nbsp;`;
      text += verse.verse + "\n";
    });

    return {
      text,
      html,
    };
  }
  getVerse(bookIndex: string, chapterIndex: string, verseIndex: string): any {
    let verses = this.bibleData.filter((verse) => {
      if (verse.bookIndex.toString() === bookIndex &&
        verse.chapterIndex.toString() === chapterIndex &&
        verse.verseIndex.toString() === verseIndex)
        return true;
      return false;
    });
    let text = verses[0].verse;
    return {
      text,
    };
  }
  /** returns 5 verse chunk - less if first or last verse */
  getVersesChunk(bookIndex: string, chapterIndex: string, verseIndex: string): any {
    // get verses for chapter
    let verses = this.bibleData.filter((verse) => {
      if (verse.bookIndex.toString() === bookIndex &&
        verse.chapterIndex.toString() === chapterIndex)
        return true;
      return false;
    });
    let localVerses = verses.sort((a: any, b: any) => {
      if (a.verseIndex > b.verseIndex) return 1;
      if (a.verseIndex < b.verseIndex) return -1;
      return 0;
    });
    let text = "";
    let vIndex = Number(verseIndex);
    for (let c = 0, l = localVerses.length; c < l; c++) {
      if (c >= vIndex - 2 && c <= vIndex + 2) text += verses[c].verse + " ";
    }
    return {
      text,
    };
  }
  getBooks(): any {
    const books = {};
    this.bibleData.forEach((row) => {
      let book = books[row.bookIndex];
      if (!book) {
        book = {};
        books[row.bookIndex] = book;
      }
      let chapter = book[row.chapterIndex];
      if (!chapter) {
        chapter = {};
        book[row.chapterIndex] = chapter;
      }
      chapter[row.verseIndex] = row;
    });
    return books;
  }
  getChaptersByBook(): any[] {
    const books = this.getBooks();
    const bookList = Object.keys(books);
    const rows: any[] = [];
    bookList.forEach(bookIndex => {
      const chapterIndexes = Object.keys(books[bookIndex]);
      chapterIndexes.forEach(chapterIndex => {
        const chapter = this.getChapter(bookIndex, chapterIndex);
        rows.push({
          book: books[bookIndex][chapterIndex]["0"].book,
          bookIndex,
          chapterIndex,
          text: chapter.text,
        })
      });
    });

    return rows;
  }
  getQueryDetails(): any {
    if (this.embedding_type_select.selectedIndex === 0) {
      return {
        topK: 10,
        includeK: 10,
        include: "verse",
        pineconeDB: "verse",
        apiToken: this.byVerseAPIToken,
        sessionId: this.byVerseSessionId,
      };
    } else if (this.embedding_type_select.selectedIndex === 1) {
      return {
        topK: 10,
        includeK: 5,
        include: "verseChunk",
        pineconeDB: "verse",
        apiToken: this.byVerseAPIToken,
        sessionId: this.byVerseSessionId,
      };
    } else if (this.embedding_type_select.selectedIndex === 2) {
      return {
        topK: 10,
        includeK: 2,
        include: "chapter",
        pineconeDB: "verse",
        apiToken: this.byVerseAPIToken,
        sessionId: this.byVerseSessionId,
      };
    } else {
      return {
        topK: 5,
        includeK: 2,
        include: "chapter",
        pineconeDB: "chapter",
        apiToken: this.byChapterToken,
        sessionId: this.byChapterSessionId,
      };
    }
  }
  async sendPromptToLLM(): Promise<string> {
    this.saveLocalStorage();
    const message = this.analyze_prompt_textarea.value.trim();
    if (!message) {
      return "please supply a message";
    }
    const queryDetails = this.getQueryDetails();

    let result = await this.getMatchingVectors(message, queryDetails.topK, queryDetails.apiToken, queryDetails.sessionId);

    if (!result.success) {
      console.log("error", result);
      return result.errorMessage;
    }
    let matches: any[] = result.matches;
    if (queryDetails.topK !== queryDetails.includeK) {
      matches = [result.matches[0]];
      let cIndex = result.matches[0].metadata.chapterIndex;
      let bIndex = result.matches[0].metadata.bookIndex;
      for (let c = 1, l = result.matches.length; c < l; c++) {
        if (matches.length >= queryDetails.includeK) break;
        let match = result.matches[c];
        if (match.metadata.chapterIndex.toString() !== cIndex.toString() || match.metadata.bookIndex.toString() !== bIndex.toString()) {
          matches.push(match);
        }
      }
    }

    const prompt = this.embedPrompt(message, matches, queryDetails);
    const diagram = this.embedding_diagram_img.src;
    this.summary_details.innerHTML = `<a target="_blank" class="embedding_diagram_anchor" href="${diagram}"><img style="width:100px;float:right" class="embedding_diagram_img" src="${diagram}" alt=""></a>
    <label>Granularity Level</label>: ${this.embedding_type_select.selectedIndex < 3 ? "Verse" : "Chapter"}<br>
    <label>Small to Big</label>: ${this.embedding_type_select.selectedIndex < 2 ? "True" : "False"}<br>
    <label>Top K</label>: ${queryDetails.topK}<br>
    <label>Include K</label>: ${queryDetails.includeK}<br><br>
    <div class="raw_prompt">${prompt}</div><br>`;


    const body = {
      message: prompt,
      apiToken: queryDetails.apiToken,
      sessionId: queryDetails.sessionId,
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
      return result.errorMessage;
    }
    if (promptResult.assist.error) {
      return promptResult.assist.error.message;
    } else if (promptResult.assist.assist.error) {
      return promptResult.assist.assist.error.message;
    } else {
      return promptResult.assist.assist.choices["0"].message.content;
    }
  }
  embedPrompt(prompt: string, matches: any[], queryDetails: any): string {
    const promptTemplate = this.prompt_template_text_area.value;
    const documentTemplate = this.document_template_text_area.value;
    const promptT = (<any>window).Handlebars.compile(promptTemplate);
    const docT = (<any>window).Handlebars.compile(documentTemplate);

    let documentsEmbedText = "";
    matches.forEach((match: any, index: number) => {
      const merge = Object.assign({}, match.metadata);
      merge.id = match.id;
      merge.matchIndex = index;
      merge.text = this.getTextForMatch(match, queryDetails);
      documentsEmbedText += (<any>docT)(merge);
    });

    const mainMerge = {
      documents: documentsEmbedText,
      prompt,
    };
    return (<any>promptT)(mainMerge);
  }
  getTextForMatch(match: any, queryDetails: any) {
    if (queryDetails.include === "chapter") {
      return this.getChapter(match.metadata.bookIndex, match.metadata.chapterIndex).text;
    } else if (queryDetails.include === "verseChunk") {
      return this.getVersesChunk(match.metadata.bookIndex, match.metadata.chapterIndex, match.metadata.verseIndex).text;
    } else {
      return this.getVerse(match.metadata.bookIndex, match.metadata.chapterIndex, match.metadata.verseIndex).text;
    }
  }
  populatePromptTemplates(templateIndex: number = -1, noSave = false) {
    if (templateIndex < 0) templateIndex = this.prompt_template_select_preset.selectedIndex - 1;

    this.prompt_template_text_area.value = promptTemplates[templateIndex].mainPrompt;
    this.document_template_text_area.value = promptTemplates[templateIndex].documentPrompt;
    if (!noSave) this.saveLocalStorage();
  }
  saveLocalStorage() {
    localStorage.setItem("queryIndex", this.embedding_type_select.selectedIndex.toString());
    localStorage.setItem("lastPrompt", this.analyze_prompt_textarea.value);
    localStorage.setItem("promptTemplate", this.prompt_template_text_area.value);
    localStorage.setItem("documentTemplate", this.document_template_text_area.value);
  }
}

const promptTemplates = [
  {
    mainPrompt: `Please evaluate these bible verses for their level of violence appropriateness for 16-year-olds, rating them on a scale from 1 to 10, where 10 means completely inappropriate due to violence and 1 means fully appropriate with no concerning violent content. Provide a one-sentence justification for each rating:
{{documents}}

Respond in this format for each document:
<b>Title</b>:
<b>Score</b>:
<b>Verse Text</b>:
<b>Explanation</b>:
<hr>`
    ,
    documentPrompt: `Document Id: {{id}}  Index: {{matchIndex}}  Title: {{title}}:
{{text}}
`,
  },
  {
    mainPrompt: `Please assess the age appropriateness of these bible verses using the Maturity-Based Rating (MBR) system. Assign a recommended minimum age for each document, considering factors like language, themes, and content maturity. Include a brief explanation for your recommended age:
{{documents}}

Respond in this format for each document:
<b>Title</b>: 
<b>Verse Text</b>:
<b>Recommended Age</b>: 
<b>Explanation</b>:
<hr>
`
    ,
    documentPrompt: `Document Id: {{id}}  Index: {{matchIndex}}  Title: {{title}}:
{{text}}
`,
  },
  {
    mainPrompt: `Provide a subject score in a range of 1-10 for political correctness for high school students in the USA for the following documents:
{{documents}}
Please respond with json and only json in this format:
{
  "documentId": "",
  "politicalCorrectnessScore": 0,
}`,
    documentPrompt: `Document Id: {{id}}  Index: {{matchIndex}}  Title: {{title}}:
{{text}}
`,
  },
];