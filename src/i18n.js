export const translations = {
    ja: {
        appTitle: "HorizTree - Horizontal Outliner",
        btnHelp: "ヘルプ",
        depthAll: "表示: すべて",
        depthLevel: "表示: {val}階層",
        btnClear: "新規ツリー",
        btnImport: "ファイルをロード",
        btnExport: "ファイルに保存",
        defaultNodeText: "無題",
        placeholderRoot: "ルートノード...",
        placeholderNode: "テキストを入力...",
        hiddenNodes: "... {count} 個の隠しノード",
        btnCancel: "キャンセル",
        btnInitialize: "初期化する",
        confirmClear: "全てのデータを削除して新しいプロジェクトを開始しますか？",
        helpTitle: "キーボードショートカット",
        btnClose: "閉じる",
        errorInvalidJson: "無効なファイル形式です。JSONファイルを選択してください。",
        shortcuts: [
            { key: 'Enter', desc: '下に新しいノードを追加' },
            { key: 'Shift + Enter', desc: 'ノード内で改行' },
            { key: 'Tab', desc: '右にインデント（子ノードにする）' },
            { key: 'Shift + Tab', desc: '左にアウトデント（親の兄弟にする）' },
            { key: 'Backspace', desc: 'ノードを削除（空欄の時のみ）' },
            { key: 'Shift + ↑ / ↓', desc: '同階層のノード間でフォーカス移動' },
            { key: 'Shift + ←', desc: '親ノードにフォーカス移動' },
            { key: 'Shift + →', desc: '子ノードにフォーカス移動（なければ追加）' }
        ]
    },
    en: {
        appTitle: "HorizTree - Horizontal Outliner",
        btnHelp: "Help",
        depthAll: "Show: All",
        depthLevel: "Show: {val} Levels",
        btnClear: "New Tree",
        btnImport: "Load File",
        btnExport: "Save File",
        defaultNodeText: "Untitled",
        placeholderRoot: "Root node...",
        placeholderNode: "Enter text...",
        hiddenNodes: "... {count} hidden nodes",
        btnCancel: "Cancel",
        btnInitialize: "Initialize",
        confirmClear: "Are you sure you want to delete all data and start a new project?",
        helpTitle: "Keyboard Shortcuts",
        btnClose: "Close",
        errorInvalidJson: "Invalid file format. Please select a JSON file.",
        shortcuts: [
            { key: 'Enter', desc: 'Add new node below' },
            { key: 'Shift + Enter', desc: 'Line break within node' },
            { key: 'Tab', desc: 'Indent right (make child node)' },
            { key: 'Shift + Tab', desc: 'Outdent left (make parent\'s sibling)' },
            { key: 'Backspace', desc: 'Delete node (only when empty)' },
            { key: 'Shift + up / Shift + down', desc: 'Move focus between nodes at same level' },
            { key: 'Shift + left', desc: 'Move focus to parent node' },
            { key: 'Shift + right', desc: 'Move focus to child node (create if none)' }
        ]
    }
};

const browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
export const currentLang = translations[browserLang] ? browserLang : 'en';

export const t = (key, params = {}) => {
    let text = translations[currentLang][key];
    if (!text) {
        text = translations['en'][key] || key;
    }
    Object.keys(params).forEach(k => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
    return text;
};

export const setupUIStrings = () => {
    document.title = t('appTitle');
    const btnHelp = document.getElementById('btn-help');
    if (btnHelp) btnHelp.textContent = t('btnHelp');
    const btnClear = document.getElementById('btn-clear');
    if (btnClear) btnClear.textContent = t('btnClear');
    const btnImport = document.getElementById('btn-import');
    if (btnImport) btnImport.textContent = t('btnImport');
    const btnExport = document.getElementById('btn-export');
    if (btnExport) btnExport.textContent = t('btnExport');
};
