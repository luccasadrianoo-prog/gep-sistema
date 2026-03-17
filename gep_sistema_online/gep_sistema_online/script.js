const STORAGE_KEY='grupo_espirita_paz_estudos_v2';
const DARK_KEY='grupo_espirita_paz_dark';
const LOGIN_USER='GEP';
const LOGIN_PASS='gep1906';
const LOGIN_KEY='grupo_espirita_paz_logged';

const defaultFacilitators = [
  'ALINE','GUSTAVO','DRI','JANETE','MARCOS','BRUNO','PEDRO','JUCIMEIRE',
  'MAICON','HIARA','REJANE','JEAN','UYARA','CIDA','JEFFERSON','GABI','ÊNIO'
];

const defaultState={
  people: defaultFacilitators.map((name,idx)=>({id:idx+1,name,role:'FACILITADOR',obs:''})),
  availability: Object.fromEntries(defaultFacilitators.map((_,idx)=>[idx+1,{groups:true,general:true,obs:''}])),
  groups:[
    {name:'ESDE',facilitators:['','',''],attendees:Array(10).fill('')},
    {name:'EADE',facilitators:['','',''],attendees:Array(10).fill('')},
    {name:'CIP',facilitators:['','',''],attendees:Array(10).fill('')},
    {name:'PERCEPÇÕES',facilitators:['','',''],attendees:Array(10).fill('')},
    {name:'PSICOFONIA',facilitators:['','',''],attendees:Array(10).fill('')},
    {name:'PSICOFONIA 2',facilitators:['','',''],attendees:Array(10).fill('')},
    {name:'PASSE',facilitators:['','',''],attendees:Array(10).fill('')},
    {name:'AT. FRATERNO',facilitators:['','',''],attendees:Array(10).fill('')}
  ],
  ui:{sortMode:'name'}
};

let state = loadState();
applyTheme(localStorage.getItem(DARK_KEY)==='1');

function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(defaultState);
    return mergeState(JSON.parse(raw));
  }catch{return structuredClone(defaultState)}
}
function mergeState(raw){
  const m=structuredClone(defaultState);
  m.people=Array.isArray(raw.people)?raw.people:m.people;
  m.availability=raw.availability||m.availability;
  m.groups=Array.isArray(raw.groups)?raw.groups:m.groups;
  m.ui=raw.ui||m.ui;
  m.groups=m.groups.map(g=>({
    name:g.name||'GRUPO',
    facilitators:Array.isArray(g.facilitators)?[...g.facilitators,'','',''].slice(0,3):['','',''],
    attendees:Array.isArray(g.attendees)?[...g.attendees,...Array(10).fill('')].slice(0,10):Array(10).fill('')
  }));
  return m;
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); queueRemoteSave()}
function normalizeText(str){return (str||'').toString().trim().toUpperCase()}
function nextId(){return state.people.reduce((m,p)=>Math.max(m,Number(p.id)||0),0)+1}
function personById(id){return state.people.find(p=>Number(p.id)===Number(id))}
function availablePeople(){return state.people.filter(p=>state.availability[p.id]?.groups)}
function availableFacilitators(){return availablePeople().filter(p=>p.role==='FACILITADOR')}
function availableAttendees(){return availablePeople().filter(p=>p.role==='FREQUENTADOR')}
function assignedIds(){
  const used=new Set();
  state.groups.forEach(g=>{
    g.facilitators.forEach(v=>v&&used.add(Number(v)));
    g.attendees.forEach(v=>v&&used.add(Number(v)));
  });
  return used;
}
function optionsFor(role,currentId=''){
  const used=assignedIds();
  const current=currentId?Number(currentId):null;
  if(current) used.delete(current);
  const source=role==='FACILITADOR'?availableFacilitators():availableAttendees();
  return source.filter(p=>!used.has(Number(p.id)) || Number(p.id)===current);
}
function getStatus(group){
  const fc=group.facilitators.filter(Boolean).length;
  const ac=group.attendees.filter(Boolean).length;
  if(fc===0&&ac===0) return {text:'GRUPO VAZIO',cls:'empty'};
  if(fc===0) return {text:'SEM FACILITADOR',cls:'bad'};
  if(ac===0) return {text:'SEM FREQUENTADORES',cls:'warn'};
  return {text:'OK',cls:'ok'};
}
function escapeHtml(str){return String(str??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escapeAttr(str){return escapeHtml(str).replace(/"/g,'&quot;')}
function cardMetric(label,value){return `<div class="card"><div class="muted">${label}</div><strong>${value}</strong></div>`}

function renderSummary(){
  document.getElementById('summaryCards').innerHTML=[
    cardMetric('TOTAL CADASTRADOS',state.people.length),
    cardMetric('FACILITADORES',state.people.filter(p=>p.role==='FACILITADOR').length),
    cardMetric('FREQUENTADORES',state.people.filter(p=>p.role==='FREQUENTADOR').length),
    cardMetric('DISPONÍVEIS P/ GRUPOS',availablePeople().length)
  ].join('');
  document.getElementById('groupSummary').innerHTML=state.groups.map(g=>{
    const s=getStatus(g);
    return `<div class="row compact" style="grid-template-columns:1fr auto;margin-bottom:8px;"><strong>${escapeHtml(g.name)}</strong><span class="pill ${s.cls}">${s.text}</span></div>`;
  }).join('');
  const generalYes=state.people.filter(p=>state.availability[p.id]?.general).length;
  const groupsYes=state.people.filter(p=>state.availability[p.id]?.groups).length;
  document.getElementById('availabilitySummary').innerHTML=`
    <div class="card"><div class="muted">VÃO AO ESTUDO GERAL</div><strong>${generalYes}</strong></div>
    <div class="card"><div class="muted">DISPONÍVEIS P/ GRUPOS</div><strong>${groupsYes}</strong></div>
    <div class="card"><div class="muted">FACILITADORES DISPONÍVEIS</div><strong>${availableFacilitators().length}</strong></div>
    <div class="card"><div class="muted">FREQUENTADORES DISPONÍVEIS</div><strong>${availableAttendees().length}</strong></div>
  `;
}
function renderLists(){
  document.getElementById('facilitadoresDisponiveis').innerHTML=availableFacilitators().map(p=>`<div>${escapeHtml(p.name)}</div>`).join('')||'<div class="muted">Nenhum</div>';
  document.getElementById('frequentadoresDisponiveis').innerHTML=availableAttendees().map(p=>`<div>${escapeHtml(p.name)}</div>`).join('')||'<div class="muted">Nenhum</div>';
  document.getElementById('todosDisponiveis').innerHTML=availablePeople().map(p=>`<div>${escapeHtml(p.name)}</div>`).join('')||'<div class="muted">Nenhum</div>';
}
function renderPeople(){
  const list=document.getElementById('peopleList');
  const q=normalizeText(document.getElementById('searchPeople').value);
  let people=[...state.people];
  if(state.ui.sortMode==='role'){people.sort((a,b)=>a.role.localeCompare(b.role)||a.name.localeCompare(b.name))}
  else{people.sort((a,b)=>a.name.localeCompare(b.name))}
  if(q) people=people.filter(p=>normalizeText(p.name).includes(q));
  list.innerHTML=people.map(p=>{
    const av=state.availability[p.id]||{groups:false,general:false,obs:''};
    return `<div class="person">
      <div><strong>${escapeHtml(p.name)}</strong></div>
      <div><span class="tag ${p.role==='FACILITADOR'?'facilitador':'frequen'}">${p.role}</span></div>
      <div><span class="tag ${av.groups?'sim':'nao'}">GRUPOS: ${av.groups?'SIM':'NÃO'}</span></div>
      <div>${escapeHtml(p.obs||'')}</div>
      <div><button class="btn-danger" onclick="removePerson(${p.id})">Excluir</button></div>
    </div>`;
  }).join('')||'<div class="person"><div class="muted">Nenhuma pessoa cadastrada.</div></div>';
}
function renderAvailability(){
  const filter=document.getElementById('roleFilter')?.value||'TODOS';

  const list=document.getElementById('availabilityList');
  let people=[...state.people].sort((a,b)=>a.name.localeCompare(b.name));
  if(filter!=='TODOS'){
    people=people.filter(p=>p.role===filter);
  }
  list.innerHTML=people.map(p=>{
    const av=state.availability[p.id]||{groups:false,general:false,obs:''};
    return `<div class="person">
      <div><strong>${escapeHtml(p.name)}</strong></div>
      <div><span class="tag ${p.role==='FACILITADOR'?'facilitador':'frequen'}">${p.role}</span></div>
      <div>
        <select onchange="updateAvailability(${p.id},'groups',this.value)">
          <option value="SIM" ${av.groups?'selected':''}>SIM</option>
          <option value="NAO" ${!av.groups?'selected':''}>NÃO</option>
        </select>
      </div>
      <div>
        <select onchange="updateAvailability(${p.id},'general',this.value)">
          <option value="SIM" ${av.general?'selected':''}>SIM</option>
          <option value="NAO" ${!av.general?'selected':''}>NÃO</option>
        </select>
      </div>
      <div><input type="text" value="${escapeAttr(av.obs||'')}" placeholder="Observação" oninput="updateAvailabilityObs(${p.id},this.value)" /></div>
    </div>`;
  }).join('');
}
function buildOptions(role,currentValue){
  const current=currentValue?Number(currentValue):'';
  const pool=optionsFor(role,current);
  const blank=`<option value="" ${current===''?'selected':''}>—</option>`;
  const opts=pool.sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<option value="${p.id}" ${Number(current)===Number(p.id)?'selected':''}>${escapeHtml(p.name)}</option>`).join('');
  return blank+opts;
}
function renderGroups(){
  const container=document.getElementById('groupsGrid');
  container.innerHTML=state.groups.map((g,gi)=>{
    const s=getStatus(g),fc=g.facilitators.filter(Boolean).length,ac=g.attendees.filter(Boolean).length;
    return `<div class="group-card">
      <div class="group-head">
        <input type="text" value="${escapeAttr(g.name)}" onchange="renameGroup(${gi},this.value)" />
        <button class="btn-danger" onclick="removeGroup(${gi})">Excluir</button>
      </div>
      <div class="group-section-title">FACILITADORES</div>
      <div class="select-stack">${g.facilitators.map((value,idx)=>`<select onchange="setGroupMember(${gi},'facilitators',${idx},this.value)">${buildOptions('FACILITADOR',value)}</select>`).join('')}</div>
      <div class="group-section-title">FREQUENTADORES</div>
      <div class="select-stack">${g.attendees.map((value,idx)=>`<select onchange="setGroupMember(${gi},'attendees',${idx},this.value)">${buildOptions('FREQUENTADOR',value)}</select>`).join('')}</div>
      <div class="stats">
        <div class="stat"><div class="muted">QTDE<br>FACILITADORES</div><strong>${fc}</strong></div>
        <div class="stat"><div class="muted">QTDE<br>FREQUENTADORES</div><strong>${ac}</strong></div>
      </div>
      <div style="margin-top:12px;"><span class="pill ${s.cls}">${s.text}</span></div>
    </div>`;
  }).join('');
}
function render(){renderSummary();renderLists();renderPeople();renderAvailability();renderGroups();saveState()}

function addPerson(){
  const name=normalizeText(document.getElementById('personName').value);
  const role=document.getElementById('personRole').value;
  const obs=normalizeText(document.getElementById('personObs').value);
  if(!name) return alert('Digite um nome.');
  if(state.people.some(p=>normalizeText(p.name)===name)) return alert('Esse nome já está cadastrado.');
  const id=nextId();
  state.people.push({id,name,role,obs});
  state.availability[id]={groups:true,general:true,obs:''};
  document.getElementById('personName').value='';
  document.getElementById('personObs').value='';
  render();
}
function removePerson(id){
  const person=personById(id); if(!person) return;
  if(!confirm(`Excluir ${person.name}?`)) return;
  state.people=state.people.filter(p=>Number(p.id)!==Number(id));
  delete state.availability[id];
  state.groups.forEach(g=>{
    g.facilitators=g.facilitators.map(v=>Number(v)===Number(id)?'':v);
    g.attendees=g.attendees.map(v=>Number(v)===Number(id)?'':v);
  });
  render();
}
function updateAvailability(id,key,value){
  state.availability[id]=state.availability[id]||{groups:false,general:false,obs:''};
  state.availability[id][key]=value==='SIM';
  if(key==='groups'&&value!=='SIM'){
    state.groups.forEach(g=>{
      g.facilitators=g.facilitators.map(v=>Number(v)===Number(id)?'':v);
      g.attendees=g.attendees.map(v=>Number(v)===Number(id)?'':v);
    });
  }
  render();
}
function updateAvailabilityObs(id,value){
  state.availability[id]=state.availability[id]||{groups:false,general:false,obs:''};
  state.availability[id].obs=value; saveState();
}
function setGroupMember(groupIndex,type,slotIndex,value){
  const id=value?Number(value):'';
  const role=type==='facilitators'?'FACILITADOR':'FREQUENTADOR';
  const allowed=optionsFor(role,state.groups[groupIndex][type][slotIndex]).map(p=>Number(p.id));
  if(id&&!allowed.includes(id)){alert('Essa pessoa já está em outro grupo ou não está disponível.');render();return;}
  state.groups[groupIndex][type][slotIndex]=id||''; render();
}
function renameGroup(index,value){state.groups[index].name=normalizeText(value)||`GRUPO ${index+1}`;saveState();renderSummary()}
function addGroup(){state.groups.push({name:`GRUPO ${state.groups.length+1}`,facilitators:['','',''],attendees:Array(10).fill('')});render()}
function removeGroup(index){if(!confirm('Excluir este grupo?')) return; state.groups.splice(index,1); render()}
function clearGroups(){if(!confirm('Limpar todos os grupos?')) return; state.groups=state.groups.map(g=>({...g,facilitators:['','',''],attendees:Array(g.attendees.length).fill('')})); render()}
function autoDistribute(){
  const freeAttendees=optionsFor('FREQUENTADOR');
  if(!freeAttendees.length) return alert('Não há frequentadores livres para distribuir.');
  let cursor=0;
  for(const person of freeAttendees){
    let placed=false;
    for(let attempts=0;attempts<state.groups.length;attempts++){
      const idx=(cursor+attempts)%state.groups.length;
      const slot=state.groups[idx].attendees.findIndex(v=>!v);
      if(slot!==-1){state.groups[idx].attendees[slot]=person.id; cursor=idx+1; placed=true; break;}
    }
    if(!placed) break;
  }
  render();
}
function resetAll(){if(!confirm('Zerar tudo e voltar ao modelo inicial?')) return; state=structuredClone(defaultState); render()}

function checkLogin(){
  const ok = sessionStorage.getItem(LOGIN_KEY)==='1';
  const overlay = document.getElementById('loginOverlay');
  if(overlay) overlay.style.display = ok ? 'none' : 'flex';
}
function doLogin(){
  const user = (document.getElementById('loginUser')?.value || '').trim();
  const pass = document.getElementById('loginPass')?.value || '';
  const err = document.getElementById('loginError');
  if(user === LOGIN_USER && pass === LOGIN_PASS){
    sessionStorage.setItem(LOGIN_KEY,'1');
    if(err) err.textContent = '';
    checkLogin();
  }else{
    if(err) err.textContent = 'Usuário ou senha inválidos.';
  }
}


function toggleSenha(){
  const campo = document.getElementById('loginPass');
  const botao = document.getElementById('togglePassBtn');
  const mostrando = campo.type === 'text';
  campo.type = mostrando ? 'password' : 'text';
  botao.textContent = mostrando ? 'Mostrar' : 'Ocultar';
}

function applyTheme(isDark){
  document.body.classList.toggle('dark',isDark);
  localStorage.setItem(DARK_KEY,isDark?'1':'0');
  document.getElementById('themeBtn').textContent=isDark?'Tema claro':'Tema escuro';
}

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
}));
document.getElementById('addPersonBtn').addEventListener('click',addPerson);
document.getElementById('searchPeople').addEventListener('input',renderPeople);
document.getElementById('sortByNameBtn').addEventListener('click',()=>{state.ui.sortMode='name';renderPeople();saveState()});
document.getElementById('sortByRoleBtn').addEventListener('click',()=>{state.ui.sortMode='role';renderPeople();saveState()});
document.getElementById('addGroupBtn').addEventListener('click',addGroup);
document.getElementById('clearGroupsBtn').addEventListener('click',clearGroups);
document.getElementById('autoDistributeBtn').addEventListener('click',autoDistribute);
document.getElementById('resetBtn').addEventListener('click',resetAll);
document.getElementById('roleFilter')?.addEventListener('change',renderAvailability);
document.getElementById('themeBtn').addEventListener('click',()=>applyTheme(!document.body.classList.contains('dark')));
document.getElementById('loginBtn').addEventListener('click',doLogin);
document.getElementById('togglePassBtn').addEventListener('click',toggleSenha);
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter') doLogin()});
document.getElementById('loginUser').addEventListener('keydown',e=>{if(e.key==='Enter') doLogin()});


window.removePerson=removePerson;
window.updateAvailability=updateAvailability;
window.updateAvailabilityObs=updateAvailabilityObs;
window.setGroupMember=setGroupMember;
window.renameGroup=renameGroup;
window.removeGroup=removeGroup;



const API_LOAD='/.netlify/functions/state-get';
const API_SAVE='/.netlify/functions/state-save';
let remoteSaveTimer=null;
let remoteBooted=false;

function setSyncStatus(message,type='empty'){
  const el=document.getElementById('syncStatus');
  if(!el) return;
  el.textContent=message;
  el.className='pill';
  if(type==='ok') el.classList.add('sync-ok');
  else if(type==='warn') el.classList.add('sync-warn');
  else if(type==='bad') el.classList.add('sync-bad');
  else el.classList.add('empty');
}

async function loadRemoteState(){
  setSyncStatus('Carregando dados online...','warn');
  try{
    const res=await fetch(API_LOAD,{cache:'no-store'});
    if(!res.ok) throw new Error('Falha ao carregar dados online');
    const data=await res.json();
    if(data && data.state){
      state=mergeState(data.state);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      render();
      setSyncStatus('Dados online carregados','ok');
    }else{
      setSyncStatus('Sem dados online ainda','warn');
    }
    remoteBooted=true;
  }catch(err){
    console.warn('Usando dados locais:', err.message);
    setSyncStatus('Sem conexão com o banco','bad');
    remoteBooted=true;
  }
}

function queueRemoteSave(){
  if(!remoteBooted) return;
  clearTimeout(remoteSaveTimer);
  setSyncStatus('Salvando online...','warn');
  remoteSaveTimer=setTimeout(saveRemoteState,500);
}

async function saveRemoteState(){
  try{
    const res=await fetch(API_SAVE,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({state})
    });
    if(!res.ok) throw new Error('Falha ao salvar');
    setSyncStatus('Tudo salvo online','ok');
  }catch(err){
    console.warn('Não foi possível salvar online:', err.message);
    setSyncStatus('Erro ao salvar online','bad');
  }
}

checkLogin();
render();
loadRemoteState();