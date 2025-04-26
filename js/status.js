document.addEventListener('DOMContentLoaded', () => {
    // Fonction pour vérifier le statut d'un site
    async function checkStatus(url) {
        try {
            const response = await fetch(`https://${url}`, {
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // Fonction pour mettre à jour l'indicateur de statut
    function updateStatusIndicator(container, isOnline) {
        const indicator = container.querySelector('.status-indicator');
        const statusText = container.querySelector('.status-text');
        
        indicator.classList.remove('status-loading', 'status-online', 'status-offline');
        indicator.classList.add(isOnline ? 'status-online' : 'status-offline');
        statusText.textContent = isOnline ? 'Online' : 'Offline';
    }

    // Fonction pour vérifier tous les sites
    async function checkAllSites() {
        const sites = [
            { url: 'cybercookie.party', element: document.querySelector('.status-container:nth-child(1)') },
            { url: 'enderr.win', element: document.querySelector('.status-container:nth-child(2)') },
            { url: 'endermythex.github.io', element: document.querySelector('.status-container:nth-child(3)') }
        ];

        for (const site of sites) {
            const isOnline = await checkStatus(site.url);
            updateStatusIndicator(site.element, isOnline);
        }
    }

    // Vérifier les statuts immédiatement et toutes les 30 secondes
    checkAllSites();
    setInterval(checkAllSites, 30000);
});
