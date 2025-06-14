document.addEventListener('DOMContentLoaded', () => {
    const orderSummaryList = document.getElementById('orderSummaryList');
    const totalAmountDisplay = document.getElementById('totalAmount');
    const backButton = document.getElementById('backButton');
    const completeButton = document.getElementById('completeButton');
    const checkoutHeader = document.querySelector('.checkout-container header h1');

    const storedOrderData = localStorage.getItem('currentOrderToCheckout');
    const orderData = storedOrderData ? JSON.parse(storedOrderData) : { transactionId: '', tableNo: 0, items: {}, subtotal: 0 };

    const currentTransactionId = orderData.transactionId;
    const currentOrderItems = orderData.items;
    const currentTableNo = orderData.tableNo;

    const menus = [
        { id: 'coffee', name: 'コーヒー', price: 400 },
        { id: 'tea', name: '紅茶', price: 350 },
        { id: 'cake', name: 'ケーキ', price: 500 },
        { id: 'sandwich', name: 'サンドイッチ', price: 650 },
        { id: 'juice', name: 'ジュース', price: 300 },
        { id: 'latte', name: 'カフェラテ', price: 450 },
        { id: 'toast', name: 'トースト', price: 300 },
        { id: 'salad', name: 'サラダ', price: 550 },
    ];

    let totalAmount = 0;

    if (currentTableNo > 0) {
        checkoutHeader.textContent = `注文確認 (テーブルNo: ${currentTableNo})`;
    } else {
        checkoutHeader.textContent = `注文確認`;
    }

    function displayOrderSummary() {
        orderSummaryList.innerHTML = '';
        totalAmount = 0;

        for (const menuId in currentOrderItems) {
            const count = currentOrderItems?.[menuId];
            const menu = menus.find(m => m.id === menuId);
            if (menu) {
                const listItem = document.createElement('li');
                const itemTotal = menu.price * count;
                totalAmount += itemTotal;

                listItem.innerHTML = `
                    <span class="item-name">${menu.name}</span>
                    <span class="item-details">x ${count} = ¥${itemTotal.toLocaleString()}</span>
                `;
                orderSummaryList.appendChild(listItem);
            }
        }
        totalAmountDisplay.textContent = `¥${totalAmount.toLocaleString()}`;
    }

    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 会計完了ボタンの機能 (会計予定リストに保存)
    completeButton.addEventListener('click', () => {
        // 会計予定リストに追加または更新（checkout.jsの役割はここまで）
        const transaction = {
            id: currentTransactionId,
            date: new Date().toLocaleString('ja-JP'),
            tableNo: currentTableNo,
            items: [], // ここでは簡略化のため空にしておくか、あるいは詳細を渡す
            total: totalAmount,
            status: 'pending' // ここではpendingのまま
        };

        for (const menuId in currentOrderItems) {
            const count = currentOrderItems[menuId];
            const menu = menus.find(m => m.id === menuId);
            if (menu && count > 0) {
                transaction.items.push({
                    name: menu.name,
                    price: menu.price,
                    count: count,
                    subtotal: menu.price * count
                });
            }
        }

        let pendingHistory = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');

        const existingIndex = pendingHistory.findIndex(t => t.id === transaction.id);
        if (existingIndex > -1) {
            pendingHistory[existingIndex] = transaction;
        } else {
            pendingHistory.unshift(transaction);
        }
        
        localStorage.setItem('pendingTransactions', JSON.stringify(pendingHistory));

        alert(`テーブルNo: ${currentTableNo}\n合計金額: ¥${totalAmount.toLocaleString()}\n会計予定リストに追加されました。`);
        localStorage.removeItem('currentOrderToCheckout');
        window.location.href = 'index.html';
    });

    displayOrderSummary();
});
