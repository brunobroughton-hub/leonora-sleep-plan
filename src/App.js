import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://vyirupzqfjhqmwpwwlbc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aXJ1cHpxZmpocW13cHd3bGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDU2OTAsImV4cCI6MjA5MzQyMTY5MH0.IQWylzaFVwk0RLWuekiwUthDWyRL6_WulvefSmO0Yr8";

async function dbGet(day) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leonora_logs?day_number=eq.${day}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const rows = await res.json();
  return rows[0] || null;
}

async function dbUpsert(day, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/leonora_logs`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ day_number: day, ...data, updated_at: new Date().toISOString() }),
  });
}

const DOB        = new Date("2026-02-04");
const PLAN_START = new Date("2026-05-04");

const PHASES = [
  { days:[1,3],   emoji:"🌱", name:"Stabilise",           color:"#c8b4f0",
    focus:"Full daytime feeds every 2–2.5hrs. Bedtime 6:45–7pm. Keep midnight full feed. Gentle 2hr guide after midnight." },
  { days:[4,7],   emoji:"🌙", name:"Nap Rescue",          color:"#8ecae6",
    focus:"Practise Nap 1 in cot. Rescue one midday nap. Log whether each night feed was full or snacky." },
  { days:[8,10],  emoji:"⭐", name:"Reduce Associations", color:"#f4a0b0",
    focus:"Move bedtime feed earlier in routine. Put down drowsy-but-awake once daily. Resettle first after midnight." },
  { days:[11,14], emoji:"🌟", name:"Consolidate",         color:"#90d4b0",
    focus:"If weight/nappies good, stretch one post-midnight interval to 2.5hrs. Keep all true feeds." },
  { days:[15,84], emoji:"✨", name:"Ongoing Shaping",     color:"#f0c080",
    focus:"Continue building on foundations. One cot nap, one rescued longer nap. Follow Leonora's cues." },
];

const SCHEDULE = [
  { time:"6:30",        label:"Wake + Full Feed",     icon:"☀️", type:"feed"  },
  { time:"7:45–8:15",   label:"Nap 1 (cot practice)", icon:"💤", type:"nap"   },
  { time:"9:15–9:45",   label:"Feed",                 icon:"🤱", type:"feed"  },
  { time:"10:15–10:45", label:"Nap 2",                icon:"💤", type:"nap"   },
  { time:"11:30–12:00", label:"Feed",                 icon:"🤱", type:"feed"  },
  { time:"12:30–1:15",  label:"Nap 3",                icon:"💤", type:"nap"   },
  { time:"2:00–2:30",   label:"Feed",                 icon:"🤱", type:"feed"  },
  { time:"3:00–3:45",   label:"Nap 4",                icon:"💤", type:"nap"   },
  { time:"4:30–5:00",   label:"Feed",                 icon:"🤱", type:"feed"  },
  { time:"5:15–5:45",   label:"Catnap if needed",     icon:"😴", type:"nap"   },
  { time:"6:00–6:15",   label:"Bedtime Feed",         icon:"🌙", type:"feed"  },
  { time:"6:45–7:00",   label:"Asleep",               icon:"⭐", type:"sleep" },
];

function getDayNumber() {
  const diff = Math.floor((Date.now() - PLAN_START.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(diff, 84));
}
function getAgeWeeks() { return Math.floor((Date.now() - DOB.getTime()) / (7*86400000)); }
function getAgeDays()  { return (Date.now() - DOB.getTime()) / 86400000; }
function getPhase(day) { return PHASES.find(p => day >= p.days[0] && day <= p.days[1]) || PHASES[PHASES.length-1]; }
function napMins(s,e) {
  if (!s||!e) return null;
  const [sh,sm]=s.split(":").map(Number), [eh,em]=e.split(":").map(Number);
  const m=(eh*60+em)-(sh*60+sm); return m>0?m:null;
}
function emptyLog() {
  return { wake_time:"", bed_time:"",
    nap1_start:"", nap1_end:"", nap2_start:"", nap2_end:"",
    nap3_start:"", nap3_end:"", nap4_start:"", nap4_end:"",
    night_feeds:"", nappies:"", weight:"", hourly_wakes:false,
    mood:"😊", notes:"", guidance:"" };
}
function rowToLog(row) {
  if (!row) return emptyLog();
  return {
    wake_time:row.wake_time||"", bed_time:row.bed_time||"",
    nap1_start:row.nap1_start||"", nap1_end:row.nap1_end||"",
    nap2_start:row.nap2_start||"", nap2_end:row.nap2_end||"",
    nap3_start:row.nap3_start||"", nap3_end:row.nap3_end||"",
    nap4_start:row.nap4_start||"", nap4_end:row.nap4_end||"",
    night_feeds:row.night_feeds||"", nappies:row.nappies||"",
    weight:row.weight||"", hourly_wakes:row.hourly_wakes||false,
    mood:row.mood||"😊", notes:row.notes||"", guidance:row.guidance||"",
  };
}

function Starfield() {
  const stars = Array.from({length:50},(_,i)=>({
    x:(i*137.5)%100, y:(i*73.1)%100,
    r:[1,1,1,2,2,3][i%6], o:0.2+((i*31)%70)/100, d:2+((i*17)%5)
  }));
  return (
    <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}>
      {stars.map((s,i)=>(
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o}>
          <animate attributeName="opacity" values={`${s.o};${Math.min(1,s.o+0.35)};${s.o}`}
            dur={`${s.d}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>
  );
}

function MoonRing({ day, total=84 }) {
  const pct=day/total, r=52, cx=68, cy=68, circ=2*Math.PI*r;
  return (
    <svg width="136" height="136" viewBox="0 0 136 136">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#rg)" strokeWidth="7"
        strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}/>
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c8b4f0"/><stop offset="100%" stopColor="#8ecae6"/>
        </linearGradient>
      </defs>
      <text x={cx} y={cy-8} textAnchor="middle" fill="#e8d8ff" fontSize="20" fontFamily="Georgia,serif">{day}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill="#9985bb" fontSize="10" fontFamily="Georgia,serif">of {total}</text>
      <text x={cx} y={cy+24} textAnchor="middle" fill="#7a6a9a" fontSize="9" fontFamily="Georgia,serif">days</text>
    </svg>
  );
}

function NapBar({ mins }) {
  if (!mins) return null;
  const good=mins>=45;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
      <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.08)",flex:1,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(100,(mins/120)*100)}%`,borderRadius:3,
          background:good?"linear-gradient(90deg,#90d4b0,#5cb88a)":"linear-gradient(90deg,#f0c080,#e08040)"}}/>
      </div>
      <span style={{fontSize:10,color:good?"#90d4b0":"#f0c080",whiteSpace:"nowrap"}}>{mins}m {good?"✓":"short"}</span>
    </div>
  );
}

function SyncDot({ status }) {
  const colors={idle:"#7a6a9a",saving:"#f0c080",saved:"#90d4b0",error:"#f4a0b0"};
  const labels={idle:"",saving:"Saving…",saved:"Saved ✓",error:"Sync error"};
  if (status==="idle") return null;
  return <span style={{fontSize:11,color:colors[status],marginLeft:8}}>{labels[status]}</span>;
}

export default function App() {
  const [tab,setTab]             = useState("today");
  const [dayNum]                 = useState(getDayNumber);
  const [log,setLog]             = useState(emptyLog());
  const [loading,setLoading]     = useState(true);
  const [aiLoading,setAiLoading] = useState(false);
  const [syncStatus,setSyncStatus] = useState("idle");
  const [saveTimer,setSaveTimer]   = useState(null);
  const phase = getPhase(dayNum);

  useEffect(()=>{
    dbGet(dayNum).then(row=>{ setLog(rowToLog(row)); setLoading(false); }).catch(()=>setLoading(false));
  },[dayNum]);

  const scheduleSave = useCallback((newLog)=>{
    setSyncStatus("saving");
    if (saveTimer) clearTimeout(saveTimer);
    const t = setTimeout(async()=>{
      try { await dbUpsert(dayNum,newLog); setSyncStatus("saved"); setTimeout(()=>setSyncStatus("idle"),2000); }
      catch { setSyncStatus("error"); }
    },1200);
    setSaveTimer(t);
  },[dayNum,saveTimer]);

  function update(field,val){ const next={...log,[field]:val}; setLog(next); scheduleSave(next); }

  async function generateGuidance() {
    setAiLoading(true);
    const naps=[
      napMins(log.nap1_start,log.nap1_end), napMins(log.nap2_start,log.nap2_end),
      napMins(log.nap3_start,log.nap3_end), napMins(log.nap4_start,log.nap4_end),
    ];
    const napSummary=naps.map((m,i)=>m?`Nap ${i+1}: ${m} min`:null).filter(Boolean).join(", ")||"no naps logged";
    const totalNapMins=naps.reduce((a,m)=>a+(m||0),0);
    const ageW=getAgeWeeks(), ageD=Math.round(getAgeDays())%7;
    const prompt=`You are a warm, knowledgeable baby sleep coach. Give personalised, practical guidance for tonight and tomorrow.

Baby: Leonora, ${ageW} weeks and ${ageD} days old (born 4 February 2026). Breastfed only — mix of good full feeds and shorter snacky ones. Slower weight gain is a key concern (last recorded 5.1kg on 28 April 2026).

CRITICAL: Do NOT suggest reducing or stretching night feeds aggressively. Feeding and weight gain always come first. This is sleep shaping only — not sleep training, not night weaning.

Today is Day ${dayNum} of 84. Phase: ${phase.name} — ${phase.focus}

Today's logged data:
- Wake time: ${log.wake_time||"not logged"}
- Naps: ${napSummary} (total: ${totalNapMins} min)
- Bedtime asleep: ${log.bed_time||"not yet"}
- Night feeds last night: ${log.night_feeds||"not logged"}
- Wet nappies today: ${log.nappies||"not logged"}
- Weight today: ${log.weight?log.weight+"g":"not logged"}
- Hourly wakes after midnight: ${log.hourly_wakes?"yes":"no"}
- Leonora's mood: ${log.mood}
- Parent notes: ${log.notes||"none"}

Give 3–5 short, warm, specific, actionable points. If nappies below 5 or weight concerning, flag gently. Tired parent reading this at night — keep it concise and kind. Plain text only.`;

    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] })
      });
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"Unable to generate guidance right now.";
      const next={...log,guidance:text}; setLog(next); await dbUpsert(dayNum,next);
      setSyncStatus("saved"); setTimeout(()=>setSyncStatus("idle"),2000);
    } catch { setLog({...log,guidance:"Could not connect. Try again."}); }
    setAiLoading(false);
  }

  const naps=[
    {s:log.nap1_start,e:log.nap1_end,sf:"nap1_start",ef:"nap1_end"},
    {s:log.nap2_start,e:log.nap2_end,sf:"nap2_start",ef:"nap2_end"},
    {s:log.nap3_start,e:log.nap3_end,sf:"nap3_start",ef:"nap3_end"},
    {s:log.nap4_start,e:log.nap4_end,sf:"nap4_start",ef:"nap4_end"},
  ];
  const totalNapMins=naps.reduce((a,n)=>a+(napMins(n.s,n.e)||0),0);
  const lowNappies=log.nappies!==""&&Number(log.nappies)<5;

  const C={
    app:{minHeight:"100vh",background:"linear-gradient(160deg,#0d0820 0%,#1a0f35 35%,#0f2540 70%,#091825 100%)",fontFamily:"Georgia,serif",color:"#f0e6ff",position:"relative",overflowX:"hidden"},
    z1:{position:"relative",zIndex:1},
    hdr:{textAlign:"center",padding:"28px 20px 6px"},
    h1:{fontSize:24,fontWeight:"normal",color:"#f5e6ff",margin:"6px 0 3px",letterSpacing:"0.05em"},
    sub:{fontSize:10,color:"#7a6a9a",letterSpacing:"0.12em",textTransform:"uppercase",margin:0},
    pill:{display:"inline-flex",alignItems:"center",gap:5,margin:"10px auto 0",padding:"6px 16px",borderRadius:20,fontSize:11,letterSpacing:"0.05em",background:`${phase.color}18`,border:`1px solid ${phase.color}40`,color:phase.color},
    nav:{display:"flex",justifyContent:"center",gap:5,padding:"14px 12px 2px",flexWrap:"wrap"},
    nb:(a)=>({padding:"7px 14px",borderRadius:20,fontFamily:"Georgia,serif",fontSize:11,cursor:"pointer",transition:"all 0.2s",border:a?"1px solid rgba(200,170,255,0.5)":"1px solid rgba(200,170,255,0.14)",background:a?"rgba(180,130,255,0.18)":"rgba(255,255,255,0.03)",color:a?"#e8d5ff":"#7a6a9a"}),
    wrap:{padding:"12px 14px 60px",maxWidth:560,margin:"0 auto"},
    card:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(200,170,255,0.11)",borderRadius:15,padding:16,marginBottom:11,backdropFilter:"blur(6px)"},
    ch:{fontSize:10,letterSpacing:"0.13em",textTransform:"uppercase",color:"#7a6a9a",marginBottom:12},
    lbl:{fontSize:11,color:"#9985bb",display:"block",marginBottom:3},
    inp:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(200,170,255,0.17)",borderRadius:7,color:"#f0e6ff",padding:"8px 10px",fontSize:13,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"},
    row:{display:"flex",gap:9,marginBottom:11},
    half:{flex:1,minWidth:0},
    grid4:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:4},
    stat:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,170,255,0.07)",borderRadius:11,padding:"11px 7px",textAlign:"center"},
    sn:{fontSize:18,color:"#d4b8ff",display:"block",marginBottom:2},
    sl:{fontSize:9,color:"#7a6a9a",letterSpacing:"0.05em"},
    ta:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(200,170,255,0.17)",borderRadius:7,color:"#f0e6ff",padding:"8px 10px",fontSize:12,fontFamily:"Georgia,serif",resize:"vertical",minHeight:54,boxSizing:"border-box"},
    warn:{background:"rgba(255,140,60,0.07)",border:"1px solid rgba(255,140,60,0.32)",borderRadius:12,padding:13,marginBottom:11},
    schRow:(t)=>({display:"flex",gap:10,padding:"9px 11px",borderRadius:10,marginBottom:6,background:t==="nap"?"rgba(140,100,220,0.09)":t==="feed"?"rgba(80,160,180,0.09)":"rgba(200,140,80,0.09)",border:`1px solid ${t==="nap"?"rgba(180,130,255,0.16)":t==="feed"?"rgba(100,180,200,0.16)":"rgba(220,160,80,0.16)"}`}),
    ph:(p,a)=>({background:a?`${p.color}10`:"rgba(255,255,255,0.02)",border:`1px solid ${a?p.color+"38":"rgba(200,170,255,0.08)"}`,borderRadius:12,padding:13,marginBottom:8}),
    dots:{display:"flex",gap:3,flexWrap:"wrap",marginTop:9},
    dot:(f,c)=>({width:8,height:8,borderRadius:"50%",background:c?"#fff":f?"#c8b4f060":"rgba(255,255,255,0.07)",border:`1px solid ${c?"#fff":f?"rgba(200,170,255,0.25)":"rgba(255,255,255,0.09)"}`,boxShadow:c?"0 0 6px #fff":f?"0 0 3px #c8b4f050":"none"}),
    mb:(a)=>({fontSize:19,padding:"3px 8px",borderRadius:7,cursor:"pointer",background:a?"rgba(180,130,255,0.22)":"transparent",border:a?"1px solid rgba(180,130,255,0.42)":"1px solid transparent"}),
    aiCard:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,170,255,0.18)",borderRadius:15,padding:18,marginBottom:11,position:"relative",overflow:"hidden"},
    aiBar:{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#c8b4f0,#8ecae6,#f4a0b0)"},
  };

  const TABS=[{id:"today",icon:"🌙",label:"Today"},{id:"schedule",icon:"⏰",label:"Schedule"},{id:"plan",icon:"📅",label:"Plan"},{id:"tips",icon:"💡",label:"Tips"}];

  if (loading) return (
    <div style={{...C.app,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Starfield/>
      <div style={{textAlign:"center",zIndex:1}}>
        <div style={{fontSize:40,marginBottom:12}}>🌙</div>
        <p style={{color:"#9985bb",fontSize:13}}>Loading Leonora's plan…</p>
      </div>
    </div>
  );

  return (
    <div style={C.app}>
      <Starfield/>
      <div style={C.z1}>
        <div style={C.hdr}>
          <div style={{fontSize:38,filter:"drop-shadow(0 0 10px rgba(200,170,255,0.4))"}}>🌙</div>
          <h1 style={C.h1}>Leonora's Sleep Plan</h1>
          <p style={C.sub}>Born 4 Feb 2026 · {getAgeWeeks()}w {Math.round(getAgeDays())%7}d old · Started 4 May 2026</p>
          <div style={C.pill}>{phase.emoji} Day {dayNum} · {phase.name}<SyncDot status={syncStatus}/></div>
        </div>
        <div style={{display:"flex",justifyContent:"center",padding:"8px 0 0"}}><MoonRing day={dayNum}/></div>
        <div style={C.nav}>
          {TABS.map(t=><button key={t.id} style={C.nb(tab===t.id)} onClick={()=>setTab(t.id)}>{t.icon} {t.label}</button>)}
        </div>
        <div style={C.wrap}>

          {tab==="today" && <>
            <div style={C.aiCard}>
              <div style={C.aiBar}/>
              <div style={C.ch}>✨ Today's AI Guidance</div>
              {log.guidance ? (
                <>
                  <div style={{fontSize:12,color:"#d4c4f0",lineHeight:1.85,whiteSpace:"pre-wrap"}}>{log.guidance}</div>
                  <button onClick={generateGuidance} disabled={aiLoading}
                    style={{marginTop:12,background:"transparent",border:"1px solid rgba(200,170,255,0.2)",borderRadius:8,color:"#9985bb",padding:"6px 14px",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {aiLoading?"…":"↻ Regenerate"}
                  </button>
                </>
              ) : (
                <div style={{textAlign:"center",padding:"6px 0"}}>
                  <p style={{fontSize:12,color:"#9985bb",marginBottom:14,lineHeight:1.6}}>Log today's data below, then tap for personalised guidance.</p>
                  <button onClick={generateGuidance} disabled={aiLoading}
                    style={{background:aiLoading?"rgba(180,130,255,0.08)":"linear-gradient(135deg,rgba(180,130,255,0.28),rgba(100,160,220,0.28))",border:"1px solid rgba(180,130,255,0.38)",borderRadius:11,color:"#e8d5ff",padding:"11px 26px",fontSize:13,cursor:aiLoading?"not-allowed":"pointer",fontFamily:"Georgia,serif"}}>
                    {aiLoading?"🌙 Thinking…":"✨ Generate Today's Guidance"}
                  </button>
                </div>
              )}
            </div>
            <div style={C.card}>
              <div style={C.ch}>At a Glance</div>
              <div style={C.grid4}>
                {[{n:totalNapMins?`${totalNapMins}m`:"—",l:"Nap Total"},{n:log.nappies||"—",l:"Nappies"},{n:log.weight?`${log.weight}g`:"—",l:"Weight"},{n:log.night_feeds||"—",l:"Night Feeds"}].map((s,i)=>(
                  <div key={i} style={C.stat}><span style={C.sn}>{s.n}</span><span style={C.sl}>{s.l}</span></div>
                ))}
              </div>
            </div>
            <div style={C.card}>
              <div style={C.ch}>Sleep Times</div>
              <div style={C.row}>
                <div style={C.half}><label style={C.lbl}>☀️ Wake time</label><input type="time" style={C.inp} value={log.wake_time} onChange={e=>update("wake_time",e.target.value)}/></div>
                <div style={C.half}><label style={C.lbl}>🌙 Bedtime asleep</label><input type="time" style={C.inp} value={log.bed_time} onChange={e=>update("bed_time",e.target.value)}/></div>
              </div>
            </div>
            <div style={C.card}>
              <div style={C.ch}>Nap Log</div>
              {naps.map((n,i)=>{
                const m=napMins(n.s,n.e);
                return (
                  <div key={i} style={{marginBottom:10}}>
                    <div style={{display:"flex",gap:7,alignItems:"center"}}>
                      <span style={{fontSize:11,color:"#9985bb",width:44,flexShrink:0}}>💤 Nap {i+1}</span>
                      <input type="time" style={{...C.inp,fontSize:12}} value={n.s} onChange={e=>update(n.sf,e.target.value)}/>
                      <span style={{color:"#7a6a9a",fontSize:11}}>→</span>
                      <input type="time" style={{...C.inp,fontSize:12}} value={n.e} onChange={e=>update(n.ef,e.target.value)}/>
                    </div>
                    <NapBar mins={m}/>
                  </div>
                );
              })}
            </div>
            <div style={C.card}>
              <div style={C.ch}>Feeding & Health</div>
              <div style={C.row}>
                <div style={C.half}><label style={C.lbl}>🤱 Night feeds</label><input type="number" min="0" max="12" style={C.inp} value={log.night_feeds} placeholder="0" onChange={e=>update("night_feeds",e.target.value)}/></div>
                <div style={C.half}><label style={C.lbl}>💧 Wet nappies</label><input type="number" min="0" max="15" style={C.inp} value={log.nappies} placeholder="0" onChange={e=>update("nappies",e.target.value)}/></div>
              </div>
              <div style={C.row}>
                <div style={C.half}><label style={C.lbl}>⚖️ Weight (grams)</label><input type="number" style={C.inp} value={log.weight} placeholder="e.g. 5150" onChange={e=>update("weight",e.target.value)}/></div>
                <div style={C.half}><label style={C.lbl}>😊 Leonora's mood</label><div style={{display:"flex",gap:5,marginTop:2}}>{["😊","😴","😢","😤","🥰"].map(m=><button key={m} style={C.mb(log.mood===m)} onClick={()=>update("mood",m)}>{m}</button>)}</div></div>
              </div>
              <label style={{...C.lbl,display:"flex",alignItems:"center",gap:7,cursor:"pointer",marginBottom:10}}>
                <input type="checkbox" checked={log.hourly_wakes} onChange={e=>update("hourly_wakes",e.target.checked)} style={{accentColor:"#c8b4f0",width:14,height:14}}/>
                Hourly wakes after midnight?
              </label>
              <label style={C.lbl}>📝 Notes</label>
              <textarea style={C.ta} value={log.notes} onChange={e=>update("notes",e.target.value)} placeholder="Anything to remember about today…"/>
            </div>
            {lowNappies&&<div style={C.warn}><p style={{margin:0,fontSize:12,color:"#ffb06a",lineHeight:1.6}}>⚠️ <strong>Fewer than 5 wet nappies</strong> — pause the plan and check feeding.</p></div>}
          </>}

          {tab==="schedule" && <>
            <div style={C.card}>
              <div style={C.ch}>Daily Rhythm</div>
              <p style={{margin:"0 0 12px",fontSize:11,color:"#9985bb",lineHeight:1.6}}>Last nap ending 4:30pm → bedtime 6:15 · 5:00pm → 6:30 · 5:30pm → 7:00</p>
              {SCHEDULE.map((s,i)=>(
                <div key={i} style={C.schRow(s.type)}>
                  <span style={{fontSize:17,flexShrink:0}}>{s.icon}</span>
                  <div style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <strong style={{fontSize:12,color:"#e8d5ff"}}>{s.label}</strong>
                    <span style={{fontSize:10,color:"#7a6a9a"}}>{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={C.card}>
              <div style={C.ch}>Bedtime Routine</div>
              {[["6:00–6:15","Nappy · dim lights · sleep sack · short song or book"],["Feed","Full feed — not a quick doze"],["After feed","Burp · upright cuddle · cot calm and heavy-eyed"],["Settling","Hand on chest · shush · pick up if upset · put down when calm · cap 15–20 min"]].map(([t,d],i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:11,alignItems:"flex-start"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(180,130,255,0.16)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#c8b4f0",flexShrink:0}}>{i+1}</div>
                  <div><div style={{fontSize:9,color:"#7a6a9a",textTransform:"uppercase",letterSpacing:"0.07em"}}>{t}</div><div style={{fontSize:12,color:"#d4c4f0",lineHeight:1.55,marginTop:2}}>{d}</div></div>
                </div>
              ))}
            </div>
          </>}

          {tab==="plan" && <>
            <div style={C.card}>
              <div style={C.ch}>84-Day Progress</div>
              <div style={C.dots}>{Array.from({length:84},(_,i)=><div key={i} style={C.dot(i+1<dayNum,i+1===dayNum)} title={`Day ${i+1}`}/>)}</div>
              <p style={{fontSize:10,color:"#7a6a9a",marginTop:7}}>{dayNum} of 84 · {Math.round(dayNum/84*100)}% complete</p>
            </div>
            {PHASES.slice(0,4).map((p,i)=>{
              const active=dayNum>=p.days[0]&&dayNum<=p.days[1], done=dayNum>p.days[1];
              return <div key={i} style={C.ph(p,active)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><strong style={{fontSize:13,color:active?p.color:"#d4c4f0"}}>{p.emoji} {p.name}</strong><span style={{fontSize:10,color:"#7a6a9a"}}>{done?"✓ Done":active?"← Now":`Day ${p.days[0]}–${p.days[1]}`}</span></div><p style={{margin:0,fontSize:11,color:"#b0a0cc",lineHeight:1.6}}>{p.focus}</p></div>;
            })}
            <div style={{...C.card,border:"1px solid rgba(255,130,100,0.22)"}}>
              <div style={C.ch}>⚠️ Non-Negotiables</div>
              {["Never cut night feeds aggressively — weight gain is being monitored.","Keep midnight feed + at least 1–2 further night feeds as needed.","Pause if weight stalls, nappies drop below 5/day, or Leonora seems distressed.","Safe sleep always: back · firm flat mattress · clear cot · same room as parents."].map((t,i)=>(
                <div key={i} style={{display:"flex",gap:7,marginBottom:8}}><span style={{color:"#e09090",fontSize:12}}>•</span><span style={{fontSize:11,color:"#d4c4f0",lineHeight:1.6}}>{t}</span></div>
              ))}
            </div>
          </>}

          {tab==="tips" && <>
            {[
              {icon:"⏰",title:"Wake Windows",body:"75–90 min early day · 90–105 min later day. Watch for eye rubs, staring off, turning away. Start wind-down early."},
              {icon:"🫶",title:"The 45-Min Rescue",body:"At 35–40 min, be nearby. Stirs → pause 60–90 sec. Fusses → hand on chest + shush. Escalates → pick up, rock, put back down. Try 10–15 min. If it doesn't work, end the nap and shorten the next wake window."},
              {icon:"🌛",title:"Night Feed Guide",body:"Keep midnight as a full feed always. After a good feed, aim to wait 2hrs before feeding again unless clearly hungry. Sucks 1–3 min and dozes = snack. Treat the next similar wake as resettle-first."},
              {icon:"💡",title:"One Cot Nap Rule",body:"Practise independent settling for Nap 1 only. Everything else — contact, pram, carrier — is completely fine. One practice nap + one rescued longer nap is enough."},
              {icon:"🛡️",title:"Safe Sleep",body:"Always on back · firm flat mattress · clear cot · own sleep space · same room as parents for first 6 months."},
            ].map((tip,i)=>(
              <div key={i} style={C.card}>
                <div style={{fontSize:20,marginBottom:7}}>{tip.icon}</div>
                <strong style={{fontSize:13,color:"#e8d5ff",display:"block",marginBottom:7}}>{tip.title}</strong>
                <p style={{margin:0,fontSize:11,color:"#b0a0cc",lineHeight:1.75}}>{tip.body}</p>
              </div>
            ))}
          </>}

        </div>
      </div>
    </div>
  );
}
