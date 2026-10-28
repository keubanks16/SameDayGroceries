const $ = (s) => document.querySelector(s);
const STORE = 'kollin-smart-cart-v1';
const PREFS = 'kollin-smart-cart-prefs-v1';
const icons = {milk:'🥛',bread:'🍞',eggs:'🥚',bananas:'🍌',banana:'🍌',apples:'🍎',apple:'🍎',cheese:'🧀',water:'💧',coffee:'☕',chicken:'🍗'};
let cart = JSON.parse(localStorage.getItem(STORE) || '[]');
let prefs = JSON.parse(localStorage.getItem(PREFS) || '{}');
let editingCartId = null;

function normalize(value){ return value.toLowerCase().trim().replace(/\b(some|a|an|please|get|grab|buy|i need|we need|add)\b/g,'').replace(/\s+/g,' ').trim(); }
function singular(value){ return value.endsWith('ies') ? value.slice(0,-3)+'y' : value.endsWith('s') && !value.endsWith('ss') ? value.slice(0,-1) : value; }
function parseList(text){
  return text.replace(/\band\b/gi, ',').split(/,|\n/).map(normalize).filter(Boolean).map(part => {
    const match = part.match(/^(?:(\d+)|one|two|three|four|five)\s+(.+)$/i);
    const words = {one:1,two:2,three:3,four:4,five:5};
    return match ? {qty:Number(match[1] || words[match[0].split(' ')[0].toLowerCase()]), key:singular(match[2])} : {qty:1,key:singular(part)};
  });
}
function save(){ localStorage.setItem(STORE,JSON.stringify(cart)); localStorage.setItem(PREFS,JSON.stringify(prefs)); render(); }
function addText(text){
  parseList(text).forEach(({key,qty}) => {
    const found = cart.find(x => x.key === key);
    if(found) found.qty += qty; else cart.push({id:crypto.randomUUID(),key,qty});
  });
  save(); $('#quickInput').value=''; $('#cartSection').scrollIntoView({behavior:'smooth',block:'start'});
}
function productFor(item){ return prefs[item.key] || null; }
function render(){
  const list=$('#cartList'); list.innerHTML=''; $('#cartEmpty').hidden=cart.length>0; $('#clearBtn').hidden=!cart.length;
  $('#deliveryCard').hidden=!cart.length; $('#checkoutBtn').hidden=!cart.length; $('#checkoutNote').hidden=!cart.length;
  cart.forEach(item => {
    const pref=productFor(item), row=document.createElement('article'); row.className='cart-item '+(pref?'':'unmatched');
    const label=pref?.name || `Choose your preferred ${item.key}`; const detail=pref ? [pref.size,pref.sub==='none'?'No substitutions':pref.sub==='similar'?'Similar substitutes OK':'Ask before substituting'].filter(Boolean).join(' · ') : 'Teach me once and I’ll remember it';
    row.innerHTML=`<div class="product-icon">${icons[item.key]||'🛒'}</div><div><h3>${escapeHtml(label)}</h3><p>${escapeHtml(detail)}</p></div><div class="item-actions">${pref?'':`<button class="teach" data-teach="${item.id}">Choose item</button>`}<div class="qty"><button data-minus="${item.id}" aria-label="Decrease">−</button><span>${item.qty}</span><button data-plus="${item.id}" aria-label="Increase">+</button></div><button class="remove" data-remove="${item.id}" aria-label="Remove">×</button></div>`;
    list.appendChild(row);
  });
  renderPrefs();
}
function escapeHtml(s=''){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function showPref(key, cartId=null){
  editingCartId=cartId; const p=prefs[key]||{}; $('#prefKey').value=key; $('#dialogTitle').textContent=`Which ${key} do you like?`; $('#prefName').value=p.name||''; $('#prefSize').value=p.size||''; $('#prefQty').value=p.qty||1; $('#prefUrl').value=p.url||''; $('#prefSub').value=p.sub||'ask'; $('#preferenceDialog').showModal(); setTimeout(()=>$('#prefName').focus(),80);
}
function renderPrefs(){
  const wrap=$('#preferenceList'), entries=Object.entries(prefs); wrap.innerHTML=entries.length?'':'<div class="empty-state"><strong>No favorites yet</strong><p>Add one here or choose an unmatched cart item.</p></div>';
  entries.forEach(([key,p])=>{const row=document.createElement('div');row.className='pref-row';row.innerHTML=`<div><strong>${escapeHtml(key)} → ${escapeHtml(p.name)}</strong><span>${escapeHtml(p.size||'Size not set')} · usual qty ${p.qty||1}</span></div><button data-edit="${escapeHtml(key)}">Edit</button>`;wrap.appendChild(row)});
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

$('#quickForm').addEventListener('submit',e=>{e.preventDefault();if($('#quickInput').value.trim())addText($('#quickInput').value)});
document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>addText(b.dataset.add)));
$('#cartList').addEventListener('click',e=>{const id=e.target.dataset.plus||e.target.dataset.minus||e.target.dataset.remove||e.target.dataset.teach;if(!id)return;const item=cart.find(x=>x.id===id);if(e.target.dataset.teach)return showPref(item.key,id);if(e.target.dataset.plus)item.qty++;if(e.target.dataset.minus)item.qty--;if(e.target.dataset.remove||item.qty<1)cart=cart.filter(x=>x.id!==id);save()});
$('#clearBtn').addEventListener('click',()=>{cart=[];save()});
$('#settingsBtn').addEventListener('click',()=>$('#libraryDialog').showModal()); $('#closeLibrary').addEventListener('click',()=>$('#libraryDialog').close());
$('#preferenceList').addEventListener('click',e=>{if(e.target.dataset.edit){$('#libraryDialog').close();showPref(e.target.dataset.edit)}});
$('#addPreference').addEventListener('click',()=>{const key=prompt('What do you call this item? (Example: milk)');if(key){$('#libraryDialog').close();showPref(singular(normalize(key)))}});
$('#preferenceForm').addEventListener('submit',e=>{
  if(e.submitter?.value==='cancel')return; e.preventDefault(); const key=$('#prefKey').value; let url=$('#prefUrl').value.trim(); if(url && !/^https:\/\/(www\.)?walmart\.com\//i.test(url)){toast('Please use a Walmart product link');return}
  prefs[key]={name:$('#prefName').value.trim(),size:$('#prefSize').value.trim(),qty:Number($('#prefQty').value)||1,url,sub:$('#prefSub').value};
  const item=cart.find(x=>x.id===editingCartId); if(item && item.qty===1)item.qty=prefs[key].qty; save(); $('#preferenceDialog').close();toast(`I’ll remember your ${key}`);
});
$('#checkoutBtn').addEventListener('click',()=>{
  const unmatched=cart.find(x=>!productFor(x)); if(unmatched){showPref(unmatched.key,unmatched.id);toast(`Choose your ${unmatched.key} first`);return}
  const first=cart[0], p=productFor(first); const query=cart.map(x=>`${x.qty} ${productFor(x).name} ${productFor(x).size||''}`).join(', ');
  const url=cart.length===1&&p.url?p.url:`https://www.walmart.com/search?q=${encodeURIComponent(query)}`; window.open(url,'_blank','noopener'); toast('Opening Walmart for final review');
});

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){
  const rec=new SpeechRecognition();rec.lang='en-US';rec.interimResults=false;
  $('#micBtn').addEventListener('click',()=>rec.start());
  rec.onstart=()=>{$('#micBtn').classList.add('listening');$('#voiceTitle').textContent='Listening…';$('#voiceHint').textContent='Say everything you need.'};
  rec.onend=()=>{$('#micBtn').classList.remove('listening');$('#voiceTitle').textContent='Tap to speak';$('#voiceHint').textContent='“I need milk, bread, and two bananas.”'};
  rec.onresult=e=>addText(e.results[0][0].transcript); rec.onerror=()=>toast('I couldn’t hear that. Try typing it below.');
}else{$('#micBtn').addEventListener('click',()=>toast('Voice input is not supported in this browser yet.'))}
render();
