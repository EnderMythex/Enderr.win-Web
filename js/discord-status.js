const DISCORD_ID = '1006197798577909880';

async function updateDiscordStatus() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await response.json();
        
        if (data.success) {
            const { discord_status, discord_user, activities, spotify } = data.data;
            
            // Mettre à jour l'avatar et le nom d'utilisateur
            const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${discord_user.avatar}`;
            document.querySelector('.discord-avatar').src = avatarUrl;
            document.querySelector('.discord-username').textContent = discord_user.username;

            // Conteneur des activités
            const activityContainer = document.querySelector('.discord-activity');
            activityContainer.innerHTML = '';

            // Ajouter le statut
            const statusDiv = document.createElement('div');
            statusDiv.className = 'discord-status';
            statusDiv.innerHTML = `
                <div class="discord-status-dot discord-status-${discord_status}"></div>
                <div class="discord-status-text">${discord_status.charAt(0).toUpperCase() + discord_status.slice(1)}</div>
            `;
            activityContainer.appendChild(statusDiv);

            // Nettoyer les anciennes bulles de lien
            const oldBubbles = document.querySelectorAll('.discord-link-bubble');
            oldBubbles.forEach(bubble => bubble.remove());

            // Trouver l'activité avec le lien enderr.win
            const customStatus = activities.find(activity => 
                activity.type === 4 && activity.state && activity.state.includes('enderr.win')
            );

            if (customStatus) {
                const linkBubble = document.createElement('div');
                linkBubble.className = 'discord-link-bubble';
                linkBubble.innerHTML = `
                    <span class="fire-icon">🔥</span>
                    ${customStatus.state}
                `;
                document.querySelector('.discord-user-info').appendChild(linkBubble);
            }

            // Ajouter Spotify si présent
            if (spotify) {
                const spotifyDiv = document.createElement('div');
                spotifyDiv.className = 'discord-current-activity spotify-activity';
                spotifyDiv.innerHTML = `
                    <img src="${spotify.album_art_url}" class="spotify-art" alt="Album art">
                    <div class="spotify-info">
                        <div class="spotify-song">${spotify.song}</div>
                        <div class="spotify-artist">${spotify.artist}</div>
                    </div>
                `;
                activityContainer.appendChild(spotifyDiv);
            }
        }
    } catch (error) {
        console.error('Failed to fetch Discord status:', error);
    }
}

// Mettre à jour toutes les 5 secondes
document.addEventListener('DOMContentLoaded', () => {
    updateDiscordStatus();
    setInterval(updateDiscordStatus, 1000);
}); 