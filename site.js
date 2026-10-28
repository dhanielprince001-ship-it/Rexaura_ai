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
const hp=$('#hp'),hl=$('#hl'),hb=$('#hist');
const tob=$('#tob'),upd=()=>{tob.hidden=log.scrollHeight-log.scrollTop-log.clientHeight<80};
log.addEventListener('scroll',upd,{passive:true});new MutationObserver(upd).observe(log,{childList:true,subtree:true});
tob.onclick=()=>log.scrollTo({top:log.scrollHeight,behavior:'smooth'});
let busy=false,fresh=true,docs=[],uid='guest',chats=[],cur=null,sent=false;
$$('a[href$="#chat"]').forEach(a=>a.addEventListener('click',()=>setTimeout(()=>inp.focus({preventScroll:true}),450)));
const tm=()=>new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});

// saved chats (kept in this browser, separate per signed-in account)
const KEY=()=>'rexaura:chats:'+uid;
function load(){try{chats=JSON.parse(localStorage.getItem(KEY())||'[]')}catch(e){chats=[]}if(!Array.isArray(chats))chats=[]}
function save(){let c=chats.slice(0,30);const r=(k,v)=>k==='images'?undefined:k==='content'&&typeof v==='string'&&v.length>8000?v.slice(0,8000):v;
for(;;){try{localStorage.setItem(KEY(),JSON.stringify(c,r));return}catch(e){if(c.length<=1)return;c.pop()}}}

// replies with code blocks + copy button
function parse(t){return t.split('```').map((p,i)=>{
if(i%2===0)return{k:'t',v:p.replace(/^\n+|\n+$/g,'')};
const nl=p.indexOf('\n'),first=nl>-1?p.slice(0,nl).trim():'',lang=/^[\w+#.-]{1,15}$/.test(first)?first:'';
return{k:'c',lang,v:(lang?p.slice(nl+1):p.replace(/^\n/,'')).replace(/\n+$/,'')}}).filter(x=>x.v)}
function fb(t,done){const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.append(a);a.select();a.setSelectionRange(0,t.length);try{document.execCommand('copy');done()}catch(e){}a.remove()}
function copy(t,b){const done=()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',1600)};
if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done,()=>fb(t,done));else fb(t,done)}
function fill(el,text){el.textContent='';parse(text).forEach(p=>{
if(p.k==='t'){p.v.split(/(`[^`\n]+`)/).forEach(s=>{if(!s)return;
if(s.length>2&&s[0]==='`'&&s.endsWith('`')){const c=document.createElement('code');c.className='ic2';c.textContent=s.slice(1,-1);el.append(c)}else el.append(s)});return}
const w=document.createElement('div');w.className='code',h=document.createElement('div'),l=document.createElement('span'),b=document.createElement('button'),pre=document.createElement('pre'),c=document.createElement('code');
h.className='ch2';l.textContent=p.lang||'code';b.type='button';b.textContent='Copy';b.onclick=()=>copy(p.v,b);
c.textContent=p.v;pre.append(c);h.append(l,b);w.append(h,pre);el.append(w)})}

function add(role,txt,t,imgs){if(fresh){log.innerHTML='';fresh=false}
const d=document.createElement('div');d.className='m '+role;
if(role==='ai')d.innerHTML='<b class="who">\u2726 RexAura AI</b>';
const s=document.createElement('div');s.className='bd';
if(role==='ai')fill(s,txt);else s.textContent=txt;if(imgs&&imgs.length){const g=document.createElement('div');g.className='th';imgs.forEach(u=>{const m=document.createElement('img');m.src=u;m.alt='';g.append(m)});d.append(g)}d.append(s);
if(role==='user'){const x=document.createElement('time');x.textContent=t||tm();d.append(x)}
log.append(d);log.scrollTop=log.scrollHeight;return s}
const warn=t=>add('ai',t).parentElement.classList.add('err');

function showAtt(){att.hidden=!docs.length;att.innerHTML='';docs.forEach((d,i)=>{const p=document.createElement('div'),s=document.createElement('span'),x=document.createElement('button');p.className='chp';
if(d.img){const m=document.createElement('img');m.src=d.url;m.alt='';p.append(m)}
s.textContent=(d.img?'':'\u{1F4CE} ')+d.name+(d.cut?' (first 20,000 characters)':'');
x.type='button';x.textContent='\u00D7';x.setAttribute('aria-label','Remove');x.onclick=()=>{docs.splice(i,1);showAtt()};p.append(s,x);att.append(p)})}

function openChat(c){cur=c;fresh=false;log.innerHTML='';docs=[];showAtt();
c.msgs.forEach(m=>add(m.role==='user'?'user':'ai',m.role==='user'?(m.shown||m.content):m.content,m.t))}
function newChat(){cur=null;log.innerHTML=sample;fresh=true;docs=[];showAtt();toggle(false)}
function list(){hl.innerHTML='';if(!chats.length){hl.textContent='No saved chats yet.';return}
chats.forEach(c=>{const r=document.createElement('div'),o=document.createElement('button'),t=document.createElement('b'),s=document.createElement('small'),x=document.createElement('button');
r.className='hr';o.type=x.type='button';o.className='ho';x.className='hx';t.textContent=c.title||'Untitled chat';
s.textContent=new Date(c.ts).toLocaleDateString([],{month:'short',day:'numeric'});o.append(t,s);
o.onclick=()=>{openChat(c);toggle(false)};
x.textContent='\u00D7';x.setAttribute('aria-label','Delete chat');
x.onclick=()=>{chats=chats.filter(k=>k!==c);if(cur===c)newChat();save();list()};r.append(o,x);hl.append(r)})}
function toggle(v){hp.hidden=!v;hb.setAttribute('aria-expanded',String(v));if(v)list()}
hb.onclick=()=>toggle(hp.hidden);
$('#clr').onclick=()=>{if(chats.length&&confirm('Delete all saved chats on this device?')){chats=[];save();newChat();list()}};
$('#reset').onclick=newChat;

$('#add').onclick=()=>file.click();
function shrink(f){return new Promise((ok,no)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{const k=Math.min(1,1280/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.8))};i.onerror=()=>no();i.src=u})}
file.onchange=async()=>{const fs=[...file.files];file.value='';
for(const f of fs){
if(docs.length>=3){warn('You can attach up to 3 files at a time.');break}
if(f.type.startsWith('image/')){try{docs.push({img:1,name:f.name||'photo',url:await shrink(f)})}catch(e){warn('I couldn\u2019t open that photo. Try a JPEG or PNG.')}continue}
if(f.size>2e6){warn('That file is too large. The limit is 2 MB.');continue}
if(docs.some(d=>!d.img)){warn('Attach one text file at a time.');continue}
let t;try{t=await f.text()}catch(e){warn('I couldn\u2019t read that file.');continue}
if(/[\u0000\uFFFD]/.test(t.slice(0,2000))){warn('Only photos and text files are supported (txt, md, csv, json, code). PDFs aren\u2019t supported yet.');continue}
docs.push({name:f.name,text:t.slice(0,20000),cut:t.length>20000})}
showAtt()};
function payload(c){let left=3;const o=c.msgs.slice(-20).map(m=>({role:m.role,content:m.content,images:m.images}));
for(let i=o.length-1;i>=0;i--){const im=o[i].images;if(!im)continue;if(left<=0){delete o[i].images;continue}o[i].images=im.slice(0,left);left-=o[i].images.length}return o}

async function ask(text){
text=text.trim();if((!text&&!docs.length)||busy)return;
const ds=docs;docs=[];showAtt();const imgs=ds.filter(d=>d.img).map(d=>d.url),q=text||(imgs.length?'What can you tell me about this?':'Please review this file.');
busy=true;sent=true;send.disabled=true;inp.value='';toggle(false);
if(!cur){cur={id:Date.now().toString(36),title:q.slice(0,40),ts:Date.now(),msgs:[]};chats.unshift(cur)}
const c=cur,shown=q+ds.map(d=>'\n'+(d.img?'\u{1F5BC} ':'\u{1F4CE} ')+d.name).join(''),t=tm();
add('user',shown,t,imgs);
c.msgs.push({role:'user',content:q+ds.filter(d=>!d.img).map(d=>'\n\n[Attached file: '+d.name+(d.cut?' (truncated)':'')+']\n'+d.text).join(''),shown,t,images:imgs.length?imgs:undefined});save();
const slot=add('ai','');slot.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
try{const h={'Content-Type':'application/json'};if(A.session)h.Authorization='Bearer '+A.session.access_token;
const r=await fetch('/api/chat',{method:'POST',headers:h,body:JSON.stringify({messages:payload(c)})});
const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Something went wrong. Please try again.');
fill(slot,j.reply);c.msgs.push({role:'assistant',content:j.reply});c.ts=Date.now();chats=[c,...chats.filter(k=>k!==c)]}
catch(e){slot.textContent=e.message;slot.parentElement.classList.add('err');c.msgs.pop();
if(!c.msgs.length){chats=chats.filter(k=>k!==c);if(cur===c)cur=null}}
save();busy=false;send.disabled=false;log.scrollTop=log.scrollHeight;inp.focus({preventScroll:true})}
form.onsubmit=e=>{e.preventDefault();ask(inp.value)};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition,mic=$('#mic');
if(!SR)mic.style.display='none';else{const rec=new SR();rec.lang=navigator.language||'en-US';
rec.onresult=e=>{inp.value=e.results[0][0].transcript;inp.focus()};rec.onend=()=>mic.classList.remove('on');
mic.onclick=()=>{if(mic.classList.contains('on')){rec.stop();return}mic.classList.add('on');try{rec.start()}catch(_){}}}

// restore the most recent saved chat (and switch to the account's own chats once login is known)
load();if(chats[0])openChat(chats[0]);
A.ready.then(()=>{if(A.session&&!sent){uid=A.session.user.id;load();newChat();if(chats[0])openChat(chats[0])}});
})();
