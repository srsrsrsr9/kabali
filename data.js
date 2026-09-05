/* The catalogue: static reference content, not user state.
   Add a school or correct a number here. Phone numbers came from public
   directories rather than the schools themselves. */
(function(){
"use strict";
var SCHOOLS = [
  {id:"vibgyor-rise", name:"VIBGYOR Rise", area:"Doddanekkundi", km:2, upto:"10 ?", fee:"1.14–1.65L", read:"go",
   phone:"+91 96866 91166", email:"vi-doddanekkundi.support@vgos.org",
   note:"Closest school to the office by a distance. Confirm whether this campus runs XI–XII."},
  {id:"ekya-itpl", name:"Ekya School ITPL", area:"Doddanekkundi Extn", km:2.5, upto:"XII", fee:"1.8–2.4L", read:"warn",
   phone:"080 4680 9096", email:"admissions@ekyaschools.com",
   note:"Grade 1–12, strong academics, nearest good school to the office. The one real budget risk — at two children it likely breaks ₹5L on its own."},
  {id:"narayana-marathahalli", name:"Narayana e-Techno", area:"Marathahalli", km:3, upto:"X", fee:"60–85k", telugu:true, read:"go",
   phone:"+91 70222 93912", phone2:"+91 70222 81466",
   note:"Best odds on the list for a Telugu answer, and cheap. Exam-drill culture; typically ends at X."},
  {id:"sri-chaitanya", name:"Sri Chaitanya", area:"Marathahalli / Munnekolala", km:3, upto:"X", fee:"45–75k", telugu:true, read:"go",
   phone:"+91 88610 04639", phone2:"+91 90717 66562",
   note:"Same logic as Narayana. High pressure — weigh differently for Grade 5 than Grade 9."},
  {id:"mtb-jjv", name:"MTB Jnana Jyothi Vidyanikethan", area:"Mahadevapura", km:3, upto:"?", fee:"?", read:"warn",
   phone:"+91 73495 19927",
   note:"Small local school, ~1,000 students, CBSE, opened 2010. Low fees. Check Class 9 seats and whether it runs XI–XII."},
  {id:"pragathi", name:"Pragathi School", area:"Mahadevapura", km:3, upto:"?", fee:"~70k–1.2L", read:"warn",
   phone:"+91 93413 47534", phone2:"+91 89049 44991", email:"pragathischooladmission@gmail.com",
   note:"Runs CBSE and state board, which sometimes means more language flexibility. Worth one call for that alone."},
  {id:"nps-vibhuthipura", name:"NPS Vibhuthipura", area:"Vibhuthipura", km:3.5, upto:"growing", fee:"verify", read:"warn",
   phone:"+91 63669 49138",
   note:"Grade 8 only starts in 2026–27, so Grade 9 would be its first-ever cohort. Great brand, no results record here yet."},
  {id:"rbgs-marathahalli", name:"Ravindra Bharathi Global", area:"Marathahalli", km:3.5, upto:"X", fee:"70–80k", telugu:true, read:"go",
   phone:"+91 73537 77385", phone2:"+91 90363 60044",
   note:"Hyderabad chain, so Telugu is plausible. Ends at X — a two-year stop for the elder child."},
  {id:"brigade", name:"The Brigade School", area:"Mahadevapura / Whitefield", km:4, upto:"XII", fee:"~72k–1.2L", read:"go",
   phone:"+91 63648 59376", email:"tbswadmission@brigadeschools.edu.in",
   note:"Best structural fit found: runs to XII AND publicly lists seats in Grade 5, Grade 9 and Grade 12. Registration opened 3 September last year, so its 2027–28 window is opening about now."},
  {id:"mvj", name:"MVJ International", area:"Marathahalli", km:4, upto:"?", fee:"~70k+", read:"go",
   phone:"080 4302 4471", phone2:"+91 97420 00633", email:"contact@mvjinternationalschool.edu.in",
   note:"Ranked #3 Whitefield-Plus CBSE and #15 Bengaluru, Times School Survey 2025–26. Best quality-per-rupee signal nearby."},
  {id:"narayana-kundalahalli", name:"Narayana Co School", area:"Kundalahalli", km:4, upto:"X", fee:"~60–85k", telugu:true, read:"idle",
   phone:"1800 102 3344", email:"blrmh.etechno@narayanagroup.com",
   note:"Same chain, second campus. 1800 102 3344 is Narayana's chain-wide line — use it to ask about Telugu once, centrally, then pick whichever campus has a Grade 9 seat."},
  {id:"vagdevi", name:"Vagdevi Vilas", area:"Marathahalli", km:4, upto:"X", fee:"~77k", read:"warn",
   phone:"+91 80500 05851", phone2:"+91 96865 77189", email:"info@vvi.edu.in",
   note:"Applications open at Ganesha Chaturthi each year — i.e. right now. Ends at X."},
  {id:"genius-global", name:"Genius Global School", area:"Marathahalli", km:4, upto:"X", fee:"55k–1.06L", read:"stop",
   phone:"080 4854 2975", phone2:"+91 97400 84742", email:"admission@geniusglobalschool.com",
   note:"Nursery–10 only, so not for Grade 9. Still viable for the Grade 5 child if the language answer is good."},
  {id:"janes", name:"Janes International", area:"Hoodi / Garudacharpalya", km:4.5, upto:"?", fee:"?", read:"warn",
   note:"The only school here I could not pin down at all — no number, no board, no fees. The nearest match in any registry is Janes English Primary School, Hoodi: private unaided, est. 1996, Grades 1–10, and listed as state board, not CBSE. If that is the same school it fails your board filter and ends at 10. Confirm from the Maps listing before spending a visit."},
  {id:"vrukksha", name:"The Vrukksha School", area:"Mahadevapura / Dooravani Nagar", km:5, upto:"?", fee:"~43–50k", read:"warn",
   phone:"+91 96324 46699", phone2:"+91 96634 46699",
   note:"Cheapest credible option in the ring. Newer school — ask directly about Class X results history."},
  {id:"sm-english", name:"SM English School", area:"Hoodi", km:5, upto:"?", fee:"?", read:"warn",
   phone:"+91 76769 95557", email:"info@smschool.co.in",
   note:"Society founded 1965; board affiliation not confirmable online. Confirm it is CBSE before anything else."},
  {id:"gopalan-national", name:"Gopalan National School", area:"Mahadevapura", km:5, upto:"ICSE", fee:"—", read:"stop",
   phone:"080 4155 4091", phone2:"080 4115 7829", email:"gns@gopalanschool.com",
   note:"ICSE, not CBSE. If you want the group, check Gopalan International at Hoodi instead — different board."},
  {id:"shishya-beml", name:"Shishya BEML Public School", area:"Kaggadasapura", km:6, upto:"XII", fee:"1.08–1.18L", read:"go",
   phone:"080 6452 0004", phone2:"080 2524 7242", email:"contact@shishyabemlschool.edu.in",
   note:"Since 1994, CBSE to XII, sensible fees, established results. Kaggadasapura, not Whitefield."},
  {id:"geethanjali", name:"Geethanjali Vidyalaya", area:"Kaggadasapura / CV Raman Nagar", km:6, upto:"XII", fee:"verify", read:"go",
   phone:"080 2527 2357", phone2:"+91 99001 36176",
   note:"25 years, 2.5-acre campus, ~1,100 students, Nursery–XII. Good size-to-attention ratio."},
  {id:"narayana-kaggadasapura", name:"Narayana e-Techno", area:"Kaggadasapura", km:6, upto:"X", fee:"~60–85k", telugu:true, read:"idle",
   phone:"1800 102 3344", email:"principalkag@narayanagroup.com",
   note:"Third Narayana campus in range. Its direct line was truncated in every listing, so the chain number is here instead — the principal's email is direct."},
  {id:"narayana-krpuram", name:"Narayana e-Techno", area:"KR Puram", km:6, upto:"X", fee:"~60–85k", telugu:true, read:"idle",
   phone:"+91 70222 93859", phone2:"1800 102 3344",
   note:"Fourth Narayana campus in range, on Hoodi Main Road. The listing rendered this number malformed; it fits Narayana's 70222-9xxxx branch series but try the chain line if it fails."},
  {id:"amara-jyothi", name:"Amara Jyothi Public School", area:"KR Puram / Devasandra", km:6.5, upto:"XII", fee:"low", read:"go",
   phone:"+91 63638 53388", phone2:"+91 83108 85066", email:"info@amarajyothipublicschool.edu.in",
   note:"Since 1998, Pre-Nursery to XII, genuinely inexpensive. Strong value play if the bus route reaches you."},
  {id:"orchids-cvrn", name:"Orchids The International", area:"CV Raman Nagar", km:6.5, upto:"X", fee:"1.19–2.3L", read:"stop",
   phone:"+91 95139 23100", phone2:"+91 99994 31999",
   note:"Nursery–10 only and near the top of the band. Kannada explicitly not a prerequisite here — worth a language call for Grade 5."},
  {id:"euroschool", name:"EuroSchool", area:"Whitefield / Hoodi", km:7.5, upto:"XII", fee:"1.63–1.79L", read:"warn",
   phone:"+91 70385 55555", email:"connect@euroschoolindia.com",
   note:"Nursery–12, solid, and its site is already advertising 2027–28 admissions. Two children here plus transport lands right at the ₹5L ceiling."},
  {id:"narayana-kasturinagar", name:"Narayana Olympiad", area:"Kasturi Nagar", km:8, upto:"X", fee:"~60–85k", telugu:true, read:"idle",
   phone:"+91 70222 93862", phone2:"+91 92436 03258",
   note:"Furthest Narayana. Only if it is the campus that says yes to Telugu."},
  {id:"vishwa-vidyapeeth", name:"Vishwa Vidyapeeth", area:"Varthur", km:8.5, upto:"XII", fee:"verify", read:"warn",
   phone:"+91 70220 09757", phone2:"+91 76762 27483", email:"enquiry@vishwavidyapeeth.edu.in",
   note:"Multi-board campus to XII. Wrong side of Varthur traffic from Doddanekkundi at 8am."},
  {id:"presidency-east", name:"Presidency School Bangalore East", area:"Kasturi Nagar", km:8.5, upto:"XII", fee:"verify", read:"warn",
   phone:"+91 96208 12270", phone2:"080 4227 7351", email:"admission-psbe@presidency.edu.in",
   note:"Runs to XII, placement test for all entrants. Registration historically opens 1 October."},
  {id:"ppec", name:"Poornaprajna Education Centre", area:"Indiranagar", km:9.5, upto:"XII", fee:"verify", read:"stop",
   phone:"080 2361 7465", phone2:"080 2361 9034",
   note:"Good school, wrong geography. From Doddanekkundi this is a daily crawl down ORR in both peaks."},
  {id:"new-pratham", name:"New Pratham Public School", area:"KR Puram · Pai Layout", km:7, upto:"?", fee:"?", read:"warn",
   email:"kjrnpps@gmail.com",
   note:"Now pinned down: Pai Layout, KR Puram 560016, CBSE affiliation 830770, co-ed, founded 2010. Every listing shows its phone truncated to 7 digits, so email is the way in."}
];

var QUESTIONS = [
  {k:"q1", t:"Which languages do you offer as R1, R2 and R3 for Class IX under Circular Acad-33/2026?", hint:"If they don't know the circular, ask for the academic coordinator."},
  {k:"q2", t:"Are you registered on OASIS to offer Telugu — subject code 007 or 089?", hint:"A yes/no fact about the school, not an opinion. This one settles everything."},
  {k:"q3", t:"If Telugu isn't available as R2, will you take it as R3 with internal school-based assessment?", hint:"Point out there is no Class X board paper for R3 for this batch. Most likely ask to succeed."},
  {k:"q4", t:"How do you handle a Class 9 lateral entrant from another state who has never studied Kannada?", hint:"Ask what they actually did for previous such students — not what the policy says."},
  {k:"q5", t:"Is the combination locked at admission, and can it change before you upload Class IX registration to CBSE?", hint:"Get the deadline date. That is the real decision point."},
  {k:"q6", t:"Do you run Classes XI and XII, and in which streams?", hint:"For the Grade 9 child this is close to disqualifying if the answer is no."},
  {k:"q7", t:"Are there Class IX and Class V seats for 2027–28, is there an entrance test, and on what date?", hint:""},
  {k:"q8", t:"Does your bus cover our rental zone? Pickup time and one-way ride time?", hint:"Ask for ride time, not distance. On ORR they are unrelated."},
  {k:"q9", t:"What is the full annual outgo — tuition, admission, transport, books, uniform, building fee?", hint:"One number per child per year, in writing."}
];

var PHASES = [
  {when:"September 2026 — now", tasks:[
    ["s1","Call The Brigade School Mahadevapura — it lists Grade 5, 9 and 12 seats and its window opens about now"],
    ["s2","Call Narayana e-Techno Marathahalli — lead with Q2 (OASIS code 007/089)"],
    ["s3","Call Shishya BEML Kaggadasapura"],
    ["s4","Ask Narayana / Sri Chaitanya head office about Telugu centrally, not campus by campus"],
    ["s5","Check whether Vagdevi Vilas and EuroSchool 2027–28 applications have already opened"]]},
  {when:"October 2026", tasks:[
    ["o1","Presidency School East registration opens (historically 1 Oct)"],
    ["o2","Submit applications to every school still in Shortlist"],
    ["o3","Get any language accommodation confirmed BY EMAIL, not verbally"]]},
  {when:"November – December 2026", tasks:[
    ["n1","Entrance tests and parent interactions"],
    ["n2","Cut the list to three"],
    ["n3","Visit at 8am on a school day, not on a weekend tour"],
    ["n4","Ride the actual bus route from the candidate rental zone"]]},
  {when:"December 2026", tasks:[
    ["d1","Check Blue Line / Doddanekkundi metro station status"],
    ["d2","Lock the rental zone — after the school is decided, not before"]]},
  {when:"January – February 2027", tasks:[
    ["j1","Accept an offer and pay"],
    ["j2","Request the Transfer Certificate from the current school — start early, this runs late for interstate moves"],
    ["j3","Confirm the CBSE Class IX registration deadline (the date the language combination stops being changeable)"]]},
  {when:"February – March 2027", tasks:[
    ["f1","Sign the lease — 2 months deposit, 11-month term"],
    ["f2","Register the agreement on Kaveri 2.0 (₹5,000 penalty if you skip it)"]]},
  {when:"April – June 2027", tasks:[
    ["a1","Confirm whether the session starts in April or June — it moves the whole move date"],
    ["a2","Move"]]}
];

var ZONES = [
  {v:"A", l:"A · Doddanekkundi / Marathahalli", km:"0–3 km", two:"₹25–38k", three:"₹45k+"},
  {v:"B", l:"B · Kaggadasapura / CV Raman Nagar", km:"5–7 km", two:"₹26–41k", three:"₹45k+"},
  {v:"C", l:"C · Mahadevapura / Hoodi", km:"3–5 km", two:"₹27–35k", three:"₹30–60k"},
  {v:"D", l:"D · Kadugodi / Varthur / Panathur", km:"8–12 km", two:"₹22–30k", three:"₹35–60k"}
];

var STATUS = [
  {v:"none", l:"Not started", c:"c-idle"},
  {v:"queued", l:"To call", c:"c-acc"},
  {v:"called", l:"Called", c:"c-warn"},
  {v:"shortlist", l:"Shortlist", c:"c-go"},
  {v:"reject", l:"Rejected", c:"c-stop"}
];
var TELUGU = [
  {v:"unknown", l:"Telugu: unknown", c:"c-idle"},
  {v:"r2", l:"Telugu as R2", c:"c-go"},
  {v:"r3", l:"Telugu as R3", c:"c-go"},
  {v:"maybe", l:"Telugu: will consider", c:"c-warn"},
  {v:"no", l:"Telugu: no", c:"c-stop"}
];
var RSTATUS = [
  {v:"lead", l:"Lead", c:"c-idle"},
  {v:"contacted", l:"Contacted", c:"c-acc"},
  {v:"seen", l:"Viewed", c:"c-warn"},
  {v:"shortlist", l:"Shortlist", c:"c-go"},
  {v:"reject", l:"Rejected", c:"c-stop"}
];
function look(list,v){ for(var i=0;i<list.length;i++) if(list[i].v===v) return list[i]; return list[0]; }
function telHref(n){ return "tel:" + String(n||"").replace(/[^\d+]/g,""); }

/* Approximate positions.
 *
 * These are locality centroids, not surveyed addresses: there was no
 * geocoding service reachable when this was built, so each school sits at
 * the middle of the area its address names. Good enough to see the shape of
 * the shortlist against the office and to judge which side of ORR a school
 * is on; not good enough to navigate by. Every marker links out to Google
 * Maps, which resolves the real address from the school's name.
 *
 * Janes International is the exception and is exact — it came from a
 * Google Maps pin.
 */
var OFFICE = {lat:12.9795, lng:77.6965, name:"IndiQube ETA", note:"No. 38/4, adjacent to EMC2, Doddanekkundi, ORR"};

var COORDS = {
  "vibgyor-rise":          [12.9790, 77.6970],
  "ekya-itpl":             [12.9845, 77.7010],
  "narayana-marathahalli": [12.9600, 77.7130],
  "sri-chaitanya":         [12.9605, 77.7060],
  "mtb-jjv":               [12.9905, 77.6975],
  "pragathi":              [12.9915, 77.6950],
  "nps-vibhuthipura":      [12.9700, 77.6810],
  "rbgs-marathahalli":     [12.9575, 77.7015],
  "brigade":               [12.9930, 77.6990],
  "mvj":                   [12.9560, 77.7000],
  "narayana-kundalahalli": [12.9680, 77.7150],
  "vagdevi":               [12.9620, 77.7080],
  "genius-global":         [12.9580, 77.7020],
  "janes":                 [13.0038896, 77.7045969],
  "vrukksha":              [12.9930, 77.6720],
  "sm-english":            [12.9915, 77.7150],
  "gopalan-national":      [12.9760, 77.7120],
  "shishya-beml":          [12.9800, 77.6620],
  "geethanjali":           [12.9840, 77.6690],
  "narayana-kaggadasapura":[12.9855, 77.6700],
  "narayana-krpuram":      [12.9990, 77.7080],
  "amara-jyothi":          [13.0050, 77.7070],
  "orchids-cvrn":          [12.9840, 77.6600],
  "euroschool":            [12.9940, 77.7130],
  "narayana-kasturinagar": [13.0060, 77.6540],
  "vishwa-vidyapeeth":     [12.9350, 77.7480],
  "presidency-east":       [13.0080, 77.6520],
  "ppec":                  [12.9750, 77.6400],
  "new-pratham":           [13.0020, 77.6980]
};

function mapsUrl(sc){
  return "https://www.google.com/maps/search/?api=1&query=" +
         encodeURIComponent(sc.name + " school " + sc.area + " Bengaluru");
}

window.TrackerData = {
  SCHOOLS: SCHOOLS, QUESTIONS: QUESTIONS, PHASES: PHASES, ZONES: ZONES,
  STATUS: STATUS, TELUGU: TELUGU, RSTATUS: RSTATUS,
  look: look, telHref: telHref,
  OFFICE: OFFICE, COORDS: COORDS, mapsUrl: mapsUrl
};
})();
