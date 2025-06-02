document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('historyList');
    const backToOrderButton = document.getElementById('backToOrderButton');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    // 履歴を表示
    function renderHistory() {
        historyList.innerHTML = '';
        let history = JSON.parse(localStorage.getItem('transactionHistory') || '[]');

        if (history.length === 0) {
            historyList.innerHTML = '<p class="no-history-message">まだ会計履歴はありません。</p>';
            return;
        }

        history.forEach(transaction => {
            const transactionDiv = document.createElement('div');
            transactionDiv.classList.add('transaction-item');
            
            let itemsHtml = transaction.items.map(item => 
                `<li>${item.name} x ${item.count} = ¥${item.subtotal.toLocaleString()}</li>`
            ).join('');

            transactionDiv.innerHTML = `
                <div class="transaction-header">
                    <span class="transaction-date">${transaction.date}</span>
                    <span class="transaction-table">テーブルNo: ${transaction.tableNo || 'N/A'}</span> <span class="transaction-total">合計: ¥${transaction.total.toLocaleString()}</span>
                </div>
                <ul class="transaction-items-list">
                    ${itemsHtml}
                </ul>
            `;
            historyList.appendChild(transactionDiv);
        });
    }

    // 注文入力画面へ戻るボタン
    backToOrderButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 履歴を全てクリアボタン
    clearHistoryButton.addEventListener('click', () => {
        if (confirm('全ての会計履歴を削除してもよろしいですか？この操作は元に戻せません。')) {
            localStorage.removeItem('transactionHistory');
            renderHistory();
        }
    });

    // 初期表示
    renderHistory();
});
