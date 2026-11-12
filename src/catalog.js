// Qualification IDs stay stable because browser progress uses them as keys.
const planned = [
  ['ko-special','甲種特類','特殊消防用設備等'],
  ['ko1','甲種第1類','消火栓・スプリンクラー等'],
  ['otsu1','乙種第1類','消火栓・スプリンクラー等'],
  ['ko2','甲種第2類','泡消火設備等'],
  ['otsu2','乙種第2類','泡消火設備等'],
  ['ko3','甲種第3類','ガス・粉末消火設備等'],
  ['otsu3','乙種第3類','ガス・粉末消火設備等'],
  ['ko5','甲種第5類','避難器具'],
  ['otsu5','乙種第5類','避難器具'],
  ['otsu7','乙種第7類','漏電火災警報器']
];
const otsu6 = {
  id:'otsu6',name:'乙種第6類',subtitle:'消火器',status:'ported',statusLabel:'既存教材を移行',
  packs:['otsu6'],
  fileRoot:'content/otsu6',
  lessonFiles:['content/otsu6/lessons.json'],questionFiles:['content/otsu6/questions.json'],
  groupFile:'content/otsu6/groups.json',domainFile:'content/otsu6/domains.json',examFile:'content/otsu6/exams.json',
  previewCounts:{lessons:74,questions:273},
  notice:'以前の乙6教材を内容を変えずに移行しました。すべての法令・解答の逐条監修は未完了です。'
};
const ko4 = {
  id:'ko4',name:'甲種第4類',subtitle:'火災報知設備／工事・整備',status:'expanded',statusLabel:'教材拡充版',
  packs:['class4'],
  lessonFiles:['content/class4/lessons.json'],questionFiles:['content/class4/questions.json'],
  groupFile:'content/class4/groups.json',domainFile:'content/class4/domains.json',examFile:'content/class4/exams-ko4.json',
  previewCounts:{lessons:93,questions:258},
  notice:'甲4の全科目の解説・演習と2回分の模擬試験を収録。法令改正の逐条照合・専門監修、実物写真を用いた鑑別は未完了です。甲4の製図は模式図による記述練習です。'
};
const otsu4 = {
  id:'otsu4',name:'乙種第4類',subtitle:'火災報知設備／整備',status:'expanded',statusLabel:'教材拡充版',
  packs:['class4'],
  lessonFiles:['content/class4/lessons.json'],questionFiles:['content/class4/questions.json'],
  groupFile:'content/class4/groups.json',domainFile:'content/class4/domains.json',examFile:'content/class4/exams-otsu4.json',
  previewCounts:{lessons:89,questions:240},
  notice:'乙4の全科目の解説・演習と2回分の模擬試験を収録。甲4との共通教材を使用し、製図は出題しません。法令改正の逐条照合・専門監修、実物写真による鑑別は未完了です。'
};
export const COURSES = [otsu6,ko4,otsu4, ...planned.map(([id,name,subtitle])=>({id,name,subtitle,status:'planned',statusLabel:'未作成'}))];
export const READY = COURSES.filter(c=>c.status!=='planned');
export const getCourse=id=>COURSES.find(c=>c.id===id);
export const filesFor=c=>[...(c.lessonFiles||[]),...(c.questionFiles||[]),c.groupFile,c.domainFile,c.examFile].filter(Boolean);
