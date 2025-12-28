const channels = [
    {
        name: "América TV (Canal 4) HD",
        url: "https://live.saohgdasregions.fun:9092/MjAwLjIxNS4yNDguMTc1/20_.m3u8?token=IVsF4tZdBWu65PRg6x8u8Q&expires=1766963421",
        id: "america-tv"
    },
    {
        name: "Latina (Canal 2) HD",
        url: "https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/latina/latina.smil/playlist.m3u8",
        id: "latina"
    },
    {
        name: "Disney Channel",
        url: "http://201.230.121.186:8000/play/a0fb/index.m3u8",
        id: "disney"
    },
    {
        name: "ATV (Canal 9) HD",
        url: "https://live.saohgdasregions.fun:9092/MjAwLjIxNS4yNDguMTc1/23_.m3u8?token=Pl8jRWv69x4reB-vFba4_A&expires=1766956208",
        id: "atv"
    },
    {
        name: "Exitosa TV",
        url: "https://luna-1-video.mediaserver.digital/exitosatv_233b-4b49-a726-5a3cb0e3243c/index.fmp4.m3u8",
        id: "exitosa"
    }
];

const video = document.getElementById('video');
const channelList = document.getElementById('channelList');
const channelTitle = document.getElementById('channelTitle');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const playerWrapper = document.getElementById('playerWrapper');

let hls = null;

function loadChannel(channel) {
    if (hls) {
        hls.destroy();
    }

    channelTitle.textContent = channel.name;

    // Update active state in sidebar
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === channel.id) {
            item.classList.add('active');
        }
    });

    if (Hls.isSupported()) {
        console.log("Hls is supported, loading source:", channel.url);
        hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 60
        });
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            console.log("Manifest parsed, playing...");
            video.play().catch(e => {
                console.warn("Autoplay blocked or play failed:", e);
                // Try to play muted if blocked
                video.muted = true;
                video.play();
            });
            updateQualityMenu(hls);
        });

        // visual feedback for level switch
        hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
            updateQualitySelection(hls);
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
            console.error("HLS Error:", data);
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error("Network error, trying to recover...");
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error("Media error, trying to recover...");
                        hls.recoverMediaError();
                        break;
                    default:
                        console.error("Unrecoverable error Type:", data.type);
                        hls.destroy();
                        break;
                }
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log("Native HLS support detected");
        video.src = channel.url;
        video.addEventListener('loadedmetadata', function () {
            video.play().catch(e => console.warn("Native play failed:", e));
        });
    } else {
        alert("Tu navegador no soporta la reproducción de este contenido.");
    }
}

function init() {
    channels.forEach(channel => {
        const item = document.createElement('div');
        item.className = 'channel-item';
        item.dataset.id = channel.id;

        const channelNum = channel.name.match(/\d+/);
        const iconLabel = channelNum ? channelNum[0] : channel.name.charAt(0);

        item.innerHTML = `
            <div class="channel-icon">${iconLabel}</div>
            <div class="channel-name">${channel.name}</div>
        `;

        item.onclick = () => loadChannel(channel);
        channelList.appendChild(item);
    });

    // Load first channel by default
    if (channels.length > 0) {
        loadChannel(channels[0]);
    }
}

// Quality Selector Logic
const settingsBtn = document.getElementById('settingsBtn');
const qualityMenu = document.getElementById('qualityMenu');

settingsBtn.onclick = (e) => {
    e.stopPropagation();
    qualityMenu.classList.toggle('show');
};

document.onclick = (e) => {
    if (!settingsBtn.contains(e.target) && !qualityMenu.contains(e.target)) {
        qualityMenu.classList.remove('show');
    }
};

function updateQualityMenu(hls) {
    qualityMenu.innerHTML = '';

    // Auto Option
    const autoOption = document.createElement('div');
    autoOption.className = `quality-option ${hls.autoLevelEnabled ? 'selected' : ''}`;
    autoOption.textContent = 'Auto';
    autoOption.onclick = () => {
        hls.currentLevel = -1; // -1 triggers auto level
        qualityMenu.classList.remove('show');
        updateQualitySelection(hls);
    };
    qualityMenu.appendChild(autoOption);

    // Available Levels
    hls.levels.forEach((level, index) => {
        const option = document.createElement('div');
        const isSelected = !hls.autoLevelEnabled && hls.currentLevel === index;
        option.className = `quality-option ${isSelected ? 'selected' : ''}`;

        // Format label (e.g. 1080p, 720p)
        const label = level.height ? `${level.height}p` : `Level ${index}`;
        option.textContent = label;

        option.onclick = () => {
            hls.currentLevel = index;
            qualityMenu.classList.remove('show');
            updateQualitySelection(hls);
        };
        qualityMenu.appendChild(option);
    });
}

function updateQualitySelection(hls) {
    // Re-render menu to update checkmarks
    updateQualityMenu(hls);
}

// Fullscreen Logic
fullscreenBtn.onclick = () => {
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
    }
};

init();
