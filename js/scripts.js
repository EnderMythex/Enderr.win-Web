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
