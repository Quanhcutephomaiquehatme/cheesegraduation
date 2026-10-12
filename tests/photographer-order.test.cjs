const assert=require('node:assert/strict');
require('../assets/js/shared/photographer-order.js');
const {sorted,move,save}=globalThis.CheesePhotographerOrder;
const rows=[{id:'a',sort_order:0,active:true,name:'A'},{id:'b',sort_order:100,active:false,name:'B'},{id:'c',sort_order:100,active:true,name:'C'}];
const ids=rows=>rows.map(p=>p.id);
(async()=>{
 assert.deepEqual(ids(sorted(rows)),['a','b','c']);
 assert.deepEqual(ids(move(rows,'c','first')),['c','a','b']);
 assert.deepEqual(ids(move(rows,'c','up')),['a','c','b']);
 assert.deepEqual(ids(move(rows,'a','down')),['b','a','c']);
 assert.deepEqual(move(rows,'a','up'),rows);
 assert.deepEqual(move(rows,'c','down'),rows);
 assert.throws(()=>move([],'missing','first'));
 assert.deepEqual(ids(rows),['a','b','c']);
 const reordered=move(rows,'c','first');
 assert.equal(reordered.find(p=>p.id==='b').active,false);
 assert.deepEqual(ids(sorted(reordered).filter(p=>p.active)),['c','a']);
 assert.deepEqual(reordered.map(p=>p.sort_order),[10,20,30]);
 assert.deepEqual(ids(sorted([{id:'b',sort_order:10,created_at:'2026-01-02'},{id:'a',sort_order:10,created_at:'2026-01-01'}])),['a','b']);
 const calls=[];
 function mockDb(reply){
   return {from(table){
     assert.equal(table,'photographers');
     let value, rowId;
     const chain={
       update(payload){assert.deepEqual(Object.keys(payload),['sort_order']);value=payload;return chain},
       eq(key,id){assert.equal(key,'id');rowId=id;return chain},
       async select(){return reply(rowId,value)}
     };
     return chain;
   }};
 }
 const db=mockDb((id,payload)=>{calls.push({id,...payload});return {data:[{id}],error:null}});
 await save(db,rows,reordered);
 assert.deepEqual(calls,reordered.map(({id,sort_order})=>({id,sort_order})));
 calls.length=0;await save(db,reordered,reordered);assert.equal(calls.length,0);
 const failDb=mockDb(()=>({error:new Error('permission denied')}));
 await assert.rejects(save(failDb,rows,reordered),/permission denied/);
 const missingDb=mockDb(()=>({data:[],error:null}));
 await assert.rejects(save(missingDb,rows,reordered),/Không cập nhật/);
 console.log('PASS: priority moves, boundaries, ties, zero rank, hidden rows, persisted order, minimal writes and failure handling');
})().catch(error=>{console.error(error);process.exitCode=1});
