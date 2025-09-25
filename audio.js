// Multiband audio (standalone) for demo
(() => {
  let ctx, analyser, timeData, freqData, stream;
  let ema = 0; let bands = {bass:0,mids:0,highs:0};
  const $ = s => document.querySelector(s);
  const bar = () => document.getElementById('bar');

  async function enumerate() {
    try { await navigator.mediaDevices.getUserMedia({audio:true}); } catch(_) {}
    const devs = await navigator.mediaDevices.enumerateDevices();
    const mics = devs.filter(d => d.kind === 'audioinput');
    const sel = $('#mic'); sel.innerHTML='';
    mics.forEach((d,i)=>{ const o=document.createElement('option'); o.value=d.deviceId; o.textContent=d.label||`Mic ${i+1}`; sel.appendChild(o); });
  }

  async function start() {
    try{
      $('#status').textContent='starting...';
      if(!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state!=='running') await ctx.resume();
      stop();
      const deviceId = $('#mic').value;
      const constraints = { audio: { deviceId: deviceId?{exact:deviceId}:undefined, echoCancellation:false, noiseSuppression:false, autoGainControl:false } };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      const src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.7;
      timeData = new Uint8Array(analyser.fftSize);
      freqData = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
      tick();
      $('#status').textContent='mic running';
    }catch(e){ $('#status').textContent='mic error'; alert('Mic error: '+e.message); }
  }
  function stop(){ if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null;} analyser=null; }
  function computeRMS(){
    if(!analyser) return 0; analyser.getByteTimeDomainData(timeData);
    let sum=0; for(let i=0;i<timeData.length;i++){ const v=(timeData[i]-128)/128; sum+=v*v; }
    return Math.sqrt(sum/timeData.length);
  }
  function computeBands(){
    if(!analyser) return {bass:0,mids:0,highs:0};
    analyser.getByteFrequencyData(freqData);
    const sr = ctx.sampleRate || 48000; const nyq = sr/2; const binHz = nyq/freqData.length;
    const BASS_MAX=160, MIDS_MAX=2000, HIGHS_MAX=8000;
    let sb=0,nb=0, sm=0,nm=0, sh=0,nh=0;
    for(let i=0;i<freqData.length;i++){
      const hz=i*binHz; const v=freqData[i]/255;
      if(hz<=BASS_MAX){ sb+=v; nb++; }
      else if(hz<=MIDS_MAX){ sm+=v; nm++; }
      else if(hz<=HIGHS_MAX){ sh+=v; nh++; }
    }
    const bass = nb? Math.pow(sb/nb,0.85):0;
    const mids = nm? Math.pow(sm/nm,0.90):0;
    const highs= nh? Math.pow(sh/nh,0.95):0;
    const aB=0.18,aM=0.20,aH=0.22;
    bands.bass=bands.bass*(1-aB)+bass*aB;
    bands.mids=bands.mids*(1-aM)+mids*aM;
    bands.highs=bands.highs*(1-aH)+highs*aH;
    return bands;
  }
  function tick(){
    const rms=computeRMS(); const a=0.25; ema=ema*(1-a)+rms*a;
    const bl=computeBands();
    if(bar()) bar().style.width = Math.min(100, Math.round(ema*300))+'%';
    const pb=document.getElementById('pill-bass'); const pm=document.getElementById('pill-mids'); const ph=document.getElementById('pill-highs');
    if(pb) pb.textContent='bass '+bl.bass.toFixed(2); if(pm) pm.textContent='mids '+bl.mids.toFixed(2); if(ph) ph.textContent='highs '+bl.highs.toFixed(2);
    requestAnimationFrame(tick);
  }
  window.getAudioLevel=()=>ema; window.getBandLevels=()=>bands;
  window.addEventListener('load',()=>{
    enumerate();
    document.getElementById('start').onclick=start;
    document.getElementById('stop').onclick=()=>{ stop(); document.getElementById('status').textContent='stopped'; };
    navigator.mediaDevices?.addEventListener?.('devicechange', enumerate);
  });
})();