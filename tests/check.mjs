/* Dependency-free behavioral checks. DOM adapter is not a visual browser test. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const elements=new Map();
const listeners=new Map();
function element(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},value:'',setAttribute(){},focus(){},showModal(){},close(){},querySelector(){return {textContent:'Test page'}}});return elements.get(id)}
const store=new Map();
const context={console,URL,Blob,Date,Math,JSON,Number,String,Object,Array,Set,Map,confirm:()=>true,setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},fetch:async(url,opts={})=>({ok:true,status:opts.method==='POST'?201:200,json:async()=>url==='/api/profile'?(opts.method==='POST'?{ok:true,player:{playerId:'11111111-1111-4111-8111-111111111111',name:JSON.parse(opts.body||'{}').name||'Test Student',avatar:JSON.parse(opts.body||'{}').avatar||'🚂'}}:{ok:true,player:null}):({ok:true,rows:[],entry:{}})}),location:{hash:'#home'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{title:'',documentElement:{dataset:{}},body:{appendChild(){}},getElementById:element,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners.set(name,fn),createElement:()=>({click(){},remove(){},style:{}})},window:{scrollTo(){},addEventListener(){},matchMedia:()=>({matches:true})}};
vm.createContext(context);
for(const f of ['content','questions','app'])vm.runInContext(fs.readFileSync(`assets/${f}.js`,'utf8'),context,{filename:f+'.js'});
const run=s=>vm.runInContext(s,context);
assert.equal(run('QB.length'),273);
assert.equal(run('topics.length'),7);
assert.equal(run('new Set(QB.map(q=>q.id)).size'),273);
assert.equal(run('QB.filter(q=>q.o.length!==4 || !Number.isInteger(q.a) || q.a<0 || q.a>3).length'),0);
assert.equal(run('C.universities.length'),8);
for(const page of ['home','universities','updates','practice','saved','about','more'])assert.ok(run(`${page}()`).length>100,page);
for(const id of run('C.universities.map(x=>x.id)'))assert.ok(run(`university('${id}')`).includes('Official'));
assert.ok(run('missing()').includes('পাওয়া যায়নি'));
run("startSession('learn','Article',10)");assert.equal(run('data.session.ids.length'),10);assert.ok(run('sessionQuestions(data.session).every(q=>q.topic===\'Article\')'));
assert.ok(run('validBackup(data)'));
run('data.session.answers[data.session.ids[0]]=sessionQuestions(data.session)[0].a');assert.ok(run('session()').includes('Correct answer'));
run('finishSession(true)');assert.equal(run('data.attempts[0].correct'),1);assert.equal(run('data.session'),null);assert.ok(run('result()').includes('Not answered'));
run("startSession('test','all',20)");assert.equal(run('data.session.ids.length'),20);assert.ok(run('data.session.deadline>Date.now()'));
assert.ok(!run('session()').includes('class="feedback"'));
run('data.session.answers=Object.fromEntries(sessionQuestions(data.session).map(q=>[q.id,q.a])); finishSession(true)');assert.equal(run('data.attempts[0].correct'),20);assert.ok(run('validBackup(data)'));
const backup=run('JSON.stringify(data)');run(`data=JSON.parse(${JSON.stringify(backup)})`);assert.ok(run('validBackup(data)'));assert.ok(store.size>0);
assert.ok(!run('validBackup({saved:[],checks:[900],attempts:[],session:null})'));
assert.ok(!run('validBackup({saved:[],checks:[],attempts:[{}]})'));
run("startSession('test','all',10);data.session.deadline=Date.now()-1;tick()");assert.equal(run('data.session'),null);assert.equal(run('data.attempts[0].correct'),0);
assert.ok(run("esc('<script>')").includes('&lt;'));
assert.equal(run("safeURL('javascript:alert(1)')"),'#');
for(const asset of ['styles.css','content.js','questions.js','app.js','favicon.svg'])assert.ok(fs.existsSync('assets/'+asset));
const homeHtml=fs.readFileSync('index.html','utf8');assert.ok(homeHtml.includes('SBS Students’ Association'));assert.ok(homeHtml.includes('https://web.facebook.com/misbahul.tuhin'));assert.ok(homeHtml.includes('/_vercel/insights/script.js'));assert.ok(!run('practice()').includes('player-roll'));assert.ok(run('practice()').includes('save-player-profile'));assert.ok(JSON.parse(fs.readFileSync('package.json','utf8')).dependencies['@vercel/analytics']);assert.ok(JSON.parse(fs.readFileSync('package.json','utf8')).dependencies['@vercel/functions']);
console.log('PASS: 273 questions; 7 topics; 8 university profiles; practice; timed scoring; expiry; backup validation; safe rendering.');

for(const id of run('C.universities.map(x=>x.id)')) {
  const html=run(`university('${id}')`);
  for(const text of (id==='cu'?['Campus Location &amp; Geography','Explore Subjects','CU Official Website']:['Campus Location & Geography','Admission Overview','Documents Checklist','Official Sources','District','Find Campus on Google Maps'])) assert.ok((html.includes(text)||html.includes(run(`esc(${JSON.stringify(text)})`))), id+': '+text);
  assert.ok(run(`C.universities.find(u=>u.id==='${id}').details.sources.every(s=>safeURL(s.url)!=='#')`));
}
assert.ok(!fs.readFileSync('index.html','utf8').includes('href="#questions"'));
assert.ok(!fs.readFileSync('index.html','utf8').includes('href="#guides"'));
assert.ok(!fs.readFileSync('assets/app.js','utf8').includes('questions,practice'));
assert.ok(run('practice()').includes('Model Test'));
assert.ok(run("university('du')").includes('2026–27'));
assert.ok(run("university('cu')").includes('২২ কিলোমিটার'));
console.log('PASS: English labels, eight detailed campus/admission profiles, source URLs, removed archive/study-guide navigation.');

const cuHTML=run("university('cu')");assert.equal((cuHTML.match(/href="https:/g)||[]).length,2);assert.ok(!cuHTML.includes('Documents Checklist'));assert.ok(!cuHTML.includes('google.com/maps'));console.log('PASS: CU campus editorial with exactly two official external links.');

run("setTheme('dark')");assert.equal(run('document.documentElement.dataset.theme'),'dark');assert.equal(store.get('campus-theme'),'dark');run("setTheme('light')");assert.equal(run('document.documentElement.dataset.theme'),'light');
run("campusTab='academics'");assert.ok(run("university('cu')").includes('Computer Science'));run("campusTab='life'");assert.ok(run("university('cu')").includes('data:image/webp;base64'));run("campusTab='overview'");console.log('PASS: theme toggle persistence and CU section tabs.');

// Exercise the embedded Fun MCQ: student identity, lifelines, points/streaks, timer and score submission.
await run("(async()=>{$('player-name').value='Test Student'; $('player-avatar').value='🚂'; await startSession('fun','Article',10)})()");
assert.equal(run('data.session.mode'),'fun');assert.equal(run('data.session.player.name'),'Test Student');assert.equal(run('data.session.ids.length'),10);assert.ok(run('data.session.deadline>Date.now()'));
const dispatchClick=(id,dataset={})=>{const b={id,dataset,textContent:'',value:'',setAttribute(){},focus(){}};listeners.get('click')({target:{closest(sel){return sel==='button'?b:null}}});};
const fq=run('sessionQuestions(data.session)[0]');
dispatchClick('',{funLife:'fifty'});assert.equal(run(`data.session.hiddenOptions['${fq.id}'].length`),2);assert.ok(!run(`data.session.hiddenOptions['${fq.id}'].includes(${fq.a})`));
dispatchClick('',{funLife:'freeze'});assert.equal(run('data.session.frozen'),true);assert.equal(run('data.session.freeze'),false);
dispatchClick('',{answer:fq.id,choice:String(fq.a)});assert.equal(run(`data.session.answers['${fq.id}']`),fq.a);assert.ok(run('data.session.score')>0);assert.equal(run('data.session.streak'),1);assert.equal(run('data.session.bestStreak'),1);
run('data.session.index=data.session.ids.length-1');await run('finishSession(true)');assert.equal(run('data.session'),null);assert.equal(run('data.attempts[0].leaderboardStatus'),'saved');assert.equal(run('data.attempts[0].mode'),'fun');assert.ok(run('result()').includes('Global Leaderboard'));assert.ok(run('validBackup(data)'));
// Timer expiry marks the question unanswered and resets the streak, rather than ending the whole game.
run("startSession('fun','Article',10); data.session.deadline=Date.now()-1; tick()");assert.ok(run('data.session.timeouts.includes(data.session.ids[0])'));assert.equal(run('data.session.streak'),0);
console.log('PASS: embedded Fun MCQ; identity validation; 50:50; freeze timer; streak scoring; global score submit; per-question timeout.');

// Test student registration/profile restoration and MongoDB leaderboard routes using in-memory collection stubs.
const students=new Map();
const attempts=new Map();
const mockDb={
 collection(name){
  if(name==='students')return {
   createIndex:async()=>{},
   findOne:async filter=>students.get(filter._id)||null,
   insertOne:async doc=>{students.set(doc._id,{...doc});return {insertedId:doc._id}},
   updateOne:async(filter,update)=>{const doc=students.get(filter._id);if(doc)Object.assign(doc,update.$set||{});return {matchedCount:doc?1:0}}
  };
  return {
   createIndex:async()=>{},
   findOne:async filter=>[...attempts.values()].find(a=>a.attemptId===filter.attemptId)||null,
   insertOne:async doc=>{attempts.set(doc.attemptId,{...doc,_id:doc.attemptId});return {insertedId:doc.attemptId}},
   aggregate:()=>({toArray:async()=>{
    const sorted=[...attempts.values()].sort((a,b)=>b.score-a.score||b.correct-a.correct||a.timeSec-b.timeSec);
    const top=new Map();for(const a of sorted){const old=top.get(a.playerId);if(!old)top.set(a.playerId,{...a,attempts:1});else old.attempts++;}
    return [...top.values()].sort((a,b)=>b.score-a.score).map(({_id,...x})=>x);
   }})
  };
 }
};
const apiBase={console,Date,Math,JSON,String,Number,Response,Promise,randomUUID:()=> '11111111-1111-4111-8111-111111111111',getDatabase:async()=>mockDb};
const loadHandler=(path,name)=>{const sandbox=vm.createContext({...apiBase});const src=fs.readFileSync(path,'utf8').replace(/^import .*?;\s*/gm,'').replace('export default async function handler','async function handler')+`\nglobalThis.__handler=handler;`;vm.runInContext(src,sandbox,{filename:path});return sandbox.__handler};
const profileHandler=loadHandler('api/profile.js','profileHandler');
const scoresHandler=loadHandler('api/scores.js','scoresHandler');
const invoke=async(handler,method,{body,query,headers}={})=>{const out={headers:{},code:200,value:null,setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.value=v;return this}};await handler({method,body,query,headers},out);return out};
const registered=await invoke(profileHandler,'POST',{body:{name:'Test Student',avatar:'🚂'}});
assert.equal(registered.code,201);assert.equal(registered.value.ok,true);assert.equal(registered.value.player.name,'Test Student');assert.match(registered.value.player.playerId,/^[0-9a-f-]{36}$/);
const playerId=registered.value.player.playerId;assert.ok(students.has(playerId));assert.ok(registered.headers['Set-Cookie'].includes('HttpOnly'));
const restored=await invoke(profileHandler,'GET',{headers:{cookie:`campus_player=${playerId}`}});assert.equal(restored.code,200);assert.equal(restored.value.player.name,'Test Student');
const submission={playerId,attemptId:'test-attempt-0001',topic:'Article',score:245,correct:8,total:10,bestStreak:4,timeSec:95};
const saved=await invoke(scoresHandler,'POST',{body:submission});assert.equal(saved.code,201);assert.equal(saved.value.ok,true);assert.equal(saved.value.entry.name,'Test Student');assert.equal(attempts.size,1);
const duplicate=await invoke(scoresHandler,'POST',{body:submission});assert.equal(duplicate.code,200);assert.equal(duplicate.value.duplicate,true);assert.equal(attempts.size,1);
const board=await invoke(scoresHandler,'GET');assert.equal(board.code,200);assert.equal(board.value.database,'mongodb');assert.equal(board.value.rows.length,1);assert.equal(board.value.rows[0].score,245);assert.equal(board.value.rows[0].attempts,1);
const noProfile=await invoke(scoresHandler,'POST',{body:{...submission,playerId:'22222222-2222-4222-8222-222222222222',attemptId:'orphan'}});assert.equal(noProfile.code,401);assert.equal(attempts.size,1);
const invalid=await invoke(scoresHandler,'POST',{body:{...submission,total:0,attemptId:'invalid'}});assert.equal(invalid.code,400);assert.equal(attempts.size,1);
console.log('PASS: MongoDB profile registration, restore, secure cookie, leaderboard persistence, best-score aggregation, idempotency, and validation.');