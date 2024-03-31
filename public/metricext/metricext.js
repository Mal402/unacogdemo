const pageTextArea = document.getElementById('page_innertext');

document.getElementById("get_page_text").addEventListener('click', async () => {
    await getPageText();
});

async function getPageText() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getBrowserPageText
    }, (results) => {
        console.log("results", results);
        pageTextArea.value = results[0].result;
    });
}

function getBrowserPageText() {
    return document.documentElement.innerText;
}