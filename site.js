(()=>{
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s),A={sb:null,session:null};
const mb=$('#menu'),lk=$('#lk');
if(mb){const c=()=>{lk.classList.remove('open');mb.setAttribute('aria-expanded','false')};
mb.onclick=e=>{e.stopPropagation();mb.setAttribute('aria-expanded',lk.classList.toggle('open'))};
document.addEventListener('click',c);document.addEventListener('keydown',e=>e.key==='Escape'&&c())}
$$('.wave').forEach(w=>{for(let i=0;i<46;i++){const b=document.createElement('i');b.style.height=(4+Math.abs(Math.sin(i*.7)*Math.cos(i*.23))*22)+'px';w.append(b)}});
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1}):null;
$$('.rv').forEach(el=>io?io.observe(el):el.classList.add('in'));

// ---- accounts (Supabase) ----
function nav(){const s=!!A.session;
$$('.li,.lk .mo:not(.p)').forEach(e=>e.hidden=s);
$$('.gs,.lk .mo.p').forEach(e=>{e.textContent=s?'My account':'Get Started';e.setAttribute('href',s?'/account.html':'/account.html#signup')})}
A.ready=(async()=>{try{const c=await(await fetch('/api/config')).json();if(!c.url||!c.anonKey)return;
await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=ok;s.onerror=no;document.head.append(s)});
A.sb=window.supabase.createClient(c.url,c.anonKey);
const {data}=await A.sb.auth.getSession();A.session=data.session;nav();
A.sb.auth.onAuthStateChange((_e,s)=>{A.session=s;nav();A.render&&A.render()})}catch(e){}})();
if($('#authbox')){
const g=$('#guest'),u=$('#user'),msg=$('#msg'),em=$('#em'),pw=$('#pw');let up=location.hash==='#signup';
const say=(t,bad)=>{msg.textContent=t;msg.className=bad?'er':''};
const mode=()=>{$('#tab-in').classList.toggle('on',!up);$('#tab-up').classList.toggle('on',up);$('#nmw').hidden=!up;$('#sub').textContent=up?'Create account':'Log in';pw.setAttribute('autocomplete',up?'new-password':'current-password');$('#forgot').hidden=up;say('')};
$('#tab-in').onclick=()=>{up=false;mode()};$('#tab-up').onclick=()=>{up=true;mode()};mode();
A.render=()=>{$('#load').hidden=true;if(!A.sb){$('#nocfg').hidden=false;return}
const s=A.session;g.hidden=!!s;u.hidden=!s;if(s){const m=s.user.user_metadata||{};$('#who').textContent=m.name||s.user.email;$('#mail').textContent=s.user.email}};
A.ready.then(A.render);
$('#af').onsubmit=async e=>{e.preventDefault();if(!A.sb)return;const b=$('#sub');b.disabled=true;say('Please wait...');
const email=em.value.trim(),password=pw.value;
const r=up?await A.sb.auth.signUp({email,password,options:{data:{name:$('#nm').value.trim()},emailRedirectTo:location.origin+'/account.html'}}):await A.sb.auth.signInWithPassword({email,password});
b.disabled=false;if(r.error)return say(r.error.message,1);
say(up&&!r.data.session?'Almost there! Check your email to confirm your account, then log in.':'')};
$('#forgot').onclick=async()=>{if(!em.value.trim())return say('Enter your email first.',1);
const r=await A.sb.auth.resetPasswordForEmail(em.value.trim(),{redirectTo:location.origin+'/account.html'});
say(r.error?r.error.message:'Password reset email sent. Check your inbox.',!!r.error)};
$('#out').onclick=()=>A.sb.auth.signOut();
$('#np').onsubmit=async e=>{e.preventDefault();const r=await A.sb.auth.updateUser({password:$('#npw').value});
$('#nmsg').textContent=r.error?r.error.message:'Password updated.';if(!r.error)$('#npw').value=''}}

// ---- chat ----
const log=$('#log');if(!log)return;
const inp=$('#q'),form=$('#f'),send=$('#send'),att=$('#att'),file=$('#file'),sample=log.innerHTML;
let hist=[],busy=false,fresh=true,doc=null;
$$('a[href$="#chat"]').forEach(a=>a.addEventListener('click',()=>setTimeout(()=>inp.focus({preventScroll:true}),450)));
const tm=()=>new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
function add(role,txt){if(fresh){log.innerHTML='';fresh=false}
const d=document.createElement('div');d.className='m '+role;
if(role==='ai')d.innerHTML='<b class="who">\u2726 Aura AI</b>';
const s=document.createElement('span');s.textContent=txt;d.append(s);
if(role==='user'){const t=document.createElement('time');t.textContent=tm();d.append(t)}
log.append(d);log.scrollTop=log.scrollHeight;return s}
const warn=t=>add('ai',t).parentElement.classList.add('err');
$('#reset').onclick=()=>{log.innerHTML=sample;hist=[];fresh=true;doc=null;att.hidden=true};
function showAtt(){att.hidden=!doc;att.innerHTML='';if(!doc)return;
const s=document.createElement('span');s.textContent='\u{1F4CE} '+doc.name+(doc.cut?' (first 20,000 characters)':'');
const x=document.createElement('button');x.type='button';x.textContent='\u00D7';x.setAttribute('aria-label','Remove file');x.onclick=()=>{doc=null;showAtt()};att.append(s,x)}
$('#add').onclick=()=>file.click();
file.onchange=async()=>{const f=file.files[0];file.value='';if(!f)return;
if(f.size>2e6)return warn('That file is too large. The limit is 2 MB.');
let t;try{t=await f.text()}catch(e){return warn('I couldn\u2019t read that file.')}
if(/[\u0000\uFFFD]/.test(t.slice(0,2000)))return warn('Only text files are supported (txt, md, csv, json, code). PDFs and images aren\u2019t supported yet.');
doc={name:f.name,text:t.slice(0,20000),cut:t.length>20000};showAtt()};
async function ask(text){
text=text.trim();if((!text&&!doc)||busy)return;
const d=doc;doc=null;showAtt();const q=text||'Please review this file.';
busy=true;send.disabled=true;inp.value='';
add('user',q+(d?'\n\u{1F4CE} '+d.name:''));
hist.push({role:'user',content:q+(d?'\n\n[Attached file: '+d.name+(d.cut?' (truncated)':'')+']\n'+d.text:'')});
const slot=add('ai','');slot.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
try{const h={'Content-Type':'application/json'};if(A.session)h.Authorization='Bearer '+A.session.access_token;
const r=await fetch('/api/chat',{method:'POST',headers:h,body:JSON.stringify({messages:hist.slice(-20)})});
const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Something went wrong. Please try again.');
slot.textContent=j.reply;hist.push({role:'assistant',content:j.reply})}
catch(e){slot.textContent=e.message;slot.parentElement.classList.add('err');hist.pop()}
busy=false;send.disabled=false;log.scrollTop=log.scrollHeight;inp.focus({preventScroll:true})}
form.onsubmit=e=>{e.preventDefault();ask(inp.value)};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition,mic=$('#mic');
if(!SR)mic.style.display='none';else{const rec=new SR();rec.lang=navigator.language||'en-US';
rec.onresult=e=>{inp.value=e.results[0][0].transcript;inp.focus()};rec.onend=()=>mic.classList.remove('on');
mic.onclick=()=>{if(mic.classList.contains('on')){rec.stop();return}mic.classList.add('on');try{rec.start()}catch(_){}}}
})();
