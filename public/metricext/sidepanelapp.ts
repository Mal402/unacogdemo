import { AnalyzerExtensionCommon } from './extensioncommon';
declare const chrome: any;


export default class SidePanelApp {
    extCommon = new AnalyzerExtensionCommon(chrome);
    show_main_page_btn = document.querySelector('.show_main_page_btn') as HTMLButtonElement;

    constructor() {
        this.extCommon.initCommonDom();
        chrome.storage.local.onChanged.addListener(() => {
            this.extCommon.paintAnalysisTab();
        });
        this.extCommon.paintAnalysisTab();
        
        if (this.show_main_page_btn) {
            this.show_main_page_btn.addEventListener('click', () => {
                chrome.tabs.create({ url: 'main.html', active: true });
            });
        }
    }
}
