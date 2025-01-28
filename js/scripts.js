document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.loader');
    
    // Créer une promesse pour chaque image
    const imagePromises = Array.from(document.images)
        .map(img => {
            if (img.complete) {
                return Promise.resolve();
            }
            return new Promise(resolve => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve); // Gérer aussi les erreurs
            });
        });

    // Créer une promesse pour les polices
    const fontPromise = document.fonts.ready;

    // Attendre que tout soit chargé
    Promise.all([
        ...imagePromises,
        fontPromise
    ]).then(() => {
        loader.classList.add('hidden');
    });

    // Mettre à jour les informations réseau
    updateNetworkInfo();
    
    // Mettre à jour le ping toutes les 10 secondes
    setInterval(() => {
        updateNetworkInfo();
    }, 2000);
});

// Afficher le loader lors de la navigation
window.addEventListener('beforeunload', () => {
    const loader = document.querySelector('.loader');
    loader.classList.remove('hidden');
});

// Fonction pour afficher les notifications
function showNotification(message, type = 'success') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    // Créer la nouvelle notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Afficher la notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Supprimer la notification après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Fonction pour vérifier le cooldown
function checkCooldown() {
    const lastSubmitTime = localStorage.getItem('lastSubmitTime');
    const cooldownDuration = 60000; // 60 secondes de cooldown
    
    if (lastSubmitTime) {
        const timeElapsed = Date.now() - parseInt(lastSubmitTime);
        if (timeElapsed < cooldownDuration) {
            const remainingTime = Math.ceil((cooldownDuration - timeElapsed) / 1000);
            showNotification(`Please wait ${remainingTime} seconds before sending another message.`, 'error');
            return false;
        }
    }
    return true;
}

// Gestion du formulaire de contact
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Vérifier le cooldown
            if (!checkCooldown()) {
                return;
            }

            // Vérifier le token Turnstile
            const turnstileResponse = turnstile.getResponse();
            if (!turnstileResponse) {
                showNotification('Please complete the captcha', 'error');
                return;
            }
            
            const submitBtn = contactForm.querySelector('.submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            
            // Afficher le loader
            btnText.classList.add('hidden');
            btnLoader.classList.add('visible');
            submitBtn.disabled = true;

            const formData = new FormData();
            formData.append('entry.2072810337', document.getElementById('name').value);
            formData.append('entry.1822818382', document.getElementById('email').value);
            formData.append('entry.1414799093', document.getElementById('message').value);
            formData.append('cf-turnstile-response', turnstileResponse);

            try {
                const response = await fetch(
                    'https://docs.google.com/forms/d/e/1FAIpQLSdsvkDWAoW5Ep9xp8hFK25MJ_Th0qTtEQXWS24GpR5oZE82pQ/formResponse',
                    {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams(formData)
                    }
                );

                // Réinitialiser le captcha
                turnstile.reset();

                // Enregistrer le temps de soumission
                localStorage.setItem('lastSubmitTime', Date.now().toString());
                
                showNotification('Message sent successfully !', 'success');
                contactForm.reset();
                
            } catch (error) {
                showNotification('An error occurred. Please try again.', 'error');
                console.error('Error:', error);
            } finally {
                // Cacher le loader
                btnText.classList.remove('hidden');
                btnLoader.classList.remove('visible');
                submitBtn.disabled = false;
            }
        });
    }
});

// Modifier la fonction updateNetworkInfo
async function updateNetworkInfo() {
    const ipElement = document.querySelector('.ip-address');
    const pingElement = document.querySelector('.ping');
    // Sauvegarder l'état de visibilité actuel
    const wasHidden = ipElement.classList.contains('hidden');

    try {
        // Récupérer l'IP
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        // Créer le contenu de l'élément IP
        ipElement.innerHTML = `<span>IP: ${ipData.ip}</span><button class="toggle-ip" title="Toggle IP visibility">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        </button>`;
        
        // Restaurer l'état de visibilité précédent ou cacher par défaut si c'est le premier chargement
        if (wasHidden || (!wasHidden && !ipElement.classList.contains('initialized'))) {
            ipElement.classList.add('hidden');
        }
        ipElement.classList.add('initialized');
        
        // Mettre à jour l'icône en fonction de l'état actuel
        const toggleButton = ipElement.querySelector('.toggle-ip');
        if (!ipElement.classList.contains('hidden')) {
            toggleButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>`;
        }
        
        // Ajouter l'écouteur d'événements pour le bouton
        toggleButton.addEventListener('click', () => {
            ipElement.classList.toggle('hidden');
            if (ipElement.classList.contains('hidden')) {
                toggleButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>`;
            } else {
                toggleButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>`;
            }
        });

        // Mesurer le ping
        const startTime = performance.now();
        await fetch('https://api.ipify.org?format=json');
        const endTime = performance.now();
        const pingTime = Math.round(endTime - startTime);
        pingElement.textContent = `Ping: ${pingTime}ms`;

    } catch (error) {
        ipElement.textContent = 'IP: Error';
        pingElement.textContent = 'Ping: Error';
        console.error('Network info error:', error);
    }
}
