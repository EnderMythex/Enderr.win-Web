// Matrix Rain Effect with Japanese characters
document.addEventListener('DOMContentLoaded', function() {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1'; // Mettre en arrière-plan
    canvas.style.opacity = '1'; // Opacité maximale
    document.body.insertBefore(canvas, document.body.firstChild);

    // Modifier les conteneurs pour les rendre semi-transparents
    setTimeout(() => {
        const containers = document.querySelectorAll('.container');
        containers.forEach(container => {
            container.style.backgroundColor = 'rgba(5, 5, 5, 0.78)';
            container.style.backdropFilter = 'blur(3px)';
            container.style.position = 'relative';
            container.style.zIndex = '1';
        });
        
        // Correction pour les grilles de projets et d'outils
        const projectsGrids = document.querySelectorAll('.projects-grid');
        projectsGrids.forEach(grid => {
            grid.style.position = 'relative';
            grid.style.zIndex = '2';
            grid.style.backgroundColor = 'transparent';
            grid.style.border = 'none';
            grid.style.backdropFilter = 'none';
            
            // Détection de la page projects.html (via la classe sur le body)
            const isProjectsPage = document.body.classList.contains('projects-html');
            
            // Si c'est la page projects, on ajuste spécifiquement le layout
            if (isProjectsPage) {
                grid.style.display = 'grid';
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                grid.style.gridTemplateRows = 'repeat(2, 1fr)';
                grid.style.gap = '1.5rem';
            }
            
            // Corriger les cartes de projet à l'intérieur de la grille
            const cards = grid.querySelectorAll('.project-card');
            cards.forEach(card => {
                card.style.position = 'relative';
                card.style.zIndex = '2';
                card.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                card.style.margin = '0';
                card.style.height = 'auto';
                card.style.aspectRatio = '1 / 1';
                
                // S'assurer que l'overlay est au-dessus
                const overlay = card.querySelector('.project-overlay');
                if (overlay) {
                    overlay.style.position = 'absolute';
                    overlay.style.zIndex = '3';
                }
                
                // Ajuster l'opacité de l'image
                const img = card.querySelector('.project-image');
                if (img) {
                    img.style.opacity = '0.9';
                    img.style.position = 'absolute';
                    img.style.top = '0';
                    img.style.left = '0';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                }
            });
        });
        
        // Ajuster z-index pour divers éléments
        const elements = document.querySelectorAll('.project, .discord-container, .speed-test-container, .temp-mail-container, .status-grid, .contact-form');
        elements.forEach(el => {
            el.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            el.style.position = 'relative';
            el.style.zIndex = '1';
        });
        
        // S'assurer que tous les éléments interactifs sont au-dessus
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, .social-icon');
        interactiveElements.forEach(el => {
            el.style.position = 'relative';
            el.style.zIndex = '5';
        });
    }, 100);

    const ctx = canvas.getContext('2d');
    
    // Characters to use (as specified)
    const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    
    let drops = []; // Array of drops
    let brightness = []; // Array for character brightness
    let fontSize = 9; // Légèrement plus petit pour augmenter la densité
    
    // Setting canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Initialize the drops
        drops = [];
        brightness = [];
        const columns = Math.floor(canvas.width / fontSize) * 1.0; // Augmentation de la densité des colonnes
        
        for (let i = 0; i < columns; i++) {
            // Initial position of each drop
            drops[i] = Math.floor(Math.random() * -canvas.height / fontSize);
            // Initial brightness (0.5-1)
            brightness[i] = 1.1 + Math.random() * 1.1;
        }
    }
    
    // Call resize on window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Drawing the characters
    function draw() {
        // Black background with opacity
        ctx.fillStyle = 'rgba(0, 0, 0, 0.21)'; // Opacité légèrement réduite pour effet plus doux
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw each character in the matrix
        for (let i = 0; i < drops.length; i++) {
            // Faire varier la luminosité pour chaque colonne
            brightness[i] += (Math.random() * 0.00 - 0.00);
            
            // Garder la luminosité dans une plage acceptable
            if (brightness[i] < 0.4) brightness[i] = 0.4;
            if (brightness[i] > 1.1) brightness[i] = 0.1;
            
            // Select a random character
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            
            // Set color with varying brightness
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness[i]})`;
            ctx.font = fontSize + 'px monospace';
            
            // Draw the character
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);
            
            // Move the drop down
            drops[i] += 0.95; // Vitesse légèrement ajustée
            
            // Reset the drop if it reaches the bottom or randomly
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
                drops[i] = Math.floor(Math.random() * -10);
                brightness[i] = 2.0 + Math.random() * 2.5; // Reset brightness
            }
        }
    }
    
    // Animation loop
    setInterval(draw, 45); // Vitesse légèrement plus rapide
}); 