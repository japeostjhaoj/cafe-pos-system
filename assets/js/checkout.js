document.addEventListener('DOMContentLoaded', () => {
    const orderSummaryList = document.getElementById('orderSummaryList');
    const totalAmountDisplay = document.getElementById('totalAmount');
    const backButton = document.getElementById('backButton');
    const completeButton = document.getElementById('completeButton');
    const checkoutHeader = document.querySelector('.checkout-container header h1'); // 新しく追加

    // localStorage からテーブル番号を含む注文データを取得
    const storedOrderData = localStorage.getItem('currentOrderToCheckout');
    const orderData = storedOrderData ? JSON.parse(storedOrderData) : { tableNo: 0, items: {}, subtotal: 0 };

    const currentOrderItems = orderData.items; // 注文商品だけを抽出
    const currentTableNo = orderData.tableNo; // テーブル番号を抽出

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

    // ヘッダーにテーブル番号を表示
    if (currentTableNo > 0) {
        checkoutHeader.textContent = `注文確認 (テーブルNo: ${currentTableNo})`;
    } else {
        checkoutHeader.textContent = `注文確認`;
    }

    // 注文内容をリスト表示
    function displayOrderSummary() {
        orderSummaryList.innerHTML = '';
        totalAmount = 0;

        for (const menuId in currentOrderItems) { // currentOrderItems を使用
            const count = currentOrderItems?.[menuId];
            const menu = menus.find(m => m.id === menuId);
            if (menu && count > 0) {
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

    // 戻るボタンの機能
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 会計完了ボタンの機能
    completeButton.addEventListener('click', () => {
        // 会計履歴を保存
        const transaction = {
            id: Date.now(), // ユニークなIDとしてタイムスタンプを使用
            date: new Date().toLocaleString('ja-JP'),
            tableNo: currentTableNo, // テーブル番号を追加
            items: [],
            total: totalAmount
        };

        for (const menuId in currentOrderItems) { // currentOrderItems を使用
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

        let history = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
        history.unshift(transaction); // 新しい履歴を配列の先頭に追加
        localStorage.setItem('transactionHistory', JSON.stringify(history));

        alert(`テーブルNo: ${currentTableNo}\n合計金額: ¥${totalAmount.toLocaleString()}\n会計処理を実行しました。\n履歴に保存されました。`);
        localStorage.removeItem('currentOrder'); // index.htmlで使っていたcurrentOrderはクリア
        localStorage.removeItem('currentOrderToCheckout'); // checkout.htmlに渡したデータもクリア
        window.location.href = 'index.html'; // 元の画面に戻る
    });

    // 初期表示
    displayOrderSummary();
});
