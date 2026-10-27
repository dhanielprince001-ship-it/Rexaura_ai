(()=>{
const $=s=>document.querySelector(s),mb=$('#menu'),lk=$('#lk');
if(mb){const c=()=>{lk.classList.remove('open');mb.setAttribute('aria-expanded','false')};
mb.onclick=e=>{e.stopPropagation();mb.setAttribute('aria-expanded',lk.classList.toggle('open'))};
document.addEventListener('click',c);document.addEventListener('keydown',e=>e.key==='Escape'&&c())}
document.querySelectorAll('.wave').forEach(w=>{for(let i=0;i<46;i++){const b=document.createElement('i');b.style.height=(4+Math.abs(Math.sin(i*.7)*Math.cos(i*.23))*22)+'px';w.append(b)}});
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1}):null;
document.querySelectorAll('.rv').forEach(el=>io?io.observe(el):el.classList.add('in'));
const log=$('#log');if(!log)return;
const inp=$('#q'),form=$('#f'),send=$('#send'),sample=log.innerHTML;let hist=[],busy=false,fresh=true;
document.querySelectorAll('a[href$="#chat"]').forEach(a=>a.addEventListener('click',()=>setTimeout(()=>inp.focus({preventScroll:true}),450)));
const tm=()=>new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
function add(role,txt){const d=document.createElement('div');d.className='m '+role;
if(role==='ai')d.innerHTML='<b class="who">\u2726 Aura AI</b>';
const s=document.createElement('span');s.textContent=txt;d.append(s);
if(role==='user'){const t=document.createElement('time');t.textContent=tm();d.append(t)}
log.append(d);log.scrollTop=log.scrollHeight;return s}
$('#reset').onclick=()=>{log.innerHTML=sample;hist=[];fresh=true};
async function ask(text){
text=text.trim();if(!text||busy)return;
if(fresh){log.innerHTML='';fresh=false}
busy=true;send.disabled=true;inp.value='';
add('user',text);hist.push({role:'user',content:text});
const slot=add('ai','');slot.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist.slice(-20)})});
const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Something went wrong. Please try again.');
slot.textContent=d.reply;hist.push({role:'assistant',content:d.reply})}
catch(e){slot.textContent=e.message;slot.parentElement.classList.add('err');hist.pop()}
busy=false;send.disabled=false;log.scrollTop=log.scrollHeight;inp.focus({preventScroll:true})}
form.onsubmit=e=>{e.preventDefault();ask(inp.value)};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition,mic=$('#mic');
if(!SR)mic.style.display='none';else{const rec=new SR();rec.lang=navigator.language||'en-US';
rec.onresult=e=>{inp.value=e.results[0][0].transcript;inp.focus()};rec.onend=()=>mic.classList.remove('on');
mic.onclick=()=>{if(mic.classList.contains('on')){rec.stop();return}mic.classList.add('on');try{rec.start()}catch(_){}}}
})();
