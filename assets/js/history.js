document.addEventListener('DOMContentLoaded', () => {
    const pendingList = document.getElementById('pendingList');
    const completedList = document.getElementById('completedList');
    const allList = document.getElementById('allList'); // 新しく追加
    const backToOrderButton = document.getElementById('backToOrderButton');
    const clearPendingHistoryButton = document.getElementById('clearPendingHistoryButton');
    const clearCompletedHistoryButton = document.getElementById('clearCompletedHistoryButton');
    const clearAllHistoryButton = document.getElementById('clearAllHistoryButton'); // 新しく追加

    const tabButtons = document.querySelectorAll('.tab-button');
    const pendingSection = document.getElementById('pendingTransactionsSection');
    const completedSection = document.getElementById('completedTransactionsSection');
    const allSection = document.getElementById('allTransactionsSection'); // 新しく追加

    // タブ切り替え機能
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tab = button.dataset.tab;
            pendingSection.classList.add('hidden');
            completedSection.classList.add('hidden');
            allSection.classList.add('hidden'); // 全てのセクションを一旦隠す

            if (tab === 'pending') {
                pendingSection.classList.remove('hidden');
            } else if (tab === 'completed') {
                completedSection.classList.remove('hidden');
            } else if (tab === 'all') { // 新しいタブの処理
                allSection.classList.remove('hidden');
            }
            renderHistory(); // タブ切り替え時に再描画
        });
    });

    // 履歴を表示
    function renderHistory() {
        pendingList.innerHTML = '';
        completedList.innerHTML = '';
        allList.innerHTML = ''; // 全履歴リストもクリア

        let pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
        let completedTransactions = JSON.parse(localStorage.getItem('completedTransactions') || '[]');
        let longTermHistory = JSON.parse(localStorage.getItem('longTermHistory') || '[]'); // 新しく読み込み

        // 会計予定リストの表示
        if (pendingTransactions.length === 0) {
            pendingList.innerHTML = '<p class="no-history-message">まだ会計予定はありません。</p>';
        } else {
            pendingTransactions.forEach(transaction => {
                const transactionDiv = createTransactionItem(transaction, 'pending');
                pendingList.appendChild(transactionDiv);
            });
        }

        // 会計完了リストの表示
        if (completedTransactions.length === 0) {
            completedList.innerHTML = '<p class="no-history-message">まだ会計完了履歴はありません。</p>';
        } else {
            completedTransactions.forEach(transaction => {
                const transactionDiv = createTransactionItem(transaction, 'completed');
                completedList.appendChild(transactionDiv);
            });
        }

        // 全会計履歴一覧の表示（新しく追加）
        if (longTermHistory.length === 0) {
            allList.innerHTML = '<p class="no-history-message">まだ会計履歴はありません。</p>';
        } else {
            // 日付の新しい順に並べ替え (Date.now() が新しいほど大きいので降順)
            longTermHistory.sort((a, b) => b.id - a.id); 
            longTermHistory.forEach(transaction => {
                const transactionDiv = createTransactionItem(transaction, 'all'); // typeを'all'に
                allList.appendChild(transactionDiv);
            });
        }
    }

    // トランザクションアイテムを生成するヘルパー関数
    function createTransactionItem(transaction, type) {
        const transactionDiv = document.createElement('div');
        transactionDiv.classList.add('transaction-item');
        
        let itemsHtml = transaction.items.map(item => 
            `<li>${item.name} x ${item.count} = ¥${item.subtotal.toLocaleString()}</li>`
        ).join('');

        let actionButton = '';
        if (type === 'pending') {
            actionButton = `<button class="btn btn-primary complete-transaction" data-id="${transaction.id}">会計完了</button>`;
        } else if (type === 'completed') {
            actionButton = `<button class="btn btn-info revert-to-pending" data-id="${transaction.id}">会計予定に戻す</button>`;
        }
        // 'all'タブではアクションボタンは不要、または閲覧のみ

        transactionDiv.innerHTML = `
            <div class="transaction-header">
                <span class="transaction-date">${transaction.date}</span>
                <span class="transaction-table">テーブルNo: ${transaction.tableNo || 'N/A'}</span>
                <span class="transaction-total">合計: ¥${transaction.total.toLocaleString()}</span>
            </div>
            <ul class="transaction-items-list">
                ${itemsHtml}
            </ul>
            <div class="transaction-actions">
                ${actionButton}
                <button class="btn btn-secondary delete-transaction" data-id="${transaction.id}" data-type="${type}">削除</button>
            </div>
        `;
        return transactionDiv;
    }

    // 会計完了ボタンのイベントリスナー（デリゲート）
    pendingList.addEventListener('click', (e) => {
        if (e.target.classList.contains('complete-transaction')) {
            const transactionId = e.target.dataset.id;
            completeTransaction(transactionId);
        }
        if (e.target.classList.contains('delete-transaction')) {
            const transactionId = e.target.dataset.id;
            const transactionType = e.target.dataset.type;
            deleteTransaction(transactionId, transactionType);
        }
    });

    // 削除ボタンと「会計予定に戻す」ボタンのイベントリスナー（完了リスト用）
    completedList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-transaction')) {
            const transactionId = e.target.dataset.id;
            const transactionType = e.target.dataset.type;
            deleteTransaction(transactionId, transactionType);
        }
        if (e.target.classList.contains('revert-to-pending')) {
            const transactionId = e.target.dataset.id;
            revertToPending(transactionId);
        }
    });

    // 削除ボタンのイベントリスナー（全履歴リスト用）
    allList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-transaction')) {
            const transactionId = e.target.dataset.id;
            const transactionType = e.target.dataset.type; // 'all'
            deleteTransaction(transactionId, transactionType);
        }
    });


    // トランザクションを完了済みにする関数
    function completeTransaction(id) {
        let pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
        let completedTransactions = JSON.parse(localStorage.getItem('completedTransactions') || '[]');
        let longTermHistory = JSON.parse(localStorage.getItem('longTermHistory') || '[]'); // 新しく読み込み

        const transactionIndex = pendingTransactions.findIndex(t => t.id === id);
        if (transactionIndex > -1) {
            const [completed] = pendingTransactions.splice(transactionIndex, 1);
            completed.status = 'completed';
            completed.completionDate = new Date().toLocaleString('ja-JP');
            completedTransactions.unshift(completed); // 短期完了履歴に追加

            // 新しく追加: 長期履歴にも保存
            const longTermItem = { ...completed }; // オブジェクトをコピー
            longTermHistory.unshift(longTermItem); // 長期履歴の先頭に追加

            localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
            localStorage.setItem('completedTransactions', JSON.stringify(completedTransactions));
            localStorage.setItem('longTermHistory', JSON.stringify(longTermHistory)); // 長期履歴を保存
            renderHistory();
            alert(`会計が完了しました。\nテーブルNo: ${completed.tableNo} - 合計: ¥${completed.total.toLocaleString()}`);
        }
    }

    // トランザクションを会計予定に戻す関数
    function revertToPending(id) {
        if (!confirm('この会計を会計予定リストに戻してもよろしいですか？')) {
            return;
        }

        let pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
        let completedTransactions = JSON.parse(localStorage.getItem('completedTransactions') || '[]');
        // longTermHistoryからは削除しない。長期履歴は一度完了したらそのまま残す方針。

        const transactionIndex = completedTransactions.findIndex(t => t.id === id);
        if (transactionIndex > -1) {
            const [reverted] = completedTransactions.splice(transactionIndex, 1);
            reverted.status = 'pending';
            delete reverted.completionDate;
            pendingTransactions.unshift(reverted);

            localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
            localStorage.setItem('completedTransactions', JSON.stringify(completedTransactions));
            renderHistory();
            alert(`会計が会計予定リストに戻されました。\nテーブルNo: ${reverted.tableNo} - 合計: ¥${reverted.total.toLocaleString()}`);
        }
    }

    // トランザクションを削除する関数
    function deleteTransaction(id, type) {
        if (!confirm('この会計を削除してもよろしいですか？')) {
            return;
        }
        let targetList;
        let localStorageKey;

        if (type === 'pending') {
            targetList = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
            localStorageKey = 'pendingTransactions';
        } else if (type === 'completed') {
            targetList = JSON.parse(localStorage.getItem('completedTransactions') || '[]');
            localStorageKey = 'completedTransactions';
        } else if (type === 'all') { // 新しく追加
            targetList = JSON.parse(localStorage.getItem('longTermHistory') || '[]');
            localStorageKey = 'longTermHistory';
        } else {
            return;
        }

        const filteredList = targetList.filter(t => t.id !== id);
        localStorage.setItem(localStorageKey, JSON.stringify(filteredList));
        renderHistory();
        alert('会計が削除されました。');
    }


    // 注文入力画面へ戻るボタン
    backToOrderButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 会計予定を全てクリアボタン
    clearPendingHistoryButton.addEventListener('click', () => {
        if (confirm('全ての会計予定を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem('pendingTransactions');
            renderHistory();
        }
    });

    // 会計完了を全てクリアボタン
    clearCompletedHistoryButton.addEventListener('click', () => {
        if (confirm('全ての会計完了履歴を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem('completedTransactions');
            renderHistory();
        }
    });

    // 全会計履歴を全てクリアボタン（新しく追加）
    clearAllHistoryButton.addEventListener('click', () => {
        if (confirm('全ての長期会計履歴を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem('longTermHistory');
            renderHistory();
        }
    });

    // 初期表示
    renderHistory();
});
