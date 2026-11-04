const $=(s,r=document)=>r.querySelector(s),db={get:(k,d=[])=>{try{return JSON.parse(localStorage.getItem('bl_'+k))??d}catch{return d}},set:(k,v)=>localStorage.setItem('bl_'+k,JSON.stringify(v))};
const N=v=>'₦'+(+v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),day=()=>new Date().toISOString().slice(0,10),tm=()=>new Date().toLocaleTimeString(),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),200)},2400)};
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const me=()=>db.get('session',null),P=document.body.dataset.page;
if(P==='signin'||P==='signup'){
  const s=me();if(s)location.href=s.role+'.html';
  const login=u=>{db.set('session',{email:u.email,name:u.name,role:u.role});setTimeout(()=>location.href=u.role+'.html',500)};
  $('form').addEventListener('submit',async e=>{
    e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),users=db.get('users');f.email=f.email.trim().toLowerCase();const h=await hash(f.password);
    if(P==='signup'){
      if(f.password.length<6)return toast('Password must be at least 6 characters');
      if(f.password!==f.confirm)return toast('Passwords do not match');
      if(users.some(u=>u.email===f.email))return toast('Email already registered');
      const u={name:f.name.trim(),email:f.email,role:f.role,pw:h,shift:'Morning',excusedUntil:'',joined:day()};
      db.set('users',[...users,u]);toast('Account created');login(u);
    }else{const u=users.find(x=>x.email===f.email&&x.pw===h);u?login(u):toast('Wrong email or password')}
  });
}else{
  const s=me();
  if(!s)location.href='signin.html';else if(s.role!==document.body.dataset.role)location.href=s.role+'.html';else app(s);
}
function app(s){
const R=s.role,PR=()=>db.get('products'),SA=()=>db.get('sales'),EX=()=>db.get('exp'),U=()=>db.get('users');
const mine=R==='kitchen'?'Kitchen':R==='bakery'?'Bakery':null,own=()=>mine?PR().filter(p=>p.cat===mine):PR();
const NAV={admin:['dashboard','products','staff','sales','expenses','verify','reports','accounts','profile','settings'],manager:['dashboard','inventory','verify','sales','profile'],sales:['dashboard','sell','expenses','attendance','handover','profile'],kitchen:['dashboard','stock','attendance','handover','profile'],bakery:['dashboard','baked','profile']};
const LBL={dashboard:'Dashboard',products:'Products',staff:'Staff & Shifts',sales:'Sales Records',expenses:'Expenses',verify:'Stock Verification',reports:'Reports',inventory:'Inventory',attendance:'Attendance',sell:'Record Sale',handover:'Handover',stock:'Kitchen Stock',baked:'Baked Products',accounts:'Accounts',settings:'Settings',profile:'My Profile'};
const sum=a=>a.reduce((t,x)=>t+x.total,0),B=(c,t)=>`<span class="badge ${c}">${t}</span>`;
const tbl=(h,r)=>`<div class="table-wrap"><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${r.length?r.map(x=>`<tr>${x.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${h.length}" class="empty">Nothing recorded yet</td></tr>`}</table></div>`;
const panel=(t,b)=>`<section class="panel"><h3>${t}</h3>${b}</section>`,card=(a,b)=>`<div class="card"><p>${a}</p><h2>${b}</h2></div>`;
const opts=a=>a.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.qty} in stock)</option>`).join('');
const form=(a,f,b)=>`<form data-do="${a}">${f}<button class="btn">${b}</button></form>`,inp=(n,l,t='text',x='')=>`<label>${l}<input name="${n}" type="${t}" ${x} required></label>`,sel=(n,l,o)=>`<label>${l}<select name="${n}" required>${o}</select></label>`;
const prodTable=l=>tbl(['Product','Category','Price','In stock'],l.map(p=>[esc(p.name),p.cat,N(p.price),p.qty]));
const addV=t=>panel(t,form('addStock',sel('pid','Product',opts(own()))+inp('qty','Quantity added','number','min="1"'),'Add to stock'))+panel('My products',prodTable(own()));
const V={
dashboard(){const sl=SA().filter(x=>x.date===day()),my=sl.filter(x=>x.by===s.email),low=own().filter(p=>p.qty<=5),pend=db.get('verifs').filter(v=>v.status==='Discrepancy').length;
 const c=R==='admin'||R==='manager'?[card("Today's Sales",N(sum(sl))),card('Orders Today',sl.length),card('Low Stock',low.length),card('Pending Verification',pend)]:R==='sales'?[card('My Sales Today',N(sum(my))),card('My Orders',my.length),card('Low Stock',low.length)]:[card('Products',own().length),card('Low Stock',low.length),card('Added Today',db.get('adds').filter(a=>a.date===day()&&a.by===s.email).length)];
 return `<section class="grid">${c.join('')}</section>`+panel('Low stock (5 or fewer)',tbl(['Product','Category','In stock'],low.map(p=>[esc(p.name),p.cat,p.qty])))},
products:()=>`<div class="two">`+panel('Add product',form('addProduct',inp('name','Product name')+sel('cat','Category','<option>Kitchen</option><option>Bakery</option><option>Drinks</option>')+inp('price','Selling price (₦)','number','min="0" step="0.01"')+inp('qty','Opening stock','number','min="0"'),'Save product'))+panel('Correct stock (logged)',form('adjust',sel('pid','Product',opts(PR()))+inp('qty','New quantity','number','min="0"')+inp('reason','Reason'),'Update stock'))+`</div>`+panel('All products',prodTable(PR())),
inventory:()=>panel('Inventory',prodTable(PR())),
staff(){const at=db.get('att');return panel('Staff, shifts & attendance',tbl(['Name','Role','Shift','Excused until','Today','Actions'],U().filter(u=>u.role!=='admin').map(u=>{const sh=u.role==='sales'||u.role==='kitchen',pr=at.some(a=>a.email===u.email&&a.date===day());
 return [esc(u.name),u.role,sh?`<select data-shift="${u.email}">${['Morning','Evening'].map(x=>`<option${u.shift===x?' selected':''}>${x}</option>`).join('')}</select>`:'—',u.excusedUntil||'—',pr?B('done','Present'):B('new','Absent'),`<div class="row">${pr?'':`<button class="btn sm" data-act="mark" data-id="${u.email}">Mark present</button>`}<input class="days" type="number" min="1" max="30" placeholder="days"><button class="btn sm light" data-act="excuse" data-id="${u.email}">Excuse</button></div>`]})))},
sales:()=>panel('Sales records',tbl(['Date','Time','Product','Qty','Total','Sold by'],SA().slice().reverse().map(x=>[x.date,x.time,esc(x.name),x.qty,N(x.total),esc(x.byName)]))),
sell(){const l=SA().filter(x=>x.date===day()&&x.by===s.email).reverse();return `<div class="two">`+panel('Record a sale',form('sell',sel('pid','Product',opts(PR().filter(p=>p.qty>0)))+inp('qty','Quantity','number','min="1" value="1"')+'<p class="muted" id="tot"></p>','Save sale'))+panel('My sales today',tbl(['Time','Product','Qty','Total'],l.map(x=>[x.time,esc(x.name),x.qty,N(x.total)])))+`</div>`},
expenses(){const l=EX().filter(x=>R==='admin'||x.by===s.email).reverse();return (R==='sales'?panel('Record expense',form('expense',inp('item','What was it for?')+inp('amount','Amount (₦)','number','min="1" step="0.01"'),'Save expense')):'')+panel('Expenses',tbl(['Date','Item','Amount','By'],l.map(x=>[x.date,esc(x.item),N(x.amount),esc(x.byName)])))},
verify(){const v=db.get('verifs').slice().reverse(),fx=db.get('fixes').slice().reverse(),ad=R==='admin';
 return (R==='manager'?panel('Verify physical count',form('verify',sel('pid','Product',opts(PR()))+inp('cnt','Physical count','number','min="0"'),'Submit count')):'')+
 panel('Verification records',tbl(['Date','Product','Expected','Counted','Difference','Status','By'].concat(ad?['Action']:[]),v.map(x=>[x.date,esc(x.name),x.exp,x.cnt,x.cnt-x.exp,B(x.status==='Discrepancy'?'progress':x.status==='Resolved'?'done':'new',x.status),esc(x.byName)].concat(ad?[x.status==='Discrepancy'?`<button class="btn sm" data-act="resolve" data-id="${x.id}">Correct stock</button>`:'—']:[]))))+
 (ad?panel('Correction history',tbl(['Date','Product','Old','New','Reason','By'],fx.map(x=>[x.date,esc(x.name),x.old,x.nw,esc(x.reason),esc(x.byName)]))):'')},
reports(){const d={},g=k=>d[k]??={s:0,n:0,e:0};SA().forEach(x=>{const r=g(x.date);r.s+=x.total;r.n++});EX().forEach(x=>g(x.date).e+=+x.amount);
 return panel('Daily report',tbl(['Date','Orders','Sales','Expenses','Net'],Object.keys(d).sort().reverse().map(k=>[k,d[k].n,N(d[k].s),N(d[k].e),N(d[k].s-d[k].e)])))},
attendance(){const st=R==='sales'||R==='kitchen',u=U().find(x=>x.email===s.email)||{},a=db.get('att').filter(x=>!st||x.email===s.email).reverse();
 return (st?panel('Mark attendance',`<p class="muted">Shift: ${u.shift||'—'}. Your device location is checked. If it fails, ask the admin to mark you present.</p><br><button class="btn" data-act="here">I'm here</button>`):'')+panel('Attendance records',tbl(['Date','Time','Staff','Method'],a.map(x=>[x.date,x.time,esc(x.name),x.method])))},
handover(){const h=db.get('hand').slice().reverse();return panel('Hand over closing stock',form('hand',sel('pid','Product',opts(own()))+inp('cnt','Closing count','number','min="0"'),'Submit handover'))+panel('Handovers',tbl(['Date','Product','Expected','Counted','From','Status',''],h.map(x=>[x.date,esc(x.name),x.exp,x.cnt,esc(x.byName),B(x.status==='Accepted'?'done':'progress',x.status),x.status==='Pending'&&x.by!==s.email?`<button class="btn sm" data-act="accept" data-id="${x.id}">Accept</button>`:'—'])))},
profile(){const vw=R==='admin'&&arg?decodeURIComponent(arg):s.email,self=vw===s.email,u=U().find(x=>x.email===vw);if(!u)return panel('Profile','<p class="muted">Account not found.</p>');
 const track=u.role==='sales'||u.role==='kitchen',at=db.get('att').filter(a=>a.email===u.email).reverse();
 const head=`<div class="prof"><div class="avatar">${u.pic?`<img src="${u.pic}" alt="">`:esc(u.name[0]||'?').toUpperCase()}</div><div><h2>${esc(u.name)}</h2><p class="muted">${esc(u.email)} · ${u.role}${track?' · '+u.shift+' shift':''}</p><br><div class="row">${self?`<label class="btn sm light">Upload photo<input type="file" accept="image/*" data-pic hidden></label>${u.pic?'<button class="btn sm danger" data-act="rmpic">Remove photo</button>':''}`:'<a class="btn sm light" href="#accounts">Back to accounts</a>'}</div></div></div>`;
 const info=self?form('profile',`<label>Full name<input name="name" value="${esc(u.name)}" required></label><label>Phone<input name="phone" value="${esc(u.phone||'')}"></label><label>Address<input name="address" value="${esc(u.address||'')}"></label><label>About me<textarea name="about" rows="3">${esc(u.about||'')}</textarea></label>`,'Save profile'):tbl(['Phone','Address','About','Joined'],[[esc(u.phone||'—'),esc(u.address||'—'),esc(u.about||'—'),u.joined||'—']]);
 return panel('Profile',head)+panel(self?'My information':'Information',info)+(track?panel('Attendance record ('+at.length+' day'+(at.length===1?'':'s')+')',tbl(['Date','Time','Method'],at.map(x=>[x.date,x.time,x.method]))):'')},
accounts(){const at=db.get('att'),sa=SA(),l=U().filter(u=>u.email!==s.email);
 return panel('All accounts',`<label>Search<input data-filter placeholder="Name, email or role"></label><br>`+tbl(['Name','Email','Role','Shift','Status','Joined','Present today','Sales','Action'],l.map(u=>{const m=sa.filter(x=>x.by===u.email);return [esc(u.name),esc(u.email),u.role,u.role==='sales'||u.role==='kitchen'?u.shift:'—',u.excusedUntil>=day()?B('progress','Excused to '+u.excusedUntil):B('done','Active'),u.joined||'—',at.some(a=>a.email===u.email&&a.date===day())?B('done','Yes'):B('new','No'),u.role==='sales'?m.length+' · '+N(sum(m)):'—',`<div class="row"><a class="btn sm light" href="#profile/${encodeURIComponent(u.email)}">View</a><button class="btn sm danger" data-act="delUser" data-id="${u.email}">Delete</button></div>`]}))) +
 panel('Delete all other accounts',`<p class="muted">Removes all ${l.length} account(s) listed above. Your own account stays.</p>`+form('delAll',inp('password','Confirm your password','password'),'Delete all other accounts').replace('class="btn"','class="btn danger"'))},
settings:()=>panel('Account settings',`<p class="muted">Signed in as ${esc(s.name)} (${esc(s.email)}). Products, sales and other business records are kept when accounts are deleted.</p>`)+panel('Delete my account',`<p class="muted">Removes your admin account and signs you out. If no other admin exists, nobody can manage the app until a new admin signs up.</p>`+form('delMe',inp('password','Confirm your password','password'),'Delete my account').replace('class="btn"','class="btn danger"')),
stock:()=>addV('Add kitchen stock'),baked:()=>addV('Record baked products')};
const log=(k,o)=>db.set(k,[...db.get(k),o]),by={by:s.email,byName:s.name,date:day()};
const prod=id=>{const l=PR(),p=l.find(x=>x.id===id);if(!p)throw Error('Choose a product');return[l,p]};
const markAtt=(email,method)=>{const u=U().find(x=>x.email===email);if(u.excusedUntil>=day())throw Error('Excused until '+u.excusedUntil);if(db.get('att').some(a=>a.email===email&&a.date===day()))throw Error('Already marked present today');log('att',{email,name:u.name,date:day(),time:tm(),method});return 'Attendance marked'};
const pw=async f=>{if(await hash(f.password)!==U().find(x=>x.email===s.email)?.pw)throw Error('Wrong password')};
const setU=o=>{const u=U();Object.assign(u.find(x=>x.email===s.email),o);db.set('users',u)};
let arg='';
const A={
addProduct(f){log('products',{id:uid(),name:f.name.trim(),cat:f.cat,price:+f.price,qty:+f.qty});return 'Product saved'},
adjust(f){const[l,p]=prod(f.pid);log('fixes',{...by,name:p.name,old:p.qty,nw:+f.qty,reason:f.reason});p.qty=+f.qty;db.set('products',l);return 'Stock updated and logged'},
sell(f){const[l,p]=prod(f.pid),q=+f.qty;if(q<1||q>p.qty)throw Error('Only '+p.qty+' in stock');p.qty-=q;db.set('products',l);log('sales',{...by,time:tm(),pid:p.id,name:p.name,qty:q,total:q*p.price});return 'Sale saved: '+N(q*p.price)},
expense(f){log('exp',{...by,item:f.item,amount:+f.amount});return 'Expense saved'},
addStock(f){const[l,p]=prod(f.pid);p.qty+=+f.qty;db.set('products',l);log('adds',{...by,pid:p.id,qty:+f.qty});return 'Stock added'},
verify(f){const[,p]=prod(f.pid),c=+f.cnt;log('verifs',{...by,id:uid(),name:p.name,pid:p.id,exp:p.qty,cnt:c,status:c===p.qty?'Matched':'Discrepancy'});return c===p.qty?'Counts match':'Discrepancy reported to admin'},
async delAll(f){await pw(f);if(!confirm('Delete ALL other accounts? This cannot be undone.'))throw Error('Cancelled');db.set('users',U().filter(u=>u.email===s.email));return 'All other accounts deleted'},
async delMe(f){await pw(f);if(!confirm('Delete your own account? You will be signed out.'))throw Error('Cancelled');db.set('users',U().filter(u=>u.email!==s.email));localStorage.removeItem('bl_session');toast('Account deleted');setTimeout(()=>location.href='signup.html',900);return 'Account deleted'},
profile(f){const name=f.name.trim();if(!name)throw Error('Name is required');setU({name,phone:f.phone.trim(),address:f.address.trim(),about:f.about.trim()});s.name=by.byName=name;db.set('session',{...s});return 'Profile saved'},
hand(f){const[,p]=prod(f.pid);log('hand',{...by,id:uid(),name:p.name,exp:p.qty,cnt:+f.cnt,status:'Pending'});return 'Handover submitted'}};
const C={
mark:b=>markAtt(b.dataset.id,'Admin'),
here:()=>new Promise((ok,no)=>{if(!navigator.geolocation)return no(Error('Location not supported. Ask the admin to mark you present.'));navigator.geolocation.getCurrentPosition(()=>{try{ok(markAtt(s.email,'GPS'))}catch(x){no(x)}},()=>no(Error('Location failed. Ask the admin to mark you present.')),{timeout:8000})}),
excuse(b){const n=Math.floor(+b.previousElementSibling.value);if(!(n>=1&&n<=30))throw Error('Enter 1 to 30 days');const d=new Date();d.setDate(d.getDate()+n);const u=U();u.find(x=>x.email===b.dataset.id).excusedUntil=d.toISOString().slice(0,10);db.set('users',u);return 'Excused for '+n+' days'},
resolve(b){const v=db.get('verifs'),x=v.find(i=>i.id===b.dataset.id),r=prompt('Reason for the correction?');if(!r)throw Error('A reason is required');const[l,p]=prod(x.pid);log('fixes',{...by,name:p.name,old:p.qty,nw:x.cnt,reason:r});p.qty=x.cnt;x.status='Resolved';db.set('products',l);db.set('verifs',v);return 'Stock corrected'},
delUser(b){const u=U().find(x=>x.email===b.dataset.id);if(!u||!confirm('Delete '+u.name+' ('+u.role+')? This cannot be undone.'))return;db.set('users',U().filter(x=>x.email!==u.email));return u.name+' deleted'},
rmpic(){setU({pic:''});return 'Photo removed'},
accept(b){const h=db.get('hand');h.find(i=>i.id===b.dataset.id).status='Accepted';db.set('hand',h);return 'Handover accepted'}};
const nav=NAV[R];
function render(anim){const[v0,a0]=location.hash.slice(1).split('/'),v=nav.includes(v0)?v0:'dashboard',el=$('#view'),cu=U().find(x=>x.email===s.email)||{},on=v==='profile'&&a0&&R==='admin'?'accounts':v;arg=a0||'';
 $('#nav').innerHTML=nav.map(k=>`<a href="#${k}" class="${k===on?'active':''}">${LBL[k]}</a>`).join('');$('#title').textContent=on==='accounts'&&v==='profile'?'Staff Profile':LBL[v];$('#who').innerHTML=(cu.pic?`<img class="av" src="${cu.pic}" alt="">`:'')+esc(s.name)+' · '+R;
 el.innerHTML=V[v]();if(anim){el.classList.remove('fade');void el.offsetWidth;el.classList.add('fade')}}
document.addEventListener('submit',async e=>{const a=e.target.dataset.do;if(!a)return;e.preventDefault();try{toast(await A[a](Object.fromEntries(new FormData(e.target))));render()}catch(x){toast(x.message)}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;try{const m=await C[b.dataset.act](b);if(m)toast(m)}catch(x){toast(x.message)}render()});
document.addEventListener('change',e=>{const m=e.target.dataset.shift;if(m){const u=U();u.find(x=>x.email===m).shift=e.target.value;db.set('users',u);toast('Shift updated')}});
document.addEventListener('input',e=>{const f=e.target.closest('[data-do=sell]');if(f){const p=PR().find(x=>x.id===f.pid.value);$('#tot').textContent=p?'Total: '+N(p.price*(+f.qty.value||0)):''}});
document.addEventListener('input',e=>{if(e.target.dataset.filter===undefined)return;const q=e.target.value.toLowerCase();document.querySelectorAll('#view tr').forEach(r=>{if(!r.querySelector('th'))r.hidden=!r.textContent.toLowerCase().includes(q)})});
document.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(e.target.dataset.pic===undefined||!f)return;if(!f.type.startsWith('image/'))return toast('Choose an image file');const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),z=Math.min(img.width,img.height),x=c.getContext('2d');c.width=c.height=200;x.drawImage(img,(img.width-z)/2,(img.height-z)/2,z,z,0,0,200,200);setU({pic:c.toDataURL('image/jpeg',.8)});toast('Photo updated');render()};img.onerror=()=>toast('Could not read that image');img.src=URL.createObjectURL(f)});
$('#logout').onclick=()=>{localStorage.removeItem('bl_session');location.href='signin.html'};
window.addEventListener('hashchange',render);render(1);
}
