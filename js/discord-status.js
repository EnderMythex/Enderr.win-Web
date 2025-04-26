const DISCORD_ID = '1006197798577909880';

async function updateDiscordStatus() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await response.json();
       
        if (data.success) {
            const { discord_status, discord_user, activities, spotify } = data.data;
           
            // Update avatar, badges and username
            const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${discord_user.avatar}`;
            
            // Update profile section
            const profileSection = document.createElement('div');
            profileSection.className = 'discord-profile-section';
            
            // Create avatar container with decorations
            const avatarContainer = document.createElement('div');
            avatarContainer.className = 'discord-avatar-container';
            avatarContainer.innerHTML = `
                <img src="${avatarUrl}" class="discord-avatar" alt="Discord Avatar">
            `;
            
            // Create username with badges
            const usernameContainer = document.createElement('div');
            usernameContainer.className = 'discord-username-container';
            
            usernameContainer.innerHTML = `
                <div class="discord-username">${discord_user.username}</div>
            `;
            
            // Add avatar and username to profile section
            profileSection.appendChild(avatarContainer);
            profileSection.appendChild(usernameContainer);
            
            // Clear the discord container
            const discordContainer = document.querySelector('.discord-container');
            discordContainer.innerHTML = '';
            
            // Add profile section to container
            discordContainer.appendChild(profileSection);
            
            // Create status section
            const statusSection = document.createElement('div');
            statusSection.className = 'discord-status-section';
            
            // Add status indicator
            const statusDiv = document.createElement('div');
            statusDiv.className = 'discord-status';
            statusDiv.innerHTML = `
                <div class="discord-status-dot discord-status-${discord_status}"></div>
                <div class="discord-status-text">${discord_status.charAt(0).toUpperCase() + discord_status.slice(1)}</div>
            `;
            statusSection.appendChild(statusDiv);
            
            // Check for Spotify activity
            if (spotify) {
                const spotifyDiv = document.createElement('div');
                spotifyDiv.className = 'discord-current-activity spotify-activity';
                spotifyDiv.innerHTML = `
                    <div class="activity-icon">
                        <img src="${spotify.album_art_url}" class="spotify-art" alt="Album art">
                    </div>
                    <div class="activity-details">
                        <div class="activity-header">LISTENING TO SPOTIFY...</div>
                        <div class="activity-name">${spotify.song} - ${spotify.artist.substring(0, 15) + (spotify.artist.length > 15 ? '...' : '')}</div>
                        <div class="activity-subtitle">By ${spotify.artist}</div>
                    </div>
                `;
                statusSection.appendChild(spotifyDiv);
            }
            
            // Check for other activities (games, applications, etc.)
            const nonCustomActivities = activities.filter(activity => 
                activity.type !== 4 && activity.name && activity.type !== 2 // Exclude custom status and spotify
            );
            
            if (nonCustomActivities.length > 0) {
                // Display the most recent activity (first in the array)
                const activity = nonCustomActivities[0];
                
                const activityDiv = document.createElement('div');
                activityDiv.className = 'discord-current-activity';
                
                // Determine activity type label
                let activityTypeText = 'PLAYING';
                if (activity.type === 1) activityTypeText = 'STREAMING';
                if (activity.type === 3) activityTypeText = 'WATCHING';
                
                // Prepare app icon HTML
                let appIconHtml = '<div class="default-activity-icon">App</div>';
                
                // If activity has assets, display them
                if (activity.assets && activity.assets.large_image) {
                    const assetUrl = activity.assets.large_image.startsWith('mp:') 
                        ? `https://media.discordapp.net/${activity.assets.large_image.replace('mp:', '')}`
                        : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
                        
                    appIconHtml = `<img src="${assetUrl}" class="activity-app-icon" alt="App icon">`;
                } else if (activity.application_id) {
                    // Try to get icon from application ID
                    appIconHtml = `<img src="https://cdn.discordapp.com/app-icons/${activity.application_id}/default.png" class="activity-app-icon" alt="App icon">`;
                }
                
                activityDiv.innerHTML = `
                    <div class="activity-icon">
                        ${appIconHtml}
                    </div>
                    <div class="activity-details">
                        <div class="activity-header">${activityTypeText}...</div>
                        <div class="activity-name">${activity.name}</div>
                        ${activity.details ? `<div class="activity-subtitle">${activity.details}</div>` : ''}
                        ${activity.state ? `<div class="activity-state">${activity.state}</div>` : ''}
                    </div>
                `;
                
                statusSection.appendChild(activityDiv);
            }
            
            // Add status section to container
            discordContainer.appendChild(statusSection);
        }
    } catch (error) {
        console.error('Failed to fetch Discord status:', error);
    }
}

// Update every second to quickly reflect changes
document.addEventListener('DOMContentLoaded', () => {
    updateDiscordStatus();
    setInterval(updateDiscordStatus, 1000);
});