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
    const fonte = contextoAudio.createMediaElementSource(player);
    fonte.connect(analisador);
    analisador.connect(contextoAudio.destination);
    desenhar();
}

function desenhar() {
    requestAnimationFrame(desenhar);
    if (!analisador) return;
    analisador.getByteFrequencyData(dataArray);
    ctxCanvas }