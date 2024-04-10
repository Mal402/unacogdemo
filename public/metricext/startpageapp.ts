export default class SidePanelApp {
    constructor() {
        this.init();
    }

    async init() {
        const [tab] = await (<any>window).chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        });

        const tabId = tab.id;
        const button = document.querySelector('.open_side_panel');
        button?.addEventListener('click', async () => {
            await (<any>window).chrome.sidePanel.open({ tabId });
            await (<any>window).chrome.sidePanel.setOptions({
                tabId,
                path: 'sidepanel.html',
                enabled: true
            });
        });
    }
}

