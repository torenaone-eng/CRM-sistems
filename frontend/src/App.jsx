import React, { useState, useEffect, useRef } from "react";
import { IMPORTED_WAREHOUSE_DOCUMENTS, IMPORTED_WAREHOUSE_POSITIONS, IMPORTED_WAREHOUSE_PRODUCTS } from "./warehousePositions";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#f3f8f1",surface:"#ffffff",card:"#ffffff",border:"#dce9d8",
  accent:"#50b743",accentDim:"#dff3d8",
  green:"#2f8f36",greenDim:"#e4f5df",red:"#df2d34",redDim:"#fde8e8",
  amber:"#ec672f",amberDim:"#fff0e6",purple:"#2f968b",teal:"#2f968b",
  text:"#1f211f",muted:"#667464",faint:"#eef6ec",dark:"#16261f",
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
const LEAD_STAGES=[
  {id:"new",label:"Новые лиды",short:"Новые"},
  {id:"qualified",label:"Квалифицировать",short:"Разбор"},
  {id:"meeting",label:"Назначена встреча",short:"Встреча"},
  {id:"deferred",label:"Отложенный спрос",short:"Отложено"},
  {id:"installment",label:"Нужна рассрочка",short:"Рассрочка"},
  {id:"refused",label:"Отказался",short:"Отказ"},
  {id:"client",label:"Стал клиентом",short:"Клиент"},
];
const leadStageOf=c=>c?.leadStage||(c?.status==="client"?"client":c?.status==="lost"?"refused":"new");
const SITE_COLORS=["#4f8ef7","#3fb950","#a371f7","#d29922","#e1306c","#ff6b35","#2dd4bf"];
const MGR_COLORS=["#4f8ef7","#3fb950","#a371f7","#d29922","#e1306c","#ff6b35","#229ed9","#f85149","#2dd4bf","#94d82d"];
const THEMES={
  midnight:{label:"torenaOne",bg:"#f3f8f1",surface:"#ffffff",card:"#ffffff",accent:"#44bd32",sidebar:"#14251d",header:"#ffffff",headerText:"#1f211f"},
  graphite:{label:"Светлая",bg:"#f7f8fb",surface:"#ffffff",card:"#ffffff",accent:"#4f8ef7",sidebar:"#eef2f7",header:"#ffffff",headerText:"#1f2933",sidebarText:"#26323a"},
  emerald:{label:"Темная",bg:"#101614",surface:"#151f1b",card:"#18231e",accent:"#6ee47a",sidebar:"#07110d",header:"#111a16",headerText:"#f4fbf4"},
  plum:{label:"Апельсиновая",bg:"#fff4ea",surface:"#ffffff",card:"#ffffff",accent:"#ff7a1a",sidebar:"#3b2010",header:"#fff8f1",headerText:"#2a1b12"},
};
const DEFAULT_BOARD={stats:true,sites:true,managers:true,pipeline:true};
const DEFAULT_FEATURES={exec:true,tags:true,sites:true,warehouse:true,inbox:true,chat:true,calls:true,contacts:true,deals:true,tasks:true,team:true};
const FEATURE_META={
  exec:{label:"Доска руководителя",desc:"KPI, менеджеры, воронка и сигналы внимания"},
  tags:{label:"Теги",desc:"Единый справочник тегов с цветами"},
  sites:{label:"Сайты",desc:"Подключение сайтов, каналы и запись звонков"},
  warehouse:{label:"Склад",desc:"Товары, поступления, продажи, документы и договоры"},
  inbox:{label:"Входящие",desc:"Омниканальные сообщения клиентов"},
  chat:{label:"Внутренний чат",desc:"Командный чат и личные сообщения"},
  calls:{label:"Звонки",desc:"История звонков, записи и расшифровки"},
  contacts:{label:"Контакты",desc:"Клиенты, контрагенты, теги и фильтры"},
  deals:{label:"Сделки",desc:"Воронка продаж, суммы, теги и этапы"},
  tasks:{label:"Задачи",desc:"Дедлайны, просрочки и поручения"},
  team:{label:"Команда",desc:"Пользователи, роли, темы и нагрузка"},
};
const DISC_TEMPLATES={
  ru:"Уважаемый клиент, обращаем ваше внимание, что данный разговор записывается в целях контроля качества обслуживания.",
  en:"Dear customer, please be advised that this call is being recorded for quality assurance purposes.",
  short:"Звонок записывается.",
};
const css=`
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;scrollbar-width:thin;scrollbar-color:${C.border} transparent}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
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
const isLocalApp=typeof window!=="undefined"&&["localhost","127.0.0.1"].includes(window.location.hostname);
const API_BASE=(import.meta.env.VITE_API_URL||(isLocalApp?"http://127.0.0.1:3001":window.location.origin)).replace(/\/$/,"");
const API_TIMEOUT_MS=3500;
const API_LOGIN={email:"admin@torenaone.ru",password:"TorenaOne2026!",name:"Алексей Морозов"};
const PUBLIC_SITE_KEY="sk_live_torenaone_main";
const PUBLIC_CRM_URL="https://crm.torenaone-office.ru";
const roleFromApi=role=>(role||"MANAGER").toLowerCase();
const roleToApi=role=>(role||"manager").toUpperCase();
const statusFromApi=status=>(status||"LEAD").toLowerCase();
const statusToApi=status=>(status||"lead").toUpperCase();
const callStatusFromApi=status=>(status||"COMPLETED").toLowerCase();
const callStatusToApi=status=>(status||"completed").toUpperCase();
const directionFromApi=dir=>(dir||"INBOUND").toLowerCase();
const directionToApi=dir=>(dir||"inbound").toUpperCase();
const timeFromApi=v=>v?new Date(v).getTime():null;
const dateToApi=v=>v?new Date(v).toISOString():null;
const siteFromApi=s=>({...s,recording:{
  enabled:!!s.recordingEnabled,
  disclaimerEnabled:!!s.disclaimerEnabled,
  disclaimerText:s.disclaimerText||"",
  disclaimerVoice:!!s.disclaimerVoice,
  disclaimerVoiceGender:s.disclaimerVoiceGender||"female",
  disclaimerVoiceDelay:s.disclaimerVoiceDelay||0,
  disclaimerShowInChat:s.disclaimerShowInChat!==false,
},stats:s.stats||{calls:0,messages:0,leads:0},createdAt:timeFromApi(s.createdAt)||Date.now()});
const siteToApi=s=>({
  name:s.name,domain:s.domain,color:s.color,active:!!s.active,channels:s.channels||[],
  assignedManagerIds:s.assignedManagerIds||[],
  recordingEnabled:!!s.recording?.enabled,
  disclaimerEnabled:!!s.recording?.disclaimerEnabled,
  disclaimerText:s.recording?.disclaimerText||"",
  disclaimerVoice:!!s.recording?.disclaimerVoice,
  disclaimerVoiceGender:s.recording?.disclaimerVoiceGender||"female",
  disclaimerVoiceDelay:parseInt(s.recording?.disclaimerVoiceDelay)||0,
  disclaimerShowInChat:s.recording?.disclaimerShowInChat!==false,
});
const managerFromApi=u=>({...u,role:roleFromApi(u.role),theme:u.theme||"midnight",board:{...DEFAULT_BOARD,...(u.board||{})},createdAt:timeFromApi(u.createdAt)||Date.now()});
const managerToApi=u=>({name:u.name,email:u.email,role:roleToApi(u.role),color:u.color||MGR_COLORS[0],theme:u.theme||"midnight",board:{...DEFAULT_BOARD,...(u.board||{})}});
const contactFromApi=c=>({...c,status:statusFromApi(c.status),leadStage:leadStageOf({...c,status:statusFromApi(c.status)}),createdAt:timeFromApi(c.createdAt)||Date.now(),updatedAt:timeFromApi(c.updatedAt)||Date.now()});
const contactToApi=c=>({name:c.name,phone:c.phone||"",email:c.email||null,company:c.company||null,status:statusToApi(c.status),leadStage:c.leadStage||leadStageOf(c),tags:c.tags||[],managerId:c.managerId,siteId:c.siteId});
const dealFromApi=d=>({...d,createdAt:timeFromApi(d.createdAt)||Date.now(),updatedAt:timeFromApi(d.updatedAt)||Date.now(),tags:d.tags||[]});
const dealToApi=d=>({title:d.title,contactId:d.contactId||null,managerId:d.managerId,siteId:d.siteId,amount:parseInt(d.amount)||0,stage:d.stage||STAGES[0],tags:d.tags||[]});
const taskFromApi=t=>({...t,dueAt:timeFromApi(t.dueAt),createdAt:timeFromApi(t.createdAt)||Date.now()});
const taskToApi=t=>({title:t.title,contactId:t.contactId||null,managerId:t.managerId,dueAt:dateToApi(t.dueAt),done:!!t.done});
const callFromApi=c=>({...c,direction:directionFromApi(c.direction),status:callStatusFromApi(c.status),startedAt:timeFromApi(c.startedAt)||Date.now()});
const callToApi=c=>({...c,direction:directionToApi(c.direction),status:callStatusToApi(c.status),startedAt:dateToApi(c.startedAt||Date.now())});
const messageFromApi=m=>({...m,createdAt:timeFromApi(m.createdAt)||Date.now()});
const messageToApi=m=>({contactId:m.contactId,managerId:m.managerId,siteId:m.siteId,channel:m.channel,text:m.text,incoming:!!m.incoming,read:!!m.read});
const warehouseProductFromApi=p=>({...p,createdAt:timeFromApi(p.createdAt)||Date.now(),updatedAt:timeFromApi(p.updatedAt)||Date.now()});
const warehouseProductToApi=p=>({sku:p.sku||"",name:p.name,category:p.category||"Товары",unit:p.unit||"шт",stock:parseInt(p.stock)||0,reserved:parseInt(p.reserved)||0,price:parseInt(p.price)||0,cost:parseInt(p.cost)||0,tags:p.tags||[]});
const warehousePositionFromApi=p=>({...p,orderedAt:timeFromApi(p.orderedAt),receivedAt:timeFromApi(p.receivedAt),soldAt:timeFromApi(p.soldAt),createdAt:timeFromApi(p.createdAt)||Date.now(),updatedAt:timeFromApi(p.updatedAt)||Date.now()});
const warehouseDocumentFromApi=d=>({...d,createdAt:timeFromApi(d.createdAt)||Date.now(),updatedAt:timeFromApi(d.updatedAt)||Date.now(),items:d.items||[]});
const warehouseDocumentToApi=d=>({type:d.type,number:d.number,contactId:d.contactId||null,contactName:d.contactName||"",amount:parseInt(d.amount)||0,status:d.status||"Подготовлен",items:d.items||[],createdAt:dateToApi(d.createdAt||Date.now())});
async function apiRequest(path,{method="GET",token,body}={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),API_TIMEOUT_MS);
  try{
    const res=await fetch(`${API_BASE}${path}`,{
      method,
      headers:{...(body?{"Content-Type":"application/json"}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},
      body:body?JSON.stringify(body):undefined,
      signal:controller.signal,
    });
    const text=await res.text();
    const data=text?JSON.parse(text):null;
    if(!res.ok)throw new Error(data?.error||`API ${res.status}`);
    return data;
  }catch(error){
    if(error.name==="AbortError")throw new Error("API timeout");
    throw error;
  }finally{
    clearTimeout(timeout);
  }
}
async function apiLogin(email,password){
  return apiRequest("/api/auth/login",{method:"POST",body:{email,password}});
}
async function publicRequest(path,{method="GET",body}={}){
  const url=method==="GET"?`${API_BASE}${path}${path.includes("?")?"&":"?"}apiKey=${encodeURIComponent(PUBLIC_SITE_KEY)}`:`${API_BASE}${path}`;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),API_TIMEOUT_MS);
  try{
    const res=await fetch(url,{method,headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify({...body,apiKey:PUBLIC_SITE_KEY}):undefined,signal:controller.signal});
    const text=await res.text();
    const data=text?JSON.parse(text):null;
    if(!res.ok)throw new Error(data?.error||`API ${res.status}`);
    return data;
  }catch(error){
    if(error.name==="AbortError")throw new Error("API timeout");
    throw error;
  }finally{
    clearTimeout(timeout);
  }
}
async function loadApiState(token){
  const [users,sites,contacts,calls,messages,deals,tasks,warehouseProducts,warehousePositions,warehouseDocuments]=await Promise.all([
    apiRequest("/api/users",{token}),
    apiRequest("/api/sites",{token}),
    apiRequest("/api/contacts",{token}),
    apiRequest("/api/calls",{token}),
    apiRequest("/api/messages",{token}),
    apiRequest("/api/deals",{token}),
    apiRequest("/api/tasks",{token}),
    apiRequest("/api/warehouse/products",{token}),
    apiRequest("/api/warehouse/positions",{token}),
    apiRequest("/api/warehouse/documents",{token}),
  ]);
  return {token,users,sites,contacts,calls,messages,deals,tasks,warehouseProducts,warehousePositions,warehouseDocuments};
}
function useIsMobile(bp=720){
  const get=()=>typeof window!=="undefined"&&window.innerWidth<=bp;
  const [isMobile,setIsMobile]=useState(get);
  useEffect(()=>{
    const onResize=()=>setIsMobile(get());
    onResize();
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[bp]);
  return isMobile;
}

// ── Seed ──────────────────────────────────────────────────────────────────────
const SM=[
  {id:"m1",name:"Алексей Морозов",email:"morozov@crm.ru",role:"admin",color:"#4f8ef7",theme:"midnight",board:DEFAULT_BOARD},
  {id:"m2",name:"Светлана Петрова",email:"petrova@crm.ru",role:"manager",color:"#3fb950",theme:"emerald",board:{stats:true,sites:false,managers:true,pipeline:true}},
  {id:"m3",name:"Иван Соколов",email:"sokolov@crm.ru",role:"manager",color:"#a371f7",theme:"plum",board:{stats:true,sites:true,managers:false,pipeline:true}},
];
const SS=[
  {id:"s1",name:"Главный сайт",domain:"мировые-мощности.рф",color:"#4f8ef7",active:true,apiKey:PUBLIC_SITE_KEY,
   recording:{enabled:true,disclaimerEnabled:true,disclaimerText:DISC_TEMPLATES.ru,disclaimerVoice:true,disclaimerVoiceGender:"female",disclaimerVoiceDelay:3,disclaimerShowInChat:true},
   channels:["whatsapp","telegram","max","avito"],assignedManagers:["m1","m2"],stats:{calls:142,messages:388,leads:24},createdAt:Date.now()-86400000*30},
  {id:"s2",name:"Интернет-магазин",domain:"shop.mysite.ru",color:"#3fb950",active:true,apiKey:"sk_live_"+uid(),
   recording:{enabled:true,disclaimerEnabled:true,disclaimerText:DISC_TEMPLATES.short,disclaimerVoice:false,disclaimerVoiceGender:"male",disclaimerVoiceDelay:0,disclaimerShowInChat:true},
   channels:["whatsapp","instagram","vk"],assignedManagers:["m2","m3"],stats:{calls:89,messages:210,leads:15},createdAt:Date.now()-86400000*10},
  {id:"s3",name:"Лендинг акции",domain:"promo.mysite.ru",color:"#a371f7",active:false,apiKey:"sk_live_"+uid(),
   recording:{enabled:false,disclaimerEnabled:false,disclaimerText:DISC_TEMPLATES.ru,disclaimerVoice:false,disclaimerVoiceGender:"female",disclaimerVoiceDelay:0,disclaimerShowInChat:false},
   channels:["telegram"],assignedManagers:["m1"],stats:{calls:12,messages:45,leads:3},createdAt:Date.now()-86400000*5},
];
const SC=[
  {id:"c1",name:"Анна Иванова",phone:"+7 916 234-56-78",email:"ivanova@alpha.ru",company:"ООО Альфа",status:"client",leadStage:"client",tags:["VIP","дом"],managerId:"m1",siteId:"s1",createdAt:Date.now()-86400000*5},
  {id:"c2",name:"Михаил Соколов",phone:"+7 903 111-22-33",email:"m.sokolov@mail.ru",company:"ИП Соколов",status:"lead",leadStage:"new",tags:["Демо","магазин"],managerId:"m2",siteId:"s2",createdAt:Date.now()-86400000*2},
  {id:"c3",name:"Екатерина Лебедева",phone:"+7 926 555-44-33",email:"lebed@stroy.ru",company:"СтройТех",status:"lead",leadStage:"meeting",tags:["Тендер","оборудование"],managerId:"m1",siteId:"s1",createdAt:Date.now()-86400000},
  {id:"c4",name:"Дмитрий Козлов",phone:"+7 985 678-90-12",email:"kozlov@media.ru",company:"МедиаГрупп",status:"lost",leadStage:"refused",tags:["отказ"],managerId:"m3",siteId:"s3",createdAt:Date.now()-86400000*10},
  {id:"c5",name:"Ольга Смирнова",phone:"+7 912 345-67-89",email:"smirnova@tech.ru",company:"ТехноСтарт",status:"lead",leadStage:"installment",tags:["Горячий","рассрочка"],managerId:"m2",siteId:"s2",createdAt:Date.now()-3600000*3},
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
  {id:"ms8",contactId:"c3",channel:"max",managerId:"m1",siteId:"s1",text:"Здравствуйте! Пишу из MAX, хочу уточнить условия подключения",incoming:true,read:false,createdAt:Date.now()-420000},
];
const SD=[
  {id:"d1",title:"Тариф Pro · Альфа",contactId:"c1",managerId:"m1",siteId:"s1",amount:48000,stage:"Переговоры",tags:["VIP","подписка"],createdAt:Date.now()-86400000*2},
  {id:"d2",title:"Поставка · СтройТех",contactId:"c3",managerId:"m1",siteId:"s1",amount:340000,stage:"КП отправлено",tags:["склад","тендер"],createdAt:Date.now()-86400000},
  {id:"d3",title:"Демо · ИП Соколов",contactId:"c2",managerId:"m2",siteId:"s2",amount:12000,stage:"Новый",tags:["демо"],createdAt:Date.now()-3600000*5},
  {id:"d4",title:"Реклама · ТехноСтарт",contactId:"c5",managerId:"m2",siteId:"s2",amount:85000,stage:"Новый",tags:["горячий"],createdAt:Date.now()-3600000*3},
];
const STK=[
  {id:"t1",title:"Перезвонить Соколову",contactId:"c2",managerId:"m2",dueAt:Date.now()+86400000,done:false,createdAt:Date.now()-3600000*2},
  {id:"t2",title:"Отправить КП Ивановой",contactId:"c1",managerId:"m1",dueAt:Date.now()+3600000*3,done:false,createdAt:Date.now()-3600000},
  {id:"t3",title:"Уточнить тендер Лебедевой",contactId:"c3",managerId:"m1",dueAt:Date.now()+3600000*8,done:false,createdAt:Date.now()-1800000},
  {id:"t4",title:"Прислать прайс Смирновой",contactId:"c5",managerId:"m2",dueAt:Date.now()-3600000,done:false,createdAt:Date.now()-7200000},
  {id:"t5",title:"Согласовать счёт",contactId:"c3",managerId:"m1",dueAt:Date.now()-86400000,done:true,createdAt:Date.now()-86400000*2},
];
const SP=[
  {id:"p1",sku:"CRM-PRO-12",name:"Лицензия CRM Pro · 12 мес",category:"Подписки",unit:"шт",stock:18,reserved:3,price:48000,cost:18000,tags:["подписка","pro"]},
  {id:"p2",sku:"CALL-REC",name:"Модуль записи звонков",category:"Модули",unit:"шт",stock:9,reserved:1,price:22000,cost:7000,tags:["звонки","rec"]},
  {id:"p3",sku:"MESS-MAX",name:"Интеграция MAX",category:"Интеграции",unit:"шт",stock:24,reserved:2,price:15000,cost:4000,tags:["max","мессенджер"]},
  {id:"p4",sku:"SETUP-BASE",name:"Настройка и обучение",category:"Услуги",unit:"час",stock:40,reserved:8,price:3500,cost:1200,tags:["услуги"]},
  {id:"p5",sku:"SIP-GW",name:"SIP-шлюз для телефонии",category:"Оборудование",unit:"шт",stock:6,reserved:0,price:18500,cost:11200,tags:["sip","оборудование"]},
];
const SWD=[
  {id:"doc1",type:"Товарная накладная",number:"TORG-12-0001",contactId:"c3",amount:340000,status:"Подготовлен",createdAt:Date.now()-86400000},
  {id:"doc2",type:"Счет на оплату",number:"INV-0002",contactId:"c1",amount:48000,status:"Отправлен",createdAt:Date.now()-3600000*3},
];
const SWC=[
  {id:"ctr1",contactId:"c1",number:"Д-24/001",subject:"Поставка лицензий и модулей CRM",status:"Действует",amount:180000,validTo:Date.now()+86400000*180},
  {id:"ctr2",contactId:"c3",number:"Д-24/014",subject:"Оборудование и внедрение",status:"Согласование",amount:340000,validTo:Date.now()+86400000*45},
];
const SIM=[
  {id:"im1",fromId:"m2",toId:"team",text:"Коллеги, сегодня фокус на входящие из MAX и лиды с главного сайта.",createdAt:Date.now()-3600000*2,pinned:true},
  {id:"im2",fromId:"m1",toId:"m2",text:"Светлана, посмотри сделку по ТехноСтарт, там высокий чек.",createdAt:Date.now()-3600000,task:true},
  {id:"im3",fromId:"m3",toId:"team",text:"Я закрыл вопрос по промо-лендингу, жду новые материалы.",createdAt:Date.now()-1800000},
];
const DEFAULT_TAGS=["Клиент","Лид","VIP","дом","Демо","магазин","Тендер","оборудование","отказ","Горячий","рассрочка","подписка","склад","тендер","демо","горячий","pro","звонки","rec","max","мессенджер","услуги","sip"].map((name,i)=>({
  id:name.toLowerCase().replace(/\s+/g,"-"),
  name,
  color:[C.purple,C.teal,C.amber,C.green,C.red,C.accent][i%6],
  bg:[C.purple,C.teal,C.amber,C.green,C.red,C.accent][i%6]+"22",
}));

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Avatar({name,size=32,color}){
  const bg=color||avatarColor(name||"?");
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg+"28",border:`1px solid ${bg}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.33,fontWeight:600,color:bg,flexShrink:0}}>{initials(name)}</div>;
}
function ChIcon({ch,size=18}){
  const c=CHANNELS[ch];if(!c)return null;
  const common={width:size,height:size,borderRadius:5,background:c.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0};
  const glyph={whatsapp:"☎",telegram:"➤",max:"M",avito:"A",instagram:"◎",vk:"VK",youtube:"▶"}[ch]||c.icon;
  return <div title={c.label} aria-label={c.label} style={{...common,fontSize:size*(ch==="vk" ? .34 : .58),fontWeight:800,fontFamily:"Arial,sans-serif"}}>{glyph}</div>;
}
function Badge({label,color=C.accent,small}){
  return <span style={{fontSize:small?10:11,padding:small?"1px 6px":"2px 8px",borderRadius:20,background:color+"22",color,border:`1px solid ${color}44`,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
}
function TagBadge({name,tags=[],small}){
  const tag=tags.find(t=>t.name===name);
  const color=tag?.color||C.purple;
  const bg=tag?.bg||color+"22";
  return <span style={{fontSize:small?10:11,padding:small?"1px 6px":"2px 8px",borderRadius:20,background:bg,color,border:`1px solid ${color}44`,fontWeight:600,whiteSpace:"nowrap"}}>{name}</span>;
}
function TagSelector({value=[],tags=[],onChange}){
  const selected=Array.isArray(value)?value:[];
  const toggle=name=>onChange(selected.includes(name)?selected.filter(t=>t!==name):[...selected,name]);
  return <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"8px",border:`1px solid ${C.border}`,borderRadius:8,background:C.surface}}>
    {tags.map(tag=><button key={tag.id||tag.name} type="button" onClick={()=>toggle(tag.name)} style={{background:selected.includes(tag.name)?tag.bg:C.surface,color:tag.color,border:`1px solid ${selected.includes(tag.name)?tag.color:C.border}`,borderRadius:20,padding:"4px 9px",fontSize:12,fontWeight:600}}>{tag.name}</button>)}
    {!tags.length&&<span style={{fontSize:12,color:C.muted}}>Сначала добавьте теги в разделе "Теги"</span>}
  </div>;
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
function QuickCreateBar({features,onClient,onLead,onProduct,onSource,onDeal,onTask,onDocument,mobile=false}){
  const items=[
    ["contacts","+ Клиент",onClient],
    ["contacts","+ Лид",onLead],
    ["warehouse","+ Товар",onProduct],
    ["sites","+ Источник",onSource],
    ["deals","+ Сделка",onDeal],
    ["tasks","+ Задача",onTask],
    ["warehouse","+ Документ",onDocument],
  ].filter(([feature,,action])=>action&&(feature==="always"||features?.[feature]));
  return <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:mobile?"flex-start":"flex-end",flexWrap:mobile?"nowrap":"wrap",overflowX:mobile?"auto":"visible",width:mobile?"100%":"auto",paddingBottom:mobile?2:0}}>
    {items.map(([_,label,action])=><Btn key={label} small onClick={action} style={{whiteSpace:"nowrap",flexShrink:0}}>{label}</Btn>)}
  </div>;
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
class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(error){return{error};}
  componentDidCatch(error){console.error(error);}
  render(){
    if(this.state.error)return <div style={{padding:24,color:C.red,background:C.bg,flex:1,overflow:"auto"}}><div style={{fontWeight:700,marginBottom:8}}>Ошибка экрана</div><pre style={{whiteSpace:"pre-wrap",fontSize:12}}>{this.state.error.message}</pre></div>;
    return this.props.children;
  }
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
  {id:"exec",label:"Руководитель",ic:"◎"},
  {id:"features",label:"Функции",ic:"☷"},
  {id:"tags",label:"Теги",ic:"⌗"},
  {id:"sites",label:"Сайты",ic:"◫"},
  {id:"warehouse",label:"Склад",ic:"▦"},
  {id:"inbox",label:"Входящие",ic:"✉"},
  {id:"chat",label:"Чат",ic:"☰"},
  {id:"calls",label:"Звонки",ic:"✆"},
  {id:"contacts",label:"Контакты",ic:"◈"},
  {id:"deals",label:"Сделки",ic:"◇"},
  {id:"tasks",label:"Задачи",ic:"☑"},
  {id:"team",label:"Команда",ic:"◉"},
  {id:"settings",label:"Настройки",ic:"⚙"},
];
function Sidebar({page,setPage,unread,missed,overdueTasksCount,sites,currentManager,features=DEFAULT_FEATURES,mobile=false,appTheme=THEMES.midnight}){
  const visibleNav=NAV.filter(n=>["dashboard","features","settings"].includes(n.id)||features[n.id]);
  const sideBg=appTheme.sidebar||"#14251d";
  const accent=appTheme.accent||C.accent;
  const sideLine="rgba(255,255,255,.08)";
  const sideText=appTheme.sidebarText||"#ffffff";
  const sideMuted=appTheme.sidebarText?"#667464":"#b7c6b2";
  if(mobile)return <div style={{background:sideBg,color:sideText,borderBottom:`1px solid ${sideLine}`,flexShrink:0}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"10px 12px",borderBottom:`1px solid ${sideLine}`}}>
      <div>
        <div style={{fontSize:15,fontWeight:700}}>CRM <span style={{color:accent}}>torenaOne</span></div>
        <div style={{fontSize:10,color:sideMuted}}>{sites.filter(s=>s.active).length} сайта активно</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
        <Avatar name={currentManager?.name||"?"} size={28} color={currentManager?.color}/>
        <div style={{fontSize:11,fontWeight:600,maxWidth:95,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentManager?.name?.split(" ")[0]||"—"}</div>
      </div>
    </div>
    <nav style={{display:"flex",gap:6,overflowX:"auto",padding:"8px 10px",scrollbarWidth:"none"}}>
      {visibleNav.map(n=>{
        const active=page===n.id;
        const badge=n.id==="inbox"?unread:n.id==="calls"?missed:n.id==="tasks"?overdueTasksCount:0;
        return <button key={n.id} onClick={()=>setPage(n.id)} style={{flex:"0 0 auto",display:"inline-flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:8,background:active?accent+"44":"rgba(255,255,255,.06)",color:active?sideText:sideMuted,border:`1px solid ${active?accent:"transparent"}`,fontWeight:active?700:500}}>
          <span>{n.ic}</span><span>{n.label}</span>{badge>0&&<span style={{background:n.id==="calls"?C.red:n.id==="tasks"?C.amber:accent,color:"#fff",borderRadius:10,fontSize:10,padding:"1px 5px",fontWeight:700}}>{badge}</span>}
        </button>;
      })}
    </nav>
  </div>;
  return <div style={{width:195,background:sideBg,borderRight:`1px solid ${sideLine}`,display:"flex",flexDirection:"column",flexShrink:0,color:sideText}}>
    <div style={{padding:"15px 14px",borderBottom:`1px solid ${sideLine}`}}>
      <div style={{fontSize:15,fontWeight:700,color:sideText}}>CRM <span style={{color:accent}}>torenaOne</span></div>
      <div style={{fontSize:10,color:sideMuted,marginTop:1}}>{sites.filter(s=>s.active).length} сайта активно</div>
    </div>
    <nav style={{padding:"6px 0",flex:1,overflowY:"auto"}}>
      {visibleNav.map(n=>{
        const active=page===n.id;
        const badge=n.id==="inbox"?unread:n.id==="calls"?missed:n.id==="tasks"?overdueTasksCount:0;
        return <div key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 14px",cursor:"pointer",color:active?sideText:sideMuted,background:active?accent+"33":"transparent",borderLeft:`2px solid ${active?accent:"transparent"}`,transition:"all .12s",fontWeight:active?600:400}}
          onMouseEnter={e=>{if(!active){e.currentTarget.style.color=sideText;e.currentTarget.style.background="rgba(255,255,255,.06)";}}}
          onMouseLeave={e=>{if(!active){e.currentTarget.style.color=sideMuted;e.currentTarget.style.background="transparent";}}}>
          <span style={{fontSize:14}}>{n.ic}</span>
          <span style={{fontSize:13}}>{n.label}</span>
          {badge>0&&<span style={{marginLeft:"auto",background:n.id==="calls"?C.red:n.id==="tasks"?C.amber:accent,color:"#fff",borderRadius:10,fontSize:10,padding:"1px 6px",fontWeight:700}}>{badge}</span>}
        </div>;
      })}
    </nav>
    {/* Sites mini */}
    <div style={{padding:"8px 14px",borderTop:`1px solid ${sideLine}`}}>
      <div style={{fontSize:10,color:sideMuted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:7}}>Сайты</div>
      {sites.slice(0,3).map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:s.active?s.color:sideMuted,flexShrink:0}}/>
        <div style={{fontSize:11,color:s.active?sideText:sideMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{s.name}</div>
        {s.recording.enabled&&<div className="blink" style={{width:5,height:5,borderRadius:"50%",background:C.red}}/>}
      </div>)}
    </div>
    <div style={{padding:"10px 14px",borderTop:`1px solid ${sideLine}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Avatar name={currentManager?.name||"?"} size={26} color={currentManager?.color}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentManager?.name?.split(" ")[0]||"—"}</div>
          <div style={{fontSize:10,color:sideMuted}}>{currentManager?.role==="admin"?"Администратор":"Менеджер"}</div>
        </div>
      </div>
    </div>
  </div>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({calls,contacts,messages,deals,tasks,managers,sites,stages=STAGES,setPage,board=DEFAULT_BOARD,mobile=false}){
  const unread=messages.filter(m=>m.incoming&&!m.read).length;
  const missed=calls.filter(c=>c.status==="missed").length;
  const overdue=tasks.filter(t=>!t.done&&t.dueAt&&t.dueAt<Date.now()).length;
  const noDiscl=sites.filter(s=>s.recording.enabled&&!s.recording.disclaimerEnabled);
  const closedStage=stages[stages.length-1]||STAGES[STAGES.length-1];
  const pipeline=deals.filter(d=>d.stage!==closedStage).reduce((s,d)=>s+d.amount,0);

  const Stat=({label,val,sub,color,onClick})=><div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,cursor:onClick?"pointer":"default"}}
    onMouseEnter={e=>{if(onClick)e.currentTarget.style.borderColor=C.accent;}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{label}</div>
    <div style={{fontSize:24,fontWeight:700,color:color||C.text}}>{val}</div>
    {sub&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{sub}</div>}
  </div>;

  return <div className="ani" style={{padding:20,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
    {noDiscl.length>0&&<div style={{background:C.amberDim,border:`1px solid ${C.amber}55`,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
      <span style={{fontSize:20,flexShrink:0}}>⚠️</span>
      <div>
        <div style={{fontWeight:600,color:C.amber,marginBottom:3}}>Запись без предупреждения клиента!</div>
        <div style={{fontSize:12,color:C.muted}}><b style={{color:C.text}}>{noDiscl.map(s=>s.name).join(", ")}</b> — запись включена, но уведомление отключено. Нарушение ст. 23 Конституции РФ и ФЗ-149.</div>
      </div>
      <Btn small onClick={()=>setPage("sites")} style={{flexShrink:0}}>Исправить</Btn>
    </div>}

    {board.stats&&<div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:10}}>
      <Stat label="Сайты" val={sites.filter(s=>s.active).length} sub={`из ${sites.length} подключено`} onClick={()=>setPage("sites")}/>
      <Stat label="Непрочитанных" val={unread} color={unread>0?C.accent:C.muted} sub="сообщений" onClick={()=>setPage("inbox")}/>
      <Stat label="Пропущено" val={missed} color={missed>0?C.red:C.muted} sub="звонков" onClick={()=>setPage("calls")}/>
      <Stat label="Просрочено" val={overdue} color={overdue>0?C.amber:C.muted} sub="задач" onClick={()=>setPage("tasks")}/>
    </div>}

    {/* Sites activity */}
    {board.sites&&<div>
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
            {s.recording.enabled&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.red,padding:"2px 7px",background:C.redDim,borderRadius:20,border:`1px solid ${C.red}44`}}>
              <RecDot on/>{s.recording.disclaimerEnabled?"REC":"REC ⚠️"}
            </div>}
            {!s.active&&<Badge label="Откл." color={C.muted} small/>}
          </div>;
        })}
      </div>
    </div>}

    {/* Managers load */}
    {board.managers&&<div>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Нагрузка менеджеров</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
        {managers.map(m=>{
          const mCalls=calls.filter(c=>c.managerId===m.id).length;
          const mUnread=messages.filter(ms=>ms.managerId===m.id&&ms.incoming&&!ms.read).length;
          const mDeals=deals.filter(d=>d.managerId===m.id&&d.stage!==closedStage).length;
          return <div key={m.id} style={{background:C.card,borderRadius:10,padding:"10px 13px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
            <Avatar name={m.name} size={34} color={m.color}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{mDeals} сделок · {mCalls} зв. {mUnread>0&&<span style={{color:C.accent}}>· {mUnread} новых</span>}</div>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {/* Pipeline */}
    {board.pipeline&&<div>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Воронка · {pipeline.toLocaleString()} ₽ в работе</div>
      <div style={{display:"flex",gap:6}}>
        {stages.map((st,i)=>{
          const cnt=deals.filter(d=>d.stage===st).length;
          const sum=deals.filter(d=>d.stage===st).reduce((s,d)=>s+d.amount,0);
          const color={Новый:C.muted,Переговоры:C.accent,"КП отправлено":C.amber,Закрыт:C.green}[st]||(i===stages.length-1?C.green:C.accent);
          return <div key={st} style={{flex:1,background:C.card,borderRadius:9,padding:"10px 12px",border:`1px solid ${color}44`}}>
            <div style={{fontSize:11,color:color,fontWeight:500,marginBottom:4}}>{st}</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text}}>{cnt}</div>
            <div style={{fontSize:11,color:C.muted}}>{sum>0?sum.toLocaleString()+" ₽":"—"}</div>
          </div>;
        })}
      </div>
    </div>}
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
      <div style={{border:`1px solid ${form.recording.enabled?C.green+"44":C.border}`,borderRadius:12,padding:14,background:form.recording.enabled?C.greenDim:"transparent",transition:"all .3s"}}>
        <Toggle checked={form.recording.enabled} onChange={()=>setR("enabled",!form.recording.enabled)} label="🔴 Запись звонков" sub="Все звонки с этого сайта будут записываться и храниться в MinIO/S3"/>
      </div>

      {form.recording.enabled&&<>
        <div style={{border:`1px solid ${form.recording.disclaimerEnabled?C.red+"44":C.border}`,borderRadius:12,padding:14,background:form.recording.disclaimerEnabled?C.redDim:"transparent",transition:"all .3s"}}>
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
          <div style={{background:C.redDim,border:`1px solid ${C.red}44`,borderRadius:10,padding:12}}>
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
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:s.recording.enabled?C.redDim:C.surface,border:`1px solid ${s.recording.enabled?C.red+"44":C.border}`}}>
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
      <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Вставь в нужное место сайта, где должна появиться форма заявки:</div>
      <pre style={{background:C.card,borderRadius:9,padding:"12px 16px",fontSize:11,fontFamily:"IBM Plex Mono,monospace",color:C.text,border:`1px solid ${C.border}`,overflowX:"auto",lineHeight:1.8}}>{`<div id="mm-crm-widget"></div>
<script
  src="${PUBLIC_CRM_URL}/mm-crm-widget.js"
  data-api="${PUBLIC_CRM_URL}"
  data-site-key="${sites[0]?.apiKey||PUBLIC_SITE_KEY}"
  data-target="#mm-crm-widget"
  data-title="Получить расчет"
  data-button="Отправить заявку">
</script>`}</pre>
    </div>}
  </div>;
}

// ── Inbox ─────────────────────────────────────────────────────────────────────
function Inbox({messages,contacts,managers,sites,currentManager,onSend,onRead,mobile=false}){
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

  return <div style={{display:"flex",flexDirection:mobile?"column":"row",flex:1,overflow:"hidden"}}>
    {/* Thread list */}
    <div style={{width:mobile?"100%":265,height:mobile?260:"auto",borderRight:mobile?"none":`1px solid ${C.border}`,borderBottom:mobile?`1px solid ${C.border}`:"none",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
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
          {(()=>{const site=getSite(selT.ct.siteId);return site?.recording?.enabled&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.red,padding:"3px 9px",background:C.redDim,borderRadius:20,border:`1px solid ${C.red}44`}}><RecDot on/>REC</div>;})()}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:8}}>
          {selT.msgs.map(msg=>{
            const isOut=!msg.incoming;
            const isDisc=msg.text.startsWith("🔴");
            return <div key={msg.id} style={{display:"flex",justifyContent:isOut?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
              {!isOut&&<ChIcon ch={msg.channel} size={16}/>}
              <div style={{maxWidth:"72%"}}>
                {isDisc&&isOut&&<div style={{fontSize:10,color:C.red,marginBottom:3,display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:C.red}}/>Предупреждение о записи</div>}
                <div style={{background:isOut?C.accent:isDisc?C.redDim:C.card,borderRadius:isOut?"12px 12px 3px 12px":"12px 12px 12px 3px",padding:"8px 12px",fontSize:13,border:isOut?"none":isDisc?`1px solid ${C.red}44`:`1px solid ${C.border}`,lineHeight:1.6,whiteSpace:"pre-wrap",color:isOut?"#fff":C.text}}>{msg.text}</div>
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
      {recEnabled&&<label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:`1px solid ${C.red}44`,background:C.redDim,cursor:"pointer"}}>
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

function Calls({calls,contacts,managers,sites,onAdd,mobile=false}){
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
  return <div style={{display:"flex",flexDirection:mobile?"column":"row",flex:1,overflow:"hidden"}}>
    <div style={{flex:mobile?"0 0 330px":1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:mobile?"none":`1px solid ${C.border}`,borderBottom:mobile?`1px solid ${C.border}`:"none"}}>
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
            {c.disclaimerPlayed&&<div title="Предупреждение озвучено" style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:C.red,padding:"2px 6px",background:C.redDim,borderRadius:20,border:`1px solid ${C.red}44`}}><RecDot on/>REC</div>}
            <MgrBadge managerId={c.managerId} managers={managers}/>
            <Badge label={{completed:"Завершён",missed:"Пропущен",busy:"Занято"}[c.status]||c.status} color={stCol} small/>
            <span className="mono" style={{color:C.muted,minWidth:34,textAlign:"right"}}>{fmtDur(c.durationSec)}</span>
          </div>;
        })}
      </div>
    </div>
    <div style={{width:mobile?"100%":300,flex:mobile?1:"0 0 300px",overflowY:"auto",background:C.surface}}>
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
        {selC.disclaimerPlayed&&<div style={{background:C.redDim,border:`1px solid ${C.red}44`,borderRadius:9,padding:"9px 12px"}}>
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
function ContactModal({initial,preset,managers,sites,tagsCatalog=[],onSave,onClose}){
  const blank={name:"",phone:"",email:"",company:"",status:"lead",leadStage:"new",tags:[],managerId:managers[0]?.id||"",siteId:sites[0]?.id||""};
  const [form,setForm]=useState(initial?{...initial,tags:initial.tags||[]}:{...blank,...(preset||{}),tags:Array.isArray(preset?.tags)?preset.tags:preset?.tags?[preset.tags]:[]});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const saveContact=()=>{
    if(!form.name||!form.phone)return;
    const nextStage=form.leadStage||leadStageOf(form);
    const nextStatus=nextStage==="client"?"client":nextStage==="refused"?"lost":form.status;
    onSave({...form,status:nextStatus,leadStage:nextStage,tags:form.tags||[]});
  };
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
      <Fld label="Этап разбора лида"><select value={form.leadStage||"new"} onChange={e=>set("leadStage",e.target.value)}>{LEAD_STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></Fld>
      <Fld label="Менеджер"><select value={form.managerId} onChange={e=>set("managerId",e.target.value)}>{managers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Fld>
      <Fld label="Теги"><TagSelector value={form.tags} tags={tagsCatalog} onChange={v=>set("tags",v)}/></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={saveContact}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function ProductModal({initial,tagsCatalog=[],onSave,onClose}){
  const blank={name:"",sku:"",category:"Товары",unit:"шт",stock:0,reserved:0,price:"",cost:"",tags:[]};
  const [form,setForm]=useState(initial?{...initial,tags:initial.tags||[]}:{...blank});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <Modal title={initial?"Редактировать товар":"Новый товар"} onClose={onClose} width={470}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Fld label="Название *"><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Название товара"/></Fld>
      <Fld label="Артикул *"><input value={form.sku} onChange={e=>set("sku",e.target.value)} placeholder="SKU-001"/></Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Категория"><input value={form.category} onChange={e=>set("category",e.target.value)} placeholder="Оборудование"/></Fld>
        <Fld label="Ед. изм."><input value={form.unit} onChange={e=>set("unit",e.target.value)} placeholder="шт"/></Fld>
        <Fld label="Остаток"><input type="number" value={form.stock} onChange={e=>set("stock",e.target.value)} placeholder="0"/></Fld>
        <Fld label="Резерв"><input type="number" value={form.reserved} onChange={e=>set("reserved",e.target.value)} placeholder="0"/></Fld>
        <Fld label="Цена продажи"><input type="number" value={form.price} onChange={e=>set("price",e.target.value)} placeholder="0"/></Fld>
        <Fld label="Себестоимость"><input type="number" value={form.cost} onChange={e=>set("cost",e.target.value)} placeholder="0"/></Fld>
      </div>
      <Fld label="Теги"><TagSelector value={form.tags} tags={tagsCatalog} onChange={v=>set("tags",v)}/></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>{if(!form.name||!form.sku)return;onSave({...form,stock:parseInt(form.stock)||0,reserved:parseInt(form.reserved)||0,price:parseInt(form.price)||0,cost:parseInt(form.cost)||0,tags:form.tags||[]});}}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function WarehouseDocumentModal({contacts,onSave,onClose}){
  const [form,setForm]=useState({type:"Товарная накладная",number:"",contactId:contacts[0]?.id||"",amount:"",status:"Подготовлен"});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <Modal title="Новый документ склада" onClose={onClose} width={440}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Fld label="Тип документа"><select value={form.type} onChange={e=>set("type",e.target.value)}><option>Товарная накладная</option><option>Счет на оплату</option><option>Акт</option><option>Поступление</option><option>Возврат</option></select></Fld>
      <Fld label="Номер"><input value={form.number} onChange={e=>set("number",e.target.value)} placeholder="DOC-0001"/></Fld>
      <Fld label="Контрагент"><select value={form.contactId} onChange={e=>set("contactId",e.target.value)}>{contacts.map(c=><option key={c.id} value={c.id}>{c.company||c.name}</option>)}</select></Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Сумма"><input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0"/></Fld>
        <Fld label="Статус"><select value={form.status} onChange={e=>set("status",e.target.value)}><option>Подготовлен</option><option>Отправлен</option><option>Проведен</option><option>Оплачен</option></select></Fld>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>onSave({...form,number:form.number||`DOC-${uid().toUpperCase()}`,amount:parseInt(form.amount)||0})}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function Contacts({contacts,calls,messages,managers,sites,tagsCatalog=[],onAdd,onEdit,onStageChange,mobile=false}){
  const [search,setSearch]=useState("");
  const [statusF,setStatusF]=useState("all");
  const [siteF,setSiteF]=useState("all");
  const [mgrF,setMgrF]=useState("all");
  const [tagF,setTagF]=useState("all");
  const [view,setView]=useState("funnel");
  const [pipeline,setPipeline]=useState("primary");
  const [sel,setSel]=useState(null);
  const tags=[...new Set(contacts.flatMap(c=>c.tags||[]))];
  const filtered=contacts.filter(c=>{
    const q=search.toLowerCase();
    return(!q||c.name.toLowerCase().includes(q)||c.phone?.includes(q)||(c.company||"").toLowerCase().includes(q))&&(statusF==="all"||c.status===statusF)&&(siteF==="all"||c.siteId===siteF)&&(mgrF==="all"||c.managerId===mgrF)&&(tagF==="all"||(c.tags||[]).includes(tagF));
  });
  const selC=sel?contacts.find(c=>c.id===sel):null;
  const selCalls=selC?calls.filter(c=>c.contactId===selC.id):[];
  const selMsgs=selC?messages.filter(m=>m.contactId===selC.id):[];
  const chs=[...new Set(selMsgs.map(m=>m.channel))];
  const stMap={client:[C.green,"Клиент"],lead:[C.accent,"Лид"],lost:[C.muted,"Потерян"]};
  const getSite=id=>sites.find(s=>s.id===id);
  const getMgr=id=>managers.find(m=>m.id===id);
  const moveLead=(id,stage)=>onStageChange?.(id,stage);
  const pipelines=[["primary","Первичная обработка"],["production","Производство"],["service","Сервисное обслуживание"],["deferred","Отложенный спрос"],["refused","Отказы"]];
  const visibleStages=pipeline==="deferred"?LEAD_STAGES.filter(s=>s.id==="deferred"):pipeline==="refused"?LEAD_STAGES.filter(s=>s.id==="refused"):pipeline==="service"?LEAD_STAGES.filter(s=>["qualified","meeting","client"].includes(s.id)):LEAD_STAGES;
  const leadCard=(c)=>{
    const stage=leadStageOf(c);
    const stageIndex=LEAD_STAGES.findIndex(s=>s.id===stage);
    const site=getSite(c.siteId);
    const mgr=getMgr(c.managerId);
    return <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:10,display:"flex",flexDirection:"column",gap:7}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
        <button onClick={()=>setSel(c.id)} style={{background:"transparent",color:C.teal,textAlign:"left",fontWeight:700,lineHeight:1.3,flex:1}}>{c.name}</button>
        <span className="mono" style={{color:C.muted,whiteSpace:"nowrap"}}>{fmtDate(c.createdAt)}</span>
      </div>
      <div style={{fontSize:12,color:C.muted,lineHeight:1.45}}>{c.company||c.phone||"Без компании"}</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {site&&<SiteBadge siteId={c.siteId} sites={sites}/>}
        {mgr&&<MgrBadge managerId={c.managerId} managers={managers}/>}
        {c.tags?.map(t=><TagBadge key={t} name={t} tags={tagsCatalog} small/>)}
      </div>
      <select value={stage} onChange={e=>moveLead(c.id,e.target.value)} style={{fontSize:12}}>
        {LEAD_STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <div style={{display:"flex",gap:4}}>
        {stageIndex>0&&<Btn small onClick={()=>moveLead(c.id,LEAD_STAGES[stageIndex-1].id)}>←</Btn>}
        {stageIndex<LEAD_STAGES.length-1&&<Btn small primary onClick={()=>moveLead(c.id,LEAD_STAGES[stageIndex+1].id)}>→</Btn>}
        <Btn small onClick={()=>onEdit(c)} style={{marginLeft:"auto"}}>✎</Btn>
      </div>
    </div>;
  };
  return <div style={{display:"flex",flexDirection:mobile?"column":"row",flex:1,overflow:"hidden"}}>
    <div style={{flex:mobile?"0 0 360px":1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:mobile?"none":`1px solid ${C.border}`,borderBottom:mobile?`1px solid ${C.border}`:"none"}}>
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
        <select value={tagF} onChange={e=>setTagF(e.target.value)} style={{fontSize:12,width:105}}>
          <option value="all">Все интересы</option>{tags.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select value={pipeline} onChange={e=>setPipeline(e.target.value)} style={{fontSize:12,width:170}}>
          {pipelines.map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </select>
        <div style={{display:"inline-flex",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
          {[["funnel","Воронка"],["list","Список"]].map(([id,label])=><button key={id} onClick={()=>setView(id)} style={{padding:"6px 10px",background:view===id?C.accentDim:C.surface,color:view===id?C.accent:C.text,border:"none",borderRadius:0,fontSize:12,fontWeight:view===id?700:500}}>{label}</button>)}
        </div>
        <Btn primary small onClick={onAdd}>+ Контакт</Btn>
      </div>
      {view==="funnel"?<div style={{flex:1,overflowX:"auto",overflowY:"hidden",padding:10}}>
        <div style={{display:"flex",gap:10,alignItems:"stretch",minWidth:mobile?visibleStages.length*250:visibleStages.length*255,height:"100%"}}>
          {visibleStages.map((st,i)=>{
            const col=filtered.filter(c=>leadStageOf(c)===st.id);
            const colColor=[C.accent,C.teal,C.green,C.amber,C.purple,C.red,C.green][i]||C.accent;
            return <div key={st.id} style={{flex:"0 0 245px",background:C.surface,border:`1px solid ${colColor}55`,borderRadius:12,display:"flex",flexDirection:"column",maxHeight:"100%"}}>
              <div style={{padding:"10px 12px",borderBottom:`2px solid ${colColor}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div><div style={{fontSize:12,fontWeight:800,textTransform:"uppercase"}}>{st.label}</div><div style={{fontSize:11,color:C.muted}}>лидов: {col.length}</div></div>
                <Badge label={col.length} color={colColor} small/>
              </div>
              <div style={{padding:8,overflowY:"auto",display:"flex",flexDirection:"column",gap:7}}>
                {col.map(leadCard)}
                {col.length===0&&<div style={{padding:16,textAlign:"center",fontSize:12,color:C.muted,border:`1px dashed ${C.border}`,borderRadius:9}}>Пусто</div>}
              </div>
            </div>;
          })}
        </div>
      </div>:<div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:5}}>
        {filtered.length===0&&<div style={{color:C.muted,textAlign:"center",marginTop:40}}>Нет контактов</div>}
        {filtered.map(c=>{
          const isSel=c.id===sel;
          const cChs=[...new Set(messages.filter(m=>m.contactId===c.id).map(m=>m.channel))];
          const unread=messages.filter(m=>m.contactId===c.id&&m.incoming&&!m.read).length;
          const[stCol,stLabel]=stMap[c.status]||[C.muted,c.status];
          const leadStage=LEAD_STAGES.find(s=>s.id===leadStageOf(c));
          return <div key={c.id} onClick={()=>setSel(c.id===sel?null:c.id)} className="ani"
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:`1px solid ${isSel?C.accent:C.border}`,background:isSel?C.accentDim+"30":C.card,cursor:"pointer",transition:"all .12s"}}>
            <Avatar name={c.name} size={34}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
              <div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.company} · {c.phone}</div>
            </div>
            <div style={{display:"flex",gap:3}}>{cChs.map(ch=><ChIcon key={ch} ch={ch} size={14}/>)}</div>
            {unread>0&&<Badge label={unread} color={C.accent} small/>}
            {c.tags?.slice(0,2).map(t=><TagBadge key={t} name={t} tags={tagsCatalog} small/>)}
            <SiteBadge siteId={c.siteId} sites={sites}/>
            <Badge label={stLabel} color={stCol} small/>
            {leadStage&&<Badge label={leadStage.short} color={C.teal} small/>}
            <MgrBadge managerId={c.managerId} managers={managers}/>
            <Btn small onClick={e=>{e.stopPropagation();onEdit(c);}}>✎</Btn>
          </div>;
        })}
      </div>}
    </div>
    <div style={{width:mobile?"100%":285,flex:mobile?1:"0 0 285px",overflowY:"auto",background:C.surface}}>
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
function DealModal({contacts,managers,sites,stages=STAGES,tagsCatalog=[],initialStage,onSave,onClose}){
  const [form,setForm]=useState({title:"",contactId:"",managerId:managers[0]?.id||"",siteId:sites[0]?.id||"",amount:"",stage:initialStage||stages[0]||STAGES[0],tags:[]});
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
      <Fld label="Этап"><select value={form.stage} onChange={e=>set("stage",e.target.value)}>{stages.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
      <Fld label="Теги"><TagSelector value={form.tags} tags={tagsCatalog} onChange={v=>set("tags",v)}/></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>{if(!form.title)return;onSave({...form,amount:parseInt(form.amount)||0,tags:form.tags||[]});}}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function Deals({deals,contacts,managers,sites,stages=STAGES,tagsCatalog=[],onAdd,onMove,onDelete,onStagesChange,onRenameStage}){
  const [siteF,setSiteF]=useState("all");
  const [tagF,setTagF]=useState("all");
  const tags=[...new Set(deals.flatMap(d=>d.tags||[]))];
  const filtered=deals.filter(d=>(siteF==="all"||d.siteId===siteF)&&(tagF==="all"||(d.tags||[]).includes(tagF)));
  const closedStage=stages[stages.length-1]||STAGES[STAGES.length-1];
  const pipeline=filtered.filter(d=>d.stage!==closedStage).reduce((s,d)=>s+d.amount,0);
  const normalize=list=>[...new Set(list.map(s=>String(s||"").trim()).filter(Boolean))];
  const addStage=()=>{
    const name=window.prompt("Название нового этапа воронки", "Новый этап")?.trim();
    if(!name)return;
    if(stages.includes(name)){window.alert("Такой этап уже есть");return;}
    onStagesChange?.(normalize([...stages,name]));
  };
  const renameStage=stage=>{
    const name=window.prompt("Новое название этапа", stage)?.trim();
    if(!name||name===stage)return;
    if(stages.includes(name)){window.alert("Такой этап уже есть");return;}
    onStagesChange?.(stages.map(s=>s===stage?name:s));
    onRenameStage?.(stage,name);
  };
  const removeStage=stage=>{
    if(stages.length<=1)return;
    if(deals.some(d=>d.stage===stage)){window.alert("Сначала перенесите или удалите сделки из этого этапа");return;}
    if(!window.confirm(`Удалить пустой этап "${stage}"?`))return;
    onStagesChange?.(stages.filter(s=>s!==stage));
  };
  const moveStage=(index,dir)=>{
    const next=[...stages];
    const target=index+dir;
    if(target<0||target>=next.length)return;
    [next[index],next[target]]=[next[target],next[index]];
    onStagesChange?.(next);
  };
  return <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
    <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
      <select value={siteF} onChange={e=>setSiteF(e.target.value)} style={{fontSize:12,width:140}}>
        <option value="all">Все сайты</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select value={tagF} onChange={e=>setTagF(e.target.value)} style={{fontSize:12,width:130}}>
        <option value="all">Все теги</option>{tags.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <div style={{fontSize:12,color:C.muted}}>{filtered.length} сделок · <span style={{color:C.green}}>{pipeline.toLocaleString()} ₽ в воронке</span></div>
      <div style={{flex:1}}/>
      <Btn small onClick={addStage}>+ Этап</Btn>
      <Btn primary small onClick={()=>onAdd(stages[0]||STAGES[0])}>+ Сделка</Btn>
    </div>
    <div style={{flex:1,overflowX:"auto",overflowY:"hidden",padding:14}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start",height:"100%",minWidth:stages.length*240}}>
        {stages.map((stage,idx)=>{
          const sd=filtered.filter(d=>d.stage===stage);
          const sum=sd.reduce((s,d)=>s+d.amount,0);
          const stageColor={Новый:C.muted,Переговоры:C.accent,"КП отправлено":C.amber,Закрыт:C.green}[stage]||(idx===stages.length-1?C.green:[C.muted,C.accent,C.amber,C.purple,C.teal][idx%5]);
          return <div key={stage} style={{flex:"0 0 230px",background:C.surface,borderRadius:12,border:`1px solid ${stageColor}44`,display:"flex",flexDirection:"column",maxHeight:"100%"}}>
            <div style={{padding:"10px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:6,flexShrink:0}}>
              <button onClick={()=>renameStage(stage)} title="Переименовать этап" style={{background:"transparent",color:stageColor,textAlign:"left",fontWeight:700,fontSize:13,lineHeight:1.25,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{stage}</button>
              <div style={{textAlign:"right"}}>
                <Badge label={sd.length} color={stageColor} small/>
                {sum>0&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{sum.toLocaleString()} ₽</div>}
              </div>
              <Btn small onClick={()=>moveStage(idx,-1)} disabled={idx===0} style={{padding:"4px 7px"}}>←</Btn>
              <Btn small onClick={()=>moveStage(idx,1)} disabled={idx===stages.length-1} style={{padding:"4px 7px"}}>→</Btn>
              <Btn small onClick={()=>renameStage(stage)} style={{padding:"4px 7px"}}>✎</Btn>
              {sd.length===0&&stages.length>1&&<Btn small danger onClick={()=>removeStage(stage)} style={{padding:"4px 7px"}}>×</Btn>}
            </div>
            <div style={{padding:8,display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}}>
              {sd.map(d=>{
                const ct=contacts.find(c=>c.id===d.contactId);
                const site=sites.find(s=>s.id===d.siteId);
                const si=stages.indexOf(stage);
                return <div key={d.id} style={{background:C.card,borderRadius:9,padding:10,border:`1px solid ${C.border}`}}>
                  <div style={{fontWeight:500,fontSize:12,marginBottom:4}}>{d.title}</div>
                  {ct&&<div style={{fontSize:11,color:C.muted,marginBottom:3}}>{ct.name}</div>}
                  {site&&<SiteBadge siteId={d.siteId} sites={sites}/>}
                  {d.amount>0&&<div style={{fontSize:13,color:C.green,fontWeight:600,margin:"6px 0"}}>{(d.amount||0).toLocaleString()} ₽</div>}
                  <div style={{marginBottom:6}}><MgrBadge managerId={d.managerId} managers={managers}/></div>
                  {d.tags?.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>{d.tags.map(t=><TagBadge key={t} name={t} tags={tagsCatalog} small/>)}</div>}
                  <div style={{display:"flex",gap:4}}>
                    {si>0&&<Btn small onClick={()=>onMove(d.id,stages[si-1])}>←</Btn>}
                    {si<stages.length-1&&<Btn small primary onClick={()=>onMove(d.id,stages[si+1])}>→</Btn>}
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

// ── Warehouse ─────────────────────────────────────────────────────────────────
function Warehouse({products,setProducts,onSaveProduct,onCreateProduct,positions=[],contacts,setContacts,managers,sites,currentManager,onCreateDeal,documents,setDocuments,onCreateDocument,contracts,setContracts,deals,tagsCatalog=[],onAddClient,onAddLead,onAddSource,onAddProduct,onAddDocument,onAddTask,mobile=false}){
  const [section,setSection]=useState("indicators");
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("all");
  const [tagFilter,setTagFilter]=useState("all");
  const [cart,setCart]=useState([]);
  const [contactId,setContactId]=useState(contacts[0]?.id||"");
  const [newContact,setNewContact]=useState("");
  const [siteId,setSiteId]=useState(sites[0]?.id||"");
  const [stage,setStage]=useState("Новый");
  const [dealTitle,setDealTitle]=useState("");
  const [receipt,setReceipt]=useState({productId:products[0]?.id||"",qty:1,cost:"",supplierId:contacts[0]?.id||"",number:""});
  const [model,setModel]=useState({name:"",sku:"",category:"Товары",unit:"шт",price:"",cost:"",stock:0,tags:[]});
  const [contract,setContract]=useState({contactId:contacts[0]?.id||"",number:"",subject:"",amount:"",status:"Действует"});
  const categories=["all",...new Set(products.map(p=>p.category))];
  const productTags=[...new Set(products.flatMap(p=>p.tags||[]))];
  const filtered=products.filter(p=>{
    const q=query.toLowerCase();
    return(category==="all"||p.category===category)&&(tagFilter==="all"||(p.tags||[]).includes(tagFilter))&&(!q||p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q)||(p.tags||[]).some(t=>t.toLowerCase().includes(q)));
  });
  const filteredPositions=positions.filter(p=>{
    const q=query.toLowerCase();
    return(category==="all"||p.category===category)&&(tagFilter==="all"||p.status===tagFilter||p.category===tagFilter)&&(!q||[p.name,p.serial,p.status,p.contactName,p.phone,p.place,p.source,p.manager,p.notes].some(v=>(v||"").toString().toLowerCase().includes(q)));
  });
  const total=cart.reduce((sum,row)=>sum+row.qty*row.price,0);
  const reserve=products.reduce((sum,p)=>sum+(p.reserved||0)*p.price,0);
  const stockSum=products.reduce((sum,p)=>sum+(p.stock||0)*p.cost,0);
  const getProduct=id=>products.find(p=>p.id===id);
  const getContact=id=>contacts.find(c=>c.id===id);
  const available=p=>Math.max(0,(p.stock||0)-(p.reserved||0));
  const docNo=prefix=>`${prefix}-${String(documents.length+1).padStart(4,"0")}`;
  const addToCart=p=>{
    if(available(p)<=0)return;
    setCart(rows=>{
      const existing=rows.find(row=>row.productId===p.id);
      if(existing)return rows.map(row=>row.productId===p.id?{...row,qty:Math.min(row.qty+1,available(p))}:row);
      return[...rows,{productId:p.id,qty:1,price:p.price}];
    });
  };
  const updateQty=(productId,qty)=>{
    const p=getProduct(productId);
    const next=Math.max(1,Math.min(parseInt(qty)||1,available(p)));
    setCart(rows=>rows.map(row=>row.productId===productId?{...row,qty:next}:row));
  };
  const createDeal=async()=>{
    if(cart.length===0)return;
    let finalContactId=contactId;
    if(!finalContactId&&newContact.trim()){
      finalContactId=uid();
      setContacts(prev=>[{id:finalContactId,name:newContact.trim(),phone:"",email:"",company:"",status:"lead",leadStage:"new",tags:["Склад"],managerId:currentManager?.id||managers[0]?.id,siteId,createdAt:Date.now()},...prev]);
    }
    if(!finalContactId)return;
    const lines=cart.map(row=>({...row,name:getProduct(row.productId)?.name||"Товар",sku:getProduct(row.productId)?.sku||""}));
    const title=dealTitle.trim()||`Заказ · ${contacts.find(c=>c.id===finalContactId)?.name||newContact.trim()}`;
    onCreateDeal({title,contactId:finalContactId,managerId:currentManager?.id||managers[0]?.id,siteId,amount:total,stage,items:lines,createdAt:Date.now()});
    await onCreateDocument?.({type:"Товарная накладная",number:docNo("TORG-12"),contactId:finalContactId,amount:total,status:"Подготовлен",items:lines,createdAt:Date.now()});
    await onCreateDocument?.({type:"Счет на оплату",number:docNo("INV"),contactId:finalContactId,amount:total,status:"Подготовлен",items:lines,createdAt:Date.now()});
    const nextProducts=products.map(p=>{
      const row=cart.find(x=>x.productId===p.id);
      return row?{...p,stock:Math.max(0,p.stock-row.qty)}:p;
    });
    setProducts(nextProducts);
    cart.forEach(row=>{const initial=products.find(p=>p.id===row.productId);const next=nextProducts.find(p=>p.id===row.productId);if(initial&&next)onSaveProduct?.(initial,next);});
    setCart([]);
    setDealTitle("");
    setNewContact("");
    setSection("documents");
  };
  const receiveStock=()=>{
    const qty=parseInt(receipt.qty)||0;
    if(!receipt.productId||qty<=0)return;
    const cost=parseInt(receipt.cost)||getProduct(receipt.productId)?.cost||0;
    const initial=getProduct(receipt.productId);
    const next={...initial,stock:(initial?.stock||0)+qty,cost};
    setProducts(prev=>prev.map(p=>p.id===receipt.productId?next:p));
    onSaveProduct?.(initial,next);
    onCreateDocument?.({type:"Поступление",number:receipt.number||docNo("RCPT"),contactId:receipt.supplierId,amount:qty*cost,status:"Проведен",items:[{productId:receipt.productId,qty,price:cost,name:getProduct(receipt.productId)?.name}],createdAt:Date.now()});
    setReceipt(r=>({...r,qty:1,cost:"",number:""}));
  };
  const addModel=()=>{
    if(!model.name||!model.sku)return;
    onCreateProduct?.({sku:model.sku,name:model.name,category:model.category||"Товары",unit:model.unit||"шт",stock:parseInt(model.stock)||0,reserved:0,price:parseInt(model.price)||0,cost:parseInt(model.cost)||0,tags:model.tags||[]});
    setModel({name:"",sku:"",category:"Товары",unit:"шт",price:"",cost:"",stock:0,tags:[]});
    setSection("stock");
  };
  const addContract=()=>{
    if(!contract.contactId||!contract.number||!contract.subject)return;
    setContracts(prev=>[{id:uid(),...contract,amount:parseInt(contract.amount)||0,validTo:Date.now()+86400000*365},...prev]);
    setContract(c=>({...c,number:"",subject:"",amount:""}));
  };
  const tabs=[["indicators","Обзор"],["positions","Позиции"],["stock","Товары"],["sales","Продажа"],["receipts","Поступление"],["documents","Документы"],["contractors","Контрагенты"],["contracts","Договоры"],["models","Номенклатура"]];
  const invoiceDocs=documents.filter(d=>d.type==="Счет на оплату");
  const lowStock=products.filter(p=>available(p)<=3);
  const pipelineSum=deals.reduce((s,d)=>s+(d.amount||0),0);
  const panel={background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14};
  const row={background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:10};
  const showFilters=["positions","stock","sales","models"].includes(section);

  return <div style={{padding:mobile?10:16,flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:mobile?10:14,background:C.bg,minWidth:0}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:16,fontWeight:700}}>Склад и продажи</div>
        <div style={{fontSize:11,color:C.muted,marginTop:2}}>Товары, поступления, документы, договоры и сделки</div>
      </div>
      <QuickCreateBar
        features={{contacts:true,warehouse:true,sites:true,deals:true,tasks:!!onAddTask}}
        onClient={onAddClient}
        onLead={onAddLead}
        onProduct={onAddProduct}
        onSource={onAddSource}
        onDeal={()=>setSection("sales")}
        onTask={onAddTask}
        onDocument={onAddDocument}
        mobile={mobile}
      />
    </div>

    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:mobile?"nowrap":"wrap",overflowX:mobile?"auto":"visible",paddingBottom:mobile?2:0,minHeight:mobile?34:"auto"}}>
      {tabs.map(([id,label])=><button key={id} onClick={()=>setSection(id)} style={{background:section===id?C.accentDim:C.surface,color:section===id?C.accent:C.text,border:`1px solid ${section===id?C.accent+"66":C.border}`,borderRadius:8,padding:"7px 11px",fontSize:12,flex:"0 0 auto",display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:32,whiteSpace:"nowrap"}}>{label}</button>)}
      <div style={{flex:1}}/>
      <Btn small onClick={()=>setSection("receipts")}>+ Поступление</Btn>
      <Btn small onClick={()=>setSection("contracts")}>+ Договор</Btn>
    </div>

    {showFilters&&<div style={{display:"flex",gap:8,flexWrap:"wrap",...panel,padding:10}}>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск товара, артикула или тега" style={{flex:mobile?"1 1 100%":"1 1 220px",maxWidth:mobile?"none":260}}/>
      <select value={category} onChange={e=>setCategory(e.target.value)} style={{width:mobile?"100%":170}}>{categories.map(c=><option key={c} value={c}>{c==="all"?"Все категории":c}</option>)}</select>
      <select value={tagFilter} onChange={e=>setTagFilter(e.target.value)} style={{width:mobile?"100%":170}}><option value="all">Все теги товаров</option>{productTags.map(t=><option key={t} value={t}>{t}</option>)}</select>
      <div style={{flex:1}}/>
      <Btn primary small onClick={onAddProduct}>+ Товар</Btn>
    </div>}

    {section==="indicators"&&<div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fit,minmax(170px,1fr))",gap:10}}>
      {[
        ["Позиций",positions.length||products.length,C.accent],
        ["Моделей",products.length,C.teal],
        ["Остаток склада",`${stockSum.toLocaleString()} ₽`,C.green],
        ["В резерве",`${reserve.toLocaleString()} ₽`,C.amber],
        ["Сделки",`${pipelineSum.toLocaleString()} ₽`,C.purple],
      ].map(([label,value,color])=><div key={label} style={panel}><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:".06em"}}>{label}</div><div style={{fontSize:24,fontWeight:700,color,marginTop:8}}>{value}</div></div>)}
      <div style={{...panel,gridColumn:mobile?"auto":"span 2"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><b>Последние документы</b><Btn small onClick={onAddDocument}>+ Документ</Btn></div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {documents.slice(0,5).map(d=><div key={d.id} style={{...row,display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 120px 110px",gap:10,alignItems:"center"}}>
            <div><div style={{fontWeight:600}}>{d.type}</div><div className="mono" style={{color:C.muted}}>{d.number} · {getContact(d.contactId)?.company||getContact(d.contactId)?.name||"—"}</div></div>
            <div style={{fontWeight:700}}>{(d.amount||0).toLocaleString()} ₽</div>
            <Badge label={d.status} color={d.status==="Проведен"?C.green:C.accent}/>
          </div>)}
        </div>
      </div>
      <div style={{...panel,gridColumn:mobile?"auto":"span 2"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><b>Требуют внимания</b><Badge label={`${lowStock.length} позиций`} color={lowStock.length?C.amber:C.green}/></div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {(lowStock.length?lowStock:products.slice(0,4)).map(p=><div key={p.id} style={{...row,display:"flex",alignItems:"center",gap:10,flexWrap:mobile?"wrap":"nowrap"}}>
            <div style={{flex:1}}><div style={{fontWeight:600}}>{p.name}</div><div className="mono" style={{color:C.muted}}>{p.sku} · {p.category}</div></div>
            <Badge label={`${available(p)} доступно`} color={available(p)>3?C.green:C.amber}/>
          </div>)}
        </div>
      </div>
      <div style={{...panel,gridColumn:mobile?"auto":"span 2"}}>
        <div style={{fontWeight:600,marginBottom:10}}>Просроченные счета</div>
        <div style={{display:"flex",gap:22,alignItems:"end"}}><div><div style={{fontSize:28,color:C.amber,fontWeight:700}}>{invoiceDocs.length}</div><div style={{fontSize:11,color:C.muted}}>счетов</div></div><div><div style={{fontSize:28,fontWeight:700}}>{invoiceDocs.reduce((s,d)=>s+d.amount,0).toLocaleString()} ₽</div><div style={{fontSize:11,color:C.muted}}>к оплате</div></div></div>
      </div>
      <div style={{...panel,gridColumn:mobile?"auto":"span 2"}}>
        <div style={{fontWeight:600,marginBottom:10}}>Быстрые операции</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn primary small onClick={()=>setSection("sales")}>+ Продажа</Btn>
          <Btn small onClick={()=>setSection("receipts")}>+ Поступление</Btn>
          <Btn small onClick={onAddClient}>+ Клиент</Btn>
          <Btn small onClick={onAddSource}>+ Источник</Btn>
        </div>
      </div>
    </div>}

    {section==="positions"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
        {["На складе","В заказе","В пути","В резерве","Продано"].map(st=><div key={st} style={panel}>
          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:".06em"}}>{st}</div>
          <div style={{fontSize:22,fontWeight:700,color:st==="Продано"?C.amber:st==="На складе"?C.green:C.accent,marginTop:4}}>{positions.filter(p=>p.status===st).length}</div>
        </div>)}
      </div>
      {filteredPositions.map(p=><div key={p.id} style={{...row,display:"grid",gridTemplateColumns:mobile?"1fr":"130px 1fr 135px 145px 120px 120px",gap:8,alignItems:"center"}}>
        <Badge label={p.status} color={p.status==="Продано"?C.amber:p.status==="На складе"?C.green:p.status==="В резерве"?C.red:C.accent}/>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
          <div className="mono" style={{color:C.muted}}>{p.serial||"без идентификатора"} · {p.category}</div>
          {p.notes&&<div style={{fontSize:11,color:C.muted,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.notes}</div>}
        </div>
        <div><div style={{fontWeight:700}}>{(p.price||0).toLocaleString()} ₽</div><div style={{fontSize:11,color:C.muted}}>остаток {(p.balance||0).toLocaleString()} ₽</div></div>
        <div style={{fontSize:12}}>{p.contactName||"—"}<div className="mono" style={{color:C.muted}}>{p.phone||""}</div></div>
        <div style={{fontSize:12,color:C.muted}}>{p.place||"—"}</div>
        <div style={{fontSize:12,color:C.muted}}>{p.source||"—"}<br/>{p.manager||""}</div>
      </div>)}
      {filteredPositions.length===0&&<div style={{...panel,color:C.muted,textAlign:"center"}}>Позиции не найдены</div>}
    </div>}

    {section==="stock"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {filtered.map(p=><div key={p.id} style={{...row,display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 95px 95px 120px 120px 110px",gap:8,alignItems:"center"}}>
        <div><div style={{fontWeight:600}}>{p.name}</div><div className="mono" style={{color:C.muted}}>{p.sku} · {p.category}</div>{p.tags?.length>0&&<div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>{p.tags.map(t=><TagBadge key={t} name={t} tags={tagsCatalog} small/>)}</div>}</div>
        <Badge label={`${p.stock} ${p.unit}`} color={available(p)>0?C.green:C.red}/>
        <Badge label={`Резерв ${p.reserved||0}`} color={C.amber}/>
        <div style={{fontSize:12,color:C.muted}}>{(p.cost||0).toLocaleString()} ₽ себ.</div>
        <div style={{fontWeight:700}}>{(p.price||0).toLocaleString()} ₽</div>
        <Btn small onClick={()=>{addToCart(p);setSection("sales");}} disabled={available(p)<=0}>+ В продажу</Btn>
      </div>)}
    </div>}

    {section==="receipts"&&<div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(280px,360px) 1fr",gap:14}}>
      <div style={{...panel,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontWeight:600}}>Поступление товара</div>
        <Fld label="Товар"><select value={receipt.productId} onChange={e=>setReceipt(r=>({...r,productId:e.target.value}))}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Fld>
        <Fld label="Поставщик"><select value={receipt.supplierId} onChange={e=>setReceipt(r=>({...r,supplierId:e.target.value}))}>{contacts.map(c=><option key={c.id} value={c.id}>{c.company||c.name}</option>)}</select></Fld>
        <Fld label="Номер документа"><input value={receipt.number} onChange={e=>setReceipt(r=>({...r,number:e.target.value}))} placeholder="Приходная накладная"/></Fld>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:10}}>
          <Fld label="Количество"><input type="number" value={receipt.qty} onChange={e=>setReceipt(r=>({...r,qty:e.target.value}))}/></Fld>
          <Fld label="Себестоимость"><input type="number" value={receipt.cost} onChange={e=>setReceipt(r=>({...r,cost:e.target.value}))}/></Fld>
        </div>
        <Btn primary onClick={receiveStock}>Провести поступление</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{documents.filter(d=>d.type==="Поступление").map(d=><div key={d.id} style={{...row,display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 140px 130px",gap:10,alignItems:"center"}}><div><div style={{fontWeight:600}}>{d.number}</div><div style={{fontSize:12,color:C.muted}}>{getContact(d.contactId)?.company||getContact(d.contactId)?.name} · {fmt(d.createdAt)}</div></div><div>{(d.amount||0).toLocaleString()} ₽</div><Badge label={d.status} color={C.green}/></div>)}</div>
    </div>}

    {section==="models"&&<div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(280px,380px) 1fr",gap:14}}>
      <div style={{...panel,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontWeight:600}}>Новая номенклатура</div>
        <Fld label="Название"><input value={model.name} onChange={e=>setModel(m=>({...m,name:e.target.value}))}/></Fld>
        <Fld label="Артикул"><input value={model.sku} onChange={e=>setModel(m=>({...m,sku:e.target.value}))}/></Fld>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:10}}>
          <Fld label="Категория"><input value={model.category} onChange={e=>setModel(m=>({...m,category:e.target.value}))}/></Fld>
          <Fld label="Ед. изм."><input value={model.unit} onChange={e=>setModel(m=>({...m,unit:e.target.value}))}/></Fld>
          <Fld label="Цена продажи"><input type="number" value={model.price} onChange={e=>setModel(m=>({...m,price:e.target.value}))}/></Fld>
          <Fld label="Себестоимость"><input type="number" value={model.cost} onChange={e=>setModel(m=>({...m,cost:e.target.value}))}/></Fld>
        </div>
        <Fld label="Теги товара"><TagSelector value={model.tags} tags={tagsCatalog} onChange={v=>setModel(m=>({...m,tags:v}))}/></Fld>
        <Btn primary onClick={addModel}>Добавить номенклатуру</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(230px,1fr))",gap:8}}>{products.map(p=><div key={p.id} style={row}><div style={{fontWeight:600}}>{p.name}</div><div className="mono" style={{color:C.muted,marginTop:3}}>{p.sku} · {p.category} · {p.unit}</div>{p.tags?.length>0&&<div style={{display:"flex",gap:4,marginTop:7,flexWrap:"wrap"}}>{p.tags.map(t=><TagBadge key={t} name={t} tags={tagsCatalog} small/>)}</div>}</div>)}</div>
    </div>}

    {section==="sales"&&<div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(300px,1fr) minmax(320px,420px)",gap:14}}>
      <div style={{...panel,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{fontWeight:600}}>Товары для продажи</div>
        {filtered.map(p=><div key={p.id} style={{...row,display:"flex",alignItems:"center",gap:10,flexWrap:mobile?"wrap":"nowrap"}}>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div><div className="mono" style={{color:C.muted}}>{p.sku} · доступно {available(p)} {p.unit}</div></div>
          <div style={{fontWeight:700}}>{(p.price||0).toLocaleString()} ₽</div>
          <Btn small onClick={()=>addToCart(p)} disabled={available(p)<=0}>+</Btn>
        </div>)}
      </div>
      <div style={{...panel,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontWeight:600}}>Оформление сделки</div>
        {cart.length===0&&<div style={{height:100,border:`1px dashed ${C.border}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}>Корзина пуста</div>}
        {cart.map(rowItem=>{
          const p=getProduct(rowItem.productId);
          return <div key={rowItem.productId} style={{...row,display:"grid",gridTemplateColumns:mobile?"1fr 70px 92px 30px":"1fr 76px 95px 30px",gap:8,alignItems:"center"}}>
            <div style={{minWidth:0}}><div style={{fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p?.name}</div><div className="mono" style={{color:C.muted}}>{p?.sku}</div></div>
            <input type="number" min={1} max={available(p)} value={rowItem.qty} onChange={e=>updateQty(rowItem.productId,e.target.value)}/>
            <div style={{textAlign:"right",fontWeight:700}}>{(rowItem.qty*rowItem.price).toLocaleString()} ₽</div>
            <Btn small danger onClick={()=>setCart(rows=>rows.filter(x=>x.productId!==rowItem.productId))}>×</Btn>
          </div>;
        })}
        <Fld label="Клиент">
          <select value={contactId} onChange={e=>setContactId(e.target.value)}>
            <option value="">+ Новый клиент ниже</option>
            {contacts.map(c=><option key={c.id} value={c.id}>{c.name} · {c.company||c.phone||"без компании"}</option>)}
          </select>
        </Fld>
        <Fld label="Новый клиент"><input value={newContact} onChange={e=>setNewContact(e.target.value)} placeholder="Название или имя"/></Fld>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:8}}>
          <Fld label="Источник"><select value={siteId} onChange={e=>setSiteId(e.target.value)}>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Fld>
          <Fld label="Этап"><select value={stage} onChange={e=>setStage(e.target.value)}>{STAGES.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
        </div>
        <Fld label="Название сделки"><input value={dealTitle} onChange={e=>setDealTitle(e.target.value)} placeholder="Заказ по складу"/></Fld>
        <div style={{display:"flex",alignItems:mobile?"stretch":"center",justifyContent:"space-between",gap:10,flexDirection:mobile?"column":"row"}}>
          <div style={{fontSize:22,fontWeight:700,color:C.green}}>Итого: {total.toLocaleString()} ₽</div>
          <Btn primary disabled={cart.length===0||(!contactId&&!newContact.trim())} onClick={createDeal}>Оформить</Btn>
        </div>
      </div>
    </div>}

    {section==="documents"&&<div style={{...panel}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><b>Документы склада</b><Btn primary small onClick={onAddDocument}>+ Документ</Btn></div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {documents.map(d=><div key={d.id} style={{...row,display:"grid",gridTemplateColumns:mobile?"1fr":"180px 1fr 120px 115px",gap:10,alignItems:"center"}}>
          <div><div style={{fontWeight:600}}>{d.type}</div><div className="mono" style={{color:C.muted}}>{d.number}</div></div>
          <div>{getContact(d.contactId)?.company||getContact(d.contactId)?.name||"—"}</div>
          <div style={{fontWeight:700}}>{(d.amount||0).toLocaleString()} ₽</div>
          <Badge label={d.status} color={d.status==="Проведен"?C.green:C.accent}/>
        </div>)}
      </div>
    </div>}

    {section==="contractors"&&<div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
      <button onClick={onAddClient} style={{...panel,color:C.accent,border:`1px dashed ${C.accent}`,minHeight:110,textAlign:"left",fontWeight:700}}>+ Контрагент</button>
      {contacts.map(c=><div key={c.id} style={panel}>
        <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:8}}><Avatar name={c.name} size={34}/><div><div style={{fontWeight:600}}>{c.company||c.name}</div><div style={{fontSize:11,color:C.muted}}>{c.phone||c.email||"контрагент"}</div></div></div>
        <div style={{fontSize:12,color:C.muted}}>Договоров: {contracts.filter(x=>x.contactId===c.id).length}</div>
        <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>{c.tags?.map(t=><Badge key={t} label={t} color={C.amber} small/>)}</div>
      </div>)}
    </div>}

    {section==="contracts"&&<div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(280px,360px) 1fr",gap:14}}>
      <div style={{...panel,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontWeight:600}}>Новый договор</div>
        <Fld label="Контрагент"><select value={contract.contactId} onChange={e=>setContract(c=>({...c,contactId:e.target.value}))}>{contacts.map(c=><option key={c.id} value={c.id}>{c.company||c.name}</option>)}</select></Fld>
        <Fld label="Номер"><input value={contract.number} onChange={e=>setContract(c=>({...c,number:e.target.value}))}/></Fld>
        <Fld label="Предмет"><input value={contract.subject} onChange={e=>setContract(c=>({...c,subject:e.target.value}))}/></Fld>
        <Fld label="Сумма"><input type="number" value={contract.amount} onChange={e=>setContract(c=>({...c,amount:e.target.value}))}/></Fld>
        <Btn primary onClick={addContract}>Добавить договор</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{contracts.map(c=><div key={c.id} style={row}><div style={{fontWeight:600}}>{c.number} · {getContact(c.contactId)?.company||getContact(c.contactId)?.name}</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>{c.subject}</div><div style={{display:"flex",gap:8,marginTop:7}}><Badge label={c.status} color={C.green}/><Badge label={`${(c.amount||0).toLocaleString()} ₽`} color={C.accent}/></div></div>)}</div>
    </div>}
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

// ── Internal Chat ─────────────────────────────────────────────────────────────
function InternalChat({messages,setMessages,managers,currentManager,mobile=false}){
  const [target,setTarget]=useState("team");
  const [text,setText]=useState("");
  const visible=messages.filter(m=>m.toId==="team"||m.fromId===currentManager?.id||m.toId===currentManager?.id).sort((a,b)=>a.createdAt-b.createdAt);
  const send=()=>{
    if(!text.trim())return;
    setMessages(prev=>[...prev,{id:uid(),fromId:currentManager?.id,toId:target,text:text.trim(),createdAt:Date.now()}]);
    setText("");
  };
  const getM=id=>managers.find(m=>m.id===id);
  return <div style={{display:"flex",flexDirection:mobile?"column":"row",flex:1,overflow:"hidden"}}>
    <div style={{width:mobile?"100%":250,maxHeight:mobile?175:"none",borderRight:mobile?"none":`1px solid ${C.border}`,borderBottom:mobile?`1px solid ${C.border}`:"none",padding:12,display:"flex",flexDirection:"column",gap:8,background:C.surface,overflowY:"auto",flexShrink:0}}>
      <div style={{fontWeight:600,marginBottom:4}}>Каналы</div>
      <button onClick={()=>setTarget("team")} style={{textAlign:"left",padding:10,borderRadius:8,background:target==="team"?C.accentDim:C.card,color:target==="team"?C.accent:C.text,border:`1px solid ${target==="team"?C.accent+"55":C.border}`}}>Общий чат</button>
      {managers.filter(m=>m.id!==currentManager?.id).map(m=><button key={m.id} onClick={()=>setTarget(m.id)} style={{display:"flex",alignItems:"center",gap:8,textAlign:"left",padding:9,borderRadius:8,background:target===m.id?m.color+"22":C.card,color:C.text,border:`1px solid ${target===m.id?m.color+"66":C.border}`}}><Avatar name={m.name} size={26} color={m.color}/>{m.name}</button>)}
      <div style={{marginTop:12,fontSize:11,color:C.muted,lineHeight:1.6}}>Можно писать всей команде или конкретному сотруднику. Закрепленные сообщения подсвечиваются.</div>
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontWeight:600}}>{target==="team"?"Общий чат":getM(target)?.name}</span>
        <Badge label={`${visible.length} сообщений`} color={C.accent} small/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:9}}>
        {visible.map(m=>{
          const author=getM(m.fromId);
          const mine=m.fromId===currentManager?.id;
          return <div key={m.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start"}}>
            <div style={{maxWidth:mobile?"88%":"72%",background:m.pinned?C.amberDim:mine?C.accentDim:C.card,border:`1px solid ${m.pinned?C.amber+"55":mine?C.accent+"44":C.border}`,borderRadius:10,padding:10}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}><Avatar name={author?.name} size={22} color={author?.color}/><span style={{fontSize:12,fontWeight:600}}>{author?.name||"Система"}</span>{m.toId!=="team"&&<Badge label="лично" color={C.purple} small/>}{m.pinned&&<Badge label="важно" color={C.amber} small/>}</div>
              <div style={{lineHeight:1.55}}>{m.text}</div>
              <div className="mono" style={{color:C.muted,marginTop:5}}>{fmt(m.createdAt)}</div>
            </div>
          </div>;
        })}
      </div>
      <div style={{padding:12,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:mobile?"column":"row",gap:8,background:C.surface}}>
        <select value={target} onChange={e=>setTarget(e.target.value)} style={{width:155}}><option value="team">Всем</option>{managers.filter(m=>m.id!==currentManager?.id).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Сообщение команде..." rows={2} style={{resize:"none"}}/>
        <Btn primary disabled={!text.trim()} onClick={send}>Отправить</Btn>
      </div>
    </div>
  </div>;
}

// ── Executive Board ───────────────────────────────────────────────────────────
function ExecutiveBoard({calls,contacts,messages,deals,tasks,managers,sites,products,documents,mobile=false}){
  const [siteF,setSiteF]=useState("all");
  const [mgrF,setMgrF]=useState("all");
  const bySite=x=>siteF==="all"||x.siteId===siteF;
  const byMgr=x=>mgrF==="all"||x.managerId===mgrF;
  const fDeals=deals.filter(d=>bySite(d)&&byMgr(d));
  const fContacts=contacts.filter(c=>bySite(c)&&byMgr(c));
  const fCalls=calls.filter(c=>bySite(c)&&byMgr(c));
  const fMessages=messages.filter(m=>bySite(m)&&byMgr(m));
  const revenue=fDeals.reduce((s,d)=>s+(d.amount||0),0);
  const openTasks=tasks.filter(t=>!t.done&&(mgrF==="all"||t.managerId===mgrF));
  const lowStock=products.filter(p=>(p.stock||0)-(p.reserved||0)<=3);
  const panel={background:"rgba(255,255,255,.94)",border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 8px 20px rgba(22,38,31,.08)"};
  const Big=({title,value,delta,color=C.teal})=><div style={{...panel,padding:14,minHeight:125}}><div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",color:C.text}}>{title}</div><div style={{fontSize:44,lineHeight:1,fontWeight:600,color,marginTop:8}}>{value}</div><div style={{width:95,height:1,background:C.border,margin:"24px 0 12px"}}/><div style={{fontSize:18,color:C.green,fontWeight:800}}>+{delta}</div><div style={{fontSize:11,color:C.muted}}>01.04.2026 - 04.05.2026</div></div>;
  const miniBox=(title,value,color=C.green)=><div style={{...panel,padding:14,minHeight:126}}><div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",color:C.text}}>{title}</div><div style={{fontSize:40,lineHeight:1,color,fontWeight:600,marginTop:12}}>{value}</div><div style={{fontSize:11,color:C.muted,marginTop:7}}>01.04.2026 - 04.05.2026</div></div>;
  const span=n=>mobile?"auto":`span ${n}`;
  const sourceTotal=fDeals.length+fContacts.length+fMessages.length;
  return <div style={{flex:1,overflowY:"auto",padding:16,color:C.text,background:"linear-gradient(135deg,#f3f8f1 0%,#e4f5df 55%,#eef9ec 100%)"}}>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
      <select value={siteF} onChange={e=>setSiteF(e.target.value)} style={{width:170}}><option value="all">Все сайты</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <select value={mgrF} onChange={e=>setMgrF(e.target.value)} style={{width:170}}><option value="all">Все менеджеры</option>{managers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
      <Badge label="Интерактивная доска руководителя" color={C.accent}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(12,1fr)",gridAutoRows:"minmax(104px,auto)",gap:10}}>
      <div style={{gridColumn:span(2)}}><Big title="Просроченные задачи" value={tasks.filter(t=>!t.done&&t.dueAt&&t.dueAt<Date.now()).length||107} delta={95}/></div>
      <div style={{gridColumn:span(2)}}><Big title="Выполненные задачи" value={tasks.filter(t=>t.done).length+764} delta={132} color={C.green}/></div>
      <div style={{gridColumn:span(4),gridRow:mobile?"auto":"span 2",...panel,padding:16}}>
        <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase"}}>Источники сделок</div>
        <div style={{display:"flex",flexDirection:mobile?"column":"row",alignItems:"center",justifyContent:"center",gap:mobile?14:28,minHeight:mobile?0:220}}>
          <div style={{width:mobile?130:170,height:mobile?130:170,borderRadius:"50%",border:`12px solid ${C.accent}`,borderRightColor:"transparent",transform:"rotate(-25deg)",boxShadow:"0 0 0 18px rgba(80,183,67,.16)"}}/>
          <div style={{fontSize:12,lineHeight:1.9,color:C.teal,fontWeight:700}}><div>LEADSERVICE</div><div>ОБЛАЧНАЯ АТС БИЛАЙН БИЗНЕС</div><div>ИНТЕГРАЦИЯ С САЙТОМ</div><div>ИНТЕГРАЦИЯ CF7</div><div style={{color:C.text,marginTop:8}}>Всего: {sourceTotal}</div></div>
        </div>
      </div>
      <div style={{gridColumn:span(4),gridRow:mobile?"auto":"span 2",...panel,padding:16}}>
        <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase"}}>Сделки по менеджерам</div>
        <div style={{fontSize:42,color:C.purple,lineHeight:1,fontWeight:600,marginTop:8}}>{fDeals.length+824}</div>
        <div style={{fontSize:12,color:C.muted,textAlign:"right"}}>01.04.2026 - 04.05.2026</div>
        <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:13}}>
          {managers.map(m=>{const md=deals.filter(d=>d.managerId===m.id);const sum=md.reduce((s,d)=>s+(d.amount||0),0);return <div key={m.id}><div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span>{m.name}</span><b>{md.length} сделок</b><span style={{color:C.green}}>+{Math.max(12,md.length*31)}</span></div><div style={{height:4,background:C.faint,borderRadius:8,marginTop:6}}><div style={{height:"100%",width:`${Math.min(100,35+md.length*18)}%`,background:C.amber,borderRadius:8}}/></div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{sum.toLocaleString()} ₽</div></div>;})}
        </div>
      </div>
      <div style={{gridColumn:span(2)}}><Big title="Задачи к выполнению" value={openTasks.length+189} delta={132}/></div>
      <div style={{gridColumn:span(2)}}><Big title="Сделок без задач" value={fDeals.filter(d=>!tasks.some(t=>t.contactId===d.contactId)).length+722} delta={97}/></div>
      <div style={{gridColumn:span(4),gridRow:mobile?"auto":"span 2",...panel,padding:16}}>
        <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase"}}>Цели</div>
        <div style={{marginTop:18,color:C.amber,fontSize:12}}>⚠ Недостаточно данных для отображения</div>
        <div style={{height:165,display:"flex",alignItems:"center",justifyContent:"center",opacity:.45}}><div style={{width:185,height:92,borderTop:`18px solid ${C.amber}`,borderLeft:`18px solid ${C.amber}`,borderRight:`18px solid ${C.accent}`,borderRadius:"185px 185px 0 0",transform:"rotate(-12deg)"}}/></div>
      </div>
      <div style={{gridColumn:span(4),gridRow:mobile?"auto":"span 2",...panel,padding:16}}>
        <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase"}}>Использование системы 01.04.2026 - 04.05.2026</div>
        {managers.map((m,i)=><div key={m.id} style={{display:"flex",alignItems:"center",gap:10,marginTop:i?12:22}}><Avatar name={m.name} size={34} color={m.color}/><div style={{flex:1}}><div>{m.name}</div><div style={{height:4,background:C.faint,marginTop:6}}><div style={{height:"100%",width:`${65-i*13}%`,background:C.amber}}/></div></div><b>{3+i} ч. {44-i*9} м.</b></div>)}
      </div>
      <div style={{gridColumn:span(4),gridRow:mobile?"auto":"span 2",...panel,padding:16}}>
        <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase"}}>Последние файлы</div>
        <div style={{marginTop:18,color:C.amber,fontSize:12}}>⚠ Недостаточно данных для отображения</div>
        {[1,2,3,4,5].map(i=><div key={i} style={{height:16,background:"rgba(61,148,223,.13)",borderRadius:10,marginTop:18,width:`${90-i*6}%`}}/>)}
      </div>
      <div style={{gridColumn:span(8),gridRow:mobile?"auto":"span 2",...panel,padding:16,minHeight:210}}>
        <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase"}}>Прогноз продаж</div>
        <div style={{height:170,position:"relative",marginTop:16,borderLeft:`1px dashed ${C.teal}`,borderBottom:`1px solid ${C.border}`,overflow:"hidden"}}>
          <div style={{position:"absolute",left:30,bottom:10,fontSize:30,fontWeight:700}}>453</div>
          <div style={{position:"absolute",left:"30%",bottom:25,fontSize:30,fontWeight:700}}>354</div>
          <div style={{position:"absolute",left:"50%",bottom:45,fontSize:30,fontWeight:700}}>357</div>
          <div style={{position:"absolute",left:"68%",bottom:68,fontSize:30,fontWeight:700}}>386</div>
          <div style={{position:"absolute",left:0,right:0,bottom:0,height:75,background:"linear-gradient(15deg,rgba(0,255,140,.35),rgba(0,255,140,.03))",clipPath:"polygon(0 88%,35% 82%,52% 80%,70% 58%,100% 42%,100% 100%,0 100%)"}}/>
        </div>
      </div>
      <div style={{gridColumn:span(2)}}>{miniBox("Входящие звонки",fCalls.filter(c=>c.direction==="inbound").length+215,C.green)}</div>
      <div style={{gridColumn:span(2)}}>{miniBox("Исходящие звонки",fCalls.filter(c=>c.direction==="outbound").length+898,C.green)}</div>
      <div style={{gridColumn:span(2)}}>{miniBox("Примечаний",fMessages.length+160,C.green)}</div>
      <div style={{gridColumn:span(2)}}>{miniBox("Успешные сделки",fDeals.filter(d=>d.stage==="Закрыт").length+14,C.purple)}</div>
    </div>
  </div>;
}

// ── Team ──────────────────────────────────────────────────────────────────────
function ManagerModal({initial,onSave,onClose}){
  const [form,setForm]=useState(initial||{name:"",email:"",password:"TorenaOne2026!",role:"manager",color:MGR_COLORS[0],theme:"midnight",board:DEFAULT_BOARD});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <Modal title={initial?"Редактировать менеджера":"Новый менеджер"} onClose={onClose} width={400}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Fld label="Имя *"><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Иван Петров"/></Fld>
      <Fld label="Email"><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="ivan@company.ru"/></Fld>
      {!initial&&<Fld label="Пароль"><input value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Минимум 6 символов"/></Fld>}
      <Fld label="Роль"><select value={form.role} onChange={e=>set("role",e.target.value)}><option value="manager">Менеджер</option><option value="admin">Администратор</option></select></Fld>
      <Fld label="Тема интерфейса"><select value={form.theme||"midnight"} onChange={e=>set("theme",e.target.value)}>{Object.entries(THEMES).map(([k,t])=><option key={k} value={k}>{t.label}</option>)}</select></Fld>
      <Fld label="Цвет"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{MGR_COLORS.map(col=><div key={col} onClick={()=>set("color",col)} style={{width:26,height:26,borderRadius:"50%",background:col,cursor:"pointer",border:`3px solid ${form.color===col?"#fff":"transparent"}`,transition:"all .12s"}}/>)}</div></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>{if(!form.name)return;onSave(form);}}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function BoardModal({manager,onSave,onClose}){
  const [board,setBoard]=useState({...DEFAULT_BOARD,...(manager?.board||{})});
  const opts=[["stats","Показатели"],["sites","Активность сайтов"],["managers","Нагрузка менеджеров"],["pipeline","Воронка сделок"]];
  const toggle=k=>setBoard(b=>({...b,[k]:!b[k]}));
  return <Modal title="Рабочая доска" onClose={onClose} width={430}>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {opts.map(([k,l])=><label key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:board[k]?C.accentDim+"35":C.surface,border:`1px solid ${board[k]?C.accent+"55":C.border}`,borderRadius:9,cursor:"pointer"}}>
        <input type="checkbox" checked={!!board[k]} onChange={()=>toggle(k)}/>
        <div><div style={{fontWeight:500}}>{l}</div><div style={{fontSize:11,color:C.muted}}>Показывать на дашборде этого работника</div></div>
      </label>)}
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn primary onClick={()=>onSave(board)}>Сохранить</Btn>
      </div>
    </div>
  </Modal>;
}

function FeatureToggleRow({id,enabled,onToggle}){
  const meta=FEATURE_META[id];
  return <div style={{background:C.card,border:`1px solid ${enabled?C.accent+"66":C.border}`,borderRadius:10,padding:14,display:"flex",alignItems:"center",gap:12}}>
    <div style={{width:34,height:34,borderRadius:8,background:enabled?C.accentDim:C.faint,border:`1px solid ${enabled?C.accent+"55":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:enabled?C.accent:C.muted,fontWeight:700}}>☷</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontWeight:600}}>{meta?.label||id}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{meta?.desc}</div>
    </div>
    <Toggle checked={enabled} onChange={()=>onToggle(id)} label={enabled?"Включено":"Выключено"} sub=""/>
  </div>;
}

function FeaturesCenter({features,setFeatures}){
  const toggle=id=>setFeatures(prev=>({...prev,[id]:!prev[id]}));
  const enabledCount=Object.values(features).filter(Boolean).length;
  return <div style={{padding:18,flex:1,overflowY:"auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div><div style={{fontSize:16,fontWeight:700}}>Функции системы</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Включай и выключай модули CRM torenaOne под свой процесс</div></div>
      <Badge label={`${enabledCount} активных`} color={C.green}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:10}}>
      {Object.keys(FEATURE_META).map(id=><FeatureToggleRow key={id} id={id} enabled={!!features[id]} onToggle={toggle}/>)}
    </div>
  </div>;
}

function TagsPage({tags,setTags}){
  const [form,setForm]=useState({name:"",color:"#2f968b",bg:"#e0f4f1"});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const addTag=()=>{
    const name=form.name.trim();
    if(!name||tags.some(t=>t.name.toLowerCase()===name.toLowerCase()))return;
    setTags(prev=>[...prev,{id:uid(),...form,name}]);
    setForm({name:"",color:"#2f968b",bg:"#e0f4f1"});
  };
  const updateTag=(id,patch)=>setTags(prev=>prev.map(t=>t.id===id?{...t,...patch}:t));
  const removeTag=id=>setTags(prev=>prev.filter(t=>t.id!==id));
  return <div style={{padding:18,flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:16}}>
    <div>
      <div style={{fontSize:16,fontWeight:700}}>Теги</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>Единый справочник тегов для клиентов, сделок и товаров</div>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,display:"grid",gridTemplateColumns:"minmax(220px,1fr) 150px 150px auto",gap:10,alignItems:"end"}}>
      <Fld label="Название"><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Например: VIP"/></Fld>
      <Fld label="Цвет текста"><input type="color" value={form.color} onChange={e=>set("color",e.target.value)}/></Fld>
      <Fld label="Цвет заливки"><input type="color" value={form.bg} onChange={e=>set("bg",e.target.value)}/></Fld>
      <Btn primary onClick={addTag} disabled={!form.name.trim()}>Добавить тег</Btn>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(285px,1fr))",gap:10}}>
      {tags.map(tag=><div key={tag.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
          <TagBadge name={tag.name} tags={tags}/>
          <Btn small danger onClick={()=>removeTag(tag.id)}>Удалить</Btn>
        </div>
        <input value={tag.name} onChange={e=>updateTag(tag.id,{name:e.target.value})}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fld label="Текст"><input type="color" value={tag.color} onChange={e=>updateTag(tag.id,{color:e.target.value})}/></Fld>
          <Fld label="Заливка"><input type="color" value={tag.bg} onChange={e=>updateTag(tag.id,{bg:e.target.value})}/></Fld>
        </div>
      </div>)}
    </div>
  </div>;
}

function SettingsPage({managers,setManagers,currentManager,setCurrentManager,features,setFeatures,onAddManager,onSaveCurrentManager}){
  const [user,setUser]=useState({name:"",email:"",password:"TorenaOne2026!",role:"manager",theme:"midnight",color:MGR_COLORS[0]});
  const [board,setBoard]=useState({...DEFAULT_BOARD,...currentManager?.board});
  const [notice,setNotice]=useState("");
  useEffect(()=>setBoard({...DEFAULT_BOARD,...currentManager?.board}),[currentManager?.id,currentManager?.board]);
  const addUser=async()=>{
    if(!user.name||!user.email)return;
    const newName=user.name.trim();
    await onAddManager({...user,board:DEFAULT_BOARD});
    setUser({name:"",email:"",password:"TorenaOne2026!",role:"manager",theme:"midnight",color:MGR_COLORS[0]});
    setNotice(`${newName} добавлен в команду`);
  };
  const setUserField=(k,v)=>setUser(prev=>({...prev,[k]:v}));
  const toggleFeature=id=>setFeatures(prev=>({...prev,[id]:!prev[id]}));
  const selectManager=id=>{
    setManagers(prev=>{
      const manager=prev.find(m=>m.id===id);
      if(!manager)return prev;
      return [manager,...prev.filter(m=>m.id!==id)];
    });
  };
  const saveCurrent=patch=>{
    setCurrentManager(patch);
    onSaveCurrentManager?.(currentManager,{...currentManager,...patch});
  };
  const saveBoard=()=>saveCurrent({board});
  return <div style={{padding:18,flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:16}}>
    <div>
      <div style={{fontSize:16,fontWeight:700}}>Настройки системы</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>Пользователи, темы, рабочая доска и функции собраны в одном окне</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
        <div style={{fontWeight:600,marginBottom:12}}>Добавить пользователя</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label="Имя"><input value={user.name} onChange={e=>setUserField("name",e.target.value)} placeholder="Новый сотрудник"/></Fld>
          <Fld label="Email"><input value={user.email} onChange={e=>setUserField("email",e.target.value)} placeholder="user@company.ru"/></Fld>
          <Fld label="Пароль"><input value={user.password} onChange={e=>setUserField("password",e.target.value)} placeholder="TorenaOne2026!"/></Fld>
          <Fld label="Роль"><select value={user.role} onChange={e=>setUserField("role",e.target.value)}><option value="manager">Менеджер</option><option value="admin">Администратор</option></select></Fld>
          <Fld label="Тема"><select value={user.theme} onChange={e=>setUserField("theme",e.target.value)}>{Object.entries(THEMES).map(([k,t])=><option key={k} value={k}>{t.label}</option>)}</select></Fld>
        </div>
        <Fld label="Цвет"><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>{MGR_COLORS.map(col=><div key={col} onClick={()=>setUserField("color",col)} style={{width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:`3px solid ${user.color===col?"#fff":"transparent"}`}}/>)}</div></Fld>
        <Btn primary onClick={addUser} disabled={!user.name||!user.email} style={{marginTop:12}}>Добавить пользователя</Btn>
        {notice&&<div style={{marginTop:10,fontSize:12,color:C.green,background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:8,padding:9}}>{notice}</div>}
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
        <div style={{fontWeight:600,marginBottom:12}}>Текущий пользователь</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><Avatar name={currentManager?.name} size={42} color={currentManager?.color}/><div><div style={{fontWeight:600}}>{currentManager?.name}</div><div style={{fontSize:11,color:C.muted}}>{currentManager?.email}</div></div></div>
        <Fld label="Тема"><select value={currentManager?.theme||"midnight"} onChange={e=>saveCurrent({theme:e.target.value})}>{Object.entries(THEMES).map(([k,t])=><option key={k} value={k}>{t.label}</option>)}</select></Fld>
        <Fld label="Цвет"><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>{MGR_COLORS.map(col=><div key={col} onClick={()=>saveCurrent({color:col})} style={{width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:`3px solid ${currentManager?.color===col?"#fff":"transparent"}`}}/>)}</div></Fld>
      </div>
    </div>

    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
        <div>
          <div style={{fontWeight:600}}>Пользователи CRM</div>
          <div style={{fontSize:11,color:C.muted}}>После добавления сотрудник сразу появляется здесь и в разделе команды</div>
        </div>
        <Badge label={`${managers.length} пользователей`} color={C.accent}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:8}}>
        {managers.map((m,i)=>(
          <div key={m.id} style={{background:i===0?C.accentDim+"35":C.surface,border:`1px solid ${i===0?C.accent+"55":C.border}`,borderRadius:10,padding:12,display:"flex",alignItems:"center",gap:10}}>
            <Avatar name={m.name} size={36} color={m.color}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
              <div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.email||"email не указан"}</div>
              <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                <Badge label={m.role==="admin"?"Администратор":"Менеджер"} color={m.role==="admin"?C.purple:C.accent} small/>
                <Badge label={THEMES[m.theme]?.label||"torenaOne"} color={THEMES[m.theme]?.accent||C.accent} small/>
              </div>
            </div>
            {i===0?<Badge label="текущий" color={C.green} small/>:<Btn small onClick={()=>selectManager(m.id)}>Выбрать</Btn>}
          </div>
        ))}
      </div>
    </div>

    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontWeight:600}}>Рабочая доска</div><div style={{fontSize:11,color:C.muted}}>Какие блоки показывать на дашборде текущего пользователя</div></div><Btn primary small onClick={saveBoard}>Сохранить доску</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
        {Object.entries({stats:"Показатели",sites:"Активность сайтов",managers:"Нагрузка менеджеров",pipeline:"Воронка сделок"}).map(([k,label])=><label key={k} style={{display:"flex",gap:9,alignItems:"center",background:board[k]?C.accentDim+"35":C.surface,border:`1px solid ${board[k]?C.accent+"55":C.border}`,borderRadius:8,padding:10,cursor:"pointer"}}><input type="checkbox" checked={!!board[k]} onChange={()=>setBoard(prev=>({...prev,[k]:!prev[k]}))}/>{label}</label>)}
      </div>
    </div>

    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
      <div style={{fontWeight:600,marginBottom:12}}>Модули и функции</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
        {Object.keys(FEATURE_META).map(id=><FeatureToggleRow key={id} id={id} enabled={!!features[id]} onToggle={toggleFeature}/>)}
      </div>
    </div>
  </div>;
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

function PublicSite(){
  const [catalog,setCatalog]=useState({site:null,products:[]});
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState({name:"",phone:"",email:"",comment:""});
  const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  useEffect(()=>{
    publicRequest("/api/public/catalog")
      .then(data=>{setCatalog(data);setSelected(data.products?.[0]?.id||null);})
      .catch(error=>setStatus(`Ошибка загрузки: ${error.message}`))
      .finally(()=>setLoading(false));
  },[]);
  const product=catalog.products.find(p=>p.id===selected);
  const send=async()=>{
    if(!form.name||!form.phone){setStatus("Укажите имя и телефон");return;}
    setSending(true);setStatus("");
    try{
      await publicRequest("/api/public/lead",{method:"POST",body:{...form,productId:selected,interest:product?.category||"Каталог",channel:"site",pageUrl:window.location.href}});
      setStatus("Заявка отправлена. Менеджер увидит ее в CRM.");
      setForm({name:"",phone:"",email:"",comment:""});
    }catch(error){
      setStatus(`Ошибка отправки: ${error.message}`);
    }finally{
      setSending(false);
    }
  };
  return <>
    <style>{css}</style>
    <div style={{minHeight:"100dvh",background:"#f3f8f1",color:C.text,fontFamily:"Syne,sans-serif"}}>
      <header style={{position:"sticky",top:0,zIndex:5,background:"#16261f",color:"#fff",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
        <div style={{maxWidth:1180,margin:"0 auto",padding:"12px 18px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div style={{fontSize:24,fontWeight:800}}>Мировые <span style={{color:C.accent}}>мощности</span></div>
          <div style={{fontSize:12,opacity:.78}}>мировые-мощности.рф</div>
          <div style={{flex:1}}/>
          <a href="/" style={{color:"#fff",textDecoration:"none",border:`1px solid ${C.accent}`,borderRadius:8,padding:"7px 12px"}}>CRM</a>
        </div>
      </header>
      <main style={{maxWidth:1180,margin:"0 auto",padding:"28px 18px 46px"}}>
        <section style={{background:"linear-gradient(120deg,#1f7b24,#50b743)",borderRadius:18,padding:"42px 34px",color:"#fff",display:"grid",gridTemplateColumns:"minmax(0,1.1fr) minmax(280px,.9fr)",gap:24,alignItems:"center"}}>
          <div>
            <Badge label="Сайт подключен к CRM torenaOne" color="#ffffff"/>
            <h1 style={{fontSize:"clamp(30px,5vw,58px)",lineHeight:1.05,margin:"18px 0 14px",letterSpacing:0}}>Тепловые насосы и оборудование со склада</h1>
            <p style={{fontSize:17,maxWidth:560,opacity:.92}}>Заявка с этой страницы сразу попадает в CRM: создается лид, сообщение и сделка по выбранной складской позиции.</p>
          </div>
          <div style={{background:"rgba(255,255,255,.14)",border:"1px solid rgba(255,255,255,.25)",borderRadius:16,padding:18}}>
            <div style={{fontSize:13,opacity:.8}}>Источник</div>
            <div style={{fontSize:24,fontWeight:800,marginTop:4}}>{catalog.site?.domain||"мировые-мощности.рф"}</div>
            <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>{["WhatsApp","Telegram","MAX","Сайт"].map(x=><span key={x} style={{background:"rgba(255,255,255,.18)",borderRadius:20,padding:"5px 10px",fontSize:12}}>{x}</span>)}</div>
          </div>
        </section>

        <section style={{marginTop:24,display:"grid",gridTemplateColumns:"minmax(0,1fr) 360px",gap:18,alignItems:"start"}}>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,marginBottom:12}}>
              <div>
                <h2 style={{fontSize:26,marginBottom:3}}>Каталог склада</h2>
                <div style={{fontSize:13,color:C.muted}}>{loading?"Загружаем склад из CRM":`${catalog.products.length} моделей доступно из базы CRM`}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(235px,1fr))",gap:12}}>
              {catalog.products.map(p=><button key={p.id} onClick={()=>setSelected(p.id)} style={{textAlign:"left",background:selected===p.id?C.greenDim:C.card,border:`1px solid ${selected===p.id?C.accent:C.border}`,borderRadius:12,padding:14,minHeight:156}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}>
                  <Badge label={p.category} color={C.teal} small/>
                  <Badge label={`${Math.max(0,(p.stock||0)-(p.reserved||0))} шт`} color={C.green} small/>
                </div>
                <div style={{fontSize:18,fontWeight:800,marginTop:14}}>{p.name}</div>
                <div className="mono" style={{color:C.muted,marginTop:4}}>{p.sku}</div>
                <div style={{fontSize:20,fontWeight:800,marginTop:14}}>{(p.price||0).toLocaleString()} ₽</div>
              </button>)}
            </div>
          </div>

          <aside style={{position:"sticky",top:78,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,boxShadow:"0 14px 40px rgba(22,38,31,.08)"}}>
            <div style={{fontSize:18,fontWeight:800}}>Заявка в CRM</div>
            <div style={{fontSize:12,color:C.muted,marginTop:3}}>Выбранный товар: {product?.name||"не выбран"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:14}}>
              <Fld label="Имя"><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ваше имя"/></Fld>
              <Fld label="Телефон"><input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+7 900 000-00-00"/></Fld>
              <Fld label="Email"><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@example.ru"/></Fld>
              <Fld label="Комментарий"><textarea rows={4} value={form.comment} onChange={e=>set("comment",e.target.value)} placeholder="Что нужно рассчитать?"/></Fld>
              {status&&<div style={{fontSize:12,color:status.startsWith("Ошибка")?C.red:C.green,background:status.startsWith("Ошибка")?C.redDim:C.greenDim,borderRadius:8,padding:10}}>{status}</div>}
              <Btn primary disabled={sending} onClick={send} style={{justifyContent:"center"}}>{sending?"Отправляем...":"Отправить в CRM"}</Btn>
            </div>
          </aside>
        </section>
      </main>
    </div>
  </>;
}

function LoginScreen({onLogin,onSkip,loading,error,apiError}){
  const [form,setForm]=useState({email:API_LOGIN.email,password:API_LOGIN.password});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <>
    <style>{css}</style>
    <div style={{minHeight:"100dvh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
      <div style={{width:"100%",maxWidth:390,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22,boxShadow:"0 18px 50px rgba(22,38,31,.10)"}}>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:24,fontWeight:800,color:C.dark}}>CRM <span style={{color:C.accent}}>torenaOne</span></div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>Вход сотрудников в систему</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Fld label="Email"><input value={form.email} onChange={e=>set("email",e.target.value)} autoComplete="username"/></Fld>
          <Fld label="Пароль"><input type="password" value={form.password} onChange={e=>set("password",e.target.value)} autoComplete="current-password"/></Fld>
          {(error||apiError)&&<div style={{fontSize:12,color:C.red,background:C.redDim,border:`1px solid ${C.red}33`,borderRadius:8,padding:10}}>{error||apiError}</div>}
          <Btn primary disabled={loading} onClick={()=>onLogin(form)} style={{justifyContent:"center",width:"100%"}}>{loading?"Входим...":"Войти"}</Btn>
          {onSkip&&<Btn disabled={loading} onClick={onSkip} style={{justifyContent:"center",width:"100%"}}>Продолжить локально</Btn>}
        </div>
        <div style={{marginTop:16,padding:12,borderRadius:10,background:C.greenDim,border:`1px solid ${C.green}33`,fontSize:12,color:C.text}}>
          <div style={{fontWeight:700,marginBottom:4}}>Тестовый администратор</div>
          <div className="mono">admin@torenaone.ru</div>
          <div className="mono">TorenaOne2026!</div>
        </div>
      </div>
    </div>
  </>;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App(){
  if(typeof window!=="undefined"&&window.location.pathname.startsWith("/site"))return <PublicSite/>;
  const[page,setPage]=useState("dashboard");
  const[sites,setSites]=useState([]);
  const[managers,setManagers]=useState([]);
  const[contacts,setContacts]=useState([]);
  const[calls,setCalls]=useState([]);
  const[messages,setMessages]=useState([]);
  const[deals,setDeals]=useState([]);
  const[dealStages,setDealStages]=useState(STAGES);
  const[tagsCatalog,setTagsCatalog]=useState(DEFAULT_TAGS);
  const[tasks,setTasks]=useState([]);
  const[products,setProducts]=useState([]);
  const[warehousePositions,setWarehousePositions]=useState([]);
  const[warehouseDocs,setWarehouseDocs]=useState([]);
  const[contracts,setContracts]=useState([]);
  const[internalMessages,setInternalMessages]=useState([]);
  const[features,setFeatures]=useState(DEFAULT_FEATURES);
  const[modal,setModal]=useState(null);
  const[loading,setLoading]=useState(true);
  const[authRequired,setAuthRequired]=useState(false);
  const[authLoading,setAuthLoading]=useState(false);
  const[authError,setAuthError]=useState("");
  const[api,setApi]=useState({connected:false,token:null,error:null});
  const isMobile=useIsMobile();
  const cur=managers[0];
  const theme={...THEMES.midnight,...THEMES[cur?.theme||"midnight"]};
  const setCurrentManager=(patch)=>setManagers(prev=>prev.map((m,i)=>i===0?{...m,...patch}:m));
  const mergeImportedProducts=list=>{
    const source=list?.length?list:SP;
    const seen=new Set(source.map(p=>`${p.name}|${p.category}`));
    const importedMissing=IMPORTED_WAREHOUSE_PRODUCTS.filter(p=>!seen.has(`${p.name}|${p.category}`));
    return [...importedMissing,...source];
  };
  const mergeImportedDocs=list=>{
    const source=list?.length?list:SWD;
    const seen=new Set(source.map(d=>d.id||d.number));
    const importedMissing=IMPORTED_WAREHOUSE_DOCUMENTS.filter(d=>!seen.has(d.id)&&!seen.has(d.number));
    return [...importedMissing,...source];
  };
  const normalizeDealStages=list=>[...new Set((list?.length?list:STAGES).map(s=>String(s||"").trim()).filter(Boolean))];
  const applyLoadedState=(apiState,{si,mg,ct,cl,ms,dl,ds,tg,tk,pr,wp,wd,wc,im,ft})=>{
    const loadedSites=apiState?.sites?.length?apiState.sites.map(siteFromApi):(si||SS);
    const sitesWithMax=loadedSites.map((site,idx)=>idx===0&&!site.channels?.includes("max")
      ? {...site,channels:[...(site.channels||[]),"max"],stats:{...(site.stats||{}),messages:(site.stats?.messages||0)+1}}
      : site);
    const loadedMessages=apiState?.messages?.length?apiState.messages.map(messageFromApi):(ms||SMS);
    const messagesWithMax=loadedMessages.some(msg=>msg.channel==="max")
      ? loadedMessages
      : [...loadedMessages,SMS.find(msg=>msg.channel==="max")];
    const managersSource=apiState?.users?.length?apiState.users.map(managerFromApi):(mg||SM);
    const managersWithPrefs=managersSource.map((m,i)=>({...m,theme:m.theme||SM[i]?.theme||"midnight",board:{...DEFAULT_BOARD,...(m.board||SM[i]?.board||{})}}));
    const contactsSource=apiState?.contacts?.length?apiState.contacts.map(contactFromApi):(ct||SC);
    const contactsWithLeadStages=contactsSource.map(c=>({...c,leadStage:leadStageOf(c)}));
    setSites(sitesWithMax);setManagers(managersWithPrefs);setContacts(contactsWithLeadStages);
    setCalls(apiState?.calls?.length?apiState.calls.map(callFromApi):(cl||SCL));
    setMessages(messagesWithMax);
    setDeals(apiState?.deals?.length?apiState.deals.map(dealFromApi):(dl||SD));
    setDealStages(normalizeDealStages(ds));
    setTagsCatalog(tg?.length?tg:DEFAULT_TAGS);
    setTasks(apiState?.tasks?.length?apiState.tasks.map(taskFromApi):(tk||STK));
    const apiProducts=apiState?.warehouseProducts?.length?apiState.warehouseProducts.map(warehouseProductFromApi):null;
    const apiPositions=apiState?.warehousePositions?.length?apiState.warehousePositions.map(warehousePositionFromApi):null;
    const apiDocuments=apiState?.warehouseDocuments?.length?apiState.warehouseDocuments.map(warehouseDocumentFromApi):null;
    setProducts(apiProducts||mergeImportedProducts(pr));setWarehousePositions(apiPositions||(wp?.length?wp:IMPORTED_WAREHOUSE_POSITIONS));setWarehouseDocs(apiDocuments||mergeImportedDocs(wd));setContracts(wc?.length?wc:SWC);setInternalMessages(im?.length?im:SIM);setFeatures({...DEFAULT_FEATURES,...(ft||{})});
  };

  useEffect(()=>{
    (async()=>{
      const[si,mg,ct,cl,ms,dl,ds,tg,tk,pr,wp,wd,wc,im,ft]=await Promise.all([
        load("crm4:sites"),load("crm4:managers"),load("crm4:contacts"),
        load("crm4:calls"),load("crm4:messages"),load("crm4:deals"),load("crm4:dealStages"),load("crm4:tags"),load("crm4:tasks"),
        load("crm4:products"),load("crm4:warehousePositions"),load("crm4:warehouseDocs"),load("crm4:contracts"),load("crm4:internalMessages"),load("crm4:features"),
      ]);
      const local={si,mg,ct,cl,ms,dl,ds,tg,tk,pr,wp,wd,wc,im,ft};
      try{
        await apiRequest("/api/health");
        const savedAuth=await load("crm4:auth");
        if(!savedAuth?.token){
          applyLoadedState(null,local);
          setApi({connected:false,token:null,error:"Локальный режим"});
          setAuthRequired(false);
          setLoading(false);
          return;
        }
        const apiState=await loadApiState(savedAuth.token);
        applyLoadedState(apiState,local);
        setApi({connected:true,token:savedAuth.token,error:null});
      }catch(error){
        console.warn("CRM API fallback:",error.message);
        applyLoadedState(null,local);
        setApi({connected:false,token:null,error:"Локальный режим"});
        setAuthRequired(false);
      }
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{if(!loading)save("crm4:sites",sites);},[sites,loading]);
  useEffect(()=>{if(!loading)save("crm4:managers",managers);},[managers,loading]);
  useEffect(()=>{if(!loading)save("crm4:contacts",contacts);},[contacts,loading]);
  useEffect(()=>{if(!loading)save("crm4:calls",calls);},[calls,loading]);
  useEffect(()=>{if(!loading)save("crm4:messages",messages);},[messages,loading]);
  useEffect(()=>{if(!loading)save("crm4:deals",deals);},[deals,loading]);
  useEffect(()=>{if(!loading)save("crm4:dealStages",dealStages);},[dealStages,loading]);
  useEffect(()=>{if(!loading)save("crm4:tags",tagsCatalog);},[tagsCatalog,loading]);
  useEffect(()=>{if(!loading)save("crm4:tasks",tasks);},[tasks,loading]);
  useEffect(()=>{if(!loading)save("crm4:products",products);},[products,loading]);
  useEffect(()=>{if(!loading)save("crm4:warehousePositions",warehousePositions);},[warehousePositions,loading]);
  useEffect(()=>{if(!loading)save("crm4:warehouseDocs",warehouseDocs);},[warehouseDocs,loading]);
  useEffect(()=>{if(!loading)save("crm4:contracts",contracts);},[contracts,loading]);
  useEffect(()=>{if(!loading)save("crm4:internalMessages",internalMessages);},[internalMessages,loading]);
  useEffect(()=>{if(!loading)save("crm4:features",features);},[features,loading]);

  const unread=messages.filter(m=>m.incoming&&!m.read).length;
  const missed=calls.filter(c=>c.status==="missed").length;
  const overdueTasks=tasks.filter(t=>!t.done&&t.dueAt&&t.dueAt<Date.now()).length;
  const handleLogin=async({email,password})=>{
    setAuthLoading(true);setAuthError("");
    try{
      const auth=await apiLogin(email,password);
      await save("crm4:auth",{token:auth.token,email:auth.user?.email});
      const[si,mg,ct,cl,ms,dl,ds,tg,tk,pr,wp,wd,wc,im,ft]=await Promise.all([
        load("crm4:sites"),load("crm4:managers"),load("crm4:contacts"),
        load("crm4:calls"),load("crm4:messages"),load("crm4:deals"),load("crm4:dealStages"),load("crm4:tags"),load("crm4:tasks"),
        load("crm4:products"),load("crm4:warehousePositions"),load("crm4:warehouseDocs"),load("crm4:contracts"),load("crm4:internalMessages"),load("crm4:features"),
      ]);
      const apiState=await loadApiState(auth.token);
      applyLoadedState(apiState,{si,mg,ct,cl,ms,dl,ds,tg,tk,pr,wp,wd,wc,im,ft});
      setApi({connected:true,token:auth.token,error:null});
      setAuthRequired(false);
    }catch(error){
      setAuthError(error.message==="Invalid credentials"?"Неверный email или пароль":error.message);
    }finally{
      setAuthLoading(false);
    }
  };
  const logout=async()=>{
    await save("crm4:auth",null);
    setApi({connected:false,token:null,error:null});
    setAuthRequired(true);
  };

  if(loading)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:500,color:C.muted,background:C.bg,fontFamily:"Syne,sans-serif"}}>Загрузка CRM...</div>;
  if(authRequired)return <LoginScreen onLogin={handleLogin} onSkip={()=>{setAuthRequired(false);setAuthError("");}} loading={authLoading} error={authError} apiError={api.error}/>;

  const labels={dashboard:"Дашборд",exec:"Доска руководителя",features:"Функции системы",tags:"Теги",sites:"Сайты",warehouse:"Склад и продажи",inbox:"Входящие сообщения",chat:"Внутренний чат",calls:"Звонки",contacts:"Контакты",deals:"Сделки",tasks:"Задачи",team:"Команда",settings:"Настройки"};
  const openClient=()=>setModal({type:"add-contact",preset:{status:"client",leadStage:"client",tags:"Клиент"}});
  const openLead=()=>setModal({type:"add-contact",preset:{status:"lead",leadStage:"new",tags:"Лид"}});
  const openSource=()=>setModal("add-site");
  const openProduct=()=>setModal("add-product");
  const openDocument=()=>setModal("add-document");
  const moveLeadStage=(id,leadStage)=>{
    const nextStatus=leadStage==="client"?"client":leadStage==="refused"?"lost":"lead";
    setContacts(prev=>prev.map(c=>c.id===id?{...c,leadStage,status:nextStatus}:c));
    const contact=contacts.find(c=>c.id===id);
    if(api.connected&&contact)apiRequest(`/api/contacts/${id}`,{method:"PATCH",token:api.token,body:contactToApi({...contact,leadStage,status:nextStatus})}).catch(console.warn);
  };
  const apiCreate=async(path,body,fromApi,onLocal)=>{
    if(!api.connected)return onLocal({id:uid(),...body});
    try{onLocal(fromApi(await apiRequest(path,{method:"POST",token:api.token,body})));}catch(error){console.warn(error);onLocal({id:uid(),...body});}
  };
  const apiPatch=async(path,body,onLocal)=>{
    onLocal();
    if(api.connected)try{await apiRequest(path,{method:"PATCH",token:api.token,body});}catch(error){console.warn(error);}
  };
  const apiDelete=async(path,onLocal)=>{
    onLocal();
    if(api.connected)try{await apiRequest(path,{method:"DELETE",token:api.token});}catch(error){console.warn(error);}
  };
  const createSite=async f=>{
    if(api.connected){
      try{const created=siteFromApi(await apiRequest("/api/sites",{method:"POST",token:api.token,body:siteToApi(f)}));setSites(p=>[created,...p]);return;}catch(error){console.warn(error);}
    }
    setSites(p=>[...p,{id:uid(),apiKey:"sk_live_"+uid(),stats:{calls:0,messages:0,leads:0},createdAt:Date.now(),...f}]);
  };
  const saveSite=async(initial,f)=>{
    setSites(p=>p.map(s=>s.id===initial.id?{...s,...f}:s));
    if(api.connected)apiRequest(`/api/sites/${initial.id}`,{method:"PATCH",token:api.token,body:siteToApi({...initial,...f})}).catch(console.warn);
  };
  const createContact=async f=>{
    if(api.connected){
      try{const created=contactFromApi(await apiRequest("/api/contacts",{method:"POST",token:api.token,body:contactToApi(f)}));setContacts(p=>[created,...p]);return;}catch(error){console.warn(error);}
    }
    setContacts(p=>[{id:uid(),...f,createdAt:Date.now()},...p]);
  };
  const saveContact=async(initial,f)=>{
    setContacts(p=>p.map(c=>c.id===initial.id?{...c,...f}:c));
    if(api.connected)apiRequest(`/api/contacts/${initial.id}`,{method:"PATCH",token:api.token,body:contactToApi({...initial,...f})}).catch(console.warn);
  };
  const createCall=async f=>{
    if(api.connected){
      try{const created=callFromApi(await apiRequest("/api/calls",{method:"POST",token:api.token,body:callToApi({...f,startedAt:Date.now()})}));setCalls(p=>[created,...p]);return;}catch(error){console.warn(error);}
    }
    setCalls(p=>[{id:uid(),...f,startedAt:Date.now()},...p]);
  };
  const createDeal=async f=>{
    if(api.connected){
      try{const created=dealFromApi(await apiRequest("/api/deals",{method:"POST",token:api.token,body:dealToApi(f)}));setDeals(p=>[created,...p]);return;}catch(error){console.warn(error);}
    }
    setDeals(p=>[{id:uid(),...f,createdAt:Date.now()},...p]);
  };
  const createTask=async f=>{
    if(api.connected){
      try{const created=taskFromApi(await apiRequest("/api/tasks",{method:"POST",token:api.token,body:taskToApi({...f,done:false})}));setTasks(p=>[created,...p]);return;}catch(error){console.warn(error);}
    }
    setTasks(p=>[{id:uid(),...f,done:false,createdAt:Date.now()},...p]);
  };
  const createWarehouseProduct=async f=>{
    if(api.connected){
      try{const created=warehouseProductFromApi(await apiRequest("/api/warehouse/products",{method:"POST",token:api.token,body:warehouseProductToApi(f)}));setProducts(p=>[created,...p]);return;}catch(error){console.warn(error);}
    }
    setProducts(p=>[{id:uid(),...f},...p]);
  };
  const saveWarehouseProduct=async(initial,next)=>{
    setProducts(p=>p.map(product=>product.id===initial.id?{...product,...next}:product));
    if(api.connected)apiRequest(`/api/warehouse/products/${initial.id}`,{method:"PATCH",token:api.token,body:warehouseProductToApi({...initial,...next})}).catch(console.warn);
  };
  const createWarehouseDocument=async f=>{
    const localDoc={id:uid(),...f,createdAt:f.createdAt||Date.now()};
    if(api.connected){
      try{const created=warehouseDocumentFromApi(await apiRequest("/api/warehouse/documents",{method:"POST",token:api.token,body:warehouseDocumentToApi(localDoc)}));setWarehouseDocs(p=>[created,...p]);return created;}catch(error){console.warn(error);}
    }
    setWarehouseDocs(p=>[localDoc,...p]);
    return localDoc;
  };
  const createManager=async f=>{
    if(api.connected){
      try{
        const auth=await apiRequest("/api/auth/register",{method:"POST",token:api.token,body:{...managerToApi(f),password:f.password||"TorenaOne2026!"}});
        setManagers(p=>[...p,managerFromApi(auth.user)]);
        return;
      }catch(error){console.warn(error);}
    }
    const {password,...safe}=f;
    setManagers(p=>[...p,{id:uid(),...safe,board:{...DEFAULT_BOARD,...safe.board}}]);
  };
  const saveManager=async(initial,next)=>{
    if(!initial?.id)return;
    const normalized={...next,board:{...DEFAULT_BOARD,...(next.board||{})}};
    setManagers(p=>p.map(m=>m.id===initial.id?{...m,...normalized}:m));
    if(api.connected)apiRequest(`/api/users/${initial.id}`,{method:"PATCH",token:api.token,body:managerToApi(normalized)}).catch(console.warn);
  };
  const deleteManager=async id=>{
    if(managers.length<=1)return;
    apiDelete(`/api/users/${id}`,()=>setManagers(p=>p.filter(m=>m.id!==id)));
  };
  const renameDealStage=async(from,to)=>{
    const affected=deals.filter(d=>d.stage===from);
    setDeals(p=>p.map(d=>d.stage===from?{...d,stage:to}:d));
    if(api.connected)affected.forEach(deal=>{
      apiRequest(`/api/deals/${deal.id}`,{method:"PATCH",token:api.token,body:dealToApi({...deal,stage:to})}).catch(console.warn);
    });
  };

  return <>
    <style>{css}</style>
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100dvh",minHeight:isMobile?0:700,overflow:"hidden",border:isMobile?"none":`1px solid ${C.border}`,background:theme.bg}}>
      <Sidebar page={page} setPage={setPage} unread={unread} missed={missed} overdueTasksCount={overdueTasks} sites={sites} currentManager={cur} features={features} mobile={isMobile} appTheme={theme}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:isMobile?"8px 10px":"10px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:isMobile?8:12,background:theme.header||theme.surface,color:theme.headerText||C.text,flexShrink:0,flexWrap:"wrap"}}>
          <span style={{fontWeight:600,fontSize:isMobile?13:14,flex:isMobile?"1 0 100%":"0 0 auto"}}>{labels[page]}</span>
          <Badge label={api.connected?"API + база":"Локально"} color={api.connected?C.green:C.amber} small/>
          {page==="inbox"&&unread>0&&<Badge label={`${unread} новых`} color={C.accent}/>}
          {page==="tasks"&&overdueTasks>0&&<Badge label={`${overdueTasks} просрочено`} color={C.amber}/>}
          <div style={{flex:1}}/>
          {!isMobile&&page==="sites"&&<Btn primary small onClick={()=>setModal("add-site")}>+ Сайт</Btn>}
          {!isMobile&&page==="calls"&&<Btn primary small onClick={()=>setModal("add-call")}>+ Звонок</Btn>}
          {!isMobile&&page==="contacts"&&<Btn primary small onClick={()=>setModal("add-contact")}>+ Контакт</Btn>}
          {!isMobile&&page==="deals"&&<Btn primary small onClick={()=>setModal({type:"add-deal",stage:dealStages[0]||STAGES[0]})}>+ Сделка</Btn>}
          {!isMobile&&page==="tasks"&&<Btn primary small onClick={()=>setModal("add-task")}>+ Задача</Btn>}
          {!isMobile&&page==="team"&&managers.length<10&&<Btn primary small onClick={()=>setModal("add-manager")}>+ Менеджер</Btn>}
          <QuickCreateBar
            features={features}
            onClient={openClient}
            onLead={openLead}
            onProduct={openProduct}
            onSource={openSource}
            onDeal={()=>setModal({type:"add-deal",stage:dealStages[0]||STAGES[0]})}
            onTask={()=>setModal("add-task")}
            onDocument={openDocument}
            mobile={isMobile}
          />
          <select value={cur?.theme||"midnight"} onChange={e=>saveManager(cur,{...cur,theme:e.target.value})} style={{width:isMobile?112:120,fontSize:12,flexShrink:0}}>
            {Object.entries(THEMES).map(([k,t])=><option key={k} value={k}>{t.label}</option>)}
          </select>
          <Btn small onClick={()=>setModal("board-settings")}>Доска</Btn>
          {api.connected?<Btn small onClick={logout}>Выйти</Btn>:<Btn small onClick={()=>setAuthRequired(true)}>Войти</Btn>}
        </div>
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          <ErrorBoundary key={page}>
          {page==="dashboard"&&<Dashboard calls={calls} contacts={contacts} messages={messages} deals={deals} tasks={tasks} managers={managers} sites={sites} stages={dealStages} setPage={setPage} board={{...DEFAULT_BOARD,...cur?.board}} mobile={isMobile}/>}
          {page==="features"&&<FeaturesCenter features={features} setFeatures={setFeatures}/>}
          {page==="tags"&&<TagsPage tags={tagsCatalog} setTags={setTagsCatalog}/>}
          {page==="settings"&&<SettingsPage managers={managers} setManagers={setManagers} currentManager={cur} setCurrentManager={setCurrentManager} features={features} setFeatures={setFeatures} onAddManager={createManager} onSaveCurrentManager={saveManager}/>}
          {page==="exec"&&<ExecutiveBoard calls={calls} contacts={contacts} messages={messages} deals={deals} tasks={tasks} managers={managers} sites={sites} products={products} documents={warehouseDocs} mobile={isMobile}/>}
          {page==="sites"&&<Sites sites={sites} managers={managers}
            onAdd={()=>setModal("add-site")}
            onEdit={s=>setModal({type:"edit-site",data:s})}
            onDelete={id=>apiDelete(`/api/sites/${id}`,()=>setSites(p=>p.filter(s=>s.id!==id)))}
            onToggle={id=>{
              const site=sites.find(s=>s.id===id);
              apiPatch(`/api/sites/${id}`,siteToApi({...site,active:!site?.active}),()=>setSites(p=>p.map(s=>s.id===id?{...s,active:!s.active}:s)));
            }}/>}
          {page==="warehouse"&&<Warehouse products={products} setProducts={setProducts} onCreateProduct={createWarehouseProduct} onSaveProduct={saveWarehouseProduct} positions={warehousePositions} contacts={contacts} setContacts={setContacts} managers={managers} sites={sites} currentManager={cur} documents={warehouseDocs} setDocuments={setWarehouseDocs} onCreateDocument={createWarehouseDocument} contracts={contracts} setContracts={setContracts} deals={deals} tagsCatalog={tagsCatalog} mobile={isMobile}
            onAddClient={openClient}
            onAddLead={openLead}
            onAddSource={openSource}
            onAddProduct={openProduct}
            onAddDocument={openDocument}
            onAddTask={()=>setModal("add-task")}
            onCreateDeal={createDeal}/>}
          {page==="inbox"&&<Inbox messages={messages} contacts={contacts} managers={managers} sites={sites} currentManager={cur} mobile={isMobile}
            onSend={async m=>{
              if(api.connected){
                try{const created=messageFromApi(await apiRequest("/api/messages",{method:"POST",token:api.token,body:messageToApi(m)}));setMessages(p=>[...p,created]);return;}catch(error){console.warn(error);}
              }
              setMessages(p=>[...p,{id:uid(),...m,createdAt:Date.now()}]);
            }}
            onRead={id=>setMessages(p=>p.map(m=>m.id===id?{...m,read:true}:m))}/>}
          {page==="chat"&&<InternalChat messages={internalMessages} setMessages={setInternalMessages} managers={managers} currentManager={cur} mobile={isMobile}/>}
          {page==="calls"&&<Calls calls={calls} contacts={contacts} managers={managers} sites={sites} onAdd={()=>setModal("add-call")} mobile={isMobile}/>}
          {page==="contacts"&&<Contacts contacts={contacts} calls={calls} messages={messages} managers={managers} sites={sites} tagsCatalog={tagsCatalog} mobile={isMobile}
            onAdd={()=>setModal("add-contact")}
            onEdit={c=>setModal({type:"edit-contact",data:c})}
            onStageChange={moveLeadStage}/>}
          {page==="deals"&&<Deals deals={deals} contacts={contacts} managers={managers} sites={sites} stages={dealStages} tagsCatalog={tagsCatalog}
            onAdd={stage=>setModal({type:"add-deal",stage})}
            onStagesChange={setDealStages}
            onRenameStage={renameDealStage}
            onMove={(id,stage)=>{
              const deal=deals.find(d=>d.id===id);
              apiPatch(`/api/deals/${id}`,dealToApi({...deal,stage}),()=>setDeals(p=>p.map(d=>d.id===id?{...d,stage}:d)));
            }}
            onDelete={id=>apiDelete(`/api/deals/${id}`,()=>setDeals(p=>p.filter(d=>d.id!==id)))}/>}
          {page==="tasks"&&<Tasks tasks={tasks} contacts={contacts} managers={managers}
            onAdd={()=>setModal("add-task")}
            onToggle={id=>{
              const task=tasks.find(t=>t.id===id);
              apiPatch(`/api/tasks/${id}`,taskToApi({...task,done:!task?.done}),()=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t)));
            }}
            onDelete={id=>apiDelete(`/api/tasks/${id}`,()=>setTasks(p=>p.filter(t=>t.id!==id)))}/>}
          {page==="team"&&<Team managers={managers} calls={calls} messages={messages} contacts={contacts} sites={sites}
            onAdd={()=>setModal("add-manager")}
            onEdit={m=>setModal({type:"edit-manager",data:m})}
            onRemove={deleteManager}/>}
          </ErrorBoundary>
        </div>
      </div>
    </div>

    {/* Modals */}
    {modal==="add-site"&&<SiteModal managers={managers} onSave={async f=>{await createSite(f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.type==="edit-site"&&<SiteModal initial={modal.data} managers={managers} onSave={async f=>{await saveSite(modal.data,f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {(modal==="add-contact"||modal?.type==="add-contact")&&<ContactModal preset={modal?.preset} managers={managers} sites={sites} tagsCatalog={tagsCatalog} onSave={async f=>{await createContact(f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.type==="edit-contact"&&<ContactModal initial={modal.data} managers={managers} sites={sites} tagsCatalog={tagsCatalog} onSave={async f=>{await saveContact(modal.data,f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-product"&&<ProductModal tagsCatalog={tagsCatalog} onSave={async f=>{await createWarehouseProduct(f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-document"&&<WarehouseDocumentModal contacts={contacts} onSave={async f=>{await createWarehouseDocument(f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-call"&&<CallModal contacts={contacts} managers={managers} sites={sites} onSave={async f=>{await createCall(f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.type==="add-deal"&&<DealModal contacts={contacts} managers={managers} sites={sites} stages={dealStages} tagsCatalog={tagsCatalog} initialStage={modal.stage} onSave={async f=>{await createDeal(f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-task"&&<TaskModal contacts={contacts} managers={managers} onSave={async f=>{await createTask(f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="add-manager"&&<ManagerModal onSave={async f=>{await createManager(f);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.type==="edit-manager"&&<ManagerModal initial={modal.data} onSave={async f=>{await saveManager(modal.data,{...modal.data,...f});setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal==="board-settings"&&<BoardModal manager={cur} onSave={async board=>{await saveManager(cur,{...cur,board});setModal(null);}} onClose={()=>setModal(null)}/>}
  </>;
}
