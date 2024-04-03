async function initializeSidePanel() {
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    });

    const tabId = tab.id;
    const button = document.querySelector('.open_side_panel');
    button.addEventListener('click', async () => {
        await chrome.sidePanel.open({ tabId });
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'index.html',
            enabled: true
        });
    });
}

initializeSidePanel();