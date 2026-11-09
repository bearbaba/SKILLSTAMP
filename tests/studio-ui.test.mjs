import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

const ui=readFileSync('src/main.js','utf8');
const styles=readFileSync('src/style.css','utf8');

test('studio is gated by wallet connection',()=>{
 assert.match(ui,/id="workspaceDisconnected"/);
 assert.match(ui,/id="workspaceConnected" hidden/);
 assert.match(ui,/function updateStudioAccount\(switched=false\)/);
 assert.match(ui,/\$\('workspaceDisconnected'\)\.hidden=connected/);
 assert.match(ui,/\$\('workspaceConnected'\)\.hidden=!connected/);
});
test('six contract actions are rendered as tabs and only one panel is visible',()=>{
 assert.match(ui,/role="tablist"/);
 assert.match(ui,/role="tabpanel" hidden/);
 assert.match(ui,/function selectAction\(method\)/);
 assert.match(ui,/pane\.hidden=pane\.dataset\.actionPanel!==method/);
 assert.doesNotMatch(ui,/project\.forms\.map\(formHTML\)\.join/);
});
test('transaction activity is hidden until a signed transaction is initiated',()=>{
 assert.match(ui,/id="txPanel" aria-live="polite" role="status" hidden/);
 assert.match(styles,/\.activity\[hidden\]\{display:none!important\}/);
 assert.match(ui,/notice\('Confirm '\+actionName\(action\.method\)/);
 assert.doesNotMatch(ui,/id="phase1"/);
 assert.doesNotMatch(ui,/id="phase2"/);
 assert.doesNotMatch(ui,/id="phase3"/);
});
test('nontransaction events do not trigger the transaction panel',()=>{
 assert.match(ui,/workspaceMessage\('Example loaded/);
 assert.match(ui,/workspaceMessage\('SHA-256 generated/);
 assert.match(ui,/workspaceMessage\('Wallet: '/);
 assert.match(ui,/const result=rec\.method==='assess_attempt'\?/);
});
