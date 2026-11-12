import {COURSES,READY,getCourse,filesFor} from './catalog.js';
import {questionDrawing} from './legacy-diagrams.js';

const app=document.querySelector('#app');
const base=new URL('./',import.meta.url); // /src/ -> parent below
const root=new URL('../',base);
const url=(path)=>new URL(path,root).href;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const courseCache=new Map();
const localKey='fire-equipment-study-v1';
let saved={answers:{},bookmarks:[],read:[],exams:{}};
try{const raw=JSON.parse(localStorage.getItem(localKey));if(raw&&typeof raw==='object')saved={answers:raw.answers||{},bookmarks:raw.bookmarks||[],read:raw.read||[],exams:raw.exams||{}};}catch(_e){}
function store(){try{localStorage.setItem(localKey,JSON.stringify(saved))}catch(_e){}}
const key=(course,id)=>`${course}:${id}`;
const href=(...parts)=>'#/'+parts.map(x=>encodeURIComponent(x)).join('/');
const getRoute=()=>{
 const x=(location.hash||'#/').replace(/^#\/?/,'').split('/').filter(Boolean);
 try{return x.map(decodeURIComponent)}catch{return []}
};
const progressFor=(c,questions)=>{
 const qs=questions||[];
 const answered=qs.filter(q=>saved.answers[key(c,q.id)]);
 const correct=answered.filter(q=>saved.answers[key(c,q.id)]?.correct).length;
 return {answered:answered.length,correct,total:qs.length,pct:answered.length?Math.round(correct*100/answered.length):0};
};
const qTarget=(q,c)=>!q.audiences||q.audiences.includes(c);
const lTarget=(l,c)=>!l.audiences||l.audiences.includes(c);
async function fetchJSON(path){const r=await fetch(url(path));if(!r.ok)throw Error(`${path}: HTTP ${r.status}`);return r.json()}
async function loadCourse(course){
 if(courseCache.has(course.id))return courseCache.get(course.id);
 const data=await Promise.all([...(course.lessonFiles||[]).map(fetchJSON),...(course.questionFiles||[]).map(fetchJSON),fetchJSON(course.groupFile),fetchJSON(course.domainFile),course.examFile?fetchJSON(course.examFile):Promise.resolve([])]);
 const nLessons=course.lessonFiles.length,nQuestions=course.questionFiles.length;
 const lessons=data.slice(0,nLessons).flat().filter(l=>lTarget(l,course.id));
 const questions=data.slice(nLessons,nLessons+nQuestions).flat().filter(q=>qTarget(q,course.id));
 const groups=data[nLessons+nQuestions],domains=data[nLessons+nQuestions+1],exams=data[nLessons+nQuestions+2];
 const value={lessons,questions,groups,domains,exams,byLesson:Object.fromEntries(lessons.map(l=>[l.id,l])),byQuestion:Object.fromEntries(questions.map(q=>[q.id,q]))};
 courseCache.set(course.id,value);return value;
}
let currentToken=0;
let temp={filters:{search:'',domain:'all',status:'all'},showWritten:{},examSession:null,backupMessage:'',offlineMessage:''};
const button=(title,action,extra='')=>`<button class="btn ${extra}" data-action="${action}">${esc(title)}</button>`;
const labelStatus=(c)=>`<span class="tag ${c.status==='planned'?'plan':'working'}">${esc(c.statusLabel)}</span>`;
const header=()=>`<header class="site-top"><a href="#/" class="logo"><span class="logo-mark">▤</span>消防設備士 学習</a><span class="top-meta">解説・演習・模擬試験</span><span class="offline-status" id="online-status"></span><a href="#/settings" class="top-link">設定</a></header>`;
function sidebar(c,route){
 const selected=route[0];
 const link=(label,page,active=false,n)=>`<a class="side-link ${active?'active':''}" href="${page}">${esc(label)}${n!=null?`<span class="side-num">${n}</span>`:''}</a>`;
 const all=`<div class="side-cap">資格を選択</div>${READY.map(x=>link(x.name,href('course',x.id),c?.id===x.id)).join('')}`;
 const menu=c?`<div class="side-cap">${esc(c.name)}</div>${link('概要',href('course',c.id),selected==='course')}${link('解説',href('lessons',c.id),selected==='lessons'||selected==='lesson')}${link('問題集',href('questions',c.id),selected==='questions'||selected==='question')}${c.examFile?link('本試験形式',href('exams',c.id),selected==='exams'||selected==='exam'):''}${link('復習',href('review',c.id),selected==='review')}`:'';
 return `<aside class="side">${link('資格一覧','#/',selected==='')}${all}${menu}<div class="side-cap">管理</div>${link('学習データ',href('settings'),selected==='settings')}</aside>`;
}
function mobileNav(c){if(!c)return `<nav class="mobile-tabs"><a href="#/">資格一覧</a><a href="#/settings">設定</a></nav>`;return `<nav class="mobile-tabs"><a href="${href('course',c.id)}">概要</a><a href="${href('lessons',c.id)}">解説</a><a href="${href('questions',c.id)}">問題</a>${c.examFile?`<a href="${href('exams',c.id)}">模擬試験</a>`:''}<a href="${href('review',c.id)}">復習</a><a href="#/">資格一覧</a></nav>`}
function shell(c,route,body){
 app.innerHTML=`${header()}${mobileNav(c)}<div class="app-shell">${sidebar(c,route)}<main class="main"><div class="content">${body}<footer class="footer">出典：消防試験研究センター・e-Gov等。公開前の法令・問題監修は継続中です。実設備の工事・点検手順書ではありません。</footer></div></main></div>`;
 setOfflineIndicator();
}
function crumbs(c,...items){let result=`<div class="breadcrumbs"><a href="#/">資格一覧</a>`;if(c)result+=` / <a href="${href('course',c.id)}">${esc(c.name)}</a>`;for(const i of items)result+=` / ${esc(i)}`;return result+'</div>'}
const lessonLink=(c,id,label)=>`<a class="pill" href="${href('lesson',c.id,id)}">${esc(label||id)}</a>`;
const qLink=(c,id,label)=>`<a class="pill secondary" href="${href('question',c.id,id)}">${esc(label||id)}</a>`;
function home(){
 const card=c=>c.status==='planned'?`<div class="course-card off"><div class="card-top"><span class="card-title">${esc(c.name)}</span>${labelStatus(c)}</div><div class="card-desc">${esc(c.subtitle)}</div></div>`:`<a class="course-card" href="${href('course',c.id)}"><div class="card-top"><span class="card-title">${esc(c.name)}</span>${labelStatus(c)}</div><div class="card-desc">${esc(c.subtitle)}</div><div class="card-foot">解説 ${c.previewCounts?.lessons||0}項目・問題 ${c.previewCounts?.questions||0}問</div></a>`;
 return `<div class="breadcrumbs">資格一覧</div><h1>資格を選択</h1><p class="lede">学習する類を選んでください。甲種第6・7類はありません。</p><div class="card-grid">${READY.map(card).join('')}</div><section class="section"><h2>今後追加する資格</h2><div class="card-grid">${COURSES.filter(x=>x.status==='planned').map(card).join('')}</div></section><div class="note">甲種は特類と第1〜5類、乙種は第1〜7類の計13区分。甲種第6・7類はありません。各類の教材は順次追加する設計です。</div>`;
}
function courseHome(c,data){
 const p=progressFor(c.id,data.questions);
 const byGroup=data.groups.map(([id,name])=>({id,name,ls:data.lessons.filter(l=>l.group===id)})).filter(x=>x.ls.length);
 return `${crumbs(c)}<div class="card-top"><h1>${esc(c.name)}</h1>${labelStatus(c)}</div><p class="lede">${esc(c.subtitle)}</p><div class="metrics"><div class="metric"><strong>${data.lessons.length}</strong><span>解説項目</span></div><div class="metric"><strong>${data.questions.length}</strong><span>練習問題</span></div><div class="metric"><strong>${p.answered}</strong><span>回答済み</span></div></div><div class="btn-row"><a class="btn primary" href="${href('lessons',c.id)}">解説を読む</a><a class="btn" href="${href('questions',c.id)}">問題を解く</a>${data.exams.length?`<a class="btn" href="${href('exams',c.id)}">本試験形式</a>`:''}${button('この資格をオフライン保存','offline','')}</div><div class="warn">${esc(c.notice)}</div>${temp.offlineMessage?`<p class="note">${esc(temp.offlineMessage)}</p>`:''}<section class="section"><div class="section-head"><h2>目次</h2><a href="${href('lessons',c.id)}" class="tiny">すべて見る</a></div><div class="list">${byGroup.map(g=>`<a class="item" href="${href('lessons',c.id)}"><div><div class="item-title">${esc(g.name)}</div><div class="item-sub">${esc(g.ls.slice(0,3).map(l=>l.title).join(' / '))}</div></div><span class="tag">${g.ls.length}項目</span></a>`).join('')}</div></section>`;
}
function lessonsIndex(c,data){
 return `${crumbs(c,'解説')}<h1>解説</h1><p class="lede">章ごとに読むか、解説ページから関連問題へ進めます。</p>${data.groups.map(([gId,gName])=>{
 const ls=data.lessons.filter(l=>l.group===gId);if(!ls.length)return '';
 return `<section class="group"><div class="group-name">${esc(gName)} <span>${ls.length}項目</span></div><div class="group-list">${ls.map(l=>`<a href="${href('lesson',c.id,l.id)}" class="item"><div><div class="item-title">${esc(l.title)}</div><div class="item-sub">${esc(l.lead)}</div></div>${saved.read.includes(key(c.id,l.id))?'<span class="read-state">既読 ✓</span>':'<span class="tiny">読む →</span>'}</a>`).join('')}</div></section>`;
 }).join('')}`;
}
function lessonPage(c,data,id){
 const l=data.byLesson[id];if(!l)return missing('解説が見つかりません。');
 const isRead=saved.read.includes(key(c.id,l.id));
 const related=[...new Set([...(l.questions||[]),...data.questions.filter(q=>q.lesson===l.id).map(q=>q.id)])].filter(qid=>data.byQuestion[qid]);
 const refs=(l.refs||[]).filter(r=>r.url&&r.label);
 return `${crumbs(c,'解説',l.title)}<div class="question-meta">${esc(data.groups.find(g=>g[0]===l.group)?.[1]||l.group)} ${l.reviewStatus==='imported-unreviewed'?'・既存教材':'・教材拡充版（未監修）'}</div><h1>${esc(l.title)}</h1><p class="lede">${esc(l.lead)}</p>${l.diagram?`<figure class="lesson-diagram"><img src="${url(l.diagram)}" alt="${esc(l.title)}の模式図" loading="lazy"><figcaption>学習用の模式図（実際の配線・施工図ではありません）</figcaption></figure>`:''}<div class="btn-row">${button(isRead?'既読を解除':'既読にする','toggle-read',isRead?'active':'') }<a class="btn" href="${href('lessons',c.id)}">目次へ戻る</a></div>${l.parts.map(p=>`<section class="lesson-part"><h2>${esc(p[0])}</h2><p>${esc(p[1])}</p></section>`).join('')}${l.check?`<div class="box soft"><h3>理解確認</h3><p>${esc(l.check[0])}</p><p class="tiny">答えを確認する前に考えてみてください。</p>${button('答えを見る','show-check')}<div id="check-result" hidden class="feedback"><p>正解：${esc(l.check[1]?.[l.check[2]]||'')}</p><p>${esc(l.check[3]||'')}</p></div></div>`:''}<section class="section"><div class="section-head"><h2>関連問題</h2><span class="tiny">${related.length}問</span></div>${related.length?`<div class="lesson-links">${related.slice(0,36).map(id=>qLink(c,id,`${id}　${data.byQuestion[id].prompt.slice(0,32)}…`)).join('')}</div>${related.length>36?`<p class="tiny">他 ${related.length-36}問は問題一覧から検索できます。</p>`:''}`:'<p class="tiny">この項目に紐付く問題はまだありません。</p>'}</section>${refs.length?`<div class="refs">根拠・参考：${refs.map(r=>`<a target="_blank" rel="noopener noreferrer" href="${esc(r.url)}">${esc(r.label)} ↗</a>`).join('　')}</div>`:''}`;
}
function questionCard(c,q,short=false){
 const last=saved.answers[key(c.id,q.id)];return `<a class="q-row" href="${href('question',c.id,q.id)}"><span class="q-index">${esc(q.id)}</span><span class="q-main">${esc(q.prompt.replace(/\s+/g,' ').slice(0,short?68:108))}${q.prompt.length>(short?68:108)?'…':''}</span><span class="q-right">${last?(last.correct?'✓ 正解':'× 復習'):q.type==='written'?'記述':''}</span></a>`;
}
function questionsIndex(c,data,reviewOnly=false){
 temp.filters.search='';temp.filters.domain='all';temp.filters.status=reviewOnly?'wrong':'all';
 const domains=Object.entries(data.domains||{});
 return `${crumbs(c,reviewOnly?'復習':'問題集')}<h1>${reviewOnly?'復習':'問題集'}</h1><div class="toolbar"><input id="q-search" class="field search" placeholder="問題文・用語を検索" aria-label="問題文検索"><select id="q-domain" class="field" aria-label="分野"> <option value="all">全分野</option>${domains.map(([v,n])=>`<option value="${esc(v)}">${esc(n)}</option>`).join('')}</select><select id="q-status" class="field" aria-label="回答状態"><option value="all">すべて</option><option value="unanswered">未回答</option><option value="wrong" ${reviewOnly?'selected':''}>誤答・要復習</option><option value="bookmarked">ブックマーク</option></select></div><p id="q-count" class="tiny"></p><div id="question-results" class="question-list"></div>`;
}
function refreshQuestionList(c,data){
 const {search,domain,status}=temp.filters;
 const matched=data.questions.filter(q=>{
  if(domain!=='all'&&q.domain!==domain)return false;
  const a=saved.answers[key(c.id,q.id)];
  if(status==='wrong'&&(!a||a.correct))return false;
  if(status==='unanswered'&&a)return false;
  if(status==='bookmarked'&&!saved.bookmarks.includes(key(c.id,q.id)))return false;
  if(search&&!`${q.id} ${q.prompt} ${q.category||''} ${q.explanation||''}`.toLowerCase().includes(search.toLowerCase()))return false;
  return true;
 });
 document.getElementById('q-count').textContent=`${matched.length}問 / ${data.questions.length}問`;
 document.getElementById('question-results').innerHTML=matched.length?matched.map(q=>questionCard(c,q,true)).join(''):'<div class="missing">該当する問題はありません。</div>';
}
function explanation(raw){return String(raw||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('')}
function getDiagram(q){
 if(q.diagram)return `<img class="diagram" src="${url(q.diagram)}" alt="問題に関する学習用模式図" loading="lazy">`;
 if(q.drawing)return `<div class="legacy-diagram">${questionDrawing(q)}</div>`;
 return '';
}
function sourceLink(q){return q.url?`<a href="${esc(q.url)}" target="_blank" rel="noopener noreferrer">${esc(q.source||'参考資料')} ↗</a>`:`<span>${esc(q.source||'')}</span>`}
function lessonContext(data,q){
 const l=q.lesson&&data.byLesson[q.lesson];
 if(!l||!l.parts?.length||!q.id.startsWith('F4'))return '';
 return `<details class="box lesson-context"><summary>用語・仕組みを確認する</summary>${l.parts.slice(0,3).map(([h,t])=>`<p><strong>${esc(h)}：</strong>${esc(t)}</p>`).join('')}</details>`;
}
function relatedLesson(c,data,q){
 const direct=q.lesson&&data.byLesson[q.lesson]?[q.lesson]:[];
 const indirect=data.lessons.filter(l=>l.questions?.includes(q.id)).map(l=>l.id);
 const ids=[...new Set([...direct,...indirect])];
 return ids.length?`<div class="refs">関連解説：${ids.slice(0,4).map(id=>lessonLink(c,id,data.byLesson[id].title)).join(' ')}</div>`:'';
}
function questionPage(c,data,id){
 const q=data.byQuestion[id];if(!q)return missing('問題が見つかりません。');
 const index=data.questions.findIndex(x=>x.id===id);const next=data.questions[index+1];
 const record=saved.answers[key(c.id,id)];const show=!!record;const book=saved.bookmarks.includes(key(c.id,id));const written= q.type==='written';
 const revealed=written&&(temp.showWritten[key(c.id,id)]||show);
 let input='';
 if(written){input=`<textarea id="written-answer" class="field answer-draft" placeholder="まず自分の答えを書いてください。">${esc(temp.showWritten[key(c.id,id)]?.draft||record?.text||'')}</textarea><div class="btn-row">${revealed?'':button('模範解答を見る','reveal-written','primary')}${revealed&&!record?`${button('できた（自己採点）','written-correct','primary')}${button('要復習（自己採点）','written-wrong')}`:''}</div>`}
 else input=`<div class="choice-list">${(q.options||[]).map((opt,i)=>`<button class="choice ${show?(i===q.answer?'correct':i===record.selected?'wrong':''):''}" data-action="answer" data-value="${i}" ${show?'disabled':''}><span class="letter">${i+1}</span><span>${esc(opt)}</span></button>`).join('')}</div>`;
 const verdict=record?(record.correct?'正解':'不正解／要復習'):'';
 const explanationShown=(show||revealed)?`<div class="feedback ${record?.correct?'good':record?'bad':''}">${record?`<p class="verdict">${verdict}</p>`:''}${!written?`<p><strong>正答：${esc(q.options?.[q.answer]||'')}</strong></p>`:`<p><strong>模範解答：${esc(q.answerText||'')}</strong></p>`}${explanation(q.explanation)}${lessonContext(data,q)}<div class="refs">根拠・参考：${sourceLink(q)}</div>${relatedLesson(c,data,q)}</div>`:'';
 return `${crumbs(c,'問題',q.id)}<div class="question-meta"><span>${esc(q.id)}</span><span>${esc(data.domains[q.domain]||q.category||'')}</span><span>${written?'記述式':'四肢択一'}</span></div><div class="section-head"><h1>問題 ${index+1} / ${data.questions.length}</h1>${button(book?'★ 保存済み':'☆ 保存','toggle-bookmark','small')}</div><p class="prompt">${esc(q.prompt)}</p>${getDiagram(q)}${input}${explanationShown}<div class="btn-row">${record?button('この問題をやり直す','reset-one'):''}${next?`<a class="btn primary" href="${href('question',c.id,next.id)}">次の問題へ →</a>`:''}<a class="btn" href="${href('questions',c.id)}">問題一覧</a></div>${q.reviewStatus==='imported-unreviewed'?'<p class="tiny">過去版からの移行問題です。全問題の逐条監修は未完了です。</p>':'<p class="tiny">本試験を参考にしたオリジナル問題です。法令・規格は出典と最新条文を併せて確認してください。</p>'}`;
}
function examsHub(c,data){
 if(!data.exams?.length)return missing('この資格の模擬試験はまだありません。');
 return `${crumbs(c,'模擬試験')}<h1>本試験形式</h1><p class="lede">資格ごとの出題構成に沿って通しで解きます。筆記は終了後に採点し、鑑別・製図は模範解答と照合して自己採点します。</p><div class="warn">公式の過去問ではなく、公式公開例題の出題形式を参考にした新作問題です。難易度・判定の本試験との一致は保証されません。</div><div class="list">${data.exams.map((set,i)=>{const nChoice=set.ids.filter(id=>data.byQuestion[id]?.type==='choice').length,nWrite=set.ids.length-nChoice;return `<div class="item"><div><div class="item-title">${esc(set.title)}</div><div class="item-sub">${set.ids.length}問：筆記${nChoice}問＋記述${nWrite}問</div></div>${button(saved.exams[key(c.id,i)]?.done?'結果を見る':'開始する',`open-exam-${i}`,'small')}</div>`}).join('')}</div>`;
}
function examSession(c,data,setIndex){
 const e=data.exams[setIndex];if(!e)return missing('この模擬試験はありません。');
 const storageKey=key(c.id,setIndex);
 if(!saved.exams[storageKey]){saved.exams[storageKey]={idx:0,answers:{},written:{},marks:{},done:false};store()}
 const s=saved.exams[storageKey];
 if(s.done)return examResults(c,data,e,setIndex,s);
 s.idx=Math.max(0,Math.min(s.idx,e.ids.length-1));
 const id=e.ids[s.idx],q=data.byQuestion[id];if(!q)return missing(`問題 ${id} が見つかりません。`);
 const ans=s.answers[id],written=q.type==='written';
 const stepButtons=e.ids.map((x,i)=>`<button class="step ${i===s.idx?'active':''} ${s.answers[x]!=null||s.written[x]!=null?'answered':''}" data-action="exam-jump" data-value="${i}" title="第${i+1}問">${i+1}</button>`).join('');
 return `${crumbs(c,'模擬試験',e.title)}<h1>${esc(e.title)}</h1><div class="exam-tally"><span>第${s.idx+1}問 / ${e.ids.length}問</span><span>未回答 ${e.ids.length-e.ids.filter(qid=>s.answers[qid]!=null||s.written[qid]!=null).length}問</span><span>採点は終了後</span></div><div class="progressbar"><div class="fill" style="width:${(s.idx+1)/e.ids.length*100}%"></div></div><div class="steps">${stepButtons}</div><div class="box"><div class="question-meta">${esc(q.id)}　${esc(data.domains[q.domain]||q.category||'')}　${written?'記述式':'四肢択一'}</div><p class="prompt">${esc(q.prompt)}</p>${getDiagram(q)}${written?`<textarea id="exam-written" class="field answer-draft" placeholder="自分の答えを書いてください。模範解答は終了後に確認できます。">${esc(s.written[id]||'')}</textarea>`:`<div class="choice-list">${(q.options||[]).map((text,i)=>`<button class="choice ${ans===i?'selected':''}" data-action="exam-select" data-value="${i}"><span class="letter">${i+1}</span>${esc(text)}</button>`).join('')}</div>`}<div class="btn-row">${s.idx>0?button('← 前へ','exam-prev'):''}${s.idx<e.ids.length-1?button('次へ →','exam-next','primary'):button('解答を終了して採点','exam-finish','primary')}</div></div><p class="tiny">途中の回答はこの端末に保存されます。正解は終了まで表示しません。</p>`;
}
function examResults(c,data,e,index,s){
 const writtens=e.ids.filter(id=>data.byQuestion[id]?.type==='written');
 const writtenMarked=writtens.filter(id=>s.marks[id]!=null).length;
 const choices=e.ids.filter(id=>data.byQuestion[id]?.type==='choice');
 const correct=choices.filter(id=>s.answers[id]===data.byQuestion[id].answer).length;
 const groups={};for(const id of choices){const d=data.byQuestion[id].domain; if(!groups[d])groups[d]={total:0,correct:0};groups[d].total++;groups[d].correct+=(s.answers[id]===data.byQuestion[id].answer)?1:0;}
 const allMarked=writtenMarked===writtens.length;
 // The published threshold concerns three written-exam subjects, not five display subdomains.
 // This is a practice-only calculation: actual written practical scores have partial credit.
 const subjectGroups=[
  ['消防関係法令',['lawc','law4','law6']],
  ['基礎的知識',['basic']],
  ['構造・機能・整備（工事を含む）',['system','mechanism','standard']]
 ];
 const subjectRows=subjectGroups.map(([name,domains])=>{
  const v=Object.entries(groups).filter(([d])=>domains.includes(d)).reduce((acc,[,val])=>({total:acc.total+val.total,correct:acc.correct+val.correct}),{total:0,correct:0});
  return {...v,name,pct:v.total?(v.correct/v.total*100):0};
 }).filter(v=>v.total);
 const writtenPass=correct>=Math.ceil(choices.length*0.6)&&subjectRows.every(v=>v.pct>=40);
 const summary=`<div class="metrics"><div class="metric"><strong>${correct}/${choices.length}</strong><span>筆記正解数</span></div><div class="metric"><strong>${choices.length?Math.round(correct/choices.length*100):0}%</strong><span>筆記正答率</span></div><div class="metric"><strong>${writtenMarked}/${writtens.length}</strong><span>記述の自己採点</span></div></div>`;
 const subjectSummary=`<section class="section"><h2>筆記の科目別判定（練習用）</h2><div class="box"><p><strong>${writtenPass?'筆記の基準相当を満たしています':'筆記の基準相当には届いていません'}</strong>（全体60％以上・各科目40％以上）</p><table class="result-table"><thead><tr><th>科目</th><th>正解</th><th>率</th><th>判定</th></tr></thead><tbody>${subjectRows.map(v=>`<tr><td>${esc(v.name)}</td><td>${v.correct}/${v.total}</td><td>${Math.round(v.pct)}%</td><td>${v.pct>=40?'40％以上':'40％未満'}</td></tr>`).join('')}</tbody></table><p class="tiny">実際の合格には実技60％以上が必要です。記述式の自己採点は部分点を含まないため、合格判定には使用していません。</p></div></section>`;
 return `${crumbs(c,'模擬試験','採点結果')}<h1>${esc(e.title)}：結果</h1>${summary}${subjectSummary}<div class="warn">これは練習用の採点です。科目別の合格判定や記述配点は、実試験の結果を保証しません。${allMarked?'':'記述式の自己採点が残っています。'}</div><section class="section"><h2>筆記：分野別の結果</h2><div class="box"><table class="result-table"><thead><tr><th>分野</th><th>正解</th><th>正答率</th></tr></thead><tbody>${Object.entries(groups).map(([g,v])=>`<tr><td>${esc(data.domains[g]||g)}</td><td>${v.correct}/${v.total}</td><td>${Math.round(v.correct/v.total*100)}%</td></tr>`).join('')}</tbody></table></div></section><section class="section"><h2>全問の解答・解説</h2><div class="list">${e.ids.map((id,i)=>{const q=data.byQuestion[id];if(!q)return '';const wr=q.type==='written';const a=s.answers[id],right=a===q.answer;const mark=s.marks[id];return `<details class="box"><summary style="cursor:pointer;font-weight:650">${i+1}. ${esc(q.prompt.replace(/\s+/g,' ').slice(0,90))}　${wr?(mark==null?'自己採点待ち':mark?'自己採点○':'自己採点×'):(right?'○':'×')}</summary><div style="padding-top:16px">${getDiagram(q)}${wr?`<div class="review-answer"><strong>自分の解答</strong><p>${esc(s.written[id]||'（未記入）')}</p><strong>模範解答</strong><p>${esc(q.answerText||'')}</p></div><div class="btn-row"><button class="btn small ${mark===true?'active':''}" data-action="exam-mark" data-id="${esc(id)}" data-value="true">できた</button><button class="btn small ${mark===false?'active':''}" data-action="exam-mark" data-id="${esc(id)}" data-value="false">要復習</button></div>`:`<p>自分の回答：${esc(q.options?.[a]||'（未回答）')}</p><p><strong>正答：${esc(q.options[q.answer])}</strong></p>`}<div class="feedback">${explanation(q.explanation)}${lessonContext(data,q)}<div class="refs">出典・参考：${sourceLink(q)}</div>${relatedLesson(c,data,q)}</div></div></details>`}).join('')}</div></section><div class="btn-row">${button('このセットを最初からやり直す','reset-exam')}<a class="btn" href="${href('exams',c.id)}">模擬試験一覧へ</a></div>`;
}
function settingsPage(){
 const used=Object.keys(saved.answers).length;
 return `${crumbs(null,'設定')}<h1>学習データ</h1><div class="box"><p>回答履歴 ${used}件・ブックマーク ${saved.bookmarks.length}件・既読 ${saved.read.length}件</p><p class="tiny">学習データはこのブラウザ内に保存します。別の端末やブラウザとの自動同期はありません。ブラウザのデータを消すと履歴も失われます。</p><div class="btn-row">${button('進捗をJSONで書き出す','export')}<label class="btn" for="backup-upload">JSONから復元</label><input type="file" accept=".json,application/json" id="backup-upload" hidden></div>${temp.backupMessage?`<p class="note">${esc(temp.backupMessage)}</p>`:''}</div><section class="section"><h2>オフライン利用</h2><div class="box"><p>GitHub Pagesで一度開くと、画面本体がキャッシュされます。資格ごとの解説・問題をオフラインでも使うには、その資格の概要ページで「この資格をオフライン保存」を押してください。</p><p class="tiny">PWAのホーム画面への追加はブラウザのメニューから実施できます。オフライン保存と端末のストレージ容量・ブラウザの削除設定に依存します。</p></div></section><section class="section"><h2>学習データを削除</h2><div class="box"><p class="tiny">削除すると、このブラウザ内の既読・回答・模擬試験履歴が消去されます。</p>${button('保存された学習データを削除','reset-all','danger')}</div></section>`;
}
function missing(message){return `<div class="missing">${esc(message)}<p><a href="#/">資格一覧に戻る</a></p></div>`}
function empty(){return `<div class="message">読み込み中…</div>`}
function setOfflineIndicator(){let node=document.getElementById('online-status');if(node)node.textContent=navigator.onLine?'':'オフライン'}
async function renderRoute(){
 const token=++currentToken;
 const route=getRoute();const page=route[0]||'';const c=getCourse(route[1]);
 if(page===''||page==='home'){shell(null,route,home());return}
 if(page==='settings'){shell(null,route,settingsPage());return}
 if(!c||c.status==='planned'){shell(null,route,missing('この資格の教材はまだ公開していません。'));return}
 shell(c,route,empty());
 let data;try{data=await loadCourse(c)}catch(e){if(token===currentToken)shell(c,route,missing(`教材を読み込めませんでした。ネットワーク接続と公開ファイルを確認してください。（${e.message}）`));return}
 if(token!==currentToken)return;
 let body='';
 switch(page){
  case 'course':body=courseHome(c,data);break;
  case 'lessons':body=lessonsIndex(c,data);break;
  case 'lesson':body=lessonPage(c,data,route[2]);break;
  case 'questions':body=questionsIndex(c,data);break;
  case 'review':body=questionsIndex(c,data,true);break;
  case 'question':body=questionPage(c,data,route[2]);break;
  case 'exams':body=examsHub(c,data);break;
  case 'exam':body=examSession(c,data,Number(route[2]));break;
  default:body=missing('ページが見つかりません。');
 }
 shell(c,route,body);
 if(['questions','review'].includes(page))refreshQuestionList(c,data);
}
function refresh(){renderRoute()}
// One delegated handler keeps the static site dependency-free.
document.addEventListener('click',async event=>{
 const target=event.target.closest('[data-action]');if(!target)return;
 const action=target.dataset.action,route=getRoute(),c=getCourse(route[1]);const data=c?courseCache.get(c.id):null;
 const id=route[2],k=c?key(c.id,id):'';
 const gotoNext=()=>{const q=data.byQuestion[id];const idx=data.questions.indexOf(q);const n=data.questions[idx+1];if(n)location.hash=href('question',c.id,n.id)};
 if(action==='toggle-read'&&data){let list=new Set(saved.read);list.has(k)?list.delete(k):list.add(k);saved.read=[...list];store();refresh();}
 if(action==='toggle-bookmark'&&data){let set=new Set(saved.bookmarks);set.has(k)?set.delete(k):set.add(k);saved.bookmarks=[...set];store();refresh();}
 if(action==='show-check'){let el=document.querySelector('#check-result');if(el)el.hidden=false;}
 if(action==='answer'&&data){const q=data.byQuestion[id];if(saved.answers[k]||q.type!=='choice')return;let selected=Number(target.dataset.value);saved.answers[k]={selected,correct:selected===q.answer,at:new Date().toISOString()};store();refresh();}
 if(action==='reset-one'&&data){delete saved.answers[k];delete temp.showWritten[k];store();refresh();}
 if(action==='reveal-written'&&data){let field=document.querySelector('#written-answer');temp.showWritten[k]={draft:field?.value||''};refresh();}
 if((action==='written-correct'||action==='written-wrong')&&data){const q=data.byQuestion[id];if(q.type!=='written')return;saved.answers[k]={correct:action==='written-correct',text:temp.showWritten[k]?.draft||'',at:new Date().toISOString()};store();refresh();}
 if(action==='offline'&&c){const diagrams=[...new Set((data?.questions||[]).map(q=>q.diagram).filter(Boolean))];const paths=[...filesFor(c),...diagrams,'./index.html','./src/app.js','./src/legacy-diagrams.js','./src/catalog.js','./styles.css','./assets/diagrams/monitor.svg'];try{if(!('caches' in window))throw Error('Cache Storageが利用できません');const cache=await caches.open('fire-equipment-offline-pack-v4');await Promise.all(paths.map(async path=>{const response=await fetch(url(path));if(!response.ok)throw Error(`${path} HTTP ${response.status}`);await cache.put(url(path),response.clone());}));temp.offlineMessage='この資格の教材をオフライン用に保存しました。';}catch(e){temp.offlineMessage=`保存できませんでした：${e.message}`;}refresh();}
 if(action.startsWith('open-exam-')&&c){let i=Number(action.slice('open-exam-'.length));location.hash=href('exam',c.id,i);}
 if(action.startsWith('exam-')&&data){
  const i=Number(route[2]),e=data.exams[i],session=saved.exams[key(c.id,i)];if(!e||!session)return;
  const qid=e.ids[session.idx],q=data.byQuestion[qid];
  if(q?.type==='written'){const text=document.getElementById('exam-written')?.value;if(text!==undefined)session.written[qid]=text;}
  if(action==='exam-select'){session.answers[qid]=Number(target.dataset.value)}
  if(action==='exam-jump'){session.idx=Number(target.dataset.value)}
  if(action==='exam-next'){session.idx=Math.min(e.ids.length-1,session.idx+1)}
  if(action==='exam-prev'){session.idx=Math.max(0,session.idx-1)}
  if(action==='exam-finish'){session.done=true}
  if(action==='exam-mark'){session.marks[target.dataset.id]=target.dataset.value==='true'}
  store();refresh();
 }
 if(action==='reset-exam'&&data){const idx=Number(route[2]);if(confirm('この模擬試験の回答を消して最初からやり直しますか？')){delete saved.exams[key(c.id,idx)];store();refresh();}}
 if(action==='export'){
  const b=new Blob([JSON.stringify({format:'fire-equipment-study-v1',exportedAt:new Date().toISOString(),saved},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='study-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 }
 if(action==='reset-all'){if(confirm('この端末の回答履歴・ブックマーク・既読・模擬試験の履歴をすべて削除します。よろしいですか？')){saved={answers:{},bookmarks:[],read:[],exams:{}};store();refresh();}}
});
document.addEventListener('input',event=>{
 if(event.target.id==='q-search'){temp.filters.search=event.target.value;const r=getRoute(),c=getCourse(r[1]),data=c&&courseCache.get(c.id);if(data)refreshQuestionList(c,data)}
});
document.addEventListener('change',async event=>{
 const id=event.target.id;
 if(id==='q-domain'||id==='q-status'){temp.filters[id==='q-domain'?'domain':'status']=event.target.value;const route=getRoute(),c=getCourse(route[1]),data=c&&courseCache.get(c.id);if(data)refreshQuestionList(c,data)}
 if(id==='backup-upload'){
  const file=event.target.files?.[0];if(!file)return;
  try{const payload=JSON.parse(await file.text());if(payload.format!=='fire-equipment-study-v1'||!payload.saved||typeof payload.saved.answers!=='object')throw Error('対応するバックアップではありません');
   if(!confirm('既存の学習履歴をバックアップの内容で置き換えます。よろしいですか？'))return;
   saved={answers:payload.saved.answers||{},bookmarks:payload.saved.bookmarks||[],read:payload.saved.read||[],exams:payload.saved.exams||{}};store();temp.backupMessage='バックアップを読み込みました。';
  }catch(e){temp.backupMessage=`読み込み失敗：${e.message}`;}refresh();
 }
});
window.addEventListener('hashchange',()=>{window.scrollTo(0,0);renderRoute()});
window.addEventListener('online',setOfflineIndicator);window.addEventListener('offline',setOfflineIndicator);
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register(url('sw.js'),{scope:url('./')}).catch(err=>console.warn('Service worker registration failed',err));
renderRoute();
