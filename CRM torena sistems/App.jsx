import { useState, useEffect, useRef } from "react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#0d1117",surface:"#161b22",card:"#1c2128",border:"#30363d",
  accent:"#4f8ef7",accentDim:"#1a2f6a",
  green:"#3fb950",greenDim:"#1a3a20",red:"#f85149",redDim:"#3d1c1a",
  amber:"#d29922",amberDim:"#3a2a10",purple:"#a371f7",teal:"#2dd4bf",
  text:"#e6edf3",muted:"#7d8590",faint:"#21262d",
};
const CHANNELS={
  whatsapp:{label:"WhatsApp",color:"#25d366",icon:"W"},
  telegram:{label:"Telegram",color:"#229ed9",icon:"T"},
  max:{label:"MAX",color:"#ff6b35",icon:"M"},
  avito:{label:"Авито",color:"#00aaff",icon:"A"},
  instagram:{label:"Instagram",color:"#e1306c",icon:"I"},
  vk:{label:"ВКонтакте",color:"#4680c2",icon:"V"},
  youtube:{label:"YouTube",color:"#ff0000",icon:"Y"},
};
const STAGES=["Новый","Переговоры","КП отправлено","Закрыт"];
const SITE_COLORS=["#4f8ef7","#3fb950","#a371f7","#d29922","#e1306c","#ff6b35","#2dd4bf"];
const MGR_COLORS=["#4f8ef7","#3fb950","#a371f7","#d29922","#e1306c","#ff6b35","#229ed9","#f85149","#2dd4bf","#94d82d"];
const DISC_TEMPLATES={
  ru:"Уважаемый клиент, обращаем ваше внимание, что данный разговор записывается в целях контроля качества обслуживания.",
  en:"Dear customer, please be advised that this call is being recorded for quality assurance purposes.",
  short:"Звонок записывается.",
};
const css=`
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;scrollbar-width:thin;scrollbar-color:#30363d transparent}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#30363d;border-radius:4px}
body{background:${C.bg};color:${C.text};font-family:'Syne',sans-serif;font-size:13px;line-height:1.5}
input,textarea,select{background:${C.surface};color:${C.text};border:1px solid ${C.border};border-radius:6px;padding:7px 11px;font-family:'Syne',sans-serif;font-size:13px;outline:none;width:100%;transition:border .15s}
input:focus,textarea:focus,select:focus{border-color:${C.accent}}
input[type=range]{padding:0;background:transparent;border:none;accent-color:${C.accent}}
input[type=checkbox],input[type=radio]{width:15px;height:15px;cursor:pointer;accent-color:${C.accent};flex-shrink:0}
button{font-family:'Syne',sans-serif;font-size:13px;cursor:pointer;border:none;transition:all .15s}
@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.ani{animation:fadeIn .18s ease}
.mono{font-family:'IBM Plex Mono',monospace;font-size:11px}
.blink{animation:blink 1.5s ease infinite}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid=()=>Math.random().toString(36).slice(2,10);
const fmt=d=>new Date(d).toLocaleString("ru-RU",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const fmtDate=d=>new Date(d).toLocaleDateString("ru-RU",{day:"2-digit",month:"short",year:"numeric"});
const fmtDur=s=>s?`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`:"—";
const initials=n=>(n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const ACOLORS=["#4f8ef7","#3fb950","#d29922","#a371f7","#e1306c","#ff6b35","#229ed9"];
const avatarColor=n=>ACOLORS[(n||"?").charCodeAt(0)%ACOLORS.length];
const load=async k=>{try{const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}catch{return null;}};
const save=async(k,v)=>{try{await window.storage.set(k,JSON.stringify(v));}catch{}};

// ── Seed ──────────────────────────────────────────────────────────────────────
const SM=[
  {id:"m1",name:"Алексей Морозов",email:"morozov@crm.ru",role:"admin",color:"#4f8ef7"},
  {id:"m2",name:"Светлана Петрова",email:"petrova@crm.ru",role:"manager",color:"#3fb950"},
  {id:"m3",name:"Иван Соколов",email:"sokolov@crm.ru",role:"manager",color:"#a371f7"},
];
const SS=[
  {id:"s1",name:"Главный сайт",domain:"mysite.ru",color:"#4f8ef7",active:true,apiKey:"sk_live_"+uid(),
   recording:{enabled:true,disclaimerEnabled:true,disclaimerText:DISC_TEMPLATES.ru,disclaimerVoice:true,disclaimerVoiceGender:"female",disclaimerVoiceDelay:3,disclaimerShowInChat:true},
   channels:["whatsapp","telegram","avito"],assignedManagers:["m1","m2"],stats:{calls:142,messages:387,leads:24},createdAt:Date.now()-86400000*30},
  {id:"s2",name:"Интернет-магазин",domain:"shop.mysite.ru",color:"#3fb950",active:true,apiKey:"sk_live_"+uid(),
   recording:{enabled:true,disclaimerEnabled:true,disclaimerText:DISC_TEMPLATES.short,disclaimerVoice:false,disclaimerVoiceGender:"male",disclaimerVoiceDelay:0,disclaimerShowInChat:true},
   channels:["whatsapp","instagram","vk"],assignedManagers:["m2","m3"],stats:{calls:89,messages:210,leads:15},createdAt:Date.now()-86400000*10},
  {id:"s3",name:"Лендинг акции",domain:"promo.mysite.ru",color:"#a371f7",active:false,apiKey:"sk_live_"+uid(),
   recording:{enabled:false,disclaimerEnabled:false,disclaimerText:DISC_TEMPLATES.ru,disclaimerVoice:false,disclaimerVoiceGender:"female",disclaimerVoiceDelay:0,disclaimerShowInChat:false},
   channels:["telegram"],assignedManagers:["m1"],stats:{calls:12,messages:45,leads:3},createdAt:Date.now()-86400000*5},
];
const SC=[
  {id:"c1",name:"Анна Иванова",phone:"+7 916 234-56-78",email:"ivanova@alpha.ru",company:"ООО Альфа",status:"client",tags:["VIP"],managerId:"m1",siteId:"s1",createdAt:Date.now()-86400000*5},
  {id:"c2",name:"Михаил Соколов",phone:"+7 903 111-22-33",email:"m.sokolov@mail.ru",company:"ИП Соколов",status:"lead",tags:["Демо"],managerId:"m2",siteId:"s2",createdAt:Date.now()-86400000*2},
  {id:"c3",name:"Екатерина Лебедева",phone:"+7 926 555-44-33",email:"lebed@stroy.ru",company:"СтройТех",status:"lead",tags:["Тендер"],managerId:"m1",siteId:"s1",createdAt:Date.now()-86400000},
  {id:"c4",name:"Дмитрий Козлов",phone:"+7 985 678-90-12",email:"kozlov@media.ru",company:"МедиаГрупп",status:"lost",tags:[],managerId:"m3",siteId:"s3",createdAt:Date.now()-86400000*10},
  {id:"c5",name:"Ольга Смирнова",phone:"+7 912 345-67-89",email:"smirnova@tech.ru",company:"ТехноСтарт",status:"lead",tags:["Горячий"],managerId:"m2",siteId:"s2",createdAt:Date.now()-3600000*3},
];
const SCL=[
  {id:"cl1",contactId:"c1",managerId:"m1",siteId:"s1",direction:"inbound",status:"completed",phoneFrom:"+7 916 234-56-78",phoneTo:"+7 800 555-00-00",durationSec:374,disclaimerPlayed:true,transcript:"[🔴 Предупреждение]: Уважаемый клиент, данный разговор записывается в целях контроля качества обслуживания.\n\n— Добрый день! Хочу узнать о тарифе Pro.\n— Здравствуйте, Анна! Тариф Pro включает...",summary:"Тариф Pro · реквизиты до пт",startedAt:Date.now()-3600000*2},
  {id:"cl2",contactId:"c2",managerId:"m2",siteId:"s2",direction:"outbound",status:"completed",phoneFrom:"+7 800 555-00-00",phoneTo:"+7 903 111-22-33",durationSec:125,disclaimerPlayed:true,transcript:"[🔴 Предупреждение]: Звонок записывается.\n\n— Михаил, добрый день! Согласовали встречу 28 мая в 11:00.\n— Отлично, жду.",summary:"Встреча 28 мая 11:00",startedAt:Date.now()-3600000*4},
  {id:"cl3",contactId:null,managerId:"m1",siteId:"s1",direction:"inbound",status:"missed",phoneFrom:"+7 495 000-11-22",phoneTo:"+7 800 555-00-00",durationSec:0,disclaimerPlayed:false,transcript:null,summary:null,startedAt:Date.now()-3600000*5},
  {id:"cl4",contactId:"c3",managerId:"m1",siteId:"s1",direction:"inbound",status:"completed",phoneFrom:"+7 926 555-44-33",phoneTo:"+7 800 555-00-00",durationSec:697,disclaimerPlayed:true,transcript:"[🔴 Предупреждение]: Уважаемый клиент, данный разговор записывается...\n\n— Обсудили поставку оборудования. Счёт 340 000 руб.",summary:"Счёт 340к · подтверждение до пт",startedAt:Date.now()-3600000*7},
  {id:"cl5",contactId:"c5",managerId:"m2",siteId:"s2",direction:"outbound",status:"busy",phoneFrom:"+7 800 555-00-00",phoneTo:"+7 912 345-67-89",durationSec:0,disclaimerPlayed:false,transcript:null,summary:null,startedAt:Date.now()-3600000*9},
];
const SMS=[
  {id:"ms1",contactId:"c1",channel:"whatsapp",managerId:"m1",siteId:"s1",text:"Добрый день! Хочу узнать о тарифе Pro подробнее",incoming:true,read:false,createdAt:Date.now()-3600000},
  {id:"ms2",contactId:"c1",channel:"whatsapp",managerId:"m1",siteId:"s1",text:"🔴 Уважаемый клиент, данный чат записывается в целях контроля качества.\n\nЗдравствуйте, Анна! Тариф Pro включает всё что нужно...",incoming:false,read:true,createdAt:Date.now()-3600000*.8},
  {id:"ms3",contactId:"c2",channel:"telegram",managerId:"m2",siteId:"s2",text:"Скиньте реквизиты для оплаты пожалуйста",incoming:true,read:false,createdAt:Date.now()-1800000},
  {id:"ms4",contactId:"c3",channel:"avito",managerId:"m1",siteId:"s1",text:"Интересует ваше предложение по тендеру #45678",incoming:true,read:true,createdAt:Date.now()-7200000},
  {id:"ms5",contactId:"c5",channel:"instagram",managerId:"m2",siteId:"s2",text:"Привет, увидела рекламу, хочу узнать цены",incoming:true,read:false,createdAt:Date.now()-900000},
  {id:"ms6",contactId:"c4",channel:"vk",managerId:"m3",siteId:"s3",text:"Ваше предложение неактуально, спасибо",incoming:true,read:true,createdAt:Date.now()-86400000},
  {id:"ms7",contactId:"c1",channel:"telegram",managerId:"m1",siteId:"s1",text:"Можете добавить меня в телеграм?",incoming:true,read:false,createdAt:Date.now()-600000},
];
const SD=[
  {id:"d1",title:"Тариф Pro · Альфа",contactId:"c1",managerId:"m1",siteId:"s1",amount:48000,stage:"Переговоры",createdAt:Date.now()-86400000*2},
  {id:"d2",title:"Поставка · СтройТех",contactId:"c3",managerId:"m1",siteId:"s1",amount:340000,stage:"КП отправлено",createdAt:Date.now()-86400000},
  {id:"d3",title:"Демо · ИП Соколов",contactId:"c2",managerId:"m2",siteId:"s2",amount:12000,stage:"Новый",createdAt:Date.now()-3600000*5},
  {id:"d4",title:"Реклама · ТехноСтарт",contactId:"c5",managerId:"m2",siteId:"s2",amount:85000,stage:"Новый",createdAt:Date.now()-3600000*3},
];
const STK=[
  {id:"t1",title:"Перезвонить Соколову",contactId:"c2",managerId:"m2",dueAt:Date.now()+86400000,done:false,createdAt:Date.now()-3600000*2},
  {id:"t2",title:"Отправить КП Ивановой",contactId:"c1",managerId:"m1",dueAt:Date.now()+3600000*3,done:false,createdAt:Date.now()-3600000},
  {id:"t3",title:"Уточнить тендер Лебедевой",contactId:"c3",managerId:"m1",dueAt:Date.now()+3600000*8,done:false,createdAt:Date.now()-1800000},
  {id:"t4",title:"Прислать прайс Смирновой",contactId:"c5",managerId:"m2",dueAt:Date.now()-3600000,done:false,createdAt:Date.now()-7200000},
  {id:"t5",title:"Согласовать счёт",contactId:"c3",managerId:"m1",dueAt:Date.now()-86400000,done:true,createdAt:Date.now()-86400000*2},
];

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Avatar({name,size=32,color}){
  const bg=color||avatarColor(name||"?");
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg+"28",border:`1px solid ${bg}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.33,fontWeight:600,color:bg,flexShrink:0}}>{initials(name)}</div>;
}
function ChIcon({ch,size=18}){
  const c=CHANNELS[ch];if(!c)return null;
  return <div title={c.label} style={{width:size,height:size,borderRadius:4,background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.56,fontWeight:700,color:"#fff",flexShrink:0,fontFamily:"Arial,sans-serif"}}>{c.icon}</div>;
}
function Badge({label,color=C.accent,small}){
  return <span style={{fontSize:small?10:11,padding:small?"1px 6px":"2px 8px",borderRadius:20,background:color+"22",color,border:`1px solid ${color}44`,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
}
function Btn({children,onClick,primary,danger,small,style:sx,disabled}){
  const bg=primary?C.accent:danger?C.red:"transparent";
  const col=(primary||danger)?"#fff":C.text;
  const brd=primary?C.accent:danger?C.red:C.border;
  return <button onClick={onClick} disabled={disabled}
    style={{background:bg,color:col,border:`1px solid ${brd}`,borderRadius:7,padding:small?"5px 10px":"8px 14px",fontSize:small?12:13,display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?.4:1,...sx}}
    onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".8"}}
    onMouseLeave={e=>{e.currentTarget.style.opacity="1"}}>{children}</button>;
}
function Toggle({checked,onChange,label,sub}){
  return <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}>
    <div onClick={onChange} style={{width:40,height:22,borderRadius:11,background:checked?C.accent:C.border,position:"relative",flexShrink:0,transition:"background .2s",marginTop:2,cursor:"pointer"}}>
      <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:checked?21:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.4)"}}/>
    </div>
    <div><div style={{fontWeight:500,fontSize:13}}>{label}</div>{sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}</div>
  </label>;
}
function Fld({label,children,hint}){
  return <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<label style={{fontSize:10,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:".06em"}}>{label}</label>}
    {children}
    {hint&&<div style={{fontSize:11,color:C.muted}}>{hint}</div>}
  </div>;
}
function Modal({title,onClose,children,width=500}){
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
    <div className="ani" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,width,maxWidth:"96vw",maxHeight:"88vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontSize:15,fontWeight:600}}>{title}</span>
        <button onClick={onClose} style={{background:"none",color:C.muted,fontSize:22,lineHeight:1}}>×</button>
      </div>
      {children}
    </div>
  </div>;
}
function MgrBadge({managerId,managers}){
  const m=managers.find(x=>x.id===managerId);if(!m)return null;
  return <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:m.color+"22",color:m.color,border:`1px solid ${m.color}44`,fontWeight:500,whiteSpace:"nowrap"}}>{m.name.split(" ")[0]}</span>;
}
function SiteBadge({siteId,sites}){
  const s=sites.find(x=>x.id===siteId);if(!s)return null;
  return <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:s.color+"22",color:s.color,border:`1px solid ${s.color}44`,fontWeight:500,whiteSpace:"nowrap"}}>◆ {s.name}</span>;
}
function RecDot({on}){
  return on?<div className="blink" title="Запись ведётся" style={{width:7,height:7,borderRadius:"50%",background:C.red,flexShrink:0}}/>:null;
}

// ── AudioPlayer ───────────────────────────────────────────────────────────────
function AudioPlayer({durationSec}){
  const[playing,setPlaying]=useState(false);
  const[progress,setProgress]=useState(0);
  const tmr=useRef(null);
  const bars=useRef(Array.from({length:50},()=>Math.floor(Math.random()*22)+6));
  useEffect(()=>{
    if(playing){tmr.current=setInterval(()=>setProgress(p=>{if(p>=1){clearInterval(tmr.current);setPlaying(false);return 1;}return p+1/durationSec;}),1000);}
    else clearInterval(tmr.current);
    return()=>clearInterval(tmr.current);
  },[playing,durationSec]);
  const elapsed=Math.floor(progress*durationSec);
  return <div style={{background:C.surface,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
    <div style={{display:"flex",alignItems:"flex-end",gap:2,height:34,marginBottom:10,cursor:"pointer"}}
      onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setProgress(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)));}}>
      {bars.current.map((h,i)=><div key={i} style={{flex:1,height:h,borderRadius:2,background:i<progress*50?C.accent:C.border,transition:"background .08s"}}/>)}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <button onClick={()=>setPlaying(p=>!p)} style={{width:28,height:28,borderRadius:"50%",background:C.accent,color:"#fff",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{playing?"⏸":"▶"}</button>
      <span className="mono" style={{color:C.muted}}>{fmtDur(elapsed)} / {fmtDur(durationSec)}</span>
      <div style={{flex:1}}/>
      <span style={{fontSize:11,color:C.muted}}>mp3</span>
    </div>
  </div>;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV=[
  {id:"dashboard",label:"Дашборд",ic:"⊞"},
  {id:"sites",label:"Сайты",ic:"◫"},
  {id:"inbox",label:"Входящие",ic:"✉"},
  {id:"calls",label:"Звонки",ic:"✆"},
  {id:"contacts",label:"Контакты",ic:"◈"},
  {id:"deals",label:"Сделки",ic:"◇"},
  {id:"tasks",label:"Задачи",ic:"☑"},
  {id:"team",label:"Команда",ic:"◉"},
];
function Sidebar({page,setPage,unread,missed,overdueTasksCount,sites,currentManager}){
  return <div style={{width:195,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
    <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:15,fontWeight:700,color:C.accent}}>МояCRM</div>
      <div style={{fontSize:10,color:C.muted,marginTop:1}}>{sites.filter(s=>s.active).length} сайта активно</div>
    </div>
    <nav style={{padding:"6px 0",flex:1,overflowY:"auto"}}>
      {NAV.map(n=>{
        const active=page===n.id;
        const badge=n.id==="inbox"?unread:n.id==="calls"?missed:n.id==="tasks"?overdueTasksCount:0;
        return <div key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 14px",cursor:"pointer",color:active?C.accent:C.muted,background:active?C.accentDim+"38":"transparent",borderLeft:`2px solid ${active?C.accent:"transparent"}`,transition:"all .12s",fontWeight:active?600:400}}
          onMouseEnter={e=>{if(!active){e.currentTarget.style.color=C.text;e.currentTarget.style.background=C.faint;}}}
          onMouseLeave={e=>{if(!active){e.currentTarget.style.color=C.muted;e.currentTarget.style.background="transparent";}}}>
          <span style={{fontSize:14}}>{n.ic}</span>
          <span style={{fontSize:13}}>{n.label}</span>
          {badge>0&&<span style={{marginLeft:"auto",background:n.id==="calls"?C.red:n.id==="tasks"?C.amber:C.accent,color:"#fff",borderRadius:10,fontSize:10,padding:"1px 6px",fontWeight:700}}>{badge}</span>}
        </div>;
      })}
    </nav>
    {/* Sites mini */}
    <div style={{padding:"8px 14px",borderTop:`1px solid ${C.border}`}}>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:7}}>Сайты</div>
      {sites.slice(0,3).map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:s.active?s.color:C.muted,flexShrink:0}}/>
        <div style={{fontSize:11,color:s.active?C.text:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{s.name}</div>
        {s.recording.enabled&&<div className="blink" style={{width:5,height:5,borderRadius:"50%",background:C.red}}/>}
      </div>)}
    </div>
    <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Avatar name={currentManager?.name||"?"} size={26} color={currentManager?.color}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentManager?.name?.split(" ")[0]||"—"}</div>
          <div style={{fontSize:10,color:C.muted}}>{currentManager?.role==="admin"?"Администратор":"Менеджер"}</div>
        </div>
      </div>
    </div>
  </div>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({calls,contacts,messages,deals,tasks,managers,sites,setPage}){
  const unread=messages.filter(m=>m.incoming&&!m.read).length;
  const missed=calls.filter(c=>c.status==="missed").length;
  const overdue=tasks.filter(t=>!t.done&&t.dueAt&&t.dueAt<Date.now()).length;
  const noDiscl=sites.filter(s=>s.recording.enabled&&!s.recording.disclaimerEnabled);
  const pipeline=deals.filter(d=>d.stage!=="Закрыт").reduce((s,d)=>s+d.amount,0);

  const Stat=({label,val,sub,color,onClick})=><div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,cursor:onClick?"pointer":"default"}}
    onMouseEnter={e=>{if(onClick)e.currentTarget.style.borderColor=C.accent;}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{label}</div>
    <div style={{fontSize:24,fontWeight:700,color:color||C.text}}>{val}</div>
    {sub&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{sub}</div>}
  </div>;

  return <div className="ani" style={{padding:20,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
    {noDiscl.length>0&&<div style={{background:"#2a1a00",border:`1px solid ${C.amber}55`,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
      <span style={{fontSize:20,flexShrink:0}}>⚠️</span>
      <div>
        <div style={{fontWeight:600,color:C.amber,marginBottom:3}}>Запись без предупреждения клиента!</div>
        <div style={{fontSize:12,color:C.muted}}><b style={{color:C.text}}>{noDiscl.map(s=>s.name).join(", ")}</b> — запись включена, но уведомление отключено. Нарушение ст. 23 Конституции РФ и ФЗ-149.</div>
      </div>
      <Btn small onClick={()=>setPage("sites")} style={{flexShrink:0}}>Исправить</Btn>
    </div>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10}}>
      <Stat label="Сайты" val={sites.filter(s=>s.active).length} sub={`из ${sites.length} подключено`} onClick={()=>setPage("sites")}/>
      <Stat label="Непрочитанных" val={unread} color={unread>0?C.accent:C.muted} sub="сообщений" onClick={()=>setPage("inbox")}/>
      <Stat label="Пропущено" val={missed} color={missed>0?C.red:C.muted} sub="звонков" onClick={()=>setPage("calls")}/>
      <Stat label="Просрочено" val={overdue} color={overdue>0?C.amber:C.muted} sub="задач" onClick={()=>setPage("tasks")}/>
    </div>

    {/* Sites activity */}
    <div>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Активность по сайтам</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {sites.map(s=>{
          const sCalls=calls.filter(c=>c.siteId===s.id).length;
          const sMsgs=messages.filter(m=>m.siteId===s.id).length;
          const sLeads=contacts.filter(c=>c.siteId===s.id&&c.status==="lead").length;
          return <div key={s.id} style={{background:C.card,border:`1px solid ${s.active?s.color+"44":C.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:s.active?s.color:C.muted,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:500,fontSize:13}}>{s.name}</div>
              <div className="mono" style={{color:C.muted,marginTop:1}}>{s.domain}</div>
            </div>
            <div style={{display:"flex",gap:4}}>{(s.channels||[]).map(ch=><ChIcon key={ch} ch={ch} size={15}/>)}</div>
            <div style={{fontSize:11,color:C.muted,textAlign:"right"}}>
              <div>{sCalls} зв. · {sMsgs} сообщ. · {sLeads} лидов</div>
            </div>
            {s.recording.enabled&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.red,padding:"2px 7px",background:"#1a0a0a",borderRadius:20,border:`1px solid ${C.red}44`}}>
              <RecDot on/>{s.recording.disclaimerEnabled?"REC":"REC ⚠️"}
            </div>}
            {!s.active&&<Badge label="Откл." color={C.muted} small/>}
          </div>;
        })}
      </div>
    </div>

    {/* Managers load */}
    <div>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Нагрузка менеджеров</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
        {managers.map(m=>{
          const mCalls=calls.filter(c=>c.managerId===m.id).length;
          const mUnread=messages.filter(ms=>ms.managerId===m.id&&ms.incoming&&!ms.read).length;
          const mDeals=deals.filter(d=>d.managerId===m.id&&d.stage!=="Закрыт").length;
          return <div key={m.id} style={{background:C.card,borderRadius:10,padding:"10px 13px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
            <Avatar name={m.name} size={34} color={m.color}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{mDeals} сделок · {mCalls} зв. {mUnread>0&&<span style={{color:C.accent}}>· {mUnread} новых</span>}</div>
            </div>
          </div>;
        })}
      </div>
    </div>

    {/* Pipeline */}
    <div>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Воронка · {pipeline.toLocaleString()} ₽ в работе</div>
      <div style={{display:"flex",gap:6}}>
        {STAGES.map(st=>{
          const cnt=deals.filter(d=>d.stage===st).length;
          const sum=deals.filter(d=>d.stage===st).reduce((s,d)=>s+d.amount,0);
          const color={Новый:C.muted,Переговоры:C.accent,"КП отправлено":C.amber,Закрыт:C.green}[st]||C.muted;
          return <div key={st} style={{flex:1,background:C.card,borderRadius:9,padding:"10px 12px",border:`1px solid ${color}44`}}>
            <div style={{fontSize:11,color:color,fontWeight:500,marginBottom:4}}>{st}</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text}}>{cnt}</div>
            <div style={{fontSize:11,color:C.muted}}>{sum>0?sum.toLocaleString()+" ₽":"—"}</div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

// ── Sites ─────────────────────────────────────────────────────────────────────
function SiteModal({initial,managers,onSave,onClose}){
  const blank={name:"",domain:"",color:SITE_COLORS[0],active:true,recording:{enabled:false,disclaimerEnabled:false,disclaimerText:DISC_TEMPLATES.ru,disclaimerVoice:false,disclaimerVoiceGender:"female",disclaimerVoiceDelay:0,disclaimerShowInChat:true},channels:[],assignedManagers:[]};
  const [form,setForm]=useState(initial?JSON.parse(JSON.stringify(initial)):{...blank});
  const [tab,setTab]=useState("general");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setR=(k,v)=>setForm(f=>({...f,recording:{...f.recording,[k]:v}}));
  const togCh=ch=>set("channels",form.channels.includes(ch)?form.channels.filter(x=>x!==ch):[...form.channels,ch]);
  const togMgr=id=>set("assignedManagers",form.assignedManagers.includes(id)?form.assignedManagers.filter(x=>x!==id):[...form.assignedManagers,id]);
  const TABS=["general","recording","channels","managers"];
  const TLABELS={general:"Основное",recording:"Запись",channels:"Каналы",managers:"Менеджеры"};
  return <Modal title={initial?"Настройки сайта":"Новый сайт"} onClose={onClose} width={560}>
    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:`1px solid ${C.border}`,paddingBottom:0}}>
      {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",background:"none",color:tab===t?C.accent:C.muted,borderBottom:`2px solid ${tab===t?C.accent:"transparent"}`,borderTop:"none",borderLeft:"none",borderRight:"none",borderRadius:0,fontWeight:tab===t?600:400,marginBottom:-1,fontSize:13}}>{TLABELS[t]}</button>)}
    </div>

    {tab==="general"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Fld label="Название *"><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Главный сайт"/></Fld>
      <Fld label="Домен *" hint="Используется для идентификации источника лида"><input value={form.domain} onChange={e=>set("domain",e.target.value)} placeholder="mysite.ru"/></Fld>
      <Fld label="Цвет в CRM"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{SITE_COLORS.map(col=><div key={col} onClick={()=>set("color",col)} style={{width:28,height:28,borderRadius:"50%",background:col,cursor:"pointer",border:`3px solid ${form.color===col?"#fff":"transparent"}`,transition:"all .12s"}}/>)}</div></Fld>
      <Toggle checked={form.active} onChange={()=>set("active",!form.active)} label="Сайт активен" sub="Принимать обращения с этого сайта"/>
      {initial?.apiKey&&<Fld label="API ключ"><div style={{display:"flex",gap:8}}><input readOnly value={form.apiKey} className="mono" style={{color:C.muted}}/><Btn small onClick={()=>navigator.clipboard?.writeText(form.apiKey)}>⎘</Btn></div></Fld>}
    </div>}

    {tab==="recording"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{border:`1px solid ${form.recording.enabled?C.green+"44":C.border}`,borderRadius:12,padding:14,background:form.recording.enabled?"#0d1f0d":"transparent",transition:"all .3s"}}>
        <Toggle checked={form.recording.enabled} onChange={()=>setR("enabled",!form.recording.enabled)} label="🔴 Запись звонков" sub="Все звонки с этого сайта будут записываться и храниться в MinIO/S3"/>
      </div>

      {form.recording.enabled&&<>
        <div style={{border:`1px solid ${form.recording.disclaimerEnabled?C.red+"44":C.border}`,borderRadius:12,padding:14,background:form.recording.disclaimerEnabled?"#1a0a0a":"transparent",transition:"all .3s"}}>
          <Toggle checked={form.recording.disclaimerEnabled} onChange={()=>setR("disclaimerEnabled",!form.recording.disclaimerEnabled)} label="⚠️ Предупреждение о записи" sub="Клиент будет уведомлён в начале разговора (требование закона)"/>
        </div>

        {form.recording.disclaimerEnabled&&<div style={{background:C.surface,borderRadius:12,padding:16,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:14}}>
          <Fld label="Текст предупреждения">
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              {Object.entries({ru:"RU стандарт",en:"EN стандарт",short:"Краткий"}).map(([k,l])=>(
                <Btn key={k} small onClick={()=>setR("disclaimerText",DISC_TEMPLATES[k])}>{l}</Btn>
              ))}
            </div>
            <textarea value={form.recording.disclaimerText} onChange={e=>setR("disclaimerText",e.target.value)} rows={3}
              style={{background:C.card,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontFamily:"Syne,sans-serif",fontSize:13,resize:"vertical",width:"100%"}}/>
          </Fld>

          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14}}>
            <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:12}}>📞 Голосовое (для звонков)</div>
            <Toggle checked={form.recording.disclaimerVoice} onChange={()=>setR("disclaimerVoice",!form.recording.disclaimerVoice)} label="🔊 Озвучить предупреждение" sub="TTS произносит текст до соединения с менеджером (Yandex SpeechKit / Google TTS)"/>
            {form.recording.disclaimerVoice&&<div style={{marginTop:14,display:"flex",flexDirection:"column",gap:12}}>
              <Fld label="Голос">
                <div style={{display:"flex",gap:16}}>
                  {[["female","Женский 👩"],["male","Мужской 👨"]].map(([v,l])=>(
                    <label key={v} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                      <input type="radio" name="voice" checked={form.recording.disclaimerVoiceGender===v} onChange={()=>setR("disclaimerVoiceGender",v)}/>{l}
                    </label>
                  ))}
                </div>
              </Fld>
              <Fld label={`Задержка соединения: ${form.recording.disclaimerVoiceDelay} сек`} hint="Менеджер услышит клиента только после озвучки предупреждения">
                <input type="range" min={0} max={10} value={form.recording.disclaimerVoiceDelay} onChange={e=>setR("disclaimerVoiceDelay",+e.target.value)}/>
              </Fld>
            </div>}
          </div>

          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14}}>
            <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:12}}>💬 В мессенджерах</div>
            <Toggle checked={form.recording.disclaimerShowInChat} onChange={()=>setR("disclaimerShowInChat",!form.recording.disclaimerShowInChat)} label="Показать в начале переписки" sub="Первое сообщение менеджера будет содержать уведомление о записи"/>
          </div>

          {/* Preview */}
          <div style={{background:"#1a0a0a",border:`1px solid ${C.red}44`,borderRadius:10,padding:12}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <RecDot on/>
              <span style={{color:C.red,fontSize:11,fontWeight:600}}>Предпросмотр предупреждения</span>
            </div>
            {form.recording.disclaimerVoice&&<div style={{background:C.surface,borderRadius:7,padding:"6px 10px",fontSize:11,color:C.muted,marginBottom:6,display:"flex",gap:6,alignItems:"center"}}>
              <span>🔊</span><span>Голос: <b style={{color:C.text}}>{form.recording.disclaimerVoiceGender==="female"?"Женский":"Мужской"}</b> · Задержка <b style={{color:C.text}}>{form.recording.disclaimerVoiceDelay} сек</b></span>
            </div>}
            {form.recording.disclaimerShowInChat&&<div style={{background:C.surface,borderRadius:7,padding:"6px 10px",fontSize:12,color:C.text,fontStyle:"italic",lineHeight:1.6}}>
              🔴 {form.recording.disclaimerText||"Текст предупреждения..."}
            </div>}
          </div>
        </div>}
      </>}
    </div>}

    {tab==="channels"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Каналы связи для этого сайта:</div>
      {Object.entries(CHANNELS).map(([ch,cfg])=>(
        <label key={ch} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:form.channels.includes(ch)?cfg.color+"18":C.surface,border:`1px solid ${form.channels.includes(ch)?cfg.color+"55":C.border}`,borderRadius:9,cursor:"pointer",transition:"all .15s"}}>
          <input type="checkbox" checked={form.channels.includes(ch)} onChange={()=>togCh(ch)}/>
          <ChIcon ch={ch} size={22}/>
          <div style={{flex:1}}><div style={{fontWeight:500}}>{cfg.label}</div><div style={{fontSize:11,color:C.muted}}>API интеграция</div></div>
          {form.channels.includes(ch)&&<Badge label="Активен" color={cfg.color} small/>}
        </label>
      ))}
    </div>}

    {tab==="managers"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Менеджеры, обрабатывающие этот сайт:</div>
      {managers.map(m=>(
        <label key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:form.assignedManagers.includes(m.id)?m.color+"18":C.surface,border:`1px solid ${form.assignedManagers.includes(m.id)?m.color+"55":C.border}`,borderRadius:9,cursor:"pointer",transition:"all .15s"}}>
          <input type="checkbox" checked={form.assignedManagers.includes(m.id)} onChange={()=>togMgr(m.id)}/>
          <Avatar name={m.name} size={34} color={m.color}/>
          <div style={{flex:1}}><div style={{fontWeight:500}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.email}</div></div>
          {form.assignedManagers.includes(m.id)&&<Badge label="Назначен" color={m.color} small/>}
        </label>
      ))}
    </div>}

    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
      <Btn onClick={onClose}>Отмена</Btn>
      <Btn primary onClick={()=>{if(!form.name||!form.domain)return;onSave(form);}}>Сохранить</Btn>
    </div>
  </Modal>;
}

function Sites({sites,managers,onAdd,onEdit,onDelete,onToggle}){
  return <div style={{padding:20,flex:1,overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><div style={{fontWeight:600,fontSize:15}}>Подключённые сайты</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{sites.filter(s=>s.active).length} активных · {sites.length} всего</div></div>
      <Btn primary onClick={onAdd}>+ Добавить сайт</Btn>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14,marginBottom:24}}>
      {sites.map(s=>{
        const aMgrs=managers.filter(m=>s.assignedManagers?.includes(m.id));
        return <div key={s.id} style={{background:C.card,border:`1px solid ${s.active?s.color+"44":C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:s.active?s.color+"12":"transparent"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:s.active?s.color:C.muted,boxShadow:s.active?`0 0 8px ${s.color}88`:"none",flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14}}>{s.name}</div>
              <div className="mono" style={{color:C.muted}}>{s.domain}</div>
            </div>
            <Toggle checked={s.active} onChange={()=>onToggle(s.id)} label="" sub=""/>
          </div>
          <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {[["Звонков",s.stats?.calls||0,C.text],["Сообщ.",s.stats?.messages||0,C.text],["Лидов",s.stats?.leads||0,C.green]].map(([l,v,col])=>(
                <div key={l} style={{background:C.surface,borderRadius:8,padding:"7px 8px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:col}}>{v}</div><div style={{fontSize:10,color:C.muted}}>{l}</div></div>
              ))}
            </div>
            {/* Recording status */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:s.recording.enabled?"#1a0a0a":C.surface,border:`1px solid ${s.recording.enabled?C.red+"44":C.border}`}}>
              {s.recording.enabled?<>
                <RecDot on/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:C.red}}>Запись включена</div>
                  <div style={{fontSize:11,color:C.muted}}>{s.recording.disclaimerEnabled?"Предупреждение: ✅ активно":<span style={{color:C.amber}}>⚠️ Предупреждение отключено!</span>}</div>
                </div>
              </>:<><div style={{width:7,height:7,borderRadius:"50%",background:C.muted}}/><div style={{fontSize:12,color:C.muted}}>Запись отключена</div></>}
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{(s.channels||[]).map(ch=><ChIcon key={ch} ch={ch} size={20}/>)}{(!s.channels||!s.channels.length)&&<span style={{fontSize:11,color:C.muted}}>Каналы не выбраны</span>}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{aMgrs.map(m=><span key={m.id} style={{fontSize:11,padding:"2px 7px",borderRadius:20,background:m.color+"22",color:m.color,border:`1px solid ${m.color}44`}}>{m.name.split(" ")[0]}</span>)}{!aMgrs.length&&<span style={{fontSize:11,color:C.muted}}>Нет менеджеров</span>}</div>
            <div style={{display:"flex",gap:6}}>
              <input readOnly value={s.apiKey||""} className="mono" style={{flex:1,color:C.muted,padding:"5px 8px"}}/>
              <Btn small onClick={()=>navigator.clipboard?.writeText(s.apiKey||"")}>⎘</Btn>
            </div>
            <div style={{display:"flex",gap:6}}>
              <Btn small onClick={()=>onEdit(s)} style={{flex:1,justifyContent:"center"}}>⚙ Настройки</Btn>
              <Btn small danger onClick={()=>onDelete(s.id)} style={{flex:1,justifyContent:"center"}}>Удалить</Btn>
            </div>
          </div>
        </div>;
      })}
    </div>
    {/* Widget snippet */}
    {sites.length>0&&<div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
      <div style={{fontWeight:600,marginBottom:8}}>Подключение к сайту</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Вставь в {'<head>'} нужного сайта:</div>
      <pre style={{background:C.card,borderRadius:9,padding:"12px 16px",fontSize:11,fontFamily:"IBM Plex Mono,monospace",color:C.text,border:`1px solid ${C.border}`,overflowX:"auto",lineHeight:1.8}}>{`<script>
  window.CRM_CONFIG = {
    apiKey: "${sites[0]?.apiKey||"sk_live_xxx"}",
    siteId: "${sites[0]?.id||"s1"}",
    baseUrl: "https://89.125.72.180",
  };
</script>
<script src="https://89.125.72.180/widget.js" async></script>`}</pre>
    </div>}
  </div>;
}

// ── Inbox ─────────────────────────────────────────────────────────────────────
function Inbox({messages,contacts,managers,sites,currentManager,onSend,onRead}){
  const [sel,setSel]=useState(null);
  const [reply,setReply]=useState("");
  const [replyCh,setReplyCh]=useState("whatsapp");
  const [chFilter,setChFilter]=useState("all");
  const [siteFilter,setSiteFilter]=useState("all");
  const endRef=useRef(null);

  const threads=contacts.map(ct=>{
    const msgs=messages.filter(m=>m.contactId===ct.id);
    if(!msgs.length)return null;
    return{ct,msgs,last:msgs[msgs.length-1],unread:msgs.filter(m=>m.incoming&&!m.read).length};
  }).filter(Boolean).sort((a,b)=>b.last.createdAt-a.last.createdAt)
    .filter(({ct,msgs})=>(chFilter==="all"||msgs.some(m=>m.channel===chFilter))&&(siteFilter==="all"||ct.siteId===siteFilter));

  const selT=sel?threads.find(t=>t.ct.id===sel):null;
  useEffect(()=>{if(selT)selT.msgs.forEach(m=>{if(m.incoming&&!m.read)onRead(m.id);});},[sel]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[selT?.msgs.length]);

  const getSite=id=>sites.find(s=>s.id===id);

  const sendMsg=()=>{
    if(!reply.trim()||!sel)return;
    const site=getSite(selT?.ct?.siteId);
    const outMsgs=messages.filter(m=>m.contactId===sel&&!m.incoming);
    const isFirst=outMsgs.length===0;
    const prefix=(isFirst&&site?.recording?.enabled&&site?.recording?.disclaimerEnabled&&site?.recording?.disclaimerShowInChat)?`🔴 ${site.recording.disclaimerText}\n\n`:"";
    onSend({contactId:sel,channel:replyCh,managerId:currentManager.id,siteId:selT?.ct?.siteId,text:prefix+reply.trim(),incoming:false,read:true});
    setReply("");
  };

  return <div style={{display:"flex",flex:1,overflow:"hidden"}}>
    {/* Thread list */}
    <div style={{width:265,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:10,borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
        <select value={chFilter} onChange={e=>setChFilter(e.target.value)} style={{fontSize:12}}>
          <option value="all">Все каналы</option>
          {Object.entries(CHANNELS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={siteFilter} onChange={e=>setSiteFilter(e.target.value)} style={{fontSize:12}}>
          <option value="all">Все сайты</option>
          {sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {threads.length===0&&<div style={{padding:24,textAlign:"center",color:C.muted}}>Нет диалогов</div>}
        {threads.map(({ct,msgs,last,unread})=>{
          const isSel=sel===ct.id;
          const site=getSite(ct.siteId);
          const chs=[...new Set(msgs.map(m=>m.channel))];
          return <div key={ct.id} onClick={()=>setSel(ct.id===sel?null:ct.id)}
            style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:isSel?C.accentDim+"40":"transparent",transition:"background .12s"}}
            onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=C.faint;}}
            onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <Avatar name={ct.name} size={30}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:unread?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ct.name}</div>
                {site&&<div style={{fontSize:10,color:site.color}}>◆ {site.name}</div>}
              </div>
              {unread>0&&<span style={{background:C.accent,color:"#fff",borderRadius:10,fontSize:10,padding:"1px 6px",fontWeight:700}}>{unread}</span>}
            </div>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              {chs.map(ch=><ChIcon key={ch} ch={ch} size={12}/>)}
              <div style={{fontSize:11,color:C.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginLeft:4}}>{last.incoming?"":"Вы: "}{last.text.replace(/^🔴[^\n]+\n\n/,"")}</div>
            </div>
          </div>;
        })}
      </div>
    </div>
    {/* Chat */}
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {!selT?<div style={{display:"flex",alignItems:"center",justifyContent:"center",flex:1,color:C.muted,flexDirection:"column",gap:8}}><div style={{fontSize:32,opacity:.2}}>✉</div>Выбери диалог</div>
      :<>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <Avatar name={selT.ct.name} size={34}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:600}}>{selT.ct.name}</div>
            <div style={{fontSize:11,color:C.muted}}>{selT.ct.company} · {selT.ct.phone}</div>
          </div>
          <SiteBadge siteId={selT.ct.siteId} sites={sites}/>
          {(()=>{const site=getSite(selT.ct.siteId);return site?.recording?.enabled&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.red,padding:"3px 9px",background:"#1a0a0a",borderRadius:20,border:`1px solid ${C.red}44`}}><RecDot on/>REC</div>;})()}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:8}}>
          {selT.msgs.map(msg=>{
            const isOut=!msg.incoming;
            const isDisc=msg.text.startsWith("🔴");
            return <div key={msg.id} style={{display:"flex",justifyContent:isOut?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
              {!isOut&&<ChIcon ch={msg.channel} size={16}/>}
              <div style={{maxWidth:"72%"}}>
                {isDisc&&isOut&&<div style={{fontSize:10,color:C.red,marginBottom:3,display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:C.red}}/>Предупреждение о записи</div>}
                <div style={{background:isOut?C.accent:isDisc?"#1a0a0a":C.card,color:"#fff",borderRadius:isOut?"12px 12px 3px 12px":"12px 12px 12px 3px",padding:"8px 12px",fontSize:13,border:isOut?"none":isDisc?`1px solid ${C.red}44`:`1px solid ${C.border}`,lineHeight:1.6,whiteSpace:"pre-wrap",color:isOut?"#fff":C.text}}>{msg.text}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2,textAlign:isOut?"right":"left"}}>{fmt(msg.createdAt)}</div>
              </div>
            </div>;
          })}
          <div ref={endRef}/>
        </div>
        <div style={{padding:12,borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"flex-end"}}>
          <select value={replyCh} onChange={e=>setReplyCh(e.target.value)} style={{width:120,fontSize:12,flexShrink:0,alignSelf:"center"}}>
            {(()=>{const site=getSite(selT?.ct?.siteId);const chs=site?.channels?.length?site.channels:Object.keys(CHANNELS);return chs.map(k=><option key={k} value={k}>{CHANNELS[k]?.label}</option>);})()}
          </select>
          <textarea value={reply} onChange={e=>setReply(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
            placeholder="Написать... (Enter — отправить)" rows={2}
            style={{flex:1,resize:"none",fontSize:13,padding:"7px 11px"}}/>
          <Btn primary onClick={sendMsg} disabled={!reply.trim()}>↑</Btn>
        </div>
      </>}
    </div>
  </div>;
}

// ── Calls ─────────────────────────────────────────────────────────────────────
function CallModal({contacts,managers,sites,onSave,onClose}){
  const [form,setForm]=useState({contactId:"",managerId:managers[0]?.id||"",siteId:sites[0]?.id||"",direction:"inbound",status:"completed",phoneFrom:"",phoneTo:"+7 800 555-00-00",durationSec:0,disclaimerPlayed:false,transcript:"",summary:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const selSite=sites.find(s=>s.id===form.siteId);
  const recEnabled=selSite?.recording?.enabled;
  return <Modal title="Добавить звонок" onClose={onClose} width={480}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Fld label="Сайт"><select value={form.siteId} onChange={e=>set("siteId",e.target.value)}>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Fld>
      <Fld label="Контакт">
        <select value={form.contactId} onChange={e=>{const ct=contacts.find(c=>c.id===e.target.value);set("contactId",e.target.value);if(ct)set("phoneFrom",ct.phone);}}>
          <option value="">— Неизвестный —</option>
          {contacts.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
        </select>
      </Fld>
      <Fld label="Номер звонящего"><input value={form.phoneFrom} onChange={e=>set("phoneFrom",e.target.value)} placeholder="+7 900 000-00-00"/></Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <Fld label="Тип"><select value={form.direction} onChange={e=>set("direction",e.target.value)}><option value="inbound">Входящий</option><option value="outbound">Исходящий</option></select></Fld>
        <Fld label="Статус"><select value={form.status} onChange={e=>set("status",e.target.value)}><option value="completed">Завершён</option><option value="missed">Пропущен</option><option value="busy">Занято</option></select></Fld>
        <Fld label="Менеджер"><select value={form.managerId} onChange={e=>set("managerId",e.target.value)}>{managers.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}</select></Fld>
      </div>
      <Fld label="Длительность (сек)"><input type="number" value={form.durationSec} onChange={e=>set("durationSec",+e.target.value||0)}/></Fld>
      {recEnabled&&<label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:`1px solid ${C.red}44`,background:"#1a0a0a",cursor:"pointer"}}>
        <input type="checkbox" checked={form.disclaimerPlayed} onChange={()=>set("disclaimerPlayed",!form.disclaimerPlayed)}/>
        <div><div style={{fontSize:13,fontWeight:500,color:C.red}}>Предупреждение о записи озвучено</div><div style={{fontSize:11,color:C.muted}}>Клиент был уведомлён в начале звонка</div></div>
      </label>}
      <Fld label="Расшифровка"><textarea value={form.transcript} onChange={e=>set("transcript",e.target.value)} rows={3} style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontFamily:"Syne,sans-serif",fontSize:13,resize:"vertical",width:"100%"}} placeholder="Содержание разговора..."/></Fld>
      <Fld label="AI-итог"><input value={form.summary} onChange={e=>set("summary",e.target.value)} placeholder="Краткое резюме..."/></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>{if(!form.phoneFrom)return;onSave(form);}}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function Calls({calls,contacts,managers,sites,onAdd}){
  const [sel,setSel]=useState(null);
  const [search,setSearch]=useState("");
  const [siteF,setSiteF]=useState("all");
  const [mgrF,setMgrF]=useState("all");
  const getC=id=>contacts.find(c=>c.id===id);
  const getSite=id=>sites.find(s=>s.id===id);
  const filtered=calls.filter(c=>{
    const q=search.toLowerCase();
    const ct=getC(c.contactId);
    return(!q||ct?.name.toLowerCase().includes(q)||c.phoneFrom.includes(q))&&(siteF==="all"||c.siteId===siteF)&&(mgrF==="all"||c.managerId===mgrF);
  });
  const selC=sel?calls.find(c=>c.id===sel):null;
  const selCt=selC?getC(selC.contactId):null;
  const selSite=selC?getSite(selC.siteId):null;
  return <div style={{display:"flex",flex:1,overflow:"hidden"}}>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:`1px solid ${C.border}`}}>
      <div style={{padding:10,borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..." style={{flex:1,minWidth:110}}/>
        <select value={siteF} onChange={e=>setSiteF(e.target.value)} style={{width:130,fontSize:12}}>
          <option value="all">Все сайты</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={mgrF} onChange={e=>setMgrF(e.target.value)} style={{width:120,fontSize:12}}>
          <option value="all">Все менеджеры</option>{managers.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}
        </select>
        <Btn primary small onClick={onAdd}>+ Звонок</Btn>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:5}}>
        {filtered.length===0&&<div style={{color:C.muted,textAlign:"center",marginTop:40}}>Нет звонков</div>}
        {filtered.map(c=>{
          const ct=getC(c.contactId);
          const site=getSite(c.siteId);
          const isSel=c.id===sel;
          const stCol={completed:C.green,missed:C.red,busy:C.amber}[c.status]||C.muted;
          return <div key={c.id} onClick={()=>setSel(c.id===sel?null:c.id)} className="ani"
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:`1px solid ${isSel?C.accent:C.border}`,background:isSel?C.accentDim+"30":C.card,cursor:"pointer",transition:"all .12s"}}>
            <span style={{fontSize:16,color:c.status==="missed"?C.red:c.direction==="inbound"?C.green:C.accent}}>{c.direction==="inbound"?"↙":"↗"}</span>
            <Avatar name={ct?.name||"?"} size={32}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ct?.name||c.phoneFrom}</div>
              <div style={{fontSize:11,color:C.muted,display:"flex",alignItems:"center",gap:5}}>
                {site&&<span style={{color:site.color}}>◆ {site.name}</span>}<span>· {fmt(c.startedAt)}</span>
              </div>
            </div>
            {c.disclaimerPlayed&&<div title="Предупреждение озвучено" style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:C.red,padding:"2px 6px",background:"#1a0a0a",borderRadius:20,border:`1px solid ${C.red}44`}}><RecDot on/>REC</div>}
            <MgrBadge managerId={c.managerId} managers={managers}/>
            <Badge label={{completed:"Завершён",missed:"Пропущен",busy:"Занято"}[c.status]||c.status} color={stCol} small/>
            <span className="mono" style={{color:C.muted,minWidth:34,textAlign:"right"}}>{fmtDur(c.durationSec)}</span>
          </div>;
        })}
      </div>
    </div>
    <div style={{width:300,overflowY:"auto",background:C.surface}}>
      {!selC?<div style={{padding:40,textAlign:"center",color:C.muted}}><div style={{fontSize:32,opacity:.2}}>✆</div>Выбери звонок</div>
      :<div className="ani" style={{padding:16,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Avatar name={selCt?.name||"?"} size={40}/>
          <div><div style={{fontWeight:600,fontSize:14}}>{selCt?.name||selC.phoneFrom}</div><div style={{fontSize:12,color:C.muted}}>{selCt?.company||"—"}</div></div>
        </div>
        {selSite&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:selSite.color+"14",borderRadius:8,border:`1px solid ${selSite.color}44`}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:selSite.color}}/>
          <span style={{fontSize:12,fontWeight:500,color:selSite.color}}>{selSite.name}</span>
          <span className="mono" style={{color:C.muted}}>{selSite.domain}</span>
        </div>}
        {selC.disclaimerPlayed&&<div style={{background:"#1a0a0a",border:`1px solid ${C.red}44`,borderRadius:9,padding:"9px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><RecDot on/><span style={{color:C.red,fontSize:11,fontWeight:600}}>Предупреждение озвучено</span></div>
          <div style={{fontSize:11,color:C.muted}}>Клиент уведомлён о записи в начале звонка</div>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[["Тип",selC.direction==="inbound"?"Входящий":"Исходящий"],["Статус",{completed:"Завершён",missed:"Пропущен",busy:"Занято"}[selC.status]],["Длит.",fmtDur(selC.durationSec)],["Дата",fmt(selC.startedAt)]].map(([k,v])=>(
            <div key={k} style={{background:C.card,borderRadius:7,padding:"7px 10px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em"}}>{k}</div>
              <div style={{fontSize:12,fontWeight:500,marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><MgrBadge managerId={selC.managerId} managers={managers}/></div>
        {selC.status==="completed"&&selC.durationSec>0&&<><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Запись</div><AudioPlayer durationSec={selC.durationSec}/></>}
        {selC.transcript&&<div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Расшифровка</div>
          <div style={{background:C.card,borderRadius:9,padding:11,fontSize:12,lineHeight:1.75,border:`1px solid ${C.border}`,whiteSpace:"pre-wrap"}}>{selC.transcript}</div>
        </div>}
        {selC.summary&&<div style={{background:C.accentDim+"50",borderRadius:9,padding:11,border:`1px solid ${C.accent}44`,fontSize:12}}><span style={{color:C.accent,fontWeight:600}}>Итог: </span>{selC.summary}</div>}
      </div>}
    </div>
  </div>;
}

// ── Contacts ──────────────────────────────────────────────────────────────────
function ContactModal({initial,managers,sites,onSave,onClose}){
  const blank={name:"",phone:"",email:"",company:"",status:"lead",tags:"",managerId:managers[0]?.id||"",siteId:sites[0]?.id||""};
  const [form,setForm]=useState(initial?{...initial,tags:initial.tags?.join(", ")||""}:{...blank});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <Modal title={initial?"Редактировать контакт":"Новый контакт"} onClose={onClose} width={460}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Fld label="Имя *"><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Анна Иванова"/></Fld>
      <Fld label="Телефон *"><input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+7 900 000-00-00"/></Fld>
      <Fld label="Email"><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@company.ru"/></Fld>
      <Fld label="Компания"><input value={form.company} onChange={e=>set("company",e.target.value)} placeholder="ООО Название"/></Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Статус"><select value={form.status} onChange={e=>set("status",e.target.value)}><option value="lead">Лид</option><option value="client">Клиент</option><option value="lost">Потерян</option></select></Fld>
        <Fld label="Сайт-источник"><select value={form.siteId} onChange={e=>set("siteId",e.target.value)}>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Fld>
      </div>
      <Fld label="Менеджер"><select value={form.managerId} onChange={e=>set("managerId",e.target.value)}>{managers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Fld>
      <Fld label="Теги (через запятую)"><input value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="VIP, Тендер"/></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>{if(!form.name||!form.phone)return;onSave({...form,tags:form.tags?form.tags.split(",").map(t=>t.trim()).filter(Boolean):[]});}}> Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function Contacts({contacts,calls,messages,managers,sites,onAdd,onEdit}){
  const [search,setSearch]=useState("");
  const [statusF,setStatusF]=useState("all");
  const [siteF,setSiteF]=useState("all");
  const [mgrF,setMgrF]=useState("all");
  const [sel,setSel]=useState(null);
  const filtered=contacts.filter(c=>{
    const q=search.toLowerCase();
    return(!q||c.name.toLowerCase().includes(q)||c.phone?.includes(q)||(c.company||"").toLowerCase().includes(q))&&(statusF==="all"||c.status===statusF)&&(siteF==="all"||c.siteId===siteF)&&(mgrF==="all"||c.managerId===mgrF);
  });
  const selC=sel?contacts.find(c=>c.id===sel):null;
  const selCalls=selC?calls.filter(c=>c.contactId===selC.id):[];
  const selMsgs=selC?messages.filter(m=>m.contactId===selC.id):[];
  const chs=[...new Set(selMsgs.map(m=>m.channel))];
  const stMap={client:[C.green,"Клиент"],lead:[C.accent,"Лид"],lost:[C.muted,"Потерян"]};
  return <div style={{display:"flex",flex:1,overflow:"hidden"}}>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:`1px solid ${C.border}`}}>
      <div style={{padding:10,borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..." style={{flex:1,minWidth:100}}/>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)} style={{fontSize:12,width:105}}>
          <option value="all">Все статусы</option><option value="lead">Лиды</option><option value="client">Клиенты</option><option value="lost">Потерянные</option>
        </select>
        <select value={siteF} onChange={e=>setSiteF(e.target.value)} style={{fontSize:12,width:120}}>
          <option value="all">Все сайты</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={mgrF} onChange={e=>setMgrF(e.target.value)} style={{fontSize:12,width:115}}>
          <option value="all">Все менеджеры</option>{managers.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}
        </select>
        <Btn primary small onClick={onAdd}>+ Контакт</Btn>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:5}}>
        {filtered.length===0&&<div style={{color:C.muted,textAlign:"center",marginTop:40}}>Нет контактов</div>}
        {filtered.map(c=>{
          const isSel=c.id===sel;
          const cChs=[...new Set(messages.filter(m=>m.contactId===c.id).map(m=>m.channel))];
          const unread=messages.filter(m=>m.contactId===c.id&&m.incoming&&!m.read).length;
          const[stCol,stLabel]=stMap[c.status]||[C.muted,c.status];
          return <div key={c.id} onClick={()=>setSel(c.id===sel?null:c.id)} className="ani"
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:`1px solid ${isSel?C.accent:C.border}`,background:isSel?C.accentDim+"30":C.card,cursor:"pointer",transition:"all .12s"}}>
            <Avatar name={c.name} size={34}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
              <div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.company} · {c.phone}</div>
            </div>
            <div style={{display:"flex",gap:3}}>{cChs.map(ch=><ChIcon key={ch} ch={ch} size={14}/>)}</div>
            {unread>0&&<Badge label={unread} color={C.accent} small/>}
            <SiteBadge siteId={c.siteId} sites={sites}/>
            <Badge label={stLabel} color={stCol} small/>
            <MgrBadge managerId={c.managerId} managers={managers}/>
            <Btn small onClick={e=>{e.stopPropagation();onEdit(c);}}>✎</Btn>
          </div>;
        })}
      </div>
    </div>
    <div style={{width:285,overflowY:"auto",background:C.surface}}>
      {!selC?<div style={{padding:40,textAlign:"center",color:C.muted}}><div style={{fontSize:32,opacity:.2}}>◈</div>Выбери контакт</div>
      :<div className="ani" style={{padding:16,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Avatar name={selC.name} size={44}/>
          <div>
            <div style={{fontWeight:600,fontSize:14}}>{selC.name}</div>
            <div style={{fontSize:12,color:C.muted}}>{selC.company}</div>
            <div style={{marginTop:4,display:"flex",gap:4,flexWrap:"wrap"}}>
              <Badge label={stMap[selC.status]?.[1]||selC.status} color={stMap[selC.status]?.[0]||C.muted} small/>
              <SiteBadge siteId={selC.siteId} sites={sites}/>
            </div>
          </div>
        </div>
        {[["Телефон",selC.phone],["Email",selC.email||"—"],["Компания",selC.company||"—"],["Добавлен",fmtDate(selC.createdAt)]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.muted}}>{k}</span><span style={{fontWeight:500}}>{v}</span>
          </div>
        ))}
        <div><span style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em"}}>Менеджер</span><div style={{marginTop:5}}><MgrBadge managerId={selC.managerId} managers={managers}/></div></div>
        {selC.tags?.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{selC.tags.map(t=><span key={t} style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:C.amber+"22",color:C.amber,border:`1px solid ${C.amber}44`}}>{t}</span>)}</div>}
        {chs.length>0&&<div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Каналы связи</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{chs.map(ch=><div key={ch} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,border:`1px solid ${C.border}`,fontSize:11}}><ChIcon ch={ch} size={14}/>{CHANNELS[ch]?.label}</div>)}</div>
        </div>}
        <div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Звонки ({selCalls.length})</div>
          {selCalls.length===0&&<div style={{fontSize:12,color:C.muted}}>Нет звонков</div>}
          {selCalls.slice(0,4).map(c=><div key={c.id} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
            <span style={{color:c.direction==="inbound"?C.green:C.accent}}>{c.direction==="inbound"?"↙":"↗"}</span>
            <span style={{flex:1,color:C.muted}}>{fmt(c.startedAt)}</span>
            {c.disclaimerPlayed&&<span style={{fontSize:10,color:C.red}}>●REC</span>}
            <Badge label={{completed:"Завершён",missed:"Пропущен",busy:"Занято"}[c.status]} color={{completed:C.green,missed:C.red,busy:C.amber}[c.status]||C.muted} small/>
            <span className="mono" style={{color:C.muted}}>{fmtDur(c.durationSec)}</span>
          </div>)}
        </div>
      </div>}
    </div>
  </div>;
}

// ── Deals ─────────────────────────────────────────────────────────────────────
function DealModal({contacts,managers,sites,initialStage,onSave,onClose}){
  const [form,setForm]=useState({title:"",contactId:"",managerId:managers[0]?.id||"",siteId:sites[0]?.id||"",amount:"",stage:initialStage||STAGES[0]});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <Modal title="Новая сделка" onClose={onClose} width={420}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Fld label="Название *"><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Поставка оборудования"/></Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Контакт"><select value={form.contactId} onChange={e=>set("contactId",e.target.value)}><option value="">—</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Fld>
        <Fld label="Менеджер"><select value={form.managerId} onChange={e=>set("managerId",e.target.value)}>{managers.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}</select></Fld>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Сайт"><select value={form.siteId} onChange={e=>set("siteId",e.target.value)}>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Fld>
        <Fld label="Сумма (₽)"><input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0"/></Fld>
      </div>
      <Fld label="Этап"><select value={form.stage} onChange={e=>set("stage",e.target.value)}>{STAGES.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>{if(!form.title)return;onSave({...form,amount:parseInt(form.amount)||0});}}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function Deals({deals,contacts,managers,sites,onAdd,onMove,onDelete}){
  const [siteF,setSiteF]=useState("all");
  const filtered=deals.filter(d=>siteF==="all"||d.siteId===siteF);
  const pipeline=filtered.filter(d=>d.stage!=="Закрыт").reduce((s,d)=>s+d.amount,0);
  return <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
    <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
      <select value={siteF} onChange={e=>setSiteF(e.target.value)} style={{fontSize:12,width:140}}>
        <option value="all">Все сайты</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <div style={{fontSize:12,color:C.muted}}>{filtered.length} сделок · <span style={{color:C.green}}>{pipeline.toLocaleString()} ₽ в воронке</span></div>
      <div style={{flex:1}}/>
      <Btn primary small onClick={()=>onAdd(STAGES[0])}>+ Сделка</Btn>
    </div>
    <div style={{flex:1,overflowX:"auto",overflowY:"hidden",padding:14}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start",height:"100%",minWidth:STAGES.length*215}}>
        {STAGES.map(stage=>{
          const sd=filtered.filter(d=>d.stage===stage);
          const sum=sd.reduce((s,d)=>s+d.amount,0);
          const stageColor={Новый:C.muted,Переговоры:C.accent,"КП отправлено":C.amber,Закрыт:C.green}[stage]||C.muted;
          return <div key={stage} style={{flex:"0 0 210px",background:C.surface,borderRadius:12,border:`1px solid ${stageColor}44`,display:"flex",flexDirection:"column",maxHeight:"100%"}}>
            <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <span style={{fontWeight:600,fontSize:13,color:stageColor}}>{stage}</span>
              <div style={{textAlign:"right"}}>
                <Badge label={sd.length} color={stageColor} small/>
                {sum>0&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{sum.toLocaleString()} ₽</div>}
              </div>
            </div>
            <div style={{padding:8,display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}}>
              {sd.map(d=>{
                const ct=contacts.find(c=>c.id===d.contactId);
                const site=sites.find(s=>s.id===d.siteId);
                const si=STAGES.indexOf(stage);
                return <div key={d.id} style={{background:C.card,borderRadius:9,padding:10,border:`1px solid ${C.border}`}}>
                  <div style={{fontWeight:500,fontSize:12,marginBottom:4}}>{d.title}</div>
                  {ct&&<div style={{fontSize:11,color:C.muted,marginBottom:3}}>{ct.name}</div>}
                  {site&&<SiteBadge siteId={d.siteId} sites={sites}/>}
                  {d.amount>0&&<div style={{fontSize:13,color:C.green,fontWeight:600,margin:"6px 0"}}>{d.amount.toLocaleString()} ₽</div>}
                  <div style={{marginBottom:6}}><MgrBadge managerId={d.managerId} managers={managers}/></div>
                  <div style={{display:"flex",gap:4}}>
                    {si>0&&<Btn small onClick={()=>onMove(d.id,STAGES[si-1])}>←</Btn>}
                    {si<STAGES.length-1&&<Btn small primary onClick={()=>onMove(d.id,STAGES[si+1])}>→</Btn>}
                    <Btn small danger onClick={()=>onDelete(d.id)} style={{marginLeft:"auto"}}>×</Btn>
                  </div>
                </div>;
              })}
              <Btn small onClick={()=>onAdd(stage)} style={{width:"100%",justifyContent:"center",opacity:.5}}>+ Сделка</Btn>
            </div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
function TaskModal({contacts,managers,onSave,onClose}){
  const [form,setForm]=useState({title:"",contactId:"",managerId:managers[0]?.id||"",dueAt:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <Modal title="Новая задача" onClose={onClose} width={400}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Fld label="Задача *"><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Позвонить клиенту"/></Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Контакт"><select value={form.contactId} onChange={e=>set("contactId",e.target.value)}><option value="">—</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Fld>
        <Fld label="Менеджер"><select value={form.managerId} onChange={e=>set("managerId",e.target.value)}>{managers.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}</select></Fld>
      </div>
      <Fld label="Срок"><input type="datetime-local" value={form.dueAt} onChange={e=>set("dueAt",e.target.value)}/></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>{if(!form.title)return;onSave({...form,dueAt:form.dueAt?new Date(form.dueAt).getTime():null});}}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function Tasks({tasks,contacts,managers,onAdd,onToggle,onDelete}){
  const [mgrF,setMgrF]=useState("all");
  const filtered=tasks.filter(t=>mgrF==="all"||t.managerId===mgrF);
  const open=filtered.filter(t=>!t.done).sort((a,b)=>(a.dueAt||Infinity)-(b.dueAt||Infinity));
  const done=filtered.filter(t=>t.done);
  const getC=id=>contacts.find(c=>c.id===id);
  const Row=({t})=>{
    const isOverdue=!t.done&&t.dueAt&&t.dueAt<Date.now();
    return <div style={{display:"flex",alignItems:"center",gap:12,padding:"9px 13px",background:C.card,borderRadius:9,border:`1px solid ${isOverdue?C.amber+"55":C.border}`,opacity:t.done?.5:1}}>
      <input type="checkbox" checked={t.done} onChange={()=>onToggle(t.id)}/>
      <div style={{flex:1}}>
        <div style={{fontWeight:500,textDecoration:t.done?"line-through":"none",fontSize:13}}>{t.title}</div>
        {t.contactId&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{getC(t.contactId)?.name}</div>}
      </div>
      <MgrBadge managerId={t.managerId} managers={managers}/>
      {t.dueAt&&<span className="mono" style={{fontSize:11,color:isOverdue?C.amber:C.muted,whiteSpace:"nowrap"}}>{isOverdue?"⚠ ":""}{fmt(t.dueAt)}</span>}
      <Btn small danger onClick={()=>onDelete(t.id)}>×</Btn>
    </div>;
  };
  return <div style={{padding:16,flex:1,overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontWeight:600,fontSize:15}}>Задачи</span>
        <select value={mgrF} onChange={e=>setMgrF(e.target.value)} style={{fontSize:12,width:130}}>
          <option value="all">Все менеджеры</option>{managers.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}
        </select>
      </div>
      <Btn primary onClick={onAdd}>+ Задача</Btn>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
      {open.map(t=><Row key={t.id} t={t}/>)}
      {open.length===0&&<div style={{color:C.muted,textAlign:"center",padding:24}}>Все задачи выполнены! 🎉</div>}
    </div>
    {done.length>0&&<>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Выполнено ({done.length})</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{done.slice(0,6).map(t=><Row key={t.id} t={t}/>)}</div>
    </>}
  </div>;
}

// ── Team ──────────────────────────────────────────────────────────────────────
function ManagerModal({initial,onSave,onClose}){
  const [form,setForm]=useState(initial||{name:"",email:"",role:"manager",color:MGR_COLORS[0]});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <Modal title={initial?"Редактировать менеджера":"Новый менеджер"} onClose={onClose} width={400}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Fld label="Имя *"><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Иван Петров"/></Fld>
      <Fld label="Email"><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="ivan@company.ru"/></Fld>
      <Fld label="Роль"><select value={form.role} onChange={e=>set("role",e.target.value)}><option value="manager">Менеджер</option><option value="admin">Администратор</option></select></Fld>
      <Fld label="Цвет"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{MGR_COLORS.map(col=><div key={col} onClick={()=>set("color",col)} style={{width:26,height:26,borderRadius:"50%",background:col,cursor:"pointer",border:`3px solid ${form.color===col?"#fff":"transparent"}`,transition:"all .12s"}}/>)}</div></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>{if(!form.name)return;onSave(form);}}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function Team({managers,calls,messages,contacts,sites,onAdd,onEdit,onRemove}){
  return <div style={{padding:18,flex:1,overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><div style={{fontWeight:600,fontSize:15}}>Команда</div><div style={{fontSize:11,color:C.muted}}>{managers.length} из 10 слотов заняты</div></div>
      {managers.length<10&&<Btn primary onClick={onAdd}>+ Менеджер</Btn>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(268px,1fr))",gap:12,marginBottom:24}}>
      {managers.map(m=>{
        const mSites=sites.filter(s=>s.assignedManagers?.includes(m.id));
        const mCalls=calls.filter(c=>c.managerId===m.id).length;
        const mUnread=messages.filter(ms=>ms.managerId===m.id&&ms.incoming&&!ms.read).length;
        const mDeals=contacts.filter(c=>c.managerId===m.id).length;
        return <div key={m.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:13,padding:16,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Avatar name={m.name} size={44} color={m.color}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
              <div style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.email}</div>
              <div style={{marginTop:4}}><Badge label={m.role==="admin"?"Администратор":"Менеджер"} color={m.role==="admin"?C.purple:C.accent} small/></div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {[["Контакты",mDeals,C.text],["Звонков",mCalls,C.text],["Сайтов",mSites.length,C.teal],["Новых",mUnread,mUnread>0?C.accent:C.muted]].map(([l,v,col])=>(
              <div key={l} style={{background:C.surface,borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:700,color:col}}>{v}</div>
                <div style={{fontSize:9,color:C.muted}}>{l}</div>
              </div>
            ))}
          </div>
          {mSites.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{mSites.map(s=><span key={s.id} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:s.color+"22",color:s.color,border:`1px solid ${s.color}44`}}>{s.name}</span>)}</div>}
          <div style={{display:"flex",gap:6}}>
            <Btn small onClick={()=>onEdit(m)} style={{flex:1,justifyContent:"center"}}>✎ Изменить</Btn>
            {m.role!=="admin"&&<Btn small danger onClick={()=>onRemove(m.id)} style={{flex:1,justifyContent:"center"}}>Удалить</Btn>}
          </div>
        </div>;
      })}
    </div>
    {/* All channels */}
    <div style={{background:C.surface,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
      <div style={{fontWeight:500,fontSize:13,marginBottom:12}}>Подключённые каналы</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
        {Object.entries(CHANNELS).map(([ch,cfg])=>{
          const active=sites.some(s=>s.channels?.includes(ch)&&s.active);
          return <div key={ch} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:C.card,borderRadius:9,border:`1px solid ${active?cfg.color+"44":C.border}`}}>
            <ChIcon ch={ch} size={22}/>
            <div>
              <div style={{fontSize:12,fontWeight:500}}>{cfg.label}</div>
              <div style={{fontSize:10,color:active?C.green:C.muted}}>{active?"● Активен":"○ Не подкл."}</div>
            </div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App(){
  const[page,setPage]=useState("dashboard");
  const[sites,setSites]=useState([]);
  const[managers,setManagers]=useState([]);
  const[contacts,setContacts]=useState([]);
  const[calls,setCalls]=useState([]);
  const[messages,setMessages]=useState([]);
  const[deals,setDeals]=useState([]);
  const[tasks,setTasks]=useState([]);
  const[modal,setModal]=useState(null);
  const[loading,setLoading]=useState(true);
  const cur=managers[0];

  useEffect(()=>{
    (async()=>{
      const[si,mg,ct,cl,ms,dl,tk]=await Promise.all([
        load("crm4:sites"),load("crm4:managers"),load("crm4:contacts"),
        load("crm4:calls"),load("crm4:messages"),load("crm4:deals"),load("crm4:tasks"),
      ]);
      setSites(si||SS);setManagers(mg||SM);setContacts(ct||SC);
      setCalls(cl||SCL);setMessages(ms||SMS);setDeals(dl||SD);setTasks(tk||STK);
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{if(!loading)save("crm4:sites",sites);},[sites,loading]);
  useEffect(()=>{if(!loading)save("crm4:managers",managers);},[managers,loading]);
  useEffect(()=>{if(!loading)save("crm4:contacts",contacts);},[contacts,loading]);
  useEffect(()=>{if(!loading)save("crm4:calls",calls);},[calls,loading]);
  useEffect(()=>{if(!loading)save("crm4:messages",messages);},[messages,loading]);
  useEffect(()=>{if(!loading)save("crm4:deals",deals);},[deals,loading]);
  useEffect(()=>{if(!loading)save("crm4:tasks",tasks);},[tasks,loading]);

  const unread=messages.filter(m=>m.incoming&&!m.read).length;
  const missed=calls.filter(c=>c.status==="missed").length;
  const overdueTasks=tasks.filter(t=>!t.done&&t.dueAt&&t.dueAt<Date.now()).length;

  if(loading)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:500,color:C.muted,background:C.bg,fontFamily:"Syne,sans-serif"}}>Загрузка CRM...</div>;

  const labels={dashboard:"Дашборд",sites:"Сайты",inbox:"Входящие сообщения",calls:"Звонки",contacts:"Контакты",deals:"Сделки",tasks:"Задачи",team:"Команда"};

  return <>
    <style>{css}</style>
    <div style={{display:"flex",height:700,borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`,background:C.bg}}>
      <Sidebar page={page} setPage={setPage} unread={unread} missed={missed} overdueTasksCount={overdueTasks} sites={sites} currentManager={cur}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:C.surface,flexShrink:0}}>
          <span style={{fontWeight:600,fontSize:14}}>{labels[page]}</span>
          {page==="inbox"&&unread>0&&<Badge label={`${unread} новых`} color={C.accent}/>}
          {page==="tasks"&&overdueTasks>0&&<Badge label={`${overdueTasks} просрочено`} color={C.amber}/>}
          <div style={{flex:1}}/>
          {page==="sites"&&<Btn primary small onClick={()=>setModal("add-site")}>+ Сайт</Btn>}
          {page==="calls"&&<Btn primary small onClick={()=>setModal("add-call")}>+ Звонок</Btn>}
          {page==="contacts"&&<Btn primary small onClick={()=>setModal("add-contact")}>+ Контакт</Btn>}
          {page==="deals"&&<Btn primary small onClick={()=>setModal({type:"add-deal",stage:STAGES[0]})}>+ Сделка</Btn>}
          {page==="tasks"&&<Btn primary small onClick={()=>setModal("add-task")}>+ Задача</Btn>}
          {page==="team"&&managers.length<10&&<Btn primary small onClick={()=>setModal("add-manager")}>+ Менеджер</Btn>}
        </div>
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          {page==="dashboard"&&<Dashboard calls={calls} contacts={contacts} messages={messages} deals={deals} tasks={tasks} managers={managers} sites={sites} setPage={setPage}/>}
          {page==="sites"&&<Sites sites={sites} managers={managers}
            onAdd={()=>setModal("add-site")}
            onEdit={s=>setModal({type:"edit-site",data:s})}
            onDelete={id=>setSites(p=>p.filter(s=>s.id!==id))}
            onToggle={id=>setSites(p=>p.map(s=>s.id===id?{...s,active:!s.active}:s))}/>}
          {page==="inbox"&&<Inbox messages={messages} contacts={contacts} managers={managers} sites={sites} currentManager={cur}
            onSend={m=>setMessages(p=>[...p,{id:uid(),...m,createdAt:Date.now()}])}
            onRead={id=>setMessages(p=>p.map(m=>m.id===id?{...m,read:true}:m))}/>}
          {page==="calls"&&<Calls calls={calls} contacts={contacts} managers={managers} sites={sites} onAdd={()=>setModal("add-call")}/>}
          {page==="contacts"&&<Contacts contacts={contacts} calls={calls} messages={messages} managers={managers} sites={sites}
            onAdd={()=>setModal("add-contact")}
            onEdit={c=>setModal({type:"edit-contact",data:c})}/>}
          {page==="deals"&&<Deals deals={deals} contacts={contacts} managers={managers} sites={sites}
            onAdd={stage=>setModal({type:"add-deal",stage})}
            onMove={(id,stage)=>setDeals(p=>p.map(d=>d.id===id?{...d,stage}:d))}
            onDelete={id=>setDeals(p=>p.filter(d=>d.id!==id))}/>}
          {page==="tasks"&&<Tasks tasks={tasks} contacts={contacts} managers={managers}
            onAdd={()=>setModal("add-task")}
            onToggle={id=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t))}
            onDelete={id=>setTasks(p=>p.filter(t=>t.id!==id))}/>}
          {page==="team"&&<Team managers={managers} calls={calls} messages={messages} contacts={contacts} sites={sites}
            onAdd={()=>setModal("add-manager")}
            onEdit={m=>setModal({type:"edit-manager",data:m})}
            onRemove={id=>setManagers(p=>p.filter(m=>m.id!==id))}/>}
        </div>
      </div>
    </div>

    {/* Modals */}
    {modal==="add-site"&&<SiteModal managers={managers} onSave={f=>{setSites(p=>[...p,{id:uid(),apiKey:"sk_live_"+uid(),stats:{calls:0,messages:0,leads:0},createdAt:Date.now(),...f}]);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.type==="edit-site"&&<SiteModal initial={modal.data} managers={managers} onSave={f=>{setSites(p=>p.map(s=>s.id===modal.data.id?{...s,...f}:s));setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-contact"&&<ContactModal managers={managers} sites={sites} onSave={f=>{setContacts(p=>[{id:uid(),...f,createdAt:Date.now()},...p]);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.type==="edit-contact"&&<ContactModal initial={modal.data} managers={managers} sites={sites} onSave={f=>{setContacts(p=>p.map(c=>c.id===modal.data.id?{...c,...f}:c));setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-call"&&<CallModal contacts={contacts} managers={managers} sites={sites} onSave={f=>{setCalls(p=>[{id:uid(),...f,startedAt:Date.now()},...p]);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.type==="add-deal"&&<DealModal contacts={contacts} managers={managers} sites={sites} initialStage={modal.stage} onSave={f=>{setDeals(p=>[{id:uid(),...f,createdAt:Date.now()},...p]);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-task"&&<TaskModal contacts={contacts} managers={managers} onSave={f=>{setTasks(p=>[{id:uid(),...f,done:false,createdAt:Date.now()},...p]);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-manager"&&<ManagerModal onSave={f=>{setManagers(p=>[...p,{id:uid(),...f}]);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.type==="edit-manager"&&<ManagerModal initial={modal.data} onSave={f=>{setManagers(p=>p.map(m=>m.id===modal.data.id?{...m,...f}:m));setModal(null);}} onClose={()=>setModal(null)}/>}
  </>;
}
