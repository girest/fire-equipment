"""Extract the latest generated Otsu-6 content without changing questions or answers.
Run: python tools/migrate_otsu6.py /absolute/path/otsu6_revised_exam_guide.html
"""
import json, sys
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/mnt/data/otsu6_revised_exam_guide.html')
html=source.read_text(encoding='utf-8')

def extract(name):
 marker='const '+name+'='
 ix=html.index(marker)+len(marker)
 return json.JSONDecoder().raw_decode(html[ix:])[0]

lessons=extract('LESSONS'); questions=extract('BANK'); groups=extract('GROUPS'); domains=extract('DOMAINS'); exams=extract('EXAM_SETS')
# Correct a duplicate legacy anchor ID without changing the lesson content.
# The older single HTML used 'gas' for both gas laws and extinguishing gas.
for lesson in lessons:
 if lesson['id']=='gas':
  lesson['id']='gas-laws' if lesson['group']=='mechanics' else 'gas-agent'
for q in questions:
 if q.get('lesson')=='gas':
  q['lesson']='gas-laws' if q['domain']=='basic' else 'gas-agent'
for q in questions:
 if q['type']=='written' and not q.get('answerText'):
  raw=q.get('explanation','')
  if raw.startswith('【模範解答】'):
   q['answerText']=raw.split('【模範解答】',1)[1].split('【',1)[0].strip()
  else:
   raise ValueError(f'Written item {q["id"]} lacks model answer')
 q['reviewStatus']='imported-unreviewed'
 q['audiences']=['otsu6']
for lesson in lessons:
 lesson['audiences']=['otsu6']
 lesson['reviewStatus']='imported-unreviewed'
for name,obj in [('lessons',lessons),('questions',questions),('groups',groups),('domains',domains),('exams',exams)]:
 path=root/'content/otsu6'/f'{name}.json'; path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(path.name,len(obj))
