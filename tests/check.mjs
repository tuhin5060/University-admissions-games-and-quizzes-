/* Dependency-free behavioral checks. DOM adapter is not a visual browser test. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},value:'',setAttribute(){},focus(){},showModal(){},close(){},querySelector(){return {textContent:'Test page'}}});return elements.get(id)}
const store=new Map();
const context={console,URL,Blob,Date,Math,JSON,Number,String,Object,Array,Set,Map,confirm:()=>true,setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},location:{hash:'#home'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{documentElement:{dataset:{}},getElementById:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({click(){}})},window:{scrollTo(){},addEventListener(){}}};
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