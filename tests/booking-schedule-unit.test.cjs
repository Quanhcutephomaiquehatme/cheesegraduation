const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/booking/contact-booking.js'),'utf8');
const html=fs.readFileSync(path.join(root,'lien-he.html'),'utf8');
const slice=(start,end)=>source.slice(source.indexOf('function '+start+'('),source.indexOf('function '+end+'('));
const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',value:'1',style:{setProperty(){}},classList:{toggle(){}},setAttribute(){}});return nodes.get(id)};
const cards=[...html.matchAll(/<button class="grad-package-card[\s\S]*?<\/button>/g)].map(([markup])=>({dataset:{gradPackage:markup.match(/data-grad-package="([^"]+)"/)[1]},classList:{toggle(){}},setAttribute(){},querySelector(selector){assert.equal(selector,'.grad-price','Selector must target the strong element itself');assert.match(markup,/<strong class="grad-price">/);return node(this.dataset.gradPackage)}}));
const a={name:'A',graduationPrices:{ceremony:1900000,pregrad:2700000,'pregrad-plus':3600000},graduationExtraPerPerson:0};
const b={name:'B',graduationPrices:{ceremony:2200000,pregrad:3100000,'pregrad-plus':4000000},graduationExtraPerPerson:450000};
const context=vm.createContext({console,Number,profiles:{a,b},currentSlug:'a',gradPackageId:'ceremony',GRAD_EXTRA:300000,GRAD_PACKAGES:[{id:'ceremony',basePrice:1700000,maxPeople:2,name:'Lễ'},{id:'pregrad',basePrice:2000000,maxPeople:3,name:'Pre'},{id:'pregrad-plus',basePrice:2500000,maxPeople:4,name:'Plus'}],gradPeopleRange:node('#gradPeopleRange'),$:node,$$:()=>cards,document:{},history:{replaceState(){}},syncCompactSwitch(){},syncPackageCard(){},resetAvailability(){},checkAvailability(){},buildMessage(){},shootDate:{value:''}});
vm.runInContext("function current(){return profiles[currentSlug]}\n"+slice('formatMoney','getPeopleCount')+slice('currentGradPackage','getSelectedBookingPackage')+slice('updateProfile','buildMessage'),context);
for(const [slug,person] of Object.entries({a,b})){
 context.currentSlug=slug;
 for(const [id,max] of [['ceremony',2],['pregrad',3],['pregrad-plus',4]]){
  context.gradPackageId=id;
  for(let count=1;count<=max;count++){
   node('#gradPeopleRange').value=String(count);vm.runInContext('syncGradPackage()',context);
   const expected=(person.graduationPrices[id]+(count-1)*person.graduationExtraPerPerson).toLocaleString('vi-VN')+'đ';
   assert.equal(node('#gradSummaryPrice').textContent,expected);assert.equal(node('#gradPeoplePrice').textContent,expected);
   assert.equal(node(id).textContent,person.graduationPrices[id].toLocaleString('vi-VN')+'đ');
  }
 }
}
context.currentSlug='a';context.gradPackageId='ceremony';node('#gradPeopleRange').value='2';vm.runInContext('updateProfile()',context);assert.equal(node('#gradSummaryPrice').textContent,'1.900.000đ');
context.currentSlug='b';vm.runInContext('updateProfile()',context);assert.equal(node('#gradSummaryPrice').textContent,'2.650.000đ');
context.profiles.b.graduationPrices.ceremony=0;vm.runInContext('syncGradPackage()',context);assert.equal(node('ceremony').textContent,'0đ');assert.equal(node('#gradSummaryPrice').textContent,'450.000đ');
// Exercise the complete schedule script and actual click handler with fake RPC responses.
async function schedule(mode){
 const els=new Map();const get=id=>{if(!els.has(id))els.set(id,{hidden:false,disabled:false,open:false,value:id==='#statusFilter'?'all':'',textContent:'',innerHTML:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn},replaceChildren(){},showModal(){this.open=true},close(){this.open=false},focus(){},querySelector(){return null}});return els.get(id)};
 const items=[{id:'booking:11111111-1111-4111-8111-111111111111',kind:'booking',date:'2026-10-12',slot:'Sáng',title:'Booking',status:'confirmed',revision:2},{id:'event:22222222-2222-4222-8222-222222222222',kind:'manual',date:'2026-10-12',slot:'Chiều',title:'Manual',status:'manual',revision:3}];
 if(mode==='legacy')delete items[0].revision;
 const calls=[];const db={auth:{onAuthStateChange(){}},async rpc(name,args){calls.push({name,args});if(name==='photographer_my_schedule')return {data:{member:{name:'Thợ A'},items}};
 if(mode==='missing')return {error:{code:'PGRST202'}};
 if(mode==='stale')return {error:{message:'SCHEDULE_CHANGED_OR_NOT_ALLOWED'}};
 if(mode==='network')return {error:{message:'Fetch failed'}};
 if(mode==='no-result')return {data:{}};
 return {data:{confirmed_at:'2026-10-12T10:00:00Z'}};}};
 const c=vm.createContext({window:{CheeseAuth:{client:db,guard:async()=>({role:'photographer'})}},document:{querySelector:get,activeElement:null},location:{search:''},URLSearchParams,Intl,Date,console,setInterval(){},queueMicrotask:fn=>Promise.resolve().then(fn)});
 vm.runInContext(fs.readFileSync(path.join(root,'assets/js/photographer/schedule.js'),'utf8'),c);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(get('#pendingCount').textContent,2);
 const open=id=>get('#agenda').listeners.click({target:{closest(){return {dataset:{id}}}}});
 open(items[0].id);await get('#confirmSchedule').listeners.click();
 if(mode==='ok'){
  assert.match(get('#confirmMessage').textContent,/Đã xác nhận\./);assert.equal(items[0].confirmed_at,'2026-10-12T10:00:00Z');assert.equal(get('#pendingCount').textContent,1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1].args)),{p_kind:'booking',p_id:'11111111-1111-4111-8111-111111111111',p_revision:2});
  open(items[1].id);await get('#confirmSchedule').listeners.click();assert.equal(calls.at(-1).args.p_kind,'manual');assert.equal(calls.at(-1).args.p_revision,3);assert.equal(get('#pendingCount').textContent,0);
 }else if(mode==='legacy'||mode==='missing'){
  assert.match(get('#confirmMessage').textContent,/cập nhật cơ sở dữ liệu/);assert.equal(items[0].confirmed_at,undefined);
  if(mode==='legacy')assert.equal(calls.length,1);
 }else if(mode==='stale'){assert.match(get('#confirmMessage').textContent,/Lịch đã thay đổi/);assert.equal(items[0].confirmed_at,undefined)}
 else{assert.match(get('#confirmMessage').textContent,/Chưa gửi được/);assert.equal(get('#confirmSchedule').disabled,false);assert.equal(items[0].confirmed_at,undefined)}
}
(async()=>{for(const mode of ['ok','legacy','missing','stale','network','no-result'])await schedule(mode);console.log('PASS: 18 package/people combinations, both photographer switches, zero prices, and 6 schedule confirmation scenarios.');})().catch(e=>{console.error(e);process.exit(1)});
