document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-test');
    const downloadSpeed = document.getElementById('download-speed');
    const uploadSpeed = document.getElementById('upload-speed');
    const pingValue = document.getElementById('ping-value');
    const progressBar = document.getElementById('test-progress');
    const progressStatus = document.getElementById('progress-status');
    const serverName = document.getElementById('server-name');
    
    // Hide loader when page is loaded
    const loader = document.querySelector('.loader');
    loader.classList.add('hidden');

    // Configuration avec les serveurs CDN corrects et leurs chemins spécifiques
    const config = {
        maxTestTime: 30000,
        downloadTime: 12000,
        uploadTime: 12000,
        pingTime: 6000,
        servers: [
            { 
                name: 'Europe', 
                provider: 'JSDelivr', 
                host: 'cdn.jsdelivr.net',
                path: '/npm/jquery@3.6.0/dist/jquery.min.js'
            },
            { 
                name: 'USA', 
                provider: 'UNPKG', 
                host: 'unpkg.com',
                path: '/jquery@3.6.0/dist/jquery.min.js'
            }
        ]
    };

    // Fonction pour trouver le meilleur serveur
    async function findBestServer() {
        progressStatus.textContent = 'Sélection du meilleur serveur...';
        const results = [];

        // Nombre de tests par serveur
        const testsPerServer = 3;

        for (const server of config.servers) {
            try {
                let totalLatency = 0;
                let successfulTests = 0;

                // Faire plusieurs tests pour chaque serveur
                for (let i = 0; i < testsPerServer; i++) {
                    const startTime = performance.now();
                    const response = await fetch(`https://${server.host}${server.path}?t=${Date.now()}`, {
                        method: 'HEAD',
                        cache: 'no-store'
                    });
                    
                    if (response.ok) {
                        const latency = performance.now() - startTime;
                        totalLatency += latency;
                        successfulTests++;
                    }
                    
                    // Petit délai entre les tests
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Si au moins un test a réussi, calculer la moyenne
                if (successfulTests > 0) {
                    const avgLatency = totalLatency / successfulTests;
                    results.push({ 
                        server, 
                        latency: avgLatency,
                        successRate: successfulTests / testsPerServer
                    });
                }
            } catch (error) {
                console.warn(`Serveur ${server.name} non disponible:`, error);
            }
        }

        if (results.length === 0) {
            return config.servers[0];
        }

        // Trier d'abord par taux de succès, puis par latence
        results.sort((a, b) => {
            if (b.successRate !== a.successRate) {
                return b.successRate - a.successRate;
            }
            return a.latency - b.latency;
        });

        return results[0].server;
    }

    // Fonction pour mesurer le ping
    async function measurePing() {
        const pings = [];
        const startTime = performance.now();
        progressStatus.textContent = 'Mesure de la latence...';

        try {
            while (performance.now() - startTime < config.pingTime) {
                const pingStart = performance.now();
                await fetch(`https://${config.currentServer.host}${config.currentServer.path}?t=${Date.now()}`, {
                    method: 'HEAD',
                    cache: 'no-store'
                });
                const duration = performance.now() - pingStart;
                pings.push(duration);
                
                const currentPing = Math.round(duration);
                pingValue.textContent = `${currentPing} ms`;
                const progress = ((performance.now() - startTime) / config.pingTime) * 20;
                progressBar.style.width = `${progress}%`;
            }

            // Prendre la médiane des pings pour éviter les valeurs aberrantes
            const sortedPings = [...pings].sort((a, b) => a - b);
            const medianPing = Math.round(sortedPings[Math.floor(sortedPings.length / 2)]);
            pingValue.textContent = `${medianPing} ms`;
            return medianPing;
        } catch (error) {
            console.error('Erreur de ping:', error);
            pingValue.textContent = 'Erreur';
            throw error;
        }
    }

    // Fonction pour mesurer la vitesse de téléchargement
    async function measureDownloadSpeed() {
        let measurements = [];
        const startTime = performance.now();
        progressStatus.textContent = 'Test de téléchargement en cours...';

        try {
            while (performance.now() - startTime < config.downloadTime) {
                // Taille fixe de 1MB pour des mesures plus stables
                const chunkSize = 1024 * 1024;
                const url = `https://${config.currentServer.host}${config.currentServer.path}?bytes=${chunkSize}&t=${Date.now()}`;
                const fetchStart = performance.now();
                const response = await fetch(url, { 
                    mode: 'cors',
                    cache: 'no-store'
                });
                const reader = response.body.getReader();
                let receivedSize = 0;

                while (true) {
                    const {done, value} = await reader.read();
                    if (done) break;
                    receivedSize += value.length;
                }

                const duration = (performance.now() - fetchStart) / 1000;
                // Facteur de correction plus important (0.7) pour compenser la surestimation
                const speedMbps = (receivedSize * 8 / duration / 1000000) * 0.7;
                
                // Filtrer les valeurs aberrantes
                if (speedMbps > 0.1 && speedMbps < 100) {
                    measurements.push(speedMbps);
                }

                // Calcul de la moyenne mobile des 3 dernières mesures valides
                if (measurements.length > 0) {
                    const recentMeasurements = measurements.slice(-3);
                    const avgSpeed = recentMeasurements.reduce((a, b) => a + b, 0) / recentMeasurements.length;
                    downloadSpeed.textContent = `${avgSpeed.toFixed(2)} Mbps`;
                }

                const progress = 20 + ((performance.now() - startTime) / config.downloadTime) * 40;
                progressBar.style.width = `${progress}%`;
            }

            // Pour le résultat final, prendre la médiane des mesures
            if (measurements.length > 0) {
                const sortedSpeeds = [...measurements].sort((a, b) => a - b);
                const medianSpeed = sortedSpeeds[Math.floor(sortedSpeeds.length / 2)];
                return medianSpeed;
            }
            return 0;
        } catch (error) {
            console.error('Erreur de téléchargement:', error);
            downloadSpeed.textContent = 'Erreur';
            throw error;
        }
    }

    // Fonction pour mesurer la vitesse d'upload
    async function measureUploadSpeed() {
        let measurements = [];
        const startTime = performance.now();
        progressStatus.textContent = 'Test d\'envoi en cours...';

        try {
            while (performance.now() - startTime < config.uploadTime) {
                const chunkSize = 512 * 1024 * (measurements.length + 1); // Augmente progressivement
                const data = new Uint8Array(chunkSize);
                const uploadStart = performance.now();

                await fetch('https://httpbin.org/post', {
                    method: 'POST',
                    mode: 'cors',
                    body: data
                });

                const duration = (performance.now() - uploadStart) / 1000;
                const speedMbps = (chunkSize * 8 / duration / 1000000);
                measurements.push(speedMbps);

                const avgSpeed = measurements.slice(-3).reduce((a, b) => a + b) / Math.min(measurements.length, 3);
                uploadSpeed.textContent = `${avgSpeed.toFixed(2)} Mbps`;

                const progress = 60 + ((performance.now() - startTime) / config.uploadTime) * 40;
                progressBar.style.width = `${progress}%`;
            }

            return measurements.slice(-3).reduce((a, b) => a + b) / 3;
        } catch (error) {
            console.error('Erreur d\'upload:', error);
            uploadSpeed.textContent = 'Erreur';
            throw error;
        }
    }

    // Fonction principale de test
    async function runSpeedTest() {
        startButton.disabled = true;
        progressBar.style.width = '0%';
        
        try {
            // Trouver le meilleur serveur
            const bestServer = await findBestServer();
            serverName.textContent = `${bestServer.name} (${bestServer.provider})`;
            
            // Mettre à jour l'URL du serveur pour les tests
            config.currentServer = bestServer;
            
            await measurePing();
            await measureDownloadSpeed();
            await measureUploadSpeed();
            
            progressStatus.textContent = 'Test terminé';
            progressBar.style.width = '100%';
        } catch (error) {
            console.error('Erreur lors du test:', error);
            progressStatus.textContent = 'Erreur lors du test. Veuillez réessayer.';
        } finally {
            startButton.disabled = false;
        }
    }

    // Event listener
    startButton.addEventListener('click', runSpeedTest);
});
