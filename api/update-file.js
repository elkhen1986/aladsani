export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    let body = req.body;
    if(typeof body==='string'){ try{ body=JSON.parse(body);}catch(e){} }
    const { url, title } = body||{};
    if(!url) return res.status(400).json({error:'No url'});
    // للآن نرجع نجاح - التعديل يتم في الواجهة ويظهر عبر إعادة تحميل files
    return res.status(200).json({ok:true, title:title||'ملف'});
  }catch(e){ return res.status(500).json({error:e.message}); }
}