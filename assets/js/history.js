document.addEventListener('DOMContentLoaded', () => {
    const pendingList = document.getElementById('pendingList');
    const completedList = document.getElementById('completedList');
    const backToOrderButton = document.getElementById('backToOrderButton');
    const clearPendingHistoryButton = document.getElementById('clearPendingHistoryButton');
    const clearCompletedHistoryButton = document.getElementById('clearCompletedHistoryButton');

    const tabButtons = document.querySelectorAll('.tab-button');
    const pendingSection = document.getElementById('pendingTransactionsSection');
    const completedSection = document.getElementById('completedTransactionsSection');

    // タブ切り替え機能
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tab = button.dataset.tab;
            if (tab === 'pending') {
                pendingSection.classList.remove('hidden');
                completedSection.classList.add('hidden');
            } else {
                pendingSection.classList.add('hidden');
                completedSection.classList.remove('hidden');
            }
            renderHistory(); // タブ切り替え時に再描画
        });
    });

    // 履歴を表示
    function renderHistory() {
        pendingList.innerHTML = '';
        completedList.innerHTML = '';

        let pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
        let completedTransactions = JSON.parse(localStorage.getItem('completedTransactions') || '[]');

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
            // 新しく追加: 会計完了リストに「会計予定に戻す」ボタン
            actionButton = `<button class="btn btn-info revert-to-pending" data-id="${transaction.id}">会計予定に戻す</button>`;
        }

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
        // 新しく追加: 「会計予定に戻す」ボタンのイベント
        if (e.target.classList.contains('revert-to-pending')) {
            const transactionId = e.target.dataset.id;
            revertToPending(transactionId);
        }
    });


    // トランザクションを完了済みにする関数
    function completeTransaction(id) {
        let pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
        let completedTransactions = JSON.parse(localStorage.getItem('completedTransactions') || '[]');

        const transactionIndex = pendingTransactions.findIndex(t => t.id === id);
        if (transactionIndex > -1) {
            const [completed] = pendingTransactions.splice(transactionIndex, 1); // pendingから削除
            completed.status = 'completed'; // ステータス変更
            completed.completionDate = new Date().toLocaleString('ja-JP'); // 完了日時を追加
            completedTransactions.unshift(completed); // completedに追加

            localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
            localStorage.setItem('completedTransactions', JSON.stringify(completedTransactions));
            renderHistory();
            alert(`会計が完了しました。\nテーブルNo: ${completed.tableNo} - 合計: ¥${completed.total.toLocaleString()}`);
        }
    }

    // 新しく追加: トランザクションを会計予定に戻す関数
    function revertToPending(id) {
        if (!confirm('この会計を会計予定リストに戻してもよろしいですか？')) {
            return;
        }

        let pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
        let completedTransactions = JSON.parse(localStorage.getItem('completedTransactions') || '[]');

        const transactionIndex = completedTransactions.findIndex(t => t.id === id);
        if (transactionIndex > -1) {
            const [reverted] = completedTransactions.splice(transactionIndex, 1); // completedから削除
            reverted.status = 'pending'; // ステータスをpendingに戻す
            delete reverted.completionDate; // 完了日時を削除
            pendingTransactions.unshift(reverted); // pendingに追加

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
        } else {
            return; // 不明なタイプ
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

    // 初期表示
    renderHistory();
});
