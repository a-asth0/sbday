const microphoneButton = document.querySelector("#enable-mic");
const candles = document.querySelector("#candles");
const cat = document.querySelector("#cat");

let audioContext;
let analyser;
let microphoneStream;
let blowStartedAt = 0;
let candlesBlownOut = false;

function revealCat() {
  if (candlesBlownOut) return;

  candlesBlownOut = true;
  candles.src = candles.dataset.unlitSrc;
  candles.alt = "Unlit birthday candles";
  const revealCat = () => cat.classList.add("revealed");
  window.setTimeout(() => {
    candles.addEventListener("animationend", revealCat, { once: true });
    window.setTimeout(revealCat, 2300);
    candles.classList.add("blown-out");
  }, 250);
}

function monitorBlow() {
  if (!analyser || candlesBlownOut) return;

  const samples = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(samples);

  let squaredVolume = 0;
  for (const sample of samples) {
    const normalizedSample = (sample - 128) / 128;
    squaredVolume += normalizedSample * normalizedSample;
  }

  const rmsVolume = Math.sqrt(squaredVolume / samples.length);
  if (rmsVolume > 0.08) {
    if (!blowStartedAt) blowStartedAt = performance.now();
    if (performance.now() - blowStartedAt > 140) revealCat();
  } else {
    blowStartedAt = 0;
  }

  requestAnimationFrame(monitorBlow);
}

microphoneButton.addEventListener("click", async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access requires a secure browser origin.");
    }

    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    await audioContext.resume();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    audioContext.createMediaStreamSource(microphoneStream).connect(analyser);
    microphoneButton.textContent = "Blow out the candles";
    microphoneButton.disabled = true;
    monitorBlow();
  } catch (error) {
    microphoneButton.textContent = "Microphone unavailable";
    console.error(error);
  }
});
