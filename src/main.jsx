import React,{useEffect,useMemo,useRef,useState} from "react";
import{createRoot}from"react-dom/client";
import{Activity,ChevronDown,Pause,Play,Plus,RefreshCcw,Server,ShieldCheck,SlidersHorizontal,Trash2,Zap}from"lucide-react";
import"./styles.css";

const initial=[
{id:1,name:"server-01",weight:5,cpu:42,connections:12,latency:72,requests:421,healthy:true},
{id:2,name:"server-02",weight:3,cpu:38,connections:9,latency:81,requests:408,healthy:true},
{id:3,name:"server-03",weight:2,cpu:31,connections:7,latency:66,requests:402,healthy:true}
];
const algorithms=["Round Robin","Least Connections","Weighted"];

function App(){
 const[servers,setServers]=useState(initial),[algo,setAlgo]=useState("Round Robin"),[rps,setRps]=useState(100);
 const[running,setRunning]=useState(false),[total,setTotal]=useState(1231),[failed,setFailed]=useState(17),[avg,setAvg]=useState(84),[logs,setLogs]=useState([]);
 const rr=useRef(0), idRef=useRef(4);

 const active=servers.filter(s=>s.healthy);
 const success=total-failed;
 const split=useMemo(()=>{
   const sum=active.reduce((a,s)=>a+s.requests,0)||1;
   return servers.map(s=>({...s,pct:s.healthy?Math.round(s.requests/sum*100):0}));
 },[servers]);

 function route(){
   const pool=servers.filter(s=>s.healthy);
   if(!pool.length){
     setTotal(x=>x+1);setFailed(x=>x+1);
     setLogs(l=>[{id:Date.now(),req:`#${total+1}`,server:"no healthy server",status:"FAILED",lat:"—"},...l].slice(0,7));
     return;
   }
   let target;
   if(algo==="Least Connections") target=[...pool].sort((a,b)=>a.connections-b.connections)[0];
   else if(algo==="Weighted"){
     const sum=pool.reduce((a,s)=>a+s.weight,0);let n=rr.current++%sum;
     target=pool.find(s=>(n-=s.weight)<0)||pool[0];
   }else target=pool[rr.current++%pool.length];
   const lat=Math.max(35,target.latency+Math.floor(Math.random()*21)-10);
   setServers(ss=>ss.map(s=>s.id===target.id?{...s,requests:s.requests+1,cpu:Math.min(95,Math.max(8,s.cpu+(Math.random()>.5?1:-1))),connections:Math.max(0,s.connections+(Math.random()>.55?1:-1))}:s));
   setTotal(x=>x+1);setAvg(x=>Math.round(x*.9+lat*.1));
   setLogs(l=>[{id:Date.now(),req:`#${total+1}`,server:target.name,status:"200 OK",lat:`${lat}ms`},...l].slice(0,7));
 }
 useEffect(()=>{if(!running)return;const t=setInterval(route,Math.max(150,1000/Math.min(rps,7)));return()=>clearInterval(t)},[running,rps,algo,servers,total]);

 function toggle(id){setServers(s=>s.map(x=>x.id===id?{...x,healthy:!x.healthy}:x))}
 function add(){const id=idRef.current++;setServers(s=>[...s,{id,name:`server-${String(id).padStart(2,"0")}`,weight:2,cpu:24,connections:0,latency:70,requests:0,healthy:true}])}
 function reset(){setRunning(false);setServers(initial);setTotal(1231);setFailed(17);setAvg(84);setLogs([]);rr.current=0;idRef.current=4}

 return <div className="page">
   <header className="header">
    <div><div className="eyebrow">SYSTEM LAB / 01</div><h1>Load Balancer <span>Simulator</span></h1><p>See how requests move through a server pool. Change the rules. Break a node. Watch the system adapt.</p></div>
    <div className="header-actions"><span className="online"><i/> system online</span><button onClick={reset} title="Reset"><RefreshCcw size={16}/></button></div>
   </header>

   <main>
    <section className="metrics">
      <Metric label="requests" value={total.toLocaleString()}/>
      <Metric label="successful" value={success.toLocaleString()} good/>
      <Metric label="failed" value={failed} danger/>
      <Metric label="avg latency" value={`${avg} ms`}/>
    </section>

    <div className="layout">
      <section className="left">
       <div className="section-title"><div><small>TRAFFIC MAP</small><h2>Request flow</h2></div><span className="live"><i/> live</span></div>
       <div className="map">
        <div className="requests">
          {Array.from({ length: 24 }, (_, i) => (
            <b
              key={i}
              style={{
                left: `${8 + (i % 8) * 11}%`,
                top: `${12 + Math.floor(i / 8) * 17}%`,
                animationDelay: `${(i % 6) * 0.12}s`,
              }}
            />
          ))}
        </div>
        <div className="source">incoming<br/><strong>{rps}<em>/sec</em></strong></div>
        <div className="lb"><Zap size={15}/><strong>LOAD BALANCER</strong><span>{algo}</span></div>
        <div className="lines">{servers.map((s,i)=><div key={s.id} className={`line l${i%4} ${s.healthy?"":"off"}`}><i/><i/><i/></div>)}</div>
       </div>

       <div className="servers">
        {split.map(s=><article className={!s.healthy?"offline":""} key={s.id}>
          <div className="card-top"><span><Server size={15}/>{s.name}</span><button onClick={()=>toggle(s.id)}>{s.healthy?"disable":"restart"}</button></div>
          <div className={`state ${s.healthy?"ok":"bad"}`}><i/>{s.healthy?"healthy":"offline"}</div>
          <div className="cpu"><div className="ring" style={{"--p":`${s.healthy?s.cpu:0}%`}}><strong>{s.healthy?s.cpu:0}%</strong><span>CPU</span></div></div>
          <div className="details"><span>requests <b>{s.requests}</b></span><span>connections <b>{s.connections}</b></span><span>latency <b>{s.healthy?s.latency+"ms":"—"}</b></span></div>
        </article>)}
       </div>

       <div className="logbox">
        <div className="loghead"><span><Activity size={14}/> recent requests</span><small>latest 7</small></div>
        {logs.length?logs.map(x=><div className="log" key={x.id}><span>{x.req}</span><b>→</b><strong>{x.server}</strong><em className={x.status==="FAILED"?"bad":"ok"}>{x.status}</em><small>{x.lat}</small></div>):<div className="empty">Press “start traffic” to see requests appear here.</div>}
       </div>
      </section>

      <aside className="right">
       <section className="control">
        <div className="section-title"><div><small>CONTROL PLANE</small><h2>Simulation</h2></div><SlidersHorizontal size={17}/></div>
        <label>requests / second <output>{rps}</output></label>
        <input type="range" min="10" max="500" value={rps} onChange={e=>setRps(+e.target.value)}/>
        <label>routing algorithm</label>
        <div className="select"><select value={algo} onChange={e=>setAlgo(e.target.value)}>{algorithms.map(x=><option key={x}>{x}</option>)}</select><ChevronDown size={15}/></div>
        <div className="actions"><button className="primary" onClick={()=>setRunning(x=>!x)}>{running?<Pause size={15}/>:<Play size={15}/>} {running?"pause":"start traffic"}</button><button onClick={route}><Zap size={15}/> burst</button></div>
       </section>

       <section className="pool">
        <div className="section-title"><div><small>INFRASTRUCTURE</small><h2>Server pool</h2></div><button className="add" onClick={add}><Plus size={14}/> add</button></div>
        {servers.map(s=><div className="pool-row" key={s.id}><Server size={15}/><div><b>{s.name}</b><span className={s.healthy?"ok":"bad"}><i/> {s.healthy?"healthy":"offline"}</span></div><button onClick={()=>toggle(s.id)}>{s.healthy?"kill":"restart"}</button></div>)}
       </section>

       <section className="distribution">
        <div className="section-title"><div><small>TELEMETRY</small><h2>Traffic split</h2></div></div>
        <div className="bars">{split.map((s,i)=><div className="bar-row" key={s.id}><span>{s.name}</span><div><i className={`c${i%4}`} style={{width:`${s.pct}%`}}/></div><b>{s.pct}%</b></div>)}</div>
        <p><ShieldCheck size={14}/> Healthy nodes receive traffic automatically.</p>
       </section>
      </aside>
    </div>
   </main>
   <footer>LOCAL SIMULATION · NO CLOUD REQUIRED · CLIENT-SIDE ROUTING</footer>
 </div>
}
function Metric({label,value,good,danger}){return <div className="metric"><small>{label}</small><strong className={good?"good":danger?"danger":""}>{value}</strong></div>}
createRoot(document.getElementById("root")).render(<App/>);
