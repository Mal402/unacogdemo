
class MetricAnalysis {
    constructor() {
       this.promptUrl = `https://us-central1-promptplusai.cloudfunctions.net/lobbyApi/session/external/message`;
       this.defaultPromptTemplate = `"Rate the following song 0-10, regarding its ""motivational"" content. Guideline for ""motivational"" metrics: Assess motivational/inspirational content by evaluating the presence of uplifting language, the ability to evoke resilience, ambition, and positive change. Consider how effectively the text encourages self-improvement, overcoming challenges, and pursuing goals. Look for narrative strength, real-life applicability, and the inspirational impact on the reader's mindset and actions. 
       Song Lyrics: {{query}}
       Please respond with json and only json in this format:
       {
         ""contentRating"": 0
       }"`;
    }

    async sendPromptToLLM(message) {
        const apiToken = 'cfbde57f-a4e6-4eb9-aea4-36d5fbbdad16';
        const sessionId = '8umxl4rdt32x';
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

    async sendPromptForMetric(promptTemplate, query) {
        const promptT = window.Handlebars.compile(promptTemplate);
        let merge = {
            query,
        };
        const fullPrompt = promptT(merge);

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
}