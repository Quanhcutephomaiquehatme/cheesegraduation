// Run: NODE_PATH=<directory containing playwright> node tests/booking-schedule.test.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const profiles = [
 {id:'a',slug:'alpha',name:'Alpha',active:true,team:'Ekip 1',price_amount:2500000,graduation_prices:{ceremony:1800000,pregrad:2600000,'pregrad-plus':3300000},graduation_extra_per_person:0},
 {id:'b',slug:'beta',name:'Beta',active:true,team:'Ekip 2',price_amount:2200000,graduation_prices:{ceremony:2100000,pregrad:2900000,'pregrad-plus':3800000},graduation_extra_per_person:450000}
];
async function pageFor(browser, file, mode='ok') {
 const page=await browser.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({profiles,mode})=>{
  window.testCalls=[];window.testMode=mode;
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const items=[{id:'booking:11111111-1111-4111-8111-111111111111',kind:'booking',date,slot:'Sáng',title:'Khách A',status:'confirmed',revision:2}, {id:'event:22222222-2222-4222-8222-222222222222',kind:'manual',date,slot:'Chiều',title:'Lịch bổ sung',status:'manual',revision:3}, {id:'booking:33333333-3333-4333-8333-333333333333',kind:'booking',date,slot:'Sáng',title:'Đã hủy',status:'cancelled',revision:1}];
  if(mode==='legacy')delete items[0].revision;
  const db={from(table){ const result={data:table==='photographers'?(mode==='empty'?[]:profiles):null,error:null};const q={select(){return q},eq(){return q},order(){return q},maybeSingle(){return Promise.resolve(result)},then(resolve,reject){return Promise.resolve(result).then(resolve,reject)}};return q},
   auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:'crew'}}}})},
   async rpc(name,args){window.testCalls.push({name,args});
    if(name==='photographer_my_schedule')return {data:{member:{name:'Alpha',team:'Ekip 1'},items:JSON.parse(JSON.stringify(items))}};
    if(name==='photographer_confirm_schedule'){
     if(window.testMode==='stale')return {error:{message:'SCHEDULE_CHANGED_OR_NOT_ALLOWED'}};
     if(window.testMode==='network')return {error:{message:'Failed to fetch'}};
     if(window.testMode==='missing')return {error:{code:'PGRST202',message:'Missing function'}};
     const row=items.find(x=>x.id.endsWith(args.p_id));row.confirmed_at='2026-10-12T09:00:00Z';return {data:{confirmed_at:row.confirmed_at}};
    }
    return {data:[]};
   }};
  window.supabase={createClient:()=>db};
  window.CheeseAuth={client:db,guard:async()=>({role:'photographer'})};
 },{profiles,mode});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname!=='cheese.test')return route.fulfill({body:'',contentType:'text/javascript'});
  const relative=decodeURIComponent(url.pathname).replace(/^\//,'');
  if(relative==='config.js')return route.fulfill({body:'window.CHEESE_CONFIG={supabaseUrl:"https://mock.supabase.co",supabaseAnonKey:"mock-key-with-at-least-twenty-characters"}',contentType:'text/javascript'});
  if(relative.endsWith('studio-auth.js')||relative.endsWith('music-player.js'))return route.fulfill({body:'',contentType:'text/javascript'});
  const f=path.join(root,relative);
  if(!fs.existsSync(f))return route.fulfill({status:404,body:''});
  const ext=path.extname(f);return route.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'})[ext]||'application/octet-stream'});
 });
 await page.goto('http://cheese.test/'+file);
 return {page,errors};
}
(async()=>{
 const browser=await chromium.launch({headless:true});let passed=0;
 try{
  const {page,errors}=await pageFor(browser,'lien-he.html?tho=alpha');
  await page.waitForFunction(()=>document.querySelector('#profileName').textContent==='Alpha');
  await page.locator('[data-shoot-type="Tốt nghiệp đại học"]').click();
  assert.equal(await page.locator('[data-grad-package="ceremony"] .grad-price').textContent(),'1.800.000đ');
  await page.locator('#gradPeopleRange').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input'))});
  assert.equal(await page.locator('#gradSummaryPrice').textContent(),'1.800.000đ');passed++;
  await page.locator('#photographerSelect').selectOption('beta');
  assert.equal(await page.locator('[data-grad-package="ceremony"] .grad-price').textContent(),'2.100.000đ');
  assert.equal(await page.locator('#gradSummaryPrice').textContent(),'2.550.000đ');
  assert.match(await page.locator('#messageBox').textContent(),/2\.550\.000đ/);passed++;
  for(const [id,base,max] of [['ceremony',2100000,2],['pregrad',2900000,3],['pregrad-plus',3800000,4]]){
   await page.locator(`[data-grad-package="${id}"]`).click();
   assert.equal(await page.locator('#gradSummaryPrice').textContent(),base.toLocaleString('vi-VN')+'đ');
   await page.locator('#gradPeopleRange').evaluate((el,n)=>{el.value=n;el.dispatchEvent(new Event('input'))},String(max));
   const expected=(base+(max-1)*450000).toLocaleString('vi-VN')+'đ';
   assert.equal(await page.locator('#gradPeoplePrice').textContent(),expected);
   assert.equal(await page.locator('#gradSummaryPrice').textContent(),expected);
   assert.ok((await page.locator('#messageBox').textContent()).includes(expected));passed++;
  }
  await page.locator('#compactSwitchTrigger').click();
  await page.locator('.compact-photographer-option[data-slug="alpha"]').click();
  assert.equal(await page.locator('#gradSummaryPrice').textContent(),'3.300.000đ');
  assert.deepEqual(errors,[]);passed++;await page.close();
  const empty=await pageFor(browser,'lien-he.html','empty');
  await empty.page.waitForFunction(()=>document.querySelector('#gradSummaryPrice').textContent==='Chưa tải được giá');
  assert.deepEqual(empty.errors,[]);passed++;await empty.page.close();
  for(const mode of ['ok','legacy','missing','stale','network']){
   const {page,errors}=await pageFor(browser,'lich-tho.html',mode);
   await page.waitForSelector('.event-card');
   assert.equal(await page.locator('#pendingCount').textContent(),'2');
   await page.locator('#statusFilter').selectOption('pending');
   assert.equal(await page.locator('.event-card').count(),2);
   await page.locator('[data-id="booking:11111111-1111-4111-8111-111111111111"]').click();
   await page.locator('#confirmSchedule').click();
   if(mode==='ok'){
    await page.waitForFunction(()=>document.querySelector('#confirmMessage').textContent.startsWith('Đã xác nhận.'));
    const call=await page.evaluate(()=>window.testCalls.find(x=>x.name==='photographer_confirm_schedule'));
    assert.deepEqual(call.args,{p_kind:'booking',p_id:'11111111-1111-4111-8111-111111111111',p_revision:2});
    await page.locator('#detailDone').click();await page.locator('#refreshButton').click();
    await page.waitForFunction(()=>document.querySelector('#pendingCount').textContent==='1');
    await page.locator('[data-id="event:22222222-2222-4222-8222-222222222222"]').click();await page.locator('#confirmSchedule').click();
    await page.waitForFunction(()=>document.querySelector('#confirmMessage').textContent.startsWith('Đã xác nhận.'));
    const manual=await page.evaluate(()=>window.testCalls.filter(x=>x.name==='photographer_confirm_schedule').at(-1));
    assert.equal(manual.args.p_kind,'manual');assert.equal(manual.args.p_revision,3);
   }else if(mode==='legacy'||mode==='missing'){
    await page.waitForFunction(()=>document.querySelector('#confirmMessage').textContent.includes('cập nhật cơ sở dữ liệu'));
    if(mode==='legacy')assert.equal(await page.evaluate(()=>window.testCalls.filter(x=>x.name==='photographer_confirm_schedule').length),0);
   }else if(mode==='stale'){
    await page.waitForFunction(()=>document.querySelector('#confirmMessage').textContent.includes('Lịch đã thay đổi'));
   }else{
    await page.waitForFunction(()=>document.querySelector('#confirmMessage').textContent.includes('Chưa gửi được'));
    assert.equal(await page.locator('#confirmSchedule').isEnabled(),true);
   }
   assert.deepEqual(errors,[]);passed++;await page.close();
  }
  console.log(`PASS: ${passed} browser regression scenarios (mock Supabase; no production writes).`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
