class TempMail {
    constructor() {
        this.emailAddress = '';
        this.messages = [];
        this.pollingInterval = null;
        this.token = null;
        this.apiUrl = 'https://api.mail.gw';
        this.init();
    }

    async init() {
        await this.generateNewEmail();
        this.setupEventListeners();
    }

    async generateNewEmail() {
        try {
            // Générer un nom d'utilisateur aléatoire
            const username = Math.random().toString(36).substring(2, 12);
            const password = Math.random().toString(36).substring(2, 12);

            // Récupérer les domaines disponibles
            const domainsResponse = await fetch(`${this.apiUrl}/domains`);
            const domainsData = await domainsResponse.json();
            const domain = domainsData['hydra:member'][0].domain;

            // Créer l'adresse email
            const email = `${username}@${domain}`;

            // Créer le compte
            const accountResponse = await fetch(`${this.apiUrl}/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: email,
                    password: password
                })
            });

            if (!accountResponse.ok) {
                throw new Error('Account creation error');
            }

            // Se connecter pour obtenir le token
            const tokenResponse = await fetch(`${this.apiUrl}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: email,
                    password: password
                })
            });

            const tokenData = await tokenResponse.json();
            this.token = tokenData.token;
            this.emailAddress = email;
            
            document.querySelector('.temp-email').textContent = this.emailAddress;
            this.startPolling();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Error generating email address', 'error');
        }
    }

    setupEventListeners() {
        // Copier l'adresse email
        document.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyToClipboard(this.emailAddress);
        });

        // Générer une nouvelle adresse
        document.querySelector('.refresh-btn').addEventListener('click', () => {
            this.generateNewEmail();
            this.messages = [];
            this.updateInbox();
            this.showNotification('New e-mail address generated!', 'success');
        });

        // Fermer la modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Fermer la modal en cliquant sur l'overlay
        document.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });

        // Ajouter le gestionnaire d'événements pour le bouton de signalement
        document.querySelector('.report-btn').addEventListener('click', () => {
            this.reportProblem();
        });
    }

    copyToClipboard(text) {
        // Créer un élément temporaire
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        
        // Sélectionner et copier le texte
        tempInput.select();
        try {
            document.execCommand('copy');
            this.showNotification('E-mail address copied!', 'success');
        } catch (err) {
            this.showNotification('Unable to copy address', 'error');
        }
        
        // Supprimer l'élément temporaire
        document.body.removeChild(tempInput);
    }

    startPolling() {
        // Arrêter le polling précédent s'il existe
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // Vérifier les nouveaux messages toutes les 5 secondes
        this.pollingInterval = setInterval(() => this.checkNewEmails(), 5000);
    }

    async checkNewEmails() {
        if (!this.token) return;

        try {
            const response = await fetch(`${this.apiUrl}/messages`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            const newMessages = data['hydra:member'];

            // Vérifier les nouveaux messages
            for (const message of newMessages) {
                if (!this.messages.find(m => m.id === message.id)) {
                    // Récupérer le contenu complet du message
                    const fullMessage = await this.fetchEmailContent(message);
                    if (fullMessage) {
                        this.messages.unshift(fullMessage); // Ajouter au début du tableau
                    }
                }
            }

            // Mettre à jour l'interface
            this.updateInbox();
        } catch (error) {
            console.error('Error checking emails:', error);
        }
    }

    async fetchEmailContent(message) {
        try {
            const response = await fetch(`${this.apiUrl}/messages/${message.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const fullMessage = await response.json();
            this.showNotification('New message received!', 'success');
            return fullMessage;
        } catch (error) {
            console.error('Error retrieving email content:', error);
            return null;
        }
    }

    updateInbox() {
        const mailList = document.querySelector('.mail-list');
        const mailCount = document.querySelector('.mail-count');
        
        mailCount.textContent = `${this.messages.length} messages`;

        if (this.messages.length === 0) {
            mailList.innerHTML = `
                <div class="empty-inbox">
                    <p>No message received</p>
                </div>
            `;
            return;
        }

        mailList.innerHTML = this.messages.map(mail => `
            <div class="mail-item" data-id="${mail.id}">
                <div class="mail-item-header">
                    <div class="mail-sender">${mail.from.address}</div>
                    <div class="mail-date">${this.formatDate(mail.createdAt)}</div>
                </div>
                <div class="mail-subject">${mail.subject || 'Not applicable'}</div>
                <div class="mail-preview">${mail.text ? mail.text.substring(0, 100) + '...' : 'No text content'}</div>
            </div>
        `).join('');

        // Ajouter les event listeners pour ouvrir les emails
        mailList.querySelectorAll('.mail-item').forEach(item => {
            item.addEventListener('click', () => {
                const mailId = item.dataset.id;
                const mail = this.messages.find(m => m.id === mailId);
                if (mail) {
                    this.openEmail(mail);
                }
            });
        });
    }

    openEmail(mail) {
        const modal = document.querySelector('.mail-modal');
        const overlay = document.querySelector('.modal-overlay');
        
        modal.querySelector('.modal-subject').textContent = mail.subject;
        modal.querySelector('.modal-sender').textContent = mail.from.address;
        modal.querySelector('.modal-date').textContent = this.formatDate(mail.createdAt);
        
        const content = mail.html || mail.text || 'No content';
        const contentDiv = modal.querySelector('.modal-content');
        
        if (mail.html) {
            contentDiv.innerHTML = content;
        } else {
            contentDiv.textContent = content;
        }

        modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    closeModal() {
        const modal = document.querySelector('.mail-modal');
        const overlay = document.querySelector('.modal-overlay');
        
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }

    formatDate(date) {
        return new Date(date).toLocaleString();
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    reportProblem() {
        const mailTo = 'support@enderr.win';
        const subject = 'Problem with temporary email';
        const body = `Email address concerned: ${this.emailAddress}\n\nDescribe your problem:`;
        
        window.location.href = `mailto:${mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        this.showNotification('Opening your mail client...', 'info');
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new TempMail();
});
