class SidePanelApp {
    constructor(extCommon) {
        this.extCommon = extCommon;
        this.extCommon.initCommonDom();
        chrome.storage.local.onChanged.addListener(() => {
            this.extCommon.paintAnalysisTab();
        });
        this.extCommon.paintAnalysisTab();

        this.show_main_page_btn = document.querySelector('.show_main_page_btn');
        if (this.show_main_page_btn) {
            this.show_main_page_btn.addEventListener('click', () => {
                chrome.tabs.create({ url: 'main.html', active: true });
            });

            
        }
    }
}

window.addEventListener('DOMContentLoaded', async (event) => {
    let module = await import('./extensioncommon.js');
    window.extensionCommon = new module.AnalyzerExtensionCommon();
    window.appSidePanel = new SidePanelApp(window.extensionCommon);
});