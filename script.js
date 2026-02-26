const scriptGeral = document.createElement('script');
scriptGeral.src = "https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js";
document.head.appendChild(scriptGeral);

const btnPlay = document.getElementById('btn-play');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const disco = document.querySelector('.disco');
const agulha = document.getElementById('agulha');
const uploadMusica = document.getElementById('upload-musica');
const capaVisual = document.querySelector('.capa-musica');
const canvas = document.getElementById('espectro');
const ctxCanvas = canvas.getContext('2d');

let playerA = new Audio();
let playerB = new Audio();

playerA.preload = "auto";
playerB.preload = "auto";

let playerAtivo = playerA;
let playlistFiles = []; 
let playlistUrls = [];
let indexAtual = 0;
let tocando = false;
let contextoAudio, analisador, dataArray, bufferLength;

function extrairCapa(file) {
    if (!window.jsmediatags) return;
    window.jsmediatags.read(file, {
        onSuccess: function(tag) {
            const image = tag.tags.picture;
            if (image) {
                let base64String = "";
                for (let i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
                const base64 = "data:" + image.format + ";base64," + window.btoa(base64String);
                capaVisual.style.backgroundImage = `url(${base64})`;
                capaVisual.style.backgroundColor = "transparent";
            } else {
                aplicarCapaPadrao();
            }
        },
        onError: function() {
            aplicarCapaPadrao();
        }
    });
}

function aplicarCapaPadrao() {
    const coresVibe = ['#ff8c00', '#dd9e3f', '#4a2f15', '#221100', '#1a1a1a'];
    const corSorteada = coresVibe[Math.floor(Math.random() * coresVibe.length)];
    capaVisual.style.backgroundImage = "none";
    capaVisual.style.backgroundColor = corSorteada;
}

function iniciarEspectro(player) {
    if (!contextoAudio) {
        contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
        analisador = contextoAudio.createAnalyser();
        analisador.fftSize = 256;
        bufferLength = analisador.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }
    
    try {
        const fonte = contextoAudio.createMediaElementSource(player);
        fonte.connect(analisador);
        analisador.connect(contextoAudio.destination);
    } catch (e) { console.log("Fonte já conectada"); }
    
    desenhar();
}

function desenhar() {
    requestAnimationFrame(desenhar);
    if (!analisador) return;
    analisador.getByteFrequencyData(dataArray);
    ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
    const larguraBarra = (canvas.width / bufferLength) * 2;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const alturaBarra = dataArray[i] / 1.5;
        ctxCanvas.fillStyle = `rgba(221, 158, 63, ${alturaBarra / 255})`;
        ctxCanvas.fillRect(x, (canvas.height / 2) - (alturaBarra / 2), larguraBarra, alturaBarra);
        x += larguraBarra + 1;
    }
}

function fazerCrossfade(index) {
    const playerAntigo = playerAtivo;
    const novoPlayer = (playerAtivo === playerA) ? playerB : playerA;
    
    disco.classList.remove('tocando');
    disco.classList.add('animar-troca');
    
    if (tocando) agulha.style.transform = 'rotate(-15deg)';

    setTimeout(() => {
        extrairCapa(playlistFiles[index]);
        novoPlayer.src = playlistUrls[index];
        novoPlayer.volume = 0;
        playerAtivo = novoPlayer;

        if (tocando) {
            
            const playPromise = novoPlayer.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    let vol = 0;
                    const intervalo = setInterval(() => {
                        if (vol < 1) {
                            vol = Math.min(1, vol + 0.05);
                            novoPlayer.volume = vol;
                            playerAntigo.volume = 1 - vol;
                        } else {
                            playerAntigo.pause();
                            clearInterval(intervalo);
                        }
                    }, 100);
                }).catch(error => { console.log("Play bloqueado pelo navegador"); });
            }
            setTimeout(() => { if (tocando) agulha.style.transform = 'rotate(25deg)'; }, 1100);
        } else {
            playerAntigo.pause();
            playerAtivo.volume = 1;
        }
    }, 1250);

    setTimeout(() => {
        disco.classList.remove('animar-troca');
        if (tocando) disco.classList.add('tocando');
    }, 2500);
}

btnPlay.addEventListener('click', () => {
    if (playlistUrls.length === 0) return alert("Adicione músicas!");
    
   
    if (contextoAudio && contextoAudio.state === 'suspended') {
        contextoAudio.resume();
    }
    
    if (tocando) {
        playerAtivo.pause();
        disco.classList.remove('tocando');
        agulha.style.transform = 'rotate(-15deg)';
        btnPlay.innerText = 'Play';
    } else {
        if (!playerAtivo.src) {
            playerAtivo.src = playlistUrls[indexAtual];
            extrairCapa(playlistFiles[indexAtual]);
        }
        playerAtivo.play();
        disco.classList.add('tocando');
        agulha.style.transform = 'rotate(25deg)';
        btnPlay.innerText = 'Pause';
    }
    tocando = !tocando;
});

uploadMusica.addEventListener('change', (e) => {
    const ficheiros = Array.from(e.target.files);
    ficheiros.forEach(file => {
        if (file.type.startsWith('audio/') && playlistUrls.length < 5) {
            playlistFiles.push(file);
            playlistUrls.push(URL.createObjectURL(file));
        }
    });
    if (playlistUrls.length > 0) {
       
        iniciarEspectro(playerA);
        iniciarEspectro(playerB);
    }
});

btnNext.addEventListener('click', () => {
    if (playlistUrls.length > 1) {
        indexAtual = (indexAtual + 1) % playlistUrls.length;
        fazerCrossfade(indexAtual);
    }
});

btnPrev.addEventListener('click', () => {
    if (playlistUrls.length > 1) {
        indexAtual = (indexAtual - 1 + playlistUrls.length) % playlistUrls.length;
        fazerCrossfade(indexAtual);
    }
});

playerA.addEventListener('ended', () => { if (playlistUrls.length > 1) btnNext.click(); });
playerB.addEventListener('ended', () => { if (playlistUrls.length > 1) btnNext.click(); });