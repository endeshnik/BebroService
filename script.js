
const RECIPIENTS = {
    'Журналіст(Жека)': { id: '1254925014', username: '@zhekaass' },
    'ТехПідтримка(Саньок)': { id: '1148148294', username: '@endeshnik' },
    'Єблан для теста': { id: '', username: '@sqis69' }
};

let tickets = JSON.parse(localStorage.getItem('bebro_tickets')) || [];

const ticketForm = document.getElementById('ticketForm');
const formSection = document.getElementById('form-section');
const adminSection = document.getElementById('admin-section');
const ticketsContainer = document.getElementById('tickets-container');
const successModal = document.getElementById('success-modal');

ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    let sender = document.getElementById('sender').value;
    const recipientType = document.getElementById('recipient').value;

    sender = sender.replace('@', '').trim();

    if (!title || !description || !sender || !recipientType) {
        alert('Будь ласка, заповніть всі поля!');
        return;
    }

    const newTicket = {
        id: Date.now(),
        title,
        description,
        sender,
        recipient: recipientType,
        status: 'pending',
        timestamp: new Date().toLocaleString()
    };

    tickets.push(newTicket);
    saveTickets();

    await sendToTelegramAdmin(newTicket, CONFIG.BOT_TOKEN, CONFIG.ADMIN_CHAT_ID);

    showModal();
    ticketForm.reset();
});

async function sendToTelegramAdmin(ticket, botToken, adminId) {
    if (!botToken || botToken.includes('YOUR_')) {
        console.warn('BOT_TOKEN не встановлено. Повідомлення не буде відправлено в Telegram.');
        return;
    }

    const message = `
🔔 *НОВИЙ ТІКЕТ НА РОЗГЛЯД*

📌 *Заголовок:* ${ticket.title}
📝 *Опис:* ${ticket.description}
👤 *Від кого:* @${ticket.sender}
🎯 *Кому:* ${ticket.recipient}
🕒 *Час:* ${ticket.timestamp}

Перейдіть на сайт, щоб СХВАЛИТИ цей тікет.
    `;

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();
        if (!result.ok) {
            alert(`Помилка Telegram: ${result.description}\nПереконайтеся, що ви написали /start боту!`);
        }
    } catch (error) {
        console.error('Помилка відправки в Telegram:', error);
        alert('Не вдалося з’єднатися з серверами Telegram. Перевірте інтернет.');
    }
}

async function sendFinalNotification(ticket) {
    const target = RECIPIENTS[ticket.recipient];

    if (!target || target.id === 'YOUR_MANAGER_CHAT_ID') {
        alert(`Тікет схвалено! Щоб бот написав ${ticket.recipient}, вкажіть його реальний Chat ID у script.js`);
        return;
    }

    const message = `
✅ *ВАМ ПРИЗНАЧЕНО НОВИЙ ТІКЕТ!*

👤 *Від:* @${ticket.sender}
📌 *Тема:* ${ticket.title}
📝 *Опис:* ${ticket.description}

Будь ласка, візьміть у роботу.
    `;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: target.id,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();
        if (!result.ok) {
            alert(`Помилка відправки отримувачу: ${result.description}`);
        } else {
            console.log(`Повідомлення відправлено отримувачу: ${ticket.recipient}`);
        }
    } catch (e) {
        console.error('Помилка при відправці отримувачу:', e);
        alert('Помилка мережі при відправці повідомлення отримувачу.');
    }
}

function toggleAdmin() {
    formSection.classList.toggle('hidden');
    adminSection.classList.toggle('hidden');
    if (!adminSection.classList.contains('hidden')) {
        renderTickets();
    }
}

function renderTickets() {
    ticketsContainer.innerHTML = '';
    const pendingTickets = tickets.filter(t => t.status === 'pending');

    if (pendingTickets.length === 0) {
        ticketsContainer.innerHTML = '<p class="empty-msg">Всі тікети розглянуті ✅</p>';
        return;
    }

    pendingTickets.forEach(ticket => {
        const div = document.createElement('div');
        div.className = 'ticket-item';
        div.innerHTML = `
            <div class="ticket-info">
                <h3>${ticket.title}</h3>
                <p>Від: <strong>@${ticket.sender}</strong> → <strong>${ticket.recipient}</strong></p>
                <p>${ticket.description}</p>
            </div>
            <div class="ticket-actions">
                <button class="approve-btn" onclick="approveTicket(${ticket.id})">Схвалити</button>
                <button class="reject-btn" onclick="rejectTicket(${ticket.id})">Відхилити</button>
            </div>
        `;
        ticketsContainer.appendChild(div);
    });
}

function approveTicket(id) {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
        ticket.status = 'approved';
        saveTickets();
        renderTickets();
        sendFinalNotification(ticket);
    }
}

function rejectTicket(id) {
    if (!confirm('Ви впевнені, що хочете відхилити цей тікет?')) return;

    const ticketIndex = tickets.findIndex(t => t.id === id);
    if (ticketIndex !== -1) {
        tickets[ticketIndex].status = 'rejected';
        saveTickets();
        renderTickets();
    }
}

function saveTickets() {
    localStorage.setItem('bebro_tickets', JSON.stringify(tickets));
}

function showModal() {
    successModal.classList.remove('hidden');
}

function closeModal() {
    successModal.classList.add('hidden');
}
