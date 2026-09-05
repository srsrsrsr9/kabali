/* UI. Reads the catalogue from window.TrackerData and all mutable state
   from window.TrackerStore, so the storage backend can change without
   touching anything here. */
(function(){
"use strict";
var h = React.createElement;
var T = new Proxy({}, { get:function(_,tag){
  return function(p){
    return h.apply(null, [tag, p].concat(Array.prototype.slice.call(arguments, 1)));
  };
} });
var useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo;

var D = window.TrackerData;
var SCHOOLS=D.SCHOOLS, QUESTIONS=D.QUESTIONS, PHASES=D.PHASES, ZONES=D.ZONES;
var STATUS=D.STATUS, TELUGU=D.TELUGU, RSTATUS=D.RSTATUS;
var look=D.look, telHref=D.telHref;
var store = window.TrackerStore;

function useStore(){
  var s=useState(0), tick=s[1];
  useEffect(function(){ return store.subscribe(function(){ tick(function(v){return v+1;}); }); },[]);
  return store;
}
function useNarrow(){
  var q = "(max-width: 760px)";
  var s = useState(typeof window.matchMedia === "function" ? window.matchMedia(q).matches : false);
  var v = s[0], set = s[1];
  useEffect(function(){
    if (typeof window.matchMedia !== "function") return;
    var m = window.matchMedia(q), fn = function(e){ set(e.matches); };
    if (m.addEventListener) m.addEventListener("change", fn); else m.addListener(fn);
    return function(){ if (m.removeEventListener) m.removeEventListener("change", fn); else m.removeListener(fn); };
  },[]);
  return v;
}
function Field(props){
  var st=useState(props.value||""), val=st[0], set=st[1];
  useEffect(function(){ set(props.value||""); },[props.value, props.rowKey]);
  var common = {
    value: val,
    placeholder: props.placeholder||"",
    onChange:function(e){ set(e.target.value); },
    onBlur:function(){ if((props.value||"") !== val) props.onCommit(val); }
  };
  return props.area ? T.textarea(common) : T.input(Object.assign({type:"text"}, common));
}
function CallBtn(props){
  var num = props.number;
  if (!num) return T.span({className:"call sm", "aria-disabled":"true"}, "No number");
  return T.a({className:"call" + (props.small ? " sm" : ""), href:telHref(num)}, "Call");
}

/* ==========================================================
   SCHOOLS
   ========================================================== */
function QuestionList(props){
  var s = props.s, sc = props.sc, rec = props.rec;
  return T.div({className:"qlist"}, QUESTIONS.map(function(q){
    return T.div({className:"q", key:q.k},
      T.div({className:"q-h"},
        T.span({className:"q-n"}, q.k.toUpperCase()),
        T.span({className:"q-t"}, q.t, q.hint ? T.em({className:"q-hint"}, q.hint) : null)),
      h(Field, {rowKey:sc.id, area:true, value:rec[q.k]||"", placeholder:"Their answer…",
        onCommit:function(v){ var p={}; p[q.k]=v; s.put("schools", sc.id, p); }}));
  }));
}
function SideFields(props){
  var s=props.s, sc=props.sc, rec=props.rec;
  return T.div({className:"side"},
    T.p({style:{fontSize:".87rem", color:"var(--ink-2)"}}, sc.note),
    sc.email ? T.p({style:{fontSize:".78rem"}}, T.a({href:"mailto:"+sc.email}, sc.email)) : null,
    T.div({className:"fld"}, T.label(null,"Phone (edit if wrong)"),
      h(Field,{rowKey:sc.id, value:rec.phone||"", placeholder:sc.phone||"not found — add it",
        onCommit:function(v){ s.put("schools",sc.id,{phone:v}); }})),
    T.div({className:"fld"}, T.label(null,"Confirmed annual fee"),
      h(Field,{rowKey:sc.id, value:rec.fee||"", placeholder:sc.fee,
        onCommit:function(v){ s.put("schools",sc.id,{fee:v}); }})),
    T.div({className:"fld"}, T.label(null,"Who you spoke to"),
      h(Field,{rowKey:sc.id, value:rec.contact||"", placeholder:"Name, extension, email",
        onCommit:function(v){ s.put("schools",sc.id,{contact:v}); }})),
    T.div({className:"fld"}, T.label(null,"Called on"),
      T.input({type:"date", value:rec.calledOn||"",
        onChange:function(e){ s.put("schools",sc.id,{calledOn:e.target.value}); }})),
    T.div({className:"fld"}, T.label(null,"Notes"),
      h(Field,{rowKey:sc.id, area:true, value:rec.notes||"", placeholder:"Anything else worth remembering",
        onCommit:function(v){ s.put("schools",sc.id,{notes:v}); }})));
}

function SchoolsView(){
  var s=useStore(), narrow=useNarrow();
  var f=useState({q:"", status:"all", telugu:"all", senior:false, near:false, phoned:false}), filt=f[0], setFilt=f[1];
  var o=useState(null), open=o[0], setOpen=o[1];
  function up(k,v){ var x={}; x[k]=v; setFilt(Object.assign({},filt,x)); }

  var rows = useMemo(function(){
    return SCHOOLS.filter(function(sc){
      var rec = s.get("schools", sc.id) || {};
      if (filt.q && (sc.name+" "+sc.area).toLowerCase().indexOf(filt.q.toLowerCase()) < 0) return false;
      if (filt.status !== "all" && (rec.status||"none") !== filt.status) return false;
      if (filt.telugu !== "all" && (rec.telugu||"unknown") !== filt.telugu) return false;
      if (filt.senior && sc.upto !== "XII") return false;
      if (filt.near && sc.km > 5) return false;
      if (filt.phoned && !(rec.phone || sc.phone)) return false;
      return true;
    });
  }, [filt, s.rev()]);

  var controls = T.div({className:"bar"},
    T.input({type:"search", placeholder:"Search school or area…", value:filt.q, style:{minWidth:"210px",flex:narrow?"1 1 100%":"none"},
      onChange:function(e){ up("q", e.target.value); }}),
    T.select({value:filt.status, onChange:function(e){ up("status", e.target.value); }},
      T.option({value:"all"},"All statuses"),
      STATUS.map(function(x){ return T.option({key:x.v,value:x.v},x.l); })),
    T.select({value:filt.telugu, onChange:function(e){ up("telugu", e.target.value); }},
      T.option({value:"all"},"Any Telugu answer"),
      TELUGU.map(function(x){ return T.option({key:x.v,value:x.v},x.l); })),
    T.button({className:"btn"+(filt.senior?" primary":""), onClick:function(){ up("senior",!filt.senior); }},"Runs to XII"),
    T.button({className:"btn"+(filt.near?" primary":""), onClick:function(){ up("near",!filt.near); }},"Within 5 km"),
    T.button({className:"btn"+(filt.phoned?" primary":""), onClick:function(){ up("phoned",!filt.phoned); }},"Has a number"),
    T.div({className:"spacer"}),
    T.span({className:"ui", style:{fontSize:".76rem",color:"var(--ink-3)"}}, rows.length+" of "+SCHOOLS.length));

  if (narrow){
    return T.div(null, controls,
      T.div({className:"cards"}, rows.length===0
        ? T.div({className:"card"}, T.div({className:"empty"},"No school matches those filters."))
        : rows.map(function(sc){
            var rec = s.get("schools", sc.id)||{};
            var num = rec.phone || sc.phone;
            var isOpen = open===sc.id;
            var answered = QUESTIONS.filter(function(q){ return (rec[q.k]||"").trim(); }).length;
            return T.div({className:"scard"+(isOpen?" hi":""), key:sc.id},
              T.h3(null, sc.name),
              T.div({className:"a"}, sc.area),
              T.div({className:"flags"},
                T.span({className:"chip c-"+sc.read}, sc.read==="go"?"Shortlist":sc.read==="warn"?"Verify":sc.read==="stop"?"Drop":"Backup"),
                sc.telugu ? T.span({className:"chip c-acc"},"Telugu-origin chain") : null,
                answered>0 ? T.span({className:"chip c-idle"}, answered+"/9 answered") : null),
              T.div({className:"meta"},
                T.span(null, T.b(null,"km "), sc.km===99?"?":"~"+sc.km),
                T.span(null, T.b(null,"to "), sc.upto),
                T.span(null, T.b(null,"₹ "), rec.fee||sc.fee)),
              T.div({className:"acts"},
                h(CallBtn,{number:num}),
                T.button({className:"btn", onClick:function(){ setOpen(isOpen?null:sc.id); }}, isOpen?"Close":"Open call sheet"),
                num ? T.span({className:"tel"}, num) : null),
              T.div({className:"picks"},
                T.select({value:rec.status||"none","aria-label":"Status for "+sc.name,
                  onChange:function(e){ s.put("schools",sc.id,{status:e.target.value}); }},
                  STATUS.map(function(x){ return T.option({key:x.v,value:x.v},x.l); })),
                T.select({value:rec.telugu||"unknown","aria-label":"Telugu answer for "+sc.name,
                  onChange:function(e){ s.put("schools",sc.id,{telugu:e.target.value}); }},
                  TELUGU.map(function(x){ return T.option({key:x.v,value:x.v},x.l); }))),
              isOpen ? T.div({className:"body"},
                h(QuestionList,{s:s, sc:sc, rec:rec}),
                h(SideFields,{s:s, sc:sc, rec:rec})) : null);
          })),
      T.p({className:"hint"}, "Numbers came from public directories, not the schools — correct them in the call sheet as you go. Only Janes International has no number at all."));
  }

  return T.div(null, controls,
    T.div({className:"scroller"}, T.table(null,
      T.thead(null, T.tr(null,
        T.th(null,"School"), T.th(null,"Call"), T.th(null,"~km"), T.th(null,"To"),
        T.th(null,"Indicative ₹/yr"), T.th(null,"Status"), T.th(null,"Telugu"), T.th(null,"Read"))),
      T.tbody(null, rows.length===0
        ? T.tr(null, T.td({colSpan:8}, T.div({className:"empty"},"No school matches those filters.")))
        : rows.map(function(sc){
            var rec = s.get("schools", sc.id)||{};
            var num = rec.phone || sc.phone;
            var isOpen = open===sc.id;
            var answered = QUESTIONS.filter(function(q){ return (rec[q.k]||"").trim(); }).length;
            return [
              T.tr({key:sc.id, className:isOpen?"open":""},
                T.td({className:"nm", onClick:function(){ setOpen(isOpen?null:sc.id); }},
                  sc.name, T.span({className:"a"}, sc.area),
                  T.span({className:"flags"},
                    sc.telugu ? T.span({className:"chip c-acc"},"Telugu-origin chain") : null,
                    answered>0 ? T.span({className:"chip c-idle"}, answered+"/9 answered") : null)),
                T.td(null, h(CallBtn,{number:num, small:true}), num?T.span({className:"tel"},num):null),
                T.td({className:"n"}, sc.km===99?"?":"~"+sc.km),
                T.td({className:"n"}, sc.upto),
                T.td({className:"n"}, rec.fee||sc.fee),
                T.td(null, T.select({className:"mini", value:rec.status||"none","aria-label":"Status for "+sc.name,
                  onChange:function(e){ s.put("schools",sc.id,{status:e.target.value}); }},
                  STATUS.map(function(x){ return T.option({key:x.v,value:x.v},x.l); }))),
                T.td(null, T.select({className:"mini", value:rec.telugu||"unknown","aria-label":"Telugu answer for "+sc.name,
                  onChange:function(e){ s.put("schools",sc.id,{telugu:e.target.value}); }},
                  TELUGU.map(function(x){ return T.option({key:x.v,value:x.v},x.l); }))),
                T.td(null, T.span({className:"chip c-"+sc.read},
                  sc.read==="go"?"Shortlist":sc.read==="warn"?"Verify":sc.read==="stop"?"Drop":"Backup"))),
              isOpen ? T.tr({key:sc.id+"-d"}, T.td({colSpan:8, style:{padding:0}},
                T.div({className:"detail"}, T.div({className:"detail-in"},
                  T.div(null, T.h3({style:{margin:"0 0 10px"}},"The nine questions"), h(QuestionList,{s:s,sc:sc,rec:rec})),
                  h(SideFields,{s:s, sc:sc, rec:rec}))))) : null
            ];
          })))),
    T.p({className:"hint"}, "Numbers came from public directories, not the schools — correct them in the call sheet as you go. Only Janes International has no number at all; New Pratham and Narayana Kaggadasapura are reachable by email or the chain line."));
}

/* ==========================================================
   RENTALS
   ========================================================== */
function RentalsView(){
  var s=useStore(), narrow=useNarrow();
  var all=s.all("rentals");
  var ids=Object.keys(all).sort(function(a,b){ return (all[b].createdAt||"").localeCompare(all[a].createdAt||""); });
  function add(){
    s.put("rentals", s.newId(), {name:"", zone:"C", bhk:"2", rent:"", deposit:"", link:"", phone:"", status:"lead", notes:"", createdAt:new Date().toISOString()});
  }
  var head = T.div({className:"bar"},
    T.button({className:"btn primary", onClick:add}, "+ Add a place"),
    T.div({className:"spacer"}),
    T.span({className:"ui", style:{fontSize:".76rem",color:"var(--ink-3)"}},
      ids.length+" tracked · "+ids.filter(function(i){return all[i].status==="shortlist";}).length+" shortlisted"));

  if (ids.length===0){
    return T.div(null, head, T.div({className:"card"}, T.div({className:"empty"},
      T.p(null,"Nothing tracked yet."),
      T.p({style:{marginTop:"8px"}},"Add places as you find them. Zone C — Mahadevapura and Hoodi — is where ₹30–35k goes furthest."))));
  }

  if (narrow){
    return T.div(null, head, T.div({className:"cards"}, ids.map(function(id){
      var r=all[id];
      return T.div({className:"scard", key:id},
        h(Field,{rowKey:id, value:r.name||"", placeholder:"Society / address",
          onCommit:function(v){ s.put("rentals",id,{name:v}); }}),
        T.div({className:"picks"},
          T.select({value:r.zone||"C","aria-label":"Zone", onChange:function(e){ s.put("rentals",id,{zone:e.target.value}); }},
            ZONES.map(function(z){ return T.option({key:z.v,value:z.v}, "Zone "+z.v+" · "+z.km); })),
          T.select({value:r.bhk||"2","aria-label":"BHK", onChange:function(e){ s.put("rentals",id,{bhk:e.target.value}); }},
            ["1","2","3","4"].map(function(b){ return T.option({key:b,value:b}, b+" BHK"); })),
          T.select({value:r.status||"lead","aria-label":"Status", onChange:function(e){ s.put("rentals",id,{status:e.target.value}); }},
            RSTATUS.map(function(x){ return T.option({key:x.v,value:x.v},x.l); }))),
        T.div({className:"picks"},
          h(Field,{rowKey:id, value:r.rent||"", placeholder:"rent + maint",
            onCommit:function(v){ s.put("rentals",id,{rent:v}); }}),
          h(Field,{rowKey:id, value:r.deposit||"", placeholder:"deposit (months)",
            onCommit:function(v){ s.put("rentals",id,{deposit:v}); }})),
        T.div({className:"picks"},
          h(Field,{rowKey:id, value:r.phone||"", placeholder:"owner / broker number",
            onCommit:function(v){ s.put("rentals",id,{phone:v}); }})),
        T.div({className:"acts"},
          h(CallBtn,{number:r.phone, small:true}),
          r.link ? T.a({href:r.link, target:"_blank", rel:"noopener noreferrer", className:"btn", style:{textDecoration:"none"}}, "Listing ↗") : null,
          T.button({className:"btn ghost", onClick:function(){ s.remove("rentals",id); }},"Remove")),
        T.div({style:{marginTop:"10px"}},
          h(Field,{rowKey:id, value:r.link||"", placeholder:"listing URL",
            onCommit:function(v){ s.put("rentals",id,{link:v}); }})),
        T.div({style:{marginTop:"10px"}},
          h(Field,{rowKey:id, area:true, value:r.notes||"", placeholder:"Floor, light, water, landlord…",
            onCommit:function(v){ s.put("rentals",id,{notes:v}); }})));
    })));
  }

  return T.div(null, head, T.div({className:"scroller"}, T.table(null,
    T.thead(null, T.tr(null,
      T.th(null,"Place"), T.th(null,"Zone"), T.th(null,"BHK"), T.th(null,"Rent + maint"),
      T.th(null,"Deposit"), T.th(null,"Contact"), T.th(null,"Status"), T.th(null,"Notes"), T.th(null,""))),
    T.tbody(null, ids.map(function(id){
      var r=all[id];
      return T.tr({key:id},
        T.td({className:"nm"},
          h(Field,{rowKey:id, value:r.name||"", placeholder:"Society / address",
            onCommit:function(v){ s.put("rentals",id,{name:v}); }}),
          r.link ? T.span({className:"a"}, T.a({href:r.link, target:"_blank", rel:"noopener noreferrer"},"listing ↗")) : null,
          T.span({className:"a"}, h(Field,{rowKey:id, value:r.link||"", placeholder:"listing URL",
            onCommit:function(v){ s.put("rentals",id,{link:v}); }}))),
        T.td(null, T.select({className:"mini", value:r.zone||"C","aria-label":"Zone",
          onChange:function(e){ s.put("rentals",id,{zone:e.target.value}); }},
          ZONES.map(function(z){ return T.option({key:z.v,value:z.v}, z.v+" · "+z.km); }))),
        T.td(null, T.select({className:"mini", value:r.bhk||"2","aria-label":"BHK",
          onChange:function(e){ s.put("rentals",id,{bhk:e.target.value}); }},
          ["1","2","3","4"].map(function(b){ return T.option({key:b,value:b}, b+" BHK"); }))),
        T.td(null, h(Field,{rowKey:id, value:r.rent||"", placeholder:"28000 + 2500",
          onCommit:function(v){ s.put("rentals",id,{rent:v}); }})),
        T.td(null, h(Field,{rowKey:id, value:r.deposit||"", placeholder:"months",
          onCommit:function(v){ s.put("rentals",id,{deposit:v}); }})),
        T.td(null, h(Field,{rowKey:id, value:r.phone||"", placeholder:"number",
          onCommit:function(v){ s.put("rentals",id,{phone:v}); }}),
          r.phone ? T.div({style:{marginTop:"5px"}}, h(CallBtn,{number:r.phone, small:true})) : null),
        T.td(null, T.select({className:"mini", value:r.status||"lead","aria-label":"Status",
          onChange:function(e){ s.put("rentals",id,{status:e.target.value}); }},
          RSTATUS.map(function(x){ return T.option({key:x.v,value:x.v},x.l); }))),
        T.td({style:{minWidth:"190px"}}, h(Field,{rowKey:id, area:true, value:r.notes||"", placeholder:"Floor, light, water, landlord…",
          onCommit:function(v){ s.put("rentals",id,{notes:v}); }})),
        T.td(null, T.button({className:"btn ghost", onClick:function(){ s.remove("rentals",id); }},"Remove")));
    })))));
}

/* ==========================================================
   TIMELINE + BRIEF
   ========================================================== */
function TimelineView(){
  var s=useStore(), done=s.all("tasks");
  return T.div({style:{marginTop:"20px"}}, PHASES.map(function(p,i){
    var n=p.tasks.filter(function(t){ return done[t[0]] && done[t[0]].done; }).length;
    return T.div({className:"phase", key:i},
      T.div({className:"phase-h"},
        T.span({className:"phase-when"}, p.when),
        T.span({className:"phase-c"}, n+" / "+p.tasks.length)),
      T.div({className:"tasks"}, p.tasks.map(function(t){
        var isDone = !!(done[t[0]] && done[t[0]].done);
        return T.label({className:"task"+(isDone?" done":""), key:t[0]},
          T.input({type:"checkbox", checked:isDone, onChange:function(){ s.put("tasks",t[0],{done:!isDone}); }}),
          T.span(null, t[1]));
      })));
  }));
}

function BriefView(){
  return T.div({className:"prose", style:{marginTop:"20px"}},
    T.h3(null,"The two rules that decide this"),
    T.div({className:"note"},
      T.strong(null,"CBSE requires three languages in Classes 9–10."),
      T.p(null,"Circular Acad-33/2026, effective 1 July 2026, makes R1, R2 and R3 compulsory from Class IX, at least two being native Indian languages. Only R1 and R2 are board-examined in Class X; R3 is assessed internally by the school and still appears on the CBSE certificate.")),
    T.div({className:"note w"},
      T.strong(null,"Karnataka requires Kannada as first or second language."),
      T.p(null,"Under the Kannada Language Learning Act 2015 and the NOC rules enforced from 2024–25, CBSE and ICSE schools must teach Kannada as first or second language — not third — for Classes 1 to 10. A 2023 PIL against this is still pending in the Karnataka High Court.")),
    T.p(null,"Telugu is not the obstacle at the board: CBSE runs full Class 9–10 syllabi and papers under codes 007 (Andhra Pradesh) and 089 (Telangana). The obstacle is that almost no private school in Bengaluru staffs it. But because R3 carries no board paper for your elder child's batch, a school that would never staff Telugu as an examined subject can plausibly accept it as R3. That is the door to push on."),

    T.h3(null,"Three combinations for Grade 9, in the order to ask"),
    T.div({className:"cfg"},
      T.div({className:"pick"},
        T.span({className:"chip c-go"},"Ask first"),
        T.strong(null,"English · Hindi · Telugu"),
        T.div({className:"lg"}, T.div(null,T.b(null,"R1 "),"English — board"), T.div(null,T.b(null,"R2 "),"Hindi — board"), T.div(null,T.b(null,"R3 "),"Telugu — internal")),
        T.p({style:{fontSize:".85rem"}},"Hindi is already their third language, so the board subject is one they have a base in, and Telugu costs the school almost nothing. Drops Kannada, which is what the state asks for — some schools refuse on that ground alone.")),
      T.div(null,
        T.span({className:"chip c-warn"},"Ask second"),
        T.strong(null,"English · Telugu · Kannada"),
        T.div({className:"lg"}, T.div(null,T.b(null,"R1 "),"English — board"), T.div(null,T.b(null,"R2 "),"Telugu 007/089 — board"), T.div(null,T.b(null,"R3 "),"Kannada — internal")),
        T.p({style:{fontSize:".85rem"}},"A native speaker banks a near-full score in a board language, worth real percentage points on a five-subject aggregate. Needs the school already registered on OASIS for 007 or 089 — realistically only the Telugu-origin chains.")),
      T.div(null,
        T.span({className:"chip c-stop"},"Fallback"),
        T.strong(null,"English · Kannada · Telugu"),
        T.div({className:"lg"}, T.div(null,T.b(null,"R1 "),"English — board"), T.div(null,T.b(null,"R2 "),"Kannada — board"), T.div(null,T.b(null,"R3 "),"Telugu or Hindi — internal")),
        T.p({style:{fontSize:".85rem"}},"Fully compliant, every school can say yes. But your child starts Kannada from zero in Class 9 and sits a board paper in it eighteen months later — a live threat to the Class X aggregate."))),
    T.div({className:"note"},
      T.strong(null,"The relief to cite by name"),
      T.p(null,"Karnataka's own framing provides that a student who took a particular language combination at the middle stage may continue it on reaching Class 9. Your elder child is finishing Grade 8 on Telugu and Hindi right now — exactly the case the relief contemplates. Raise it explicitly.")),

    T.h3(null,"The two children need different answers"),
    T.p(null, T.strong(null,"Grade 9 — board in 2029. "),"The first Class X board exam in R3 is for the cohort entering Class 6 in 2026–27, so R3 stays school-assessed for your elder child. Fight for Hindi or Telugu at R2; treat R3 as free."),
    T.p(null, T.strong(null,"Grade 5 — board in 2032–33. "),"Kannada is mandatory to Class 8, so this child will do it — and with five years before anything is graded, that is genuinely learnable. Less obvious: by 2032–33 R3 IS a board subject, so getting Telugu into R3 from Class 6 turns the third language into the easiest paper on their sheet."),

    T.h3(null,"Housing, in one paragraph"),
    T.p(null,"₹30–35k all-in does not get a 3BHK in a gated community anywhere in this corridor — those run ₹50–60k. It does reliably get a 2BHK, either in an older society or as an independent builder floor. Zone B builder floors sit at ₹26–27k, inside your preferred number rather than your stretch, so you probably do not need to settle for a 1BHK."),
    T.div({className:"scroller"}, T.table({style:{minWidth:"540px"}},
      T.thead(null, T.tr(null, T.th(null,"Zone"), T.th(null,"To office"), T.th(null,"2BHK"), T.th(null,"3BHK"))),
      T.tbody(null, ZONES.map(function(z){
        return T.tr({key:z.v}, T.td({className:"nm"},z.l), T.td({className:"n"},z.km), T.td({className:"n"},z.two), T.td({className:"n"},z.three));
      })))),
    T.div({className:"note"},
      T.strong(null,"Two things that save real money"),
      T.p(null,"The Karnataka Rent (Amendment) Act 2025, gazetted 8 January 2026, caps residential security deposits at two months' rent. Bengaluru's 10-month convention is no longer enforceable — at ₹32,000 rent that is ₹64,000, not ₹3.2 lakh. Brokers will still quote ten. Register the agreement on Kaveri 2.0; skipping it carries a ₹5,000 penalty."),
      T.p(null,"The Blue Line along ORR, with a station at Doddanekkundi, is targeted for December 2026 after slipping from June. Assume further slippage, but take an 11-month lease near Doddanekkundi, Kundalahalli or Mahadevapura station so you are already inside the pocket if it opens.")),

    T.h3(null,"What is not verified"),
    T.p({style:{fontSize:".89rem", color:"var(--ink-2)"}},"Every fee figure is indicative, compiled from school-listing aggregators that mix one-time and recurring charges — a sorting aid, not a quote. Distances are estimates from area centroids. Phone numbers came from public directories rather than the schools themselves. And no source anywhere confirms that any specific school will offer Telugu in any slot: the Telugu-origin chain angle is an inference from their founding, not a fact. Question 2 is what settles it.")
  );
}

/* ==========================================================
   BACKUP — the escape hatch when the page cannot save itself
   ========================================================== */
function BackupPanel(props){
  var s = props.s;
  var t = useState(""), text = t[0], setText = t[1];
  var m = useState(null), msg = m[0], setMsg = m[1];

  function fill(){ setText(s.exportJSON()); setMsg({ok:true, t:"Everything you have entered is in the box. Copy it somewhere safe."}); }
  function copy(){
    var payload = text || s.exportJSON();
    setText(payload);
    function fallback(){
      try{
        var ta=document.createElement("textarea");
        ta.value=payload; ta.style.position="fixed"; ta.style.opacity="0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy");
        document.body.removeChild(ta);
        setMsg({ok:true, t:"Copied. Paste it into a note or email to yourself."});
      }catch(e){ setMsg({ok:false, t:"Could not copy automatically — select the text in the box and copy it by hand."}); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(payload).then(function(){
        setMsg({ok:true, t:"Copied. Paste it into a note or email to yourself."});
      }, fallback);
    } else fallback();
  }
  function download(){
    var payload = text || s.exportJSON();
    setText(payload);
    try{
      var blob = new Blob([payload], {type:"application/json"});
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "ddk-tracker-backup.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
      setMsg({ok:true, t:"Saved as ddk-tracker-backup.json. On a phone this sometimes does nothing — use Copy instead."});
    }catch(e){ setMsg({ok:false, t:"Download blocked here. Use Copy instead."}); }
  }
  function restore(){
    if (!text.trim()){ setMsg({ok:false, t:"Paste a backup into the box first."}); return; }
    var problem = s.importJSON(text);
    setMsg(problem ? {ok:false, t:problem} : {ok:true, t:"Restored. Your entries are merged back in."});
  }

  return T.div({className:"backup"},
    T.strong({style:{fontFamily:"Archivo,sans-serif", fontSize:".8rem"}}, "Backup and restore"),
    T.p({style:{fontSize:".82rem", color:"var(--ink-2)"}},
      s.mode()==="cloud"
        ? "Your entries are saved for you and follow you between devices. A copy is still worth keeping before any big change — paste it into a note."
        : "Everything you type lives in this browser on this device. Copy a backup before you clear browsing data, switch phones, or if the badge above is not green."),
    T.div({className:"row"},
      T.button({className:"btn", onClick:fill}, "Show my data"),
      T.button({className:"btn primary", onClick:copy}, "Copy backup"),
      s.mode()==="cloud" ? null : T.button({className:"btn", onClick:download}, "Download"),
      T.button({className:"btn", onClick:restore}, "Restore from box")),
    T.textarea({value:text, onChange:function(e){ setText(e.target.value); },
      placeholder:"Press \u201CShow my data\u201D to fill this, or paste a saved backup here and press Restore."}),
    msg ? T.p({className:"msg "+(msg.ok?"ok":"bad")}, msg.t) : null);
}

/* ==========================================================
   SIGN IN — only shown once config.js points at a Supabase project
   ========================================================== */
function AuthBar(props){
  var a = props.auth;
  var e = useState(""), email = e[0], setEmail = e[1];
  if (a.state === "off") return null;

  if (a.state === "signed-in"){
    return T.div({className:"authbar"},
      T.span({className:"who"}, "Signed in as ", T.b(null, a.email)),
      T.button({className:"btn ghost", onClick:function(){ a.signOut(); }}, "Sign out"));
  }
  return T.div({className:"authbar"},
    T.span({className:"who"}, "Sign in to sync across your devices"),
    T.input({type:"email", value:email, placeholder:"you@example.com", autoComplete:"email",
      onChange:function(ev){ setEmail(ev.target.value); },
      onKeyDown:function(ev){ if(ev.key==="Enter" && email.indexOf("@")>0) a.signIn(email); }}),
    T.button({className:"btn primary", disabled:a.state==="sending" || email.indexOf("@")<1,
      onClick:function(){ if(email.indexOf("@")>0) a.signIn(email); }},
      a.state==="sending" ? "Sent" : "Email me a link"),
    a.note ? T.span({className:"note-inline "+(a.state==="error"?"bad":"")}, a.note) : null);
}

/* ==========================================================
   SHELL
   ========================================================== */
function App(){
  var s=useStore();
  var t=useState("schools"), tab=t[0], setTab=t[1];
  var mode=s.mode(), err=s.error();
  var recs=s.all("schools");

  var counts = useMemo(function(){
    var called=0, shortlist=0, tel=0;
    SCHOOLS.forEach(function(sc){
      var r=recs[sc.id]; if(!r) return;
      if(r.status==="called"||r.status==="shortlist"||r.status==="reject") called++;
      if(r.status==="shortlist") shortlist++;
      if(r.telugu==="r2"||r.telugu==="r3") tel++;
    });
    return {called:called, shortlist:shortlist, tel:tel};
  },[s.rev()]);

  var rentals=s.all("rentals");
  var rShort=Object.keys(rentals).filter(function(i){return rentals[i].status==="shortlist";}).length;
  var tasks=s.all("tasks");
  var totalTasks=PHASES.reduce(function(a,p){return a+p.tasks.length;},0);
  var doneTasks=Object.keys(tasks).filter(function(k){return tasks[k].done;}).length;
  var days=Math.max(0, Math.ceil((new Date(2027,1,28) - new Date())/86400000));

  var TABS=[["schools","Schools"],["rentals","Rentals"],["timeline","Timeline"],["brief","The brief"]];

  return T.div(null,
    T.header({className:"hdr"}, T.div({className:"hdr-in"},
      T.div({className:"hdr-top"},
        T.div(null,
          T.h1(null,"Doddanekkundi Tracker"),
          T.p({className:"sub"},"Grade 9 and Grade 5 into east Bengaluru, AY 2027–28 · IndiQube ETA, ORR")),
        T.div({className:"sync "+(mode==="cloud"?"cloud":mode==="device"?"local":mode==="none"?"none":""),
               title:"Storage: "+s.backends()},
          T.span({className:"led"}),
          mode==="cloud" ? (s.pendingCount() ? "Syncing — "+s.pendingCount()+" pending" : "Synced to your account")
            :mode==="device"?"Saved on this device"
            :mode==="none"?"NOT saving — copy a backup"
            :"Connecting…")),
      h(AuthBar,{auth:s.auth()}),
      T.dl({className:"tiles"},
        T.div({className:"tile"}, T.dt({className:"tile-k"},"Schools"), T.dd({className:"tile-v"}, SCHOOLS.length)),
        T.div({className:"tile"}, T.dt({className:"tile-k"},"Contacted"), T.dd({className:"tile-v"}, counts.called, T.small(null," / "+SCHOOLS.length))),
        T.div({className:"tile"}, T.dt({className:"tile-k"},"Shortlisted"), T.dd({className:"tile-v", style:{color:counts.shortlist?"var(--go)":"inherit"}}, counts.shortlist)),
        T.div({className:"tile"}, T.dt({className:"tile-k"},"Telugu: yes"), T.dd({className:"tile-v", style:{color:counts.tel?"var(--go)":"inherit"}}, counts.tel)),
        T.div({className:"tile"}, T.dt({className:"tile-k"},"Places"), T.dd({className:"tile-v"}, Object.keys(rentals).length, T.small(null," · "+rShort+" short"))),
        T.div({className:"tile"}, T.dt({className:"tile-k"},"Steps done"), T.dd({className:"tile-v"}, doneTasks, T.small(null," / "+totalTasks))),
        T.div({className:"tile"}, T.dt({className:"tile-k"},"Days left"), T.dd({className:"tile-v"}, days, T.small(null," to Feb 27")))),
      h("nav",{className:"tabs", role:"tablist"}, TABS.map(function(x){
        return T.button({key:x[0], role:"tab", "aria-selected":tab===x[0], onClick:function(){ setTab(x[0]); }}, x[1]);
      })))),
    T.main({className:"app"},
      err ? T.div({className:"err"}, err) : null,
      mode==="none" ? T.div({className:"warnbar"},
        T.strong(null,"This copy cannot save anything."),
        "Your browser is refusing local storage, which is common when an HTML file is opened straight off the filesystem rather than served over http. You can still read the page and tap the numbers, but anything you type will be gone when you close the tab. Copy a backup from the panel at the bottom of the Timeline tab before you close it — or use the hosted copy, where notes are saved for you.") : null,
      mode==="device" ? T.div({className:"warnbar"},
        T.strong(null,"Saved on this device only."),
        s.auth().state==="off"
          ? "Notes are kept in this browser (" + s.backends() + "). They will not appear on your other devices, and clearing site data erases them. Fill in config.js with a Supabase project to sync them, or use the Backup panel on the Timeline tab to move them by hand."
          : "You are not signed in, so notes are kept in this browser (" + s.backends() + ") only. Sign in above and they will sync to your account and to your other devices.") : null,
      tab==="schools" ? h(SchoolsView) :
      tab==="rentals" ? h(RentalsView) :
      tab==="timeline" ? T.div(null, h(TimelineView), h(BackupPanel,{s:s})) : h(BriefView))
  );
}

window.TrackerApp = App;
})();
