import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

test('all static DOM lookups have a rendered element', () => {
  const source=readFileSync('src/main.js','utf8');
  const document=readFileSync('index.html','utf8')+'\n'+source;
  const lookedUp=[...new Set([...source.matchAll(/\$\('([A-Za-z][\w-]*)'\)/g)].map(x=>x[1]))];
  for(const id of lookedUp) {
    assert.ok(document.includes('id="'+id+'"'), 'missing DOM element: #'+id);
  }
});
test('navigation initialization is resilient to optional breadcrumb',()=>{
  const source=readFileSync('src/main.js','utf8');
  assert.match(source,/const breadcrumb=\$\('breadcrumb'\);/);
  assert.match(source,/if\(breadcrumb\)breadcrumb\.textContent=/);
});
