const channels = [
    {
        name: "América TV (Canal 4) HD",
        url: "https://live-evg1.tv360.bitel.com.pe/bitel/americatv/playlist.m3u8",
        id: "america-tv"
    },
    {
        name: "Latina (Canal 2) HD",
        url: "https://live-evg4.tv360.bitel.com.pe/bitel/latina/playlist.m3u8",
        id: "latina"
    },
    {
        name: "ATV (Canal 9) HD",
        url: "https://live-evg4.tv360.bitel.com.pe/bitel/atv/playlist.m3u8",
        id: "atv"
    },
    {
        name: "Exitosa TV",
        url: "https://luna-1-video.mediaserver.digital/exitosatv_233b-4b49-a726-5a3cb0e3243c/index.fmp4.m3u8",
        id: "exitosa"
    },
    {
        name: "TLNovelas HD",
        url: "https://televisa-televisa-1-it.samsung.wurl.tv/playlist.m3u8",
        id: "tlnovelas"
    }
];

const video = document.getElementById('video');
const channelList = document.getElementById('channelList');
const channelTitle = document.getElementById('channelTitle');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const btnToggleChannels = document.getElementById('btnToggleChannels');
const channelListContainer = document.getElementById('channelListContainer');

let hls = null;

function loadChannel(channel) {
    if (hls) {
        hls.destroy();
    }

    channelTitle.textContent = channel.name;

    // Update active state
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === channel.id) {
            item.classList.add('active');
        }
    });

    if (Hls.isSupported()) {
        console.log("Hls supported, loading:", channel.url);
        hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 60
        });
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(e => {
                console.warn("Autoplay blocked, muting...");
                video.muted = true;
                video.play();
            });
            updateQualityMenu(hls);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, () => updateQualitySelection(hls));

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        hls.destroy();
                        break;
                }
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
        video.addEventListener('loadedmetadata', () => video.play());
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

    // Toggle logic with defensive check
    if (btnToggleChannels && channelListContainer) {
        btnToggleChannels.addEventListener('click', () => {
            const isOpen = channelListContainer.classList.toggle('show');
            btnToggleChannels.classList.toggle('open', isOpen);
        });
    } else {
        console.warn("Toggle elements not found in DOM");
    }

    // Load first channel
    if (channels.length > 0) {
        loadChannel(channels[0]);
    }
}

// Quality Selector
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
    const autoOption = document.createElement('div');
    autoOption.className = `quality-option ${hls.autoLevelEnabled ? 'selected' : ''}`;
    autoOption.textContent = 'Auto';
    autoOption.onclick = () => {
        hls.currentLevel = -1;
        qualityMenu.classList.remove('show');
        updateQualitySelection(hls);
    };
    qualityMenu.appendChild(autoOption);

    hls.levels.forEach((level, index) => {
        const option = document.createElement('div');
        const isSelected = !hls.autoLevelEnabled && hls.currentLevel === index;
        option.className = `quality-option ${isSelected ? 'selected' : ''}`;
        option.textContent = level.height ? `${level.height}p` : `Level ${index}`;
        option.onclick = () => {
            hls.currentLevel = index;
            qualityMenu.classList.remove('show');
            updateQualitySelection(hls);
        };
        qualityMenu.appendChild(option);
    });
}

function updateQualitySelection(hls) {
    updateQualityMenu(hls);
}

fullscreenBtn.onclick = () => {
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
};

console.info("Player Version: 4.5.0 - Sidebar Toggle Implemented");
init();
