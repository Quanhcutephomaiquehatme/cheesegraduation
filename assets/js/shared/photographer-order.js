/* One ordering rule for Admin and the public photographer directory. */
(function(root){
  'use strict';
  const rank=p=>Number.isFinite(Number(p.sort_order)) && p.sort_order!=null?Number(p.sort_order):100;
  function sorted(rows){
    return [...rows].sort((a,b)=>rank(a)-rank(b) ||
      String(a.created_at||'').localeCompare(String(b.created_at||'')) ||
      String(a.id||'').localeCompare(String(b.id||'')));
  }
  function move(rows,id,direction){
    const list=sorted(rows);
    const from=list.findIndex(p=>String(p.id)===String(id));
    if(from<0)throw new Error('Thợ này không còn trong danh sách. Hãy tải lại.');
    const to=direction==='first'?0:direction==='up'?Math.max(0,from-1):direction==='down'?Math.min(list.length-1,from+1):from;
    if(to===from)return list;
    const [item]=list.splice(from,1);list.splice(to,0,item);
    return list.map((p,index)=>({...p,sort_order:(index+1)*10}));
  }
  async function save(db,before,after){
    const previous=new Map(before.map(p=>[String(p.id),p.sort_order]));
    for(const p of after){
      if(previous.get(String(p.id))===p.sort_order)continue;
      const {data,error}=await db.from('photographers').update({sort_order:p.sort_order}).eq('id',p.id).select('id');
      if(error)throw error;
      if(!data || data.length!==1)throw new Error('Không cập nhật được thứ tự. Thợ có thể đã bị xóa hoặc bạn chưa có quyền chỉnh sửa.');
    }
  }
  root.CheesePhotographerOrder={sorted,move,save};
})(typeof window!=='undefined'?window:globalThis);
