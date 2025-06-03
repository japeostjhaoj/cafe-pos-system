
document.addEventListener('DOMContentLoaded', () => {
    const datetimeElement = document.getElementById('datetime');
    const menuGrid = document.getElementById('menuGrid');
    const orderList = document.getElementById('orderList');
    const subtotalDisplay = document.getElementById('subtotal');
    const checkoutButton = document.getElementById('checkoutButton');
    const clearButton = document.getElementById('clearButton');
    const viewHistoryButton = document.getElementById('viewHistoryButton');
    const tableNoInput = document.getElementById('tableNo');

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

    let currentOrder = {};

    function updateDateTime() {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        datetimeElement.textContent = now.toLocaleString('ja-JP', options);
    }
    setInterval(updateDateTime, 1000);
    updateDateTime();

    function renderMenuButtons() {
        menuGrid.innerHTML = '';
        menus.forEach(menu => {
            const button = document.createElement('div');
            button.classList.add('menu-item-button');
            button.dataset.id = menu.id;
            button.innerHTML = `
                <div class="name">${menu.name}</div>
                <div class="price">¥${menu.price.toLocaleString()}</div>
            `;
            button.addEventListener('click', () => addMenuItem(menu.id));
            menuGrid.appendChild(button);
        });
    }

    function renderOrderList() {
        orderList.innerHTML = '';
        let subtotal = 0;

        for (const menuId in currentOrder) {
            const count = currentOrder[menuId];
            if (count > 0) {
                const menu = menus.find(m => m.id === menuId);
                if (menu) {
                    const itemTotal = menu.price * count;
                    subtotal += itemTotal;

                    const orderItemDiv = document.createElement('div');
                    orderItemDiv.classList.add('order-item');
                    orderItemDiv.innerHTML = `
                        <div class="item-info">
                            <div class="item-name">${menu.name}</div>
                            <div class="item-price">¥${menu.price.toLocaleString()} x ${count} = ¥${itemTotal.toLocaleString()}</div>
                        </div>
                        <div class="quantity-control">
                            <button class="decrease-qty" data-id="${menu.id}">-</button>
                            <span class="quantity-display">${count}</span>
                            <button class="increase-qty" data-id="${menu.id}">+</button>
                        </div>
                        <button class="remove-item" data-id="${menu.id}">✕</button>
                    `;
                    orderList.appendChild(orderItemDiv);
                }
            }
        }

        subtotalDisplay.textContent = `¥${subtotal.toLocaleString()}`;
        checkoutButton.textContent = `合計 ¥${subtotal.toLocaleString()} / 会計へ`;

        orderList.querySelectorAll('.increase-qty').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                addMenuItem(id);
            });
        });
        orderList.querySelectorAll('.decrease-qty').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                removeMenuItem(id);
            });
        });
        orderList.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                delete currentOrder[id];
                renderOrderList();
            });
        });
    }

    function addMenuItem(menuId) {
        currentOrder[menuId] = (currentOrder[menuId] || 0) + 1;
        renderOrderList();
    }

    function removeMenuItem(menuId) {
        if (currentOrder[menuId] > 1) {
            currentOrder[menuId]--;
        } else {
            delete currentOrder[menuId];
        }
        renderOrderList();
    }

    clearButton.addEventListener('click', () => {
        currentOrder = {};
        renderOrderList();
        tableNoInput.value = 1;
    });

    // 会計ボタンの機能（一時保存用のデータを渡す）
    checkoutButton.addEventListener('click', () => {
        const tableNo = tableNoInput.value ? parseInt(tableNoInput.value) : 0;
        if (tableNo <= 0) {
            alert('有効なテーブル番号を入力してください。');
            tableNoInput.focus();
            return;
        }

        if (Object.keys(currentOrder).length === 0) { // 注文がない場合はアラート
            alert('注文がありません。メニューを選択してください。');
            return;
        }

        // ここでユニークな transactionId を生成
        const transactionId = `temp_${Date.now()}`;

        const orderData = {
            transactionId: transactionId, // 一時的なID
            tableNo: tableNo,
            items: currentOrder,
            subtotal: calculateSubtotal()
        };
        localStorage.setItem('currentOrderToCheckout', JSON.stringify(orderData));
        window.location.href = 'checkout.html';
    });

    viewHistoryButton.addEventListener('click', () => {
        window.location.href = 'history.html'; // 既存のhistory.htmlは「会計予定」と「会計完了」の両方を表示するページに変更
    });

    function calculateSubtotal() {
        let subtotal = 0;
        for (const menuId in currentOrder) {
            const count = currentOrder[menuId];
            const menu = menus.find(m => m.id === menuId);
            if (menu) {
                subtotal += menu.price * count;
            }
        }
        return subtotal;
    }

    renderMenuButtons();
    renderOrderList();
});
