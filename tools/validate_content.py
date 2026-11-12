"""Check data integrity without asserting that legal/technical content is correct."""
import json
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parents[1]

def read(p):return json.loads((root/p).read_text(encoding='utf-8'))

def validate(tag,lessons,questions,groups,exams,course):
 ls=[l for l in read(lessons) if course in l.get('audiences',[course])]
 qs=[q for q in read(questions) if course in q.get('audiences',[course])]
 names=[g[0] for g in read(groups)]
 ids=set()
 for l in ls:
  assert l['id'] not in ids,('duplicate lesson',tag,l['id']);ids.add(l['id'])
  assert l.get('parts') and all(len(p)==2 and all(isinstance(s,str) and s.strip() for s in p) for p in l['parts']),l['id']
  assert l['group'] in names,l['id']
 qids=set()
 for q in qs:
  assert q['id'] not in qids,('duplicate question',tag,q['id']);qids.add(q['id'])
  assert q['prompt'] and q['explanation'],q['id']
  assert q['domain'],q['id']
  if q['type']=='choice':
   assert len(q.get('options',[]))==4,('choice count',tag,q['id'])
   assert type(q['answer'])==int and 0<=q['answer']<4,q['id']
   assert len(set(q['options']))==4,q['id']
  elif q['type']=='written':assert q.get('answerText'),q['id']
  else:raise AssertionError((q['id'],q['type']))
  if q.get('lesson'):assert q['lesson'] in ids,('bad link',tag,q['id'],q['lesson'])
  if q.get('diagram'):assert (root/q['diagram']).is_file(),('missing diagram',tag,q['id'])
 for l in ls:
  for id in l.get('questions',[]):assert id in {q['id'] for q in read(questions)},('related question unknown',tag,l['id'],id)
 if exams:
  exam_sets=read(exams)
  exam_ids=[]
  specs={
   '乙6':{'lawc':6,'law6':4,'basic':5,'mechanism':9,'standard':6,'practical':5},
   '甲4':{'lawc':8,'law4':7,'basic':10,'system':12,'standard':8,'practical':5,'drawing':2},
   '乙4':{'lawc':6,'law4':4,'basic':5,'system':9,'standard':6,'practical':5}
  }
  expected=specs[tag]
  for e in exam_sets:
   assert len(e['ids'])==sum(expected.values()),('exam length',tag,e['title'])
   assert len(e['ids'])==len(set(e['ids'])),('exam duplicated IDs',tag,e['title'])
   for id in e['ids']:assert id in qids,('missing exam id',tag,id)
   doms=Counter(next(q for q in qs if q['id']==id)['domain'] for id in e['ids'])
   assert all(doms[d]==n for d,n in expected.items()),('exam spec',tag,e['title'],doms)
   for id in e['ids']:
    q=next(q for q in qs if q['id']==id)
    assert (q['type']=='choice')==(q['domain'] not in ('practical','drawing')),('exam answer type',q['id'])
   exam_ids.extend(e['ids'])
  assert len(exam_ids)==len(set(exam_ids)),('reused question between mock sets',tag)

 print(tag,'lessons',len(ls),'questions',len(qs),'exam sets',len(read(exams)) if exams else 0)

validate('乙6','content/otsu6/lessons.json','content/otsu6/questions.json','content/otsu6/groups.json','content/otsu6/exams.json','otsu6')
for c in ['ko4','otsu4']:
 validate('甲4' if c=='ko4' else '乙4','content/class4/lessons.json','content/class4/questions.json','content/class4/groups.json','content/class4/exams-'+c+'.json',c)
print('Content schema and cross-references: OK. This is NOT a legal/factual editorial audit.')
