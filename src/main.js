import './style.css';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { t, setupUIStrings, currentLang, translations } from './i18n.js';

function generateId() {
  return 'n_' + Math.random().toString(36).substr(2, 9);
}

let visibleMaxDepth = Infinity;

// 初期状態
function getInitialState() {
  return {
    id: 'root',
    text: t('defaultNodeText'),
    children: []
  };
}

let state = getInitialState();
let focusedNodeId = null;

// --- Save and Load ---
const STORAGE_KEY = 'horiztree_data';

function isTauri() {
  return window.__TAURI_INTERNALS__ || window.__TAURI__;
}

// ノードデータと、各階層のカラム幅をJSONにまとめる
function makePayload() {
  const depths = [];
  // 存在する深さのCSS変数を収集 (最大50階層までチェック)
  for (let i = 0; i < 50; i++) {
    const w = document.documentElement.style.getPropertyValue(`--col-width-${i}`);
    if (w) depths[i] = w;
  }
  return JSON.stringify({
    tree: state,
    colWidths: depths
  });
}

// 状態が変更された際、再描画のタイミングで保存するようrenderの末尾でsaveStateを呼ぶか、各処理で呼ぶ
function saveState() {
  const payload = makePayload();
  localStorage.setItem(STORAGE_KEY, payload);
}

function loadState() {
  const dataStr = localStorage.getItem(STORAGE_KEY);
  if (!dataStr) return;
  try {
    const payload = JSON.parse(dataStr);
    if (payload.tree) state = payload.tree;

    if (payload.colWidths && Array.isArray(payload.colWidths)) {
      payload.colWidths.forEach((widthStr, idx) => {
        if (widthStr) document.documentElement.style.setProperty(`--col-width-${idx}`, widthStr);
      });
    }
  } catch (e) {
    console.error('Failed to load tree data', e);
  }
}

// --- Tree Operations ---

// 再帰的にノードを検索
function findNodeContext(targetId, nodes = [state], parent = null) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === targetId) return { node: nodes[i], parent, index: i, siblings: nodes };
    const found = findNodeContext(targetId, nodes[i].children, nodes[i]);
    if (found) return found;
  }
  return null;
}

function addNode(id) {
  const ctx = findNodeContext(id);
  if (!ctx) return;

  const newNode = { id: generateId(), text: '', children: [] };
  if (ctx.node.id === 'root') ctx.node.children.unshift(newNode); // ルートでのEnterは最初の子を追加  
  else ctx.siblings.splice(ctx.index + 1, 0, newNode); // ルート以外は現在のノードの直後に追加

  focusedNodeId = newNode.id;
  render();
}

function indentNode(id) {
  const ctx = findNodeContext(id);
  if (!ctx || ctx.index === 0 || ctx.node.id === 'root') return; // 先頭ノードやルートはインデント不可

  const node = ctx.node;
  const prevSibling = ctx.siblings[ctx.index - 1];
  ctx.siblings.splice(ctx.index, 1); // 現在のリストから削除
  prevSibling.children.push(node); // 前の兄弟の子リストの末尾に追加

  focusedNodeId = node.id;
  render();
}

function outdentNode(id) {
  const ctx = findNodeContext(id);
  if (!ctx || !ctx.parent || ctx.parent.id === 'root') return; // ルート直下やルート自身はアウトデント不可

  const parentCtx = findNodeContext(ctx.parent.id);
  if (!parentCtx) return;

  const node = ctx.node;
  ctx.siblings.splice(ctx.index, 1); // 現在のリストから削除
  parentCtx.siblings.splice(parentCtx.index + 1, 0, node); // 親の兄弟リストの、親の直後に追加

  focusedNodeId = node.id;
  render();
}

function deleteNode(id, text) {
  if (text !== '') return; // 空欄の時のみ削除
  const ctx = findNodeContext(id);
  if (!ctx || ctx.node.id === 'root') return;

  // 削除後のフォーカス移動先を決定
  let targetFocusId = null;
  if (ctx.index > 0) {
    // 前の兄弟、もしくはその後孫の末尾
    let target = ctx.siblings[ctx.index - 1];
    while (target.children.length > 0) {
      target = target.children[target.children.length - 1];
    }
    targetFocusId = target.id;
  } else if (ctx.parent) {
    targetFocusId = ctx.parent.id;
  }

  if (ctx.node.children.length > 0) return; // 子がいる場合は削除しない（または別の動作）

  ctx.siblings.splice(ctx.index, 1);
  focusedNodeId = targetFocusId;
  render();
}

// --- Drag and Drop Operations ---

let draggedNodeId = null;

function handleDragStart(e, id) {
  draggedNodeId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', id); // required for Firefox

  // 見た目を半透明にする
  setTimeout(() => {
    const el = document.querySelector(`.node-content[data-id="${id}"]`);
    if (el) el.classList.add('is-dragging');
  }, 0);
}

function handleDragEnd(e, id) {
  const el = document.querySelector(`.node-content[data-id="${id}"]`);
  if (el) el.classList.remove('is-dragging');
  draggedNodeId = null;
  // ドロップ先ハイライトのクリア
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  document.querySelectorAll('.drag-over-bottom').forEach(el => el.classList.remove('drag-over-bottom'));
  document.querySelectorAll('.drag-over-right').forEach(el => el.classList.remove('drag-over-right'));
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  // イベントが発火した要素の高さから、上半分か下半分かを判定して挿入位置の手がかりにする
  const rect = e.currentTarget.getBoundingClientRect();
  const relY = e.clientY - rect.top;
  const relX = e.clientX - rect.left;
  const hasChildren = e.currentTarget.dataset.hasChildren === 'true';

  e.currentTarget.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-right');
  if (!hasChildren && relX > rect.width * 0.75 && e.currentTarget.dataset.id !== 'root') {
    e.currentTarget.classList.add('drag-over-right');
  } else if (relY < rect.height / 2) {
    e.currentTarget.classList.add('drag-over');
  } else {
    e.currentTarget.classList.add('drag-over-bottom');
  }
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-right');
}

function handleDrop(e, targetId) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-right');

  const sourceId = draggedNodeId;
  if (!sourceId || sourceId === targetId) return;

  const sourceCtx = findNodeContext(sourceId);
  if (!sourceCtx || sourceCtx.node.id === 'root') return; // rootは移動不可

  const targetCtx = findNodeContext(targetId);
  if (!targetCtx) return;

  // 自分自身の子孫にはドロップできないようにするための検証
  let isDescendant = false;
  let curr = targetCtx;
  while (curr.parent) {
    if (curr.parent.id === sourceId) {
      isDescendant = true;
      break;
    }
    curr = findNodeContext(curr.parent.id);
  }
  if (isDescendant) return;

  // ドロップ位置の判定（上半分なら直前、下半分なら直後、あるいは子要素として入れるか）
  const rect = e.currentTarget.getBoundingClientRect();
  const relY = e.clientY - rect.top;
  const relX = e.clientX - rect.left;
  const insertAsChild = targetCtx.node.children.length === 0 && relX > rect.width * 0.75 && targetId !== 'root';
  const insertAfter = relY >= rect.height / 2;

  // 元の場所から削除
  const sourceNode = sourceCtx.node;
  sourceCtx.siblings.splice(sourceCtx.index, 1);

  // 再度ターゲットのContextを取得し直す (元の削除によりindexがずれている可能性があるため)
  const freshTargetCtx = findNodeContext(targetId);

  if (insertAsChild) {
    freshTargetCtx.node.children.push(sourceNode);
  } else if (freshTargetCtx.node.id === 'root') {
    // routeへのドロップは、ルートの子要素の最初または最後に挿入
    insertAfter ? freshTargetCtx.node.children.push(sourceNode) : freshTargetCtx.node.children.unshift(sourceNode);
  } else {
    // ターゲットの兄弟要素として挿入
    const targetList = freshTargetCtx.siblings;
    const targetIndex = freshTargetCtx.index;
    targetList.splice(insertAfter ? targetIndex + 1 : targetIndex, 0, sourceNode);
  }

  render();
}

function getFlatNodesWithDepth(nodes = [state], flat = [], currentDepth = 0) {
  for (const node of nodes) {
    flat.push({ node, depth: currentDepth });
    if (currentDepth < visibleMaxDepth) {
      getFlatNodesWithDepth(node.children, flat, currentDepth + 1);
    }
  }
  return flat;
}

function moveFocus(id, direction) {
  const flat = getFlatNodesWithDepth();
  const currentIndex = flat.findIndex(n => n.node.id === id);
  if (currentIndex === -1) return;

  const currentDepth = flat[currentIndex].depth;

  let targetNodeId = null;
  if (direction === 1) {
    for (let i = currentIndex + 1; i < flat.length; i++) {
      if (flat[i].depth === currentDepth) {
        targetNodeId = flat[i].node.id;
        break;
      }
    }
  } else if (direction === -1) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (flat[i].depth === currentDepth) {
        targetNodeId = flat[i].node.id;
        break;
      }
    }
  }

  if (targetNodeId) {
    focusedNodeId = targetNodeId;
    render();
  }
}

function moveFocusToParent(id) {
  const ctx = findNodeContext(id);
  // ルートの親はnull
  if (!ctx || !ctx.parent) return;

  focusedNodeId = ctx.parent.id;
  render();
}

function moveFocusToChildOrAdd(id) {
  const ctx = findNodeContext(id);
  if (!ctx) return;

  if (ctx.node.children && ctx.node.children.length > 0) {
    focusedNodeId = ctx.node.children[0].id;
    render();
  } else {
    // 子がいない場合は新規追加してフォーカス
    const newNode = { id: generateId(), text: '', children: [] };
    ctx.node.children.push(newNode);
    focusedNodeId = newNode.id;
    render();
  }
}

// --- Rendering ---

function renderNode(node, depth = 0, isRoot = false) {
  const wrapper = document.createElement('div');
  wrapper.className = isRoot ? 'tree-container' : 'child-wrapper';

  const group = document.createElement('div');
  group.className = 'node-group';

  const content = document.createElement('div');
  content.className = 'node-content';
  content.dataset.id = node.id;
  content.dataset.hasChildren = (node.children && node.children.length > 0) ? 'true' : 'false';
  content.style.width = `var(--col-width-${depth}, 280px)`; // 変数から幅を取得

  // ドラッグハンドル
  const handle = document.createElement('div');
  handle.className = 'node-handle';
  if (!isRoot) {
    handle.draggable = true;
    handle.addEventListener('dragstart', (e) => handleDragStart(e, node.id));
    handle.addEventListener('dragend', (e) => handleDragEnd(e, node.id));
  }
  content.appendChild(handle);

  // D&D設定 (Drop先としての設定は content に残す)
  content.addEventListener('dragover', handleDragOver);
  content.addEventListener('dragleave', handleDragLeave);
  content.addEventListener('drop', (e) => handleDrop(e, node.id));

  // 幅調整用のリサイザー追加
  const resizer = document.createElement('div');
  resizer.className = 'resizer';
  resizer.contentEditable = 'false';
  resizer.addEventListener('mousedown', (e) => {
    e.stopPropagation(); // ドラッグ開始やフォーカス等を防ぐ
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = content.offsetWidth;
    resizer.classList.add('active');

    function onMouseMove(moveEvent) {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(100, startWidth + delta); // 幅の下限を100pxとする
      document.documentElement.style.setProperty(`--col-width-${depth}`, newWidth + 'px');
      // ドラッグ中はsaveStateしない
    }

    function onMouseUp() {
      resizer.classList.remove('active');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      saveState(); // 幅の変更完了時に保存
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  content.appendChild(resizer);

  const input = document.createElement('div');
  input.contentEditable = 'true';
  input.className = 'node-input';
  input.textContent = node.text || '';
  input.dataset.placeholder = isRoot ? t('placeholderRoot') : t('placeholderNode');
  input.dataset.nodeId = node.id;

  // データ同期
  input.addEventListener('input', (e) => {
    node.text = e.target.textContent;
  });

  // フォーカス状態の装飾
  input.addEventListener('focus', () => {
    content.classList.add('focused');
    focusedNodeId = node.id;
  });
  input.addEventListener('blur', () => {
    content.classList.remove('focused');
  });

  // キーボードイベント
  input.addEventListener('keydown', (e) => {
    // IME入力中などは除外 (isComposing)
    if (e.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNode(node.id);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        outdentNode(node.id);
      } else {
        indentNode(node.id);
      }
    } else if (e.key === 'Backspace') {
      // 空の時だけ
      if (input.textContent === '') {
        e.preventDefault();
        deleteNode(node.id, input.textContent);
      }
    } else if (e.key === 'ArrowUp') {
      if (e.shiftKey) {
        e.preventDefault();
        moveFocus(node.id, -1);
      }
    } else if (e.key === 'ArrowDown') {
      if (e.shiftKey) {
        e.preventDefault();
        moveFocus(node.id, 1);
      }
    } else if (e.key === 'ArrowLeft') {
      if (e.shiftKey) {
        e.preventDefault();
        moveFocusToParent(node.id);
      }
    } else if (e.key === 'ArrowRight') {
      if (e.shiftKey) {
        e.preventDefault();
        moveFocusToChildOrAdd(node.id);
      }
    }
  });

  content.appendChild(input);
  group.appendChild(content);

  const childrenContainer = document.createElement('div');
  childrenContainer.className = 'children-container';

  if (node.children && node.children.length > 0) {
    if (depth < visibleMaxDepth) {
      node.children.forEach(child => {
        childrenContainer.appendChild(renderNode(child, depth + 1, false));
      });
    } else {
      // 隠れている子ノードがあることを示すインジケーター
      const indicator = document.createElement('div');
      indicator.className = 'hidden-indicator';
      indicator.textContent = t('hiddenNodes', { count: node.children.length });
      childrenContainer.appendChild(indicator);
    }
  }

  group.appendChild(childrenContainer);
  wrapper.appendChild(group);

  return wrapper;
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderNode(state, 0, true));

  // フォーカスの復元
  if (focusedNodeId) {
    // 描画が完了するのを少し待ってからフォーカスする（DOMの更新後）
    requestAnimationFrame(() => {
      const targetInput = document.querySelector(`.node-input[data-node-id="${focusedNodeId}"]`);
      if (targetInput) {
        targetInput.focus();
        // カーソルを末尾に
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(targetInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }

  // 描画のたびに状態を自動保存
  saveState();
}

// --- Custom Confirm Dialog ---
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    const tmpl = document.getElementById('tmpl-confirm-dialog');
    const overlay = tmpl.content.cloneNode(true).firstElementChild;

    const text = overlay.querySelector('.confirm-message');
    text.textContent = message;

    const btnCancel = overlay.querySelector('.btn-cancel');
    btnCancel.textContent = t('btnCancel');
    btnCancel.onclick = () => {
      overlay.remove();
      resolve(false);
    };

    const btnOk = overlay.querySelector('.btn-ok');
    btnOk.textContent = t('btnInitialize');
    btnOk.onclick = () => {
      overlay.remove();
      resolve(true);
    };

    document.body.appendChild(overlay);

    // auto focus cancel button to prevent accidental clicks
    btnCancel.focus();
  });
}

// --- Help Dialog ---
function showHelpDialog() {
  const tmpl = document.getElementById('tmpl-help-dialog');
  const overlay = tmpl.content.cloneNode(true).firstElementChild;

  const title = overlay.querySelector('.help-title');
  title.textContent = t('helpTitle');

  const list = overlay.querySelector('.help-list');
  const shortcuts = translations[currentLang].shortcuts;

  shortcuts.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<kbd>${s.key}</kbd><span>${s.desc}</span>`;
    list.appendChild(li);
  });

  const btnClose = overlay.querySelector('.btn-close');
  btnClose.textContent = t('btnClose');
  btnClose.onclick = () => {
    overlay.remove();
  };

  document.body.appendChild(overlay);

  btnClose.focus();
}

// --- コントロールエリア ---

async function onClickExport() {
  const payload = makePayload();
  const dt = new Date();
  let fileName = `horiztree_${dt.toISOString().slice(0, 10).replace(/-/g, '')}.json`;
  if (state.text !== '') fileName = `${state.text}.json`;

  if (isTauri()) {
    try {
      const filePath = await save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: fileName
      });
      if (filePath) {
        await writeTextFile(filePath, payload);
      }
    } catch (e) {
      console.error('Failed to save file:', e);
    }
  } else {
    // Browser fallback
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(payload);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode); // Firefox向け
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

async function onClickImport() {
  if (isTauri()) {
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (filePath) {
        const contents = await readTextFile(filePath);
        loadFromJson(contents);
      }
    } catch (e) {
      console.error('Failed to open file:', e);
    }
  } else {
    // Browser fallback
    const fileInput = document.getElementById('import-file');
    fileInput.click();
  }
}

async function onClickClear() {
  if (await showConfirmDialog(t('confirmClear'))) {
    state = getInitialState();
    focusedNodeId = null;
    saveState();
    render();
  }
}

function updateDepthLabel(val) {
  const label = document.getElementById('label-depth');
  if (!label) return;
  if (val === '6' || val === 6 || val === Infinity) {
    label.textContent = t('depthAll');
  } else {
    label.textContent = t('depthLevel', { val });
  }
}

function onChangeDepth(e) {
  const val = parseInt(e.target.value, 10);
  updateDepthLabel(val);
  visibleMaxDepth = val === 6 ? Infinity : val;
  render();
}

function loadFromJson(jsonStr) {
  try {
    const payload = JSON.parse(jsonStr);
    if (payload.tree) {
      state = payload.tree;
    }
    if (payload.colWidths && Array.isArray(payload.colWidths)) {
      payload.colWidths.forEach((widthStr, idx) => {
        if (widthStr) {
          document.documentElement.style.setProperty(`--col-width-${idx}`, widthStr);
        }
      });
    }
    focusedNodeId = null;
    saveState();
    render();
  } catch (err) {
    alert(t('errorInvalidJson'));
  }
}

function onChangeImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    loadFromJson(event.target.result);
  };
  reader.readAsText(file);
}


function setupControls() {
  const inputDepth = document.getElementById('input-depth');
  inputDepth.addEventListener('input', (e) => { onChangeDepth(e); });
  updateDepthLabel(inputDepth.value);

  const btnExport = document.getElementById('btn-export');
  btnExport.addEventListener('click', async () => { onClickExport(); });

  const btnImport = document.getElementById('btn-import');
  btnImport.addEventListener('click', async () => { onClickImport(); });

  const btnHelp = document.getElementById('btn-help');
  btnHelp.addEventListener('click', showHelpDialog);

  const btnClear = document.getElementById('btn-clear');
  btnClear.addEventListener('click', async () => { onClickClear(); });

  const fileInput = document.getElementById('import-file');
  fileInput.addEventListener('change', (e) => { onChangeImportFile(e); });
}

loadState();
setupUIStrings();
setupControls();
render();
