const { chromium } = require('C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const port = 5376;
const base = `http://127.0.0.1:${port}`;
const logFd = fs.openSync(path.join(__dirname, 'vite-preview.log'), 'w');
const server = spawn(process.execPath, [path.join(root,'frontend/node_modules/vite/bin/vite.js'), '--host','127.0.0.1','--port',String(port),'--strictPort'], { cwd: path.join(root,'frontend'), stdio:['ignore',logFd,logFd], windowsHide:true });
fs.writeFileSync(path.join(__dirname,'capture-service.json'), JSON.stringify({pid:server.pid,port,base},null,2));
let browser;
(async () => {
  for(let attempt=0;attempt<80;attempt++){
    if(server.exitCode !== null) throw new Error(`Vite exited ${server.exitCode}`);
    try { if((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  browser = await chromium.launch({ executablePath:'C:/Users/0303003/AppData/Local/Google/Chrome/Application/chrome.exe',headless:true });
  const context = await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,acceptDownloads:true,locale:'zh-CN'});
  const page = await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});
  const demonstration = await page.evaluate(async () => {
    const {initialRmrFormState,computeRmrScores}=await import('/src/utils/rmrCalc.ts');
    const iso='2026-10-25T02:00:00.000Z';
    const params=[
      ['演示-01 运输巷','花岗岩',120,82,90,'ucs_100_250','rqd_75_90','sp_0_6_2','a4_25','cond_damp','f'],
      ['演示-02 联络巷','闪长岩',80,65,35,'ucs_50_100','rqd_50_75','sp_0_2_0_6','a4_20','cond_wet','fair'],
      ['演示-03 断层带','破碎岩',35,40,12,'ucs_25_50','rqd_25_50','sp_0_06_0_2','a4_10','cond_drip','uf'],
      ['演示-04 采场顶板','石英岩',280,96,250,'ucs_gt250','rqd_90_100','sp_gt2','a4_30','cond_dry','vf'],
      ['演示-05 充填联道','矿石',85,80,45,'ucs_50_100','rqd_75_90','sp_0_2_0_6','a4_25','cond_damp','fair'],
      ['演示-06 回风巷','花岗岩',150,70,110,'ucs_100_250','rqd_50_75','sp_0_6_2','a4_25','cond_wet','f'],
    ];
    const points=params.map((p,i)=>({id:`demo-point-${i+1}`,name:p[0],note:'虚构演示输入',oreType:p[1],groupId:p[1],methodId:'rmr',standardId:'bieniawski-rmr89',inputVersion:1,createdAt:iso,updatedAt:iso,rmr:{...initialRmrFormState(),a1Mode:'ucs',a1UcsValue:p[2],a2RqdValue:p[3],a3SpacingValue:p[4],a1OptionId:p[5],a2OptionId:p[6],a3OptionId:p[7],a4SimpleId:p[8],a5OptionId:p[9],a6Favorability:p[10]}}));
    const record={id:'presentation-demo-20261025',name:'演示项目｜矿山岩体分级',methodId:'rmr',schemaVersion:2,standardId:'bieniawski-rmr89',engineering:'软件功能演示（虚构数据）',location:'演示中段 · 非实际工程',remark:'所有参数均为演示输入，非实测数据，不作工程设计依据。',createdAt:iso,updatedAt:iso,points};
    localStorage.setItem('rockmass.cases.v2',JSON.stringify([record]));
    localStorage.setItem('language','zh');localStorage.setItem('darkMode','false');
    return {record,scores:points.map(p=>({name:p.name,...computeRmrScores(p.rmr)}))};
  });
  fs.writeFileSync(path.join(__dirname,'demo-inputs-and-results.json'),JSON.stringify(demonstration,null,2));
  assert(demonstration.scores.every(s=>typeof s.rmr==='number'));
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:'RMR分级',exact:true}).click();
  await page.getByRole('button',{name:'打开',exact:true}).click();
  await page.getByRole('heading',{name:'项目点位',exact:true}).waitFor();
  await page.screenshot({path:path.join(__dirname,'02-project-points.png')});
  console.log('CAPTURED points',await page.locator('h1').allTextContents());
  await page.getByRole('button',{name:'编辑',exact:true}).first().click();
  await page.getByRole('heading',{name:'RMR 岩体地质力学分级',exact:true}).waitFor();
  await page.screenshot({path:path.join(__dirname,'01-rmr-calculation.png')});
  console.log('CAPTURED calc',await page.locator('h1').allTextContents());
  await page.getByRole('button',{name:'返回',exact:true}).click();
  await page.getByRole('button',{name:'工程总览',exact:true}).click();
  await page.getByRole('heading',{name:'工程总览',exact:true}).waitFor();
  await page.screenshot({path:path.join(__dirname,'03-engineering-overview.png')});
  console.log('CAPTURED overview',await page.locator('h1').allTextContents());
  await page.getByRole('button',{name:'导出',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({path:path.join(__dirname,'04-export-dialog.png')});
  const downloads=[];page.on('download',d=>downloads.push(d));
  await page.getByRole('button',{name:'导出所选内容',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  for(let n=0;n<40&&downloads.length<2;n++)await new Promise(resolve=>setTimeout(resolve,250));
  assert.equal(downloads.length,2,'Expected DOCX and rmcal downloads');
  for(const d of downloads){const destination=path.join(__dirname,d.suggestedFilename());await d.saveAs(destination);console.log('EXPORTED',destination);} 
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'capture-evidence.json'),JSON.stringify({capturedAt:new Date().toISOString(),viewport:{width:1600,height:900},source:'Unmodified Vite web preview, isolated headless Chrome context; demo-only localStorage; real UI clicks and native export download.',license:'App.tsx explicitly permits ordinary web preview when no electronAPI.license exists; no license mock or bypass was added.',pageErrors:errors,serverPid:server.pid,serverStopped:true,downloads:downloads.map(d=>d.suggestedFilename())},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.kill();fs.closeSync(logFd);console.log('CLEANUP server',server.pid);});
