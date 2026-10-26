const {onDocumentCreated}=require('firebase-functions/v2/firestore');
const admin=require('firebase-admin');
admin.initializeApp();
const db=admin.firestore();

// Troque pela região do seu Firestore (Console > Firestore > aba Dados mostra a localização).
// Ex.: 'us-central1', 'southamerica-east1', 'europe-west1'...
const REGION='us-central1';
const on=document=>({document,region:REGION});

async function send(uid,title,body,tag){
  if(!uid)return;
  const s=await db.doc('tokens/'+uid).get();
  const toks=(s.exists&&s.data().tokens)||[];
  if(!toks.length)return;
  const r=await admin.messaging().sendEachForMulticast({
    tokens:toks,
    data:{title:String(title).slice(0,80),body:String(body).slice(0,160),tag:String(tag||'')},
    webpush:{headers:{Urgency:'high',TTL:'86400'}}
  });
  const bad=[];
  r.responses.forEach((x,i)=>{
    const c=x.error&&x.error.code||'';
    if(!x.success&&/not-registered|invalid-argument|invalid-registration/.test(c))bad.push(toks[i]);
  });
  if(bad.length)await db.doc('tokens/'+uid).update({tokens:admin.firestore.FieldValue.arrayRemove(...bad)});
}
async function nameOf(pid){
  try{const s=await db.doc('ids/'+pid).get();return (s.exists&&s.data().name)||('ID '+pid)}catch(e){return 'ID '+pid}
}
const txt=m=>m.aud?'🎤 Mensagem de voz':String(m.text||'').slice(0,120);

// Mensagem de um amigo
exports.onFriendMsg=onDocumentCreated(on('reqs/{pair}/msgs/{m}'),async ev=>{
  const m=ev.data.data(),r=(await db.doc('reqs/'+ev.params.pair).get()).data();
  if(!r)return;
  const to=m.fromUid===r.fromUid?r.toUid:r.fromUid;
  await send(to,await nameOf(m.from),txt(m),ev.params.pair);
});

// Mensagem em grupo
exports.onGroupMsg=onDocumentCreated(on('groups/{g}/msgs/{m}'),async ev=>{
  const m=ev.data.data(),g=(await db.doc('groups/'+ev.params.g).get()).data();
  if(!g)return;
  const body=(m.name||'?')+': '+txt(m);
  await Promise.all((g.members||[]).filter(u=>u!==m.fromUid).map(u=>send(u,g.name||'Grupo',body,'g'+ev.params.g)));
});

// Pedido de amizade
exports.onFriendReq=onDocumentCreated(on('reqs/{pair}'),async ev=>{
  const r=ev.data.data();
  if(r.status!=='pending')return;
  await send(r.toUid,await nameOf(r.from),'Enviou um pedido de amizade 👥','rq'+ev.params.pair);
});

// Curtidas e downloads dos seus jogos
exports.onGameNotif=onDocumentCreated(on('notifs/{nid}'),async ev=>{
  const x=ev.data.data(),who=(x.byName||'?')+(x.byId?' #'+x.byId:'');
  if(x.type==='like')await send(x.to,'❤️ '+x.title,who+' curtiu o seu jogo','n'+ev.params.nid);
  else if(x.type==='dl')await send(x.to,'⬇️ '+x.title,who+' baixou o seu jogo','n'+ev.params.nid);
});
