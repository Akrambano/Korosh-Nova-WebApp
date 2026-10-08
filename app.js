const AS='/assets/';
const screen=document.getElementById('screen'),dock=document.getElementById('dock'),audio=document.getElementById('audio');
const nav=[['bluetooth','بلوتوث'],['usb','گنجینه نوا'],['music','آوای نوا'],['rgb','RGB'],['galaxy','کهکشانی'],['ai','نورا'],['settings','اتاق فرمان']];
const state=JSON.parse(localStorage.getItem('koroshNovaWebState')||'null')||{route:'start',artwork:null,volume:.85,repeat:false,eq:[0,0,0,0,0],eqPreset:'مستقیم',bluetooth:false,wifi:false,wifiConnecting:false,speaker:true,skin:'approved',galaxyEffect:0,rgbEffect:0,musicBackground:'static',usbBackground:'static',musicBackgroundGallery:null,usbBackgroundGallery:null,frameOption:8,frameEffect:'orbit',albumMotion:'none'};
const MOTION={
 music:[['avaye_bg_motion_1.gif','موج کیهانی'],['avaye_bg_motion_2.gif','شفق نئونی'],['avaye_bg_motion_3.gif','عمق بنفش']],
 usb:[['ganjineh_bg_motion_1.gif','موج آبی'],['ganjineh_bg_motion_2.gif','شفق فیروزه‌ای'],['ganjineh_bg_motion_3.gif','نبض نئونی']]
};
const FRAMES=[[1,'آبی / ارغوانی انرژی'],[2,'طلایی / قرمز نگین‌دار'],[3,'کریستالی آبی'],[4,'برگ‌های فیروزه‌ای'],[5,'اکولایزر ارغوانی'],[6,'کریستال یخی'],[7,'بافت رنگین‌کمانی'],[8,'مدار آبی / برنزی']];
const FRAME_EFFECTS=[['orbit','گردش نوری','چرخش پیوسته قاب'],['pulse','نبض نور','تغییر شدت نور قاب'],['shimmer','درخشش عبوری','حرکت نور روی قاب'],['orbitPulse','مدار + نبض','چرخش همراه با نبض'],['crystal','کریستالی','تنفس نور سرد و تیز'],['energy','انرژی','چرخش تندتر با موج نور']];
function ensureStateDefaults(){if(!state.musicBackground)state.musicBackground='static';if(!state.usbBackground)state.usbBackground='static';if(!state.musicBackgroundGallery)state.musicBackgroundGallery=null;if(!state.usbBackgroundGallery)state.usbBackgroundGallery=null;if(!state.frameOption)state.frameOption=8;if(!state.frameEffect)state.frameEffect='orbit';if(!state.albumMotion)state.albumMotion='none';save()}
ensureStateDefaults();
let tracks=[];let trackIndex=0;let secretTaps=0;let secretTimer=null;let audioCtx=null;let sourceNode=null;let filters=[];let analyser=null;let raf=null;let bluetoothDevice=null;
function save(){localStorage.setItem('koroshNovaWebState',JSON.stringify(state))}
function roomControlState(){try{return JSON.parse(localStorage.getItem('koroshNovaRoomState.v3')||'{}')}catch(_){return {}}}
function fuseAllows(name){const f=roomControlState().fuses||{};return f[name]!==false}
function applyRoomFrame(route){try{const frames=roomControlState().frames||{};const map={start:'start',bluetooth:'bluetooth',usb:'usb',music:'music',rgb:'rgb',galaxy:'galaxy',ai:'ai',settings:'control'};const n=Number(frames[map[route]||route]);if(n>=1&&n<=8){state.frameOption=n;save()}}catch(_){}}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1700)}
function img(n,c=''){return `<img class="${c}" src="${AS+n}" alt="">`}
function header(){return `<header class="header"><div class="slogan">یک صدا<br>یک زندگی</div><div class="brand">کوروش<br>نوا</div></header>`}
function setDock(active){dock.innerHTML=nav.map(([k,l])=>`<button class="${active===k?'active':''}" data-route="${k}" aria-label="${l}">${img('nav/'+(k==='settings'?'control':k)+'.png')}</button>`).join('');dock.querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.route))}
function page(content,active='settings, start'){screen.innerHTML=`<section class="page">${header()}<div class="content">${content}</div></section>`;setDock(active)}
function go(route){applyRoomFrame(route);state.route=route;save();if(route==='settings')return openIntegratedModule('control');if(route==='usb')return ganjinehPage();if(route==='music')return avayePage();if(route==='equalizer')return openIntegratedModule('equalizer');if(route==='secret')return openIntegratedModule('secret');if(route==='bluetooth')return bluetoothPage();if(route==='rgb')return rgbPage();if(route==='galaxy')return galaxyPage();if(route==='ai')return openIntegratedModule('nora');startPage()}
function startPage(){page(`<div class="start-orb"><b>نوا</b></div><h1 class="hero-title">کوروش نوا</h1><p class="hero-sub">یک صدا • یک زندگی</p><button class="magic-btn start-cta" onclick="go('bluetooth')">ورود به مرکز اتصال</button>`,'start')}
function wifiIcon(){return `<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M8 28 Q60 -5 112 28"/><path d="M24 48 Q60 22 96 48"/><path d="M40 67 Q60 51 80 67"/><circle cx="60" cy="82" r="5"/></svg>`}
function bluetoothIcon(){return `<svg viewBox="0 0 100 120" aria-hidden="true"><path d="M48 8 L74 31 L30 67 L74 103 L48 112 L48 8"/><path d="M48 60 L24 36 M48 60 L24 84"/></svg>`}
function bluetoothCoreMarkup(connected){return `<div class="connection-core bt-core ${connected?'is-connected':'is-disconnected'}"><span class="core-orbit orbit-a"></span><span class="core-orbit orbit-b"></span><span class="core-spark spark-a"></span><span class="core-spark spark-b"></span><span class="core-glass"></span><span class="core-icon bt-icon">${bluetoothIcon()}</span><span class="core-ring ring-one"></span><span class="core-ring ring-two"></span></div>`}
function wifiCoreMarkup(connected,connecting){return `<div class="connection-core wifi-core ${connected?'is-connected':''} ${connecting?'is-connecting':''}"><span class="core-orbit orbit-a"></span><span class="core-orbit orbit-b"></span><span class="core-spark spark-a"></span><span class="core-spark spark-b"></span><span class="core-glass"></span><span class="core-icon wifi-icon">${wifiIcon()}</span><span class="core-ring ring-one"></span><span class="core-ring ring-two"></span></div>`}
function speakerPowerMarkup(on){return `<div class="speaker-power-core ${on?'is-on':'is-off'}"><span class="power-orbit orbit-a"></span><span class="power-orbit orbit-b"></span><span class="power-core-ring"></span><span class="power-core-glyph">${on?'⏻':'◌'}</span><span class="power-led"></span></div>`}
function bluetoothPage(){const connected=!!state.bluetooth;const wifi=!!state.wifi;const connecting=!!state.wifiConnecting;const speaker=state.speaker!==false;page(`<div class="custom-card center bluetooth-card connection-hub-card"><div class="connection-title"><h1 class="hero-title">مرکز ارتباط نوا</h1><p class="hero-sub">یک هسته برای ارتباط با نوا • سریع، زنده و اختصاصی</p></div><div class="connection-layout"><button class="wifi-main-control ${wifi?'is-connected':''} ${connecting?'is-connecting':''}" aria-label="${wifi?'قطع اتصال Wi-Fi':'اتصال Wi-Fi'}" onclick="toggleWifi()"><div class="wifi-main-art">${wifiCoreMarkup(wifi,connecting)}</div><div class="connection-copy"><b>Wi‑Fi نوا</b><strong>${wifi?'متصل':'شبکه آماده اتصال'}</strong><small>${wifi?'پیوند شبکه برقرار است':'برای پیوند با هسته نوا لمس کنید'}</small></div><span class="connection-status-dot"></span></button><button class="bt-mini-control ${connected?'is-connected':''}" aria-label="${connected?'قطع اتصال بلوتوث':'اتصال بلوتوث'}" onclick="toggleBluetooth()"><div class="bt-mini-art">${bluetoothCoreMarkup(connected)}</div><div class="bt-mini-copy"><b>Bluetooth</b><strong>${connected?'متصل':'آماده'}</strong></div><span class="connection-status-dot"></span></button></div><button class="speaker-power-control ${speaker?'is-on':'is-off'}" aria-label="${speaker?'خاموش کردن اسپیکر':'روشن کردن اسپیکر'}" onclick="toggleSpeakerPower()"><div class="speaker-power-art">${speakerPowerMarkup(speaker)}</div><div class="speaker-power-copy"><b>اسپیکر نوا</b><strong>${speaker?'روشن':'خاموش'}</strong><small>${speaker?'آماده پخش صدا':'خروجی صدا خاموش است'}</small></div><span class="power-status-pill">${speaker?'ON':'OFF'}</span></button><div class="connection-caption"><span class="caption-line"></span><span>${wifi?'Wi‑Fi متصل است':'Wi‑Fi در انتظار اتصال'} • ${connected?'Bluetooth متصل است':'Bluetooth در انتظار اتصال'} • اسپیکر ${speaker?'روشن':'خاموش'}</span><span class="caption-line"></span></div><div class="page-actions"><button class="magic-btn" onclick="go('settings')">تنظیمات ارتباط</button></div></div>`,'bluetooth')}
async function toggleWifi(){
  if(state.wifi){state.wifi=false;state.wifiConnecting=false;save();toast('Wi‑Fi قطع شد');bluetoothPage();return;}
  if(state.wifiConnecting)return;
  state.wifiConnecting=true;save();bluetoothPage();
  const host=String(state.wifiHost||'192.168.4.1').trim();
  const port=String(state.wifiPort||'8080').trim();
  let ok=false;
  try{
    if(location.protocol==='https:' || location.protocol==='http:'){
      const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),1600);
      const r=await fetch(`http://${host}:${port}/`,{method:'GET',mode:'no-cors',cache:'no-store',signal:ctl.signal});
      clearTimeout(timer);ok=!!r;
    }
  }catch(e){}
  state.wifiConnecting=false;state.wifi=ok;save();
  if(ok)toast('Wi‑Fi نوا متصل شد');else toast('هسته Wi‑Fi پاسخ نداد');
  bluetoothPage();
}
async function toggleSpeakerPower(){
  if(!fuseAllows('power')){toast('فیوز برق اصلی خاموش است؛ فرمان اسپیکر مسدود شد');return;}
  const target=state.speaker===false;
  const host=String(state.wifiHost||'192.168.4.1').trim();
  const port=String(state.wifiPort||'8080').trim();
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),1200);
    const res=await fetch(`http://${host}:${port}/api/power`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({powered:target}),signal:controller.signal});
    clearTimeout(timer);
    if(!res.ok) throw new Error('power command failed');
  }catch(e){
    toast('هسته نوا پاسخ نداد؛ وضعیت محلی تغییر نکرد');
    return;
  }
  state.speaker=target;save();toast(target?'اسپیکر روشن شد':'اسپیکر خاموش شد');bluetoothPage();
}

async function toggleBluetooth(){
  if(state.bluetooth){
    try{if(bluetoothDevice?.gatt?.connected) bluetoothDevice.gatt.disconnect();}catch(e){}
    bluetoothDevice=null; state.bluetooth=false; save(); if(fuseAllows('audio')) playBtSound(false); toast('بلوتوث قطع شد'); bluetoothPage(); return;
  }
  if(!window.isSecureContext || !navigator.bluetooth || !navigator.bluetooth.requestDevice){
    toast('بلوتوث وب در این محیط در دسترس نیست'); return;
  }
  try{
    toast('در حال جستجوی دستگاه بلوتوث…');
    const device=await navigator.bluetooth.requestDevice({acceptAllDevices:true});
    bluetoothDevice=device;
    device.addEventListener('gattserverdisconnected',()=>{
      if(bluetoothDevice===device){bluetoothDevice=null;state.bluetooth=false;save();if(fuseAllows('audio'))playBtSound(false);toast('اتصال بلوتوث قطع شد');bluetoothPage();}
    });
    if(device.gatt){await device.gatt.connect();}
    state.bluetooth=true; save(); if(fuseAllows('audio')) playBtSound(true); toast(`متصل شد: ${device.name||'دستگاه بلوتوث'}`); bluetoothPage();
  }catch(e){
    bluetoothDevice=null; state.bluetooth=false; save();
    if(e?.name==='NotFoundError') toast('انتخاب دستگاه لغو شد');
    else toast('اتصال بلوتوث برقرار نشد');
    bluetoothPage();
  }
}
function playBtSound(connected){const src=AS+'speaker_audio/'+(connected?'bt_connect_1.wav':'bt_disconnect_1.wav');const a=new Audio(src);a.volume=.7;a.play().catch(()=>{});}
function ensureAudio(){if(audioCtx)return;audioCtx=new AudioContext();sourceNode=audioCtx.createMediaElementSource(audio);analyser=audioCtx.createAnalyser();analyser.fftSize=128;let prev=sourceNode;filters=[];const freqs=[60,250,1000,4000,12000];freqs.forEach((f,i)=>{const q=filters[i]=audioCtx.createBiquadFilter();q.type=i===0?'lowshelf':i===4?'highshelf':'peaking';q.frequency.value=f;q.Q.value=1;prev.connect(q);prev=q});prev.connect(analyser);analyser.connect(audioCtx.destination);applyEQ()}
function applyEQ(){if(!filters.length)return;filters.forEach((f,i)=>f.gain.value=Number(state.eq[i]||0));}
function loadFiles(files){tracks=[...files].filter(f=>f.type.startsWith('audio/'));if(!tracks.length)return;trackIndex=0;loadTrack();toast(`${tracks.length} آهنگ اضافه شد`)}
function loadTrack(){const f=tracks[trackIndex];audio.src=URL.createObjectURL(f);audio.load();audio.onloadedmetadata=()=>{const t=document.getElementById('trackTime');if(t)t.textContent=format(audio.duration)};document.querySelectorAll('.track-name').forEach(x=>x.textContent=f.name)}
function playPause(){if(!tracks.length){document.getElementById('audioPicker').click();return}ensureAudio();audioCtx.resume();if(audio.paused)audio.play();else audio.pause();}
function nextTrack(){if(!tracks.length)return;trackIndex=(trackIndex+1)%tracks.length;loadTrack();audio.play()}
function prevTrack(){if(!tracks.length)return;trackIndex=(trackIndex-1+tracks.length)%tracks.length;loadTrack();audio.play()}
function format(s){if(!Number.isFinite(s))return '00:00';let m=Math.floor(s/60),q=Math.floor(s%60);return `${String(m).padStart(2,'0')}:${String(q).padStart(2,'0')}`}
function syncProgress(){const p=document.getElementById('progressRange');if(p&&audio.duration)p.value=audio.currentTime/audio.duration*100;const c=document.getElementById('currentTime');if(c)c.textContent=format(audio.currentTime);if(audio.paused){cancelAnimationFrame(raf);return}raf=requestAnimationFrame(syncProgress)}
audio.addEventListener('play',()=>{document.querySelectorAll('.frame-stage').forEach(x=>x.classList.remove('paused'));syncProgress()});audio.addEventListener('pause',()=>document.querySelectorAll('.frame-stage').forEach(x=>x.classList.add('paused')));audio.addEventListener('timeupdate',syncProgress);audio.addEventListener('ended',()=>state.repeat?audio.play():nextTrack());
function backgroundPick(type){const input=document.getElementById('backgroundPicker');input.dataset.target=type;input.click()}
function artworkPick(){document.getElementById('imagePicker').click()}
document.getElementById('imagePicker').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f||!f.type.startsWith('image/'))return;const r=new FileReader();r.onload=()=>{state.artwork=r.result;save();toast('تصویر آلبوم ذخیره شد');avayePage()};r.readAsDataURL(f)});
document.getElementById('backgroundPicker').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f||!f.type.startsWith('image/'))return;const r=new FileReader();r.onload=()=>{const t=e.target.dataset.target;if(t==='music')state.musicBackgroundGallery=r.result;else state.usbBackgroundGallery=r.result;save();toast('تصویر زمینه گالری ذخیره شد');openSharedSettings(t)};r.readAsDataURL(f)});
document.getElementById('audioPicker').addEventListener('change',e=>loadFiles(e.target.files));
function motionBackground(src,cls='motion-bg'){return src?`<img class="${cls}" src="${AS}${src}" alt="">`:''}
function selectedFrameSrc(){return state.frameOption===8?`${AS}avaye_frame8.png`:`${AS}frames/frame_option${state.frameOption}.png`}
function selectedFrameSrcFor(n){return n===8?`${AS}avaye_frame8.png`:`${AS}frames/frame_option${n}.png`}
function selectedAlbumMarkup(){if(state.artwork)return `<img class="album-img" src="${state.artwork}" alt="">`;if(state.albumMotion!=='none')return `<img class="album-img album-motion" src="${AS}artwork_gif/${state.albumMotion}" alt="">`;return ''}
function avayePage(){const motion=MOTION.music.find(x=>x[0]===state.musicBackground)?.[0];const gallery=state.musicBackgroundGallery?`<img class="avaye-motion-bg gallery-bg" src="${state.musicBackgroundGallery}" alt="">`:'';page(`<div class="avaye-page">${gallery}${motionBackground(motion,'avaye-motion-bg')}<img class="avaye-skin" src="${AS}avaye_skin.png"><div class="frame-stage ${audio.paused?'paused':''} effect-${state.frameEffect}" id="frameStage">${selectedAlbumMarkup()}<img class="frame8" src="${selectedFrameSrc()}" alt=""></div><button class="avaye-file" aria-label="انتخاب تصویر از گالری" onclick="artworkPick()"></button><button class="hidden-door" aria-label="در مخفی" onclick="hiddenTap()"></button><div class="page-actions" style="position:absolute;left:0;right:0;bottom:11%;z-index:20"><button class="magic-btn" onclick="prevTrack()">قبلی</button><button class="magic-btn" onclick="playPause()">پخش/توقف</button><button class="magic-btn" onclick="nextTrack()">بعدی</button><button class="magic-btn" onclick="go('equalizer')">اکولایزر</button><button class="magic-btn" onclick="openSharedSettings('music')">تنظیمات</button><button class="magic-btn" onclick="showAlbum()">آلبوم</button></div></div>`,'music')}
function ganjinehPage(){const motion=MOTION.usb.find(x=>x[0]===state.usbBackground)?.[0];const gallery=state.usbBackgroundGallery?`<img class="gn-motion-bg gallery-bg" src="${state.usbBackgroundGallery}" alt="">`:'';page(`<div class="gn-page">${gallery}${motionBackground(motion,'gn-motion-bg')}${motion||gallery?'':'<img class="gn-bg" src="'+AS+'ganjineh_bg.png">'}<div class="gn-inner"><img class="gn-hero" src="${AS}ganjineh_hero.png"><img class="gn-wave" src="${AS}ganjineh_wave.png"><div class="gn-title track-name">${tracks[trackIndex]?.name||'هیچ آهنگی انتخاب نشده'}</div><img class="gn-progress" src="${AS}ganjineh_progress.png"><div class="gn-title"><span id="currentTime">${format(audio.currentTime)}</span> / <span id="trackTime">${format(audio.duration)}</span></div><img class="gn-controls" src="${AS}ganjineh_controls.png"><div class="gn-tools"><button class="gn-tool" onclick="prevTrack()">قبلی</button><button class="gn-tool" onclick="playPause()">پخش / توقف</button><button class="gn-tool" onclick="nextTrack()">بعدی</button><button class="gn-tool" onclick="go('equalizer')">اکولایزر</button><button class="gn-tool" onclick="document.getElementById('audioPicker').click()">فایل‌های موسیقی</button><button class="gn-tool" onclick="showAlbum()">فهرست عکس‌ها</button><button class="gn-tool" onclick="openSharedSettings('usb')">تنظیمات گنجینه</button><button class="gn-tool" onclick="openSharedSettings('music')">تنظیمات آوای نوا</button></div><div class="volume"><b>+</b><input id="volumeRange" type="range" min="0" max="1" step=".01" value="${state.volume}" oninput="setVolume(this.value)"><b>−</b></div></div></div>`,'usb')}
function setVolume(v){state.volume=Number(v);audio.volume=state.volume;save()}
function hiddenTap(){secretTaps++;const d=document.createElement('div');d.className='tap-burst';document.querySelector('.page')?.appendChild(d);setTimeout(()=>d.remove(),480);toast(`لمس ${secretTaps} از ۵`);clearTimeout(secretTimer);secretTimer=setTimeout(()=>secretTaps=0,2200);if(secretTaps>=5){secretTaps=0;go('secret');toast('درِ مخفی باز شد')}}
function equalizerPage(){page(`<div class="custom-card"><h1 class="hero-title">اکولایزر نوا</h1><p class="hero-sub">همان موتور صدا برای گنجینه و آوای نوا</p><div class="eq-dial"><div class="eq-needle" id="eqNeedle"></div><b id="eqReadout">${state.eq.map(v=>Number(v).toFixed(0)).join(' / ')}</b></div><div class="eq-bands">${state.eq.map((v,i)=>`<label class="eq-band"><input type="range" min="-12" max="12" step="1" value="${v}" oninput="setEq(${i},this.value)"></label>`).join('')}</div><div class="preset-grid">${['مستقیم','نرم','صدای پرقدرت','آوازی','بیس عمیق','شب'].map(x=>`<button class="magic-btn" onclick="setPreset('${x}')">${x}</button>`).join('')}</div><div class="page-actions"><button class="magic-btn" onclick="go('music')">بازگشت به آوای نوا</button><button class="magic-btn" onclick="go('usb')">بازگشت به گنجینه</button></div></div>`,'settings')}
function setEq(i,v){state.eq[i]=Number(v);applyEQ();save();const r=document.getElementById('eqReadout');if(r)r.textContent=state.eq.join(' / ')}
function setPreset(p){const map={مستقیم:[0,0,0,0,0],نرم:[-2,-1,0,1,2],'صدای پرقدرت':[4,2,1,2,4],آوازی:[-2,2,4,3,-1],'بیس عمیق':[7,4,1,-1,-2],شب:[-3,1,3,2,-2]};state.eq=map[p]||[0,0,0,0,0];state.eqPreset=p;applyEQ();save();equalizerPage();toast(`پیش‌تنظیم ${p}`)}
function showAlbum(){openModal(`<h2>آلبوم نوا</h2><p class="muted">این بخش فقط تصویرهای انتخاب‌شده را نمایش می‌دهد؛ افکت، صندوق یا کنترل دیگری داخل آلبوم نیست.</p><div class="album-grid">${state.artwork?`<img src="${state.artwork}" alt="تصویر آلبوم">`:'<p class="muted">هنوز تصویری از گالری انتخاب نشده.</p>'}</div><div class="page-actions"><button class="magic-btn" onclick="artworkPick();closeModal()">انتخاب تصویر از گالری</button></div>`)}
function motionCards(type,current){const arr=MOTION[type];const gallery=type==='music'?state.musicBackgroundGallery:state.usbBackgroundGallery;return `<div class="option-grid motion-options"><button class="option-card ${current==='static'&&!gallery?'selected':''}" onclick="setMotionBackground('${type}','static')"><div class="option-preview static-preview"></div><b>تصویر فعلی ثابت</b><small>بدون حرکت</small></button><button class="option-card ${gallery?'selected':''}" onclick="backgroundPick('${type}')"><div class="album-option-preview">${gallery?`<img src="${gallery}" alt="">`:'<span>گالری</span>'}</div><b>انتخاب از گالری</b><small>تصویر زمینه شخصی</small></button>${arr.map((x,i)=>`<button class="option-card ${current===x[0]&&!gallery?'selected':''}" onclick="setMotionBackground('${type}','${x[0]}')"><img src="${AS}animated/${x[0]}" alt=""><b>${x[1]}</b><small>${i===0?'پیش‌فرض متحرک':''}</small></button>`).join('')}</div>`}
function frameCards(){return `<div class="option-grid frame-options">${FRAMES.map(([n,label])=>`<button class="option-card ${state.frameOption===n?'selected':''}" onclick="setFrameOption(${n})"><img src="${selectedFrameSrcFor(n)}" alt=""><b>${n}. ${label}</b><small>${n===8?'انتخاب فعلی':''}</small></button>`).join('')}</div>`}
function albumMotionCards(){const opts=[['none','تصویر ثابت / گالری',''],['avaye_motion_art_1.gif','موج حلقه‌ای','پیش‌فرض متحرک'],['avaye_motion_art_2.gif','شفق فیروزه‌ای',''],['avaye_motion_art_3.gif','نبض رنگی','']];return `<div class="option-grid album-options">${opts.map(([n,l,s])=>`<button class="option-card ${state.albumMotion===n?'selected':''}" onclick="setAlbumMotion('${n}')"><div class="album-option-preview">${n==='none'?'<span>گالری</span>':`<img src="${AS}artwork_gif/${n}" alt="">`}</div><b>${l}</b><small>${s}</small></button>`).join('')}</div>`}
function effectCards(){return `<div class="effect-grid">${FRAME_EFFECTS.map(([id,l,d])=>`<button class="effect-card ${state.frameEffect===id?'selected':''}" onclick="setFrameEffect('${id}')"><span class="effect-orb effect-${id}"></span><b>${l}</b><small>${d}</small></button>`).join('')}</div>`}
function sharedSettingsBody(){return `<div class="settings-section"><h3>تصویر زمینه آوای نوا — متحرک</h3><p class="muted">گزینه‌ها برای انتخاب آماده‌اند؛ تا وقتی انتخاب نکنی، تصویر فعلی ثابت باقی می‌ماند.</p>${motionCards('music',state.musicBackground)}</div><div class="settings-section"><h3>تصویر زمینه گنجینه نوا — متحرک</h3>${motionCards('usb',state.usbBackground)}</div><div class="settings-section"><h3>تصویر چرخشی آوای نوا</h3><p class="muted">گالری یا یکی از تصاویر متحرک. این انتخاب داخل قاب می‌نشیند.</p>${albumMotionCards()}</div><div class="settings-section"><h3>قاب چرخشی</h3><p class="muted">گزینه ۸ فعلاً انتخاب شده و هفت قاب دیگر هم قابل انتخاب‌اند.</p>${frameCards()}</div><div class="settings-section"><h3>افکت قاب — فعال و واقعی</h3>${effectCards()}</div><div class="settings-section settings-list"><div class="setting-row"><span>اکولایزر مشترک</span><button class="magic-btn" onclick="closeModal();go('equalizer')">باز کردن</button></div><div class="setting-row"><span>تکرار یک آهنگ</span><button class="magic-btn" onclick="state.repeat=!state.repeat;save();openSharedSettings('music')">${state.repeat?'روشن':'خاموش'}</button></div></div>`}
function openSharedSettings(source){const title=source==='usb'?'گنجینه نوا':source==='music'?'آوای نوا':source==='bluetooth'?'بلوتوث':source==='rgb'?'RGB':source==='galaxy'?'کهکشان نوا':'نورا';openModal(`<h2>تنظیمات مشترک ${title}</h2>${sharedSettingsBody()}`)}
function setMotionBackground(type,value){if(type==='music'){state.musicBackground=value;state.musicBackgroundGallery=null}else{state.usbBackground=value;state.usbBackgroundGallery=null}save();openSharedSettings(type)}
function setFrameOption(n){state.frameOption=n;save();avayePage();openSharedSettings('music')}
function setFrameEffect(id){state.frameEffect=id;save();avayePage();openSharedSettings('music')}
function setAlbumMotion(v){state.albumMotion=v;save();openSharedSettings('music')}
function settingsPage(){page(`<div class="custom-card"><h1 class="hero-title">اتاق فرمان</h1><p class="hero-sub">مرکز تنظیمات مشترک آوای نوا و گنجینه نوا</p><div class="settings-list"><div class="setting-row"><span>تنظیمات مشترک آوای نوا + گنجینه نوا</span><button class="magic-btn" onclick="openSharedSettings('music')">باز کردن</button></div><div class="setting-row"><span>اکولایزر مشترک</span><button class="magic-btn" onclick="go('equalizer')">باز کردن</button></div><div class="setting-row"><span>تصویر آلبوم</span><button class="magic-btn" onclick="artworkPick()">گالری</button></div></div></div>`,'settings')}
function openModal(html){document.getElementById('modal-content').innerHTML=html;document.getElementById('modal').classList.add('show');document.getElementById('modal').setAttribute('aria-hidden','false')}
function closeModal(){document.getElementById('modal').classList.remove('show');document.getElementById('modal').setAttribute('aria-hidden','true')}
document.querySelector('[data-action="close-modal"]').onclick=closeModal;
function secretPage(){page(`<div class="custom-card center"><div class="secret-core"><b>اتاق اسرار</b></div><h1 class="hero-title">درِ مخفی نوا</h1><p class="hero-sub">این صفحه فقط از پنج لمس پشت قاب آوای نوا باز می‌شود.</p><div class="grid3"><button class="magic-btn" onclick="secretEffect('آرام')">نور آرام</button><button class="magic-btn" onclick="secretEffect('کهکشانی')">کهکشان</button><button class="magic-btn" onclick="secretEffect('سینمایی')">سینمایی</button></div></div>`,'settings')}
function secretEffect(x){toast(`حالت ${x} فعال شد`)}
function rgbPage(){page(`<div class="custom-card center"><h1 class="hero-title">RGB نوا</h1><p class="hero-sub">تنظیم افکت‌های نور</p><div class="grid3">${['رنگ','شدت','افکت'].map((x,i)=>`<button class="magic-btn" onclick="toast('${x} تنظیم شد')">${x}</button>`).join('')}</div><div class="page-actions"><button class="magic-btn" onclick="openSharedSettings('rgb')">تنظیمات RGB</button></div></div>`,'rgb')}
function galaxyPage(){page(`<div class="custom-card center"><h1 class="hero-title">کهکشان نوا</h1><p class="hero-sub">افکت‌های کهکشانی</p><div class="grid3">${Array.from({length:6},(_,i)=>`<button class="magic-btn" onclick="state.galaxyEffect=${i};save();toast('افکت ${i+1} فعال شد')">افکت ${i+1}</button>`).join('')}</div><div class="page-actions"><button class="magic-btn" onclick="openSharedSettings('galaxy')">تنظیمات کهکشان</button></div></div>`,'galaxy')}
function noraPage(){page(`<div class="custom-card center"><h1 class="hero-title">نورا</h1><p class="hero-sub">هوش صدای کوروش نوا</p><button class="magic-btn" onclick="toast('میکروفون در نسخه وب آماده اتصال است')">فعال‌سازی گفتار</button><div class="page-actions"><button class="magic-btn" onclick="openSharedSettings('ai')">تنظیمات نورا</button></div></div>`,'ai')}

// FINAL MODULE ASSEMBLY: RGB and Galaxy run as isolated, fully integrated page modules.
function openIntegratedModule(kind){
  state.route=kind; save();
  screen.innerHTML=`<section class="integrated-module"><iframe class="integrated-module-frame" src="./modules/${kind}/index.html" allow="microphone; bluetooth" title="${kind==='rgb'?'RGB':kind==='galaxy'?'Galaxy':kind==='nora'?'NORA':kind==='control'?'Room of Command':kind}"></iframe></section>`;
  // Every page uses the same seven real bottom-navigation assets.
  // Integrated modules keep their internal content, but their private docks are hidden.
  setDock(kind==='nora'?'ai':kind==='control'?'settings':kind);
}
function rgbPage(){openIntegratedModule('rgb')}
function galaxyPage(){openIntegratedModule('galaxy')}
window.addEventListener('message',e=>{
  if(e.data?.type==='koroshNovaNavigate' && e.data.route){ go(e.data.route); }
});

// Global event bridge for progress and volume
window.setVolume=setVolume;window.playPause=playPause;window.nextTrack=nextTrack;window.prevTrack=prevTrack;window.go=go;window.artworkPick=artworkPick;window.showAlbum=showAlbum;window.openSharedSettings=openSharedSettings;window.closeModal=closeModal;window.setEq=setEq;window.setPreset=setPreset;window.backgroundPick=backgroundPick;window.setMotionBackground=setMotionBackground;window.setFrameOption=setFrameOption;window.setFrameEffect=setFrameEffect;window.setAlbumMotion=setAlbumMotion;window.toggleBluetooth=toggleBluetooth;window.toggleWifi=toggleWifi;window.toggleSpeakerPower=toggleSpeakerPower;window.hiddenTap=hiddenTap;window.secretEffect=secretEffect;
audio.volume=state.volume;applyEQ();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
go(state.route||'start');
