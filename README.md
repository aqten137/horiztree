# HorizTree

[English](#english) | [日本語](#日本語)

---

## English

HorizTree is a horizontal tree-based outliner application.
It is the perfect tool for structured note-taking, organizing thoughts, and brainstorming.

It runs as a Windows desktop application (powered by Tauri) or in a web browser.

### ✨ Features

- **Horizontal Tree Expansion**: As the hierarchy deepens, nodes expand to the right, allowing you to grasp the big picture and details simultaneously.
- **Intuitive Keyboard Operations**: You can quickly add nodes and navigate levels (indent/outdent) without taking your hands off the keyboard.
- **Drag & Drop Support**: Easily reorder nodes and move between levels intuitively using mouse operations.
- **Flexible Column Width Adjustment**: Drag the separator lines for each level to freely adjust column widths.
- **Auto-Save Data**: Edits are automatically saved locally in real-time, so you never have to worry about forgetting to save.
- **Import & Export**: You can save (export) the entire tree data as a JSON file or load (import) it.
- **Internationalization (i18n)**: The UI language automatically switches based on the environment upon application startup (Supports Japanese and English).

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Enter` | Add a new node below |
| `Shift + Enter` | Line break within a node (multi-line input) |
| `Tab` | Indent right (make child node) |
| `Shift + Tab` | Outdent left (make parent's sibling) |
| `Backspace` | Delete node (only when empty) |
| `Shift + up` / `Shift + down` | Move focus between nodes at the same level |
| `Shift + left` | Move focus to parent node |
| `Shift + right` | Move focus to child node (create if none) |

### 🚀 Setup Development Environment

This project uses [Vite](https://vitejs.dev/) as a frontend build tool and [Tauri](https://tauri.app/) to turn it into a desktop app.

#### Prerequisites
- Node.js (Recommended version)
- Rust (Required for Tauri build)

#### Installation and Startup

1. Clone the repository.
   ```bash
   git clone https://github.com/aqten137/horiztree.git
   cd horiztree
   ```

2. Install dependencies.
   ```bash
   npm install
   ```

3. Start the development server and check it in the web browser.
   ```bash
   npm run dev
   ```

4. Launch as a desktop app in Tauri dev mode.
   ```bash
   npm run tauri dev
   ```

#### Build the Application

Running the following command builds the installer and executable (`.exe`) for Windows.

```bash
npm run tauri build
```

---

## 日本語

HorizTree（ホライズツリー）は、水平方向に展開するツリー型アウトライナーアプリケーションです。
構造的なメモ書きや、思考の整理・アイデア出しに最適なツールです。

Windows向けのデスクトップアプリケーション（Tauri）として、またはWebブラウザ上で動作します。

### ✨ 主な機能

- **水平方向のツリー展開**: 階層が深くなるにつれて右にノードが展開され、全体像と細部を同時に把握できます。
- **直感的なキーボード操作**: キーボードから手を離さずに高速なノードの追加や階層移動（インデント・アウトデント）が可能です。
- **ドラッグ＆ドロップ対応**: マウス操作で直感的にノードの並び替えや階層の移動が行えます。
- **カラム幅の柔軟な調整**: 各階層ごとに区切り線をドラッグして、カラム幅を自由に調整できます。
- **データの自動保存**: 編集内容はリアルタイムでローカルに自動保存されるため、保存忘れの心配がありません。
- **インポート / エクスポート**: 作成した全体ツリーのデータをJSON形式でファイルとして保存（エクスポート）したり、読み込んだり（インポート）することができます。
- **多言語対応**: アプリ起動時の環境に合わせて、UI言語が自動で切り替わります（日本語・英語対応）。

### ⌨️ キーボードショートカット

| ショートカットキー | 動作 |
| --- | --- |
| `Enter` | 下に新しいノードを追加 |
| `Shift + Enter` | ノード内で改行（複数行入力） |
| `Tab` | 右にインデント（子ノードにする） |
| `Shift + Tab` | 左にアウトデント（親の兄弟にする） |
| `Backspace` | ノードを削除（空欄の時のみ） |
| `Shift + ↑` / `↓` | 同階層のノード間でフォーカスを移動 |
| `Shift + ←` | 親ノードにフォーカスを移動 |
| `Shift + →` | 子ノードにフォーカスを移動（子がない場合は新規追加） |

### 🚀 開発環境のセットアップ

本プロジェクトはフロントエンドビルドツールに [Vite](https://vitejs.dev/)、デスクトップアプリ化に [Tauri](https://tauri.app/) を使用しています。

#### 前提条件
- Node.js (推奨バージョン)
- Rust (Tauriのビルドに必要です)

#### インストールと起動手順

1. リポジトリをクローンします。
   ```bash
   git clone https://github.com/aqten137/horiztree.git
   cd horiztree
   ```

2. 依存関係をインストールします。
   ```bash
   npm install
   ```

3. 開発サーバーを起動してWebブラウザで動作確認します。
   ```bash
   npm run dev
   ```

4. Tauri開発モードでデスクトップアプリとして起動します。
   ```bash
   npm run tauri dev
   ```

#### アプリケーションのビルド

以下のコマンドを実行すると、Windows向けのインストーラーおよび実行可能ファイル（`.exe`）がビルドされます。

```bash
npm run tauri build
```

---

## 📄 License / ライセンス

This project is licensed under the [MIT License](LICENSE). See the `LICENSE` file for details.
このプロジェクトは [MIT ライセンス](LICENSE) のもとで公開されています。詳細については、`LICENSE` ファイルをご覧ください。

## 👤 Author / 作者

aqten
