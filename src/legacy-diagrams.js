// Preserves the simplified SVG drawings from the prior Otsu-6 course.
export function questionDrawing(q){
if(!q.drawing)return '';
const C='<style>.lbl{font:700 16px sans-serif;fill:#1f5149}.leader{stroke:#668278;stroke-width:1.7;fill:none}.cyl{fill:#fbeceb;stroke:#b74f49;stroke-width:5}</style>';
if(q.drawing==='stored')return `<div class="written-diagram"><div class="sample-caption">構造模式図（模式的に簡略化したもの。実物の形状は製品によって異なる）</div><svg viewBox="0 0 760 445" role="img" aria-label="消火器の構造を示す模式図。各部にAからGの記号が付いている">${C}
<rect x="290" y="150" width="150" height="238" rx="22" class="cyl"/><rect x="301" y="222" width="128" height="153" rx="12" fill="#f2cac5"/>
<path d="M363 151 V378" stroke="#355b60" stroke-width="8"/><path d="M349 151V130H389" stroke="#566d70" stroke-width="8" fill="none"/>
<rect x="327" y="134" width="80" height="26" rx="6" fill="#a5b4ad" stroke="#445b54" stroke-width="3"/><path d="M313 128H426L462 98H371" stroke="#3b5653" stroke-width="13" stroke-linejoin="round" fill="none"/>
<path d="M303 105L330 110" stroke="#9e7940" stroke-width="6"/><circle cx="300" cy="103" r="7" fill="#dfbc69"/>
<circle cx="445" cy="153" r="28" fill="#fff" stroke="#3a665a" stroke-width="5"/><path d="M435 146L451 159" stroke="#9b5434" stroke-width="3"/><path d="M437 160A17 17 0 0 1 452 141" stroke="#6d9b75" stroke-width="5" fill="none"/>
<path d="M437 171C512 177 560 180 556 262L560 327" stroke="#303f43" stroke-width="12" fill="none" stroke-linecap="round"/>
<path d="M556 326l-8 17" stroke="#495a5a" stroke-width="18" stroke-linecap="round"/>
<g class="leader"><path d="M175 90H266L300 103"/><path d="M363 56V96L390 108"/><path d="M567 120H504L468 145"/><path d="M646 280H593L555 264"/><path d="M155 335H254L290 314"/><path d="M483 412H413L365 355"/><path d="M158 189H278L340 151"/></g>
<g class="lbl"><text x="158" y="85">A</text><text x="355" y="49">B</text><text x="577" y="116">C</text><text x="656" y="275">D</text><text x="138" y="330">E</text><text x="492" y="407">F</text><text x="139" y="184">G</text></g></svg></div>`;
if(q.drawing==='cartridge')return `<div class="written-diagram"><div class="sample-caption">消火器の内部構造の模式図</div><svg viewBox="0 0 730 400" role="img" aria-label="消火器の内部構造を示す模式図。部品にHとIの記号が付いている">${C}
<rect x="280" y="108" width="166" height="250" rx="24" class="cyl"/><rect x="290" y="183" width="146" height="163" rx="15" fill="#f1c9bf"/>
<rect x="342" y="164" width="43" height="120" rx="11" fill="#e9eff0" stroke="#426474" stroke-width="5"/><path d="M364 160V123" stroke="#495b68" stroke-width="7"/>
<path d="M319 115V87H408" stroke="#536d65" stroke-width="10" fill="none"/><path d="M295 95H432L471 70H374" stroke="#364b4a" stroke-width="12" fill="none"/>
<path d="M441 140C525 152 574 169 565 275" stroke="#354545" stroke-width="12" fill="none"/><path d="M565 273l-4 22" stroke="#455f60" stroke-width="19" stroke-linecap="round"/>
<path d="M318 115V336" stroke="#536d65" stroke-width="7"/>
<g class="leader"><path d="M170 245H293L342 234"/><path d="M615 316H595L565 292"/></g><g class="lbl"><text x="155" y="240">H</text><text x="626" y="310">I</text></g></svg></div>`;
if(q.drawing==='gauge') {let lower=q.prompt.includes('下回');return `<div class="written-diagram"><div class="sample-caption">指示圧力計の模式図（色と針の位置に注目）</div><svg viewBox="0 0 620 280" role="img" aria-label="指示圧力計の模式図">${C}
<circle cx="310" cy="140" r="104" fill="#fff" stroke="#506761" stroke-width="10"/>
<path d="M235 197A89 89 0 0 1 235 83" stroke="#b5c2c0" stroke-width="18" fill="none"/>
<path d="M235 83A89 89 0 0 1 388 105" stroke="#6eab7c" stroke-width="18" fill="none"/>
<path d="M388 105A89 89 0 0 1 379 197" stroke="#b5c2c0" stroke-width="18" fill="none"/>
<path d="M310 140L${lower?'232 188':'345 72'}" stroke="#a24336" stroke-width="6" stroke-linecap="round"/><circle cx="310" cy="140" r="10" fill="#455753"/>
<text x="310" y="245" text-anchor="middle" class="lbl">指示圧力計</text><text x="175" y="200" class="lbl">低</text><text x="427" y="200" class="lbl">高</text></svg></div>`}
return '';
}
