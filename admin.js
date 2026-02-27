
const RECIPIENTS = {
    'Журналіст(Жека)': { id: '1254925014', username: '@zhekaass' },
    'ТехПідтримка(Саньок)': { id: '1148148294', username: '@endeshnik' },
    'Єблан для теста': { id: '1665538456', username: 'motowwoda' }
};

let tickets = JSON.parse(localStorage.getItem('bebro_tickets')) || [];

function checkAccess() {
    const passInput = document.getElementById('adminPassword').value;
    if (passInput === CONFIG.ADMIN_PASSWORD) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        document.getElementById('adminPassword').value = '';
        renderTickets();
    } else {
        alert('Невірний пароль!');
    }
}

function renderTickets() {
    const container = document.getElementById('tickets-container');
    const countBadge = document.getElementById('ticket-count');
    container.innerHTML = '';

    const pendingTickets = tickets.filter(t => t.status === 'pending');
    countBadge.innerText = pendingTickets.length;

    if (pendingTickets.length === 0) {
        container.innerHTML = '<p class="empty-msg">Всі тікети розглянуті ✅</p>';
        return;
    }

    pendingTickets.forEach(ticket => {
        const div = document.createElement('div');
        div.className = 'ticket-item';
        div.innerHTML = `
            <div class="ticket-info">
                <span class="ticket-date">${ticket.timestamp}</span>
                <h3>${ticket.title}</h3>
                <p class="ticket-route">Від: @${ticket.sender} → <strong>${ticket.recipient}</strong></p>
                <div class="ticket-desc">${ticket.description}</div>
            </div>
            <div class="ticket-actions">
                <button class="approve-btn" onclick="approveTicket(${ticket.id})">
                    <span class="btn-text">Схвалити</span>
                    <div class="btn-shine"></div>
                </button>
                <button class="reject-btn" onclick="rejectTicket(${ticket.id})">
                    <span class="btn-text">Відхилити</span>
                    <div class="btn-shine"></div>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

async function approveTicket(id) {
    const ticketIndex = tickets.findIndex(t => t.id === id);
    if (ticketIndex !== -1) {
        const ticket = tickets[ticketIndex];
        ticket.status = 'approved';
        localStorage.setItem('bebro_tickets', JSON.stringify(tickets));

        await sendFinalNotification(ticket);
        renderTickets();
    }
}

function rejectTicket(id) {
    if (!confirm('Ви впевнені, що хочете відхилити цей тікет?')) return;

    const ticketIndex = tickets.findIndex(t => t.id === id);
    if (ticketIndex !== -1) {
        tickets[ticketIndex].status = 'rejected';
        localStorage.setItem('bebro_tickets', JSON.stringify(tickets));
        renderTickets();
    }
}

async function sendFinalNotification(ticket) {
    const target = RECIPIENTS[ticket.recipient];
    if (!target) return;

    const message = `✅ *ВАМ ПРИЗНАЧЕНО НОВИЙ ТІКЕТ!*\n\n👤 *Від:* @${ticket.sender}\n📌 *Тема:* ${ticket.title}\n📝 *Опис:* ${ticket.description}\n\nБудь ласка, візьміть у роботу.`;

    try {
        await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: target.id,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error('Error sending notification:', e);
    }
}
