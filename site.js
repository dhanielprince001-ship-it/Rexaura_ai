const m=document.getElementById('menu'),l=document.getElementById('links');
m.onclick=()=>{const o=l.classList.toggle('open');m.setAttribute('aria-expanded',o)};
document.querySelectorAll('.wave').forEach(w=>{for(let i=0;i<46;i++){const b=document.createElement('i');b.style.height=(4+Math.abs(Math.sin(i*.7)*Math.cos(i*.23))*16)+'px';w.append(b)}});
