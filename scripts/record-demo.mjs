import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const dir='demo-recording';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,recordVideo:{dir,size:{width:1600,height:900}},reducedMotion:'reduce',acceptDownloads:true});
// Fresh context, no sign-in, no stored credentials. Never query real account data.
await context.route('https://*.supabase.co/**',route=>route.abort());
const page=await context.newPage();const started=Date.now();const cues=[];
const errors=[];page.on('pageerror',e=>errors.push(e.message));
function chapter(text){cues.push({start:(Date.now()-started)/1000,text});}
async function pause(ms=2500){await page.waitForTimeout(ms);}
async function click(locator){await locator.waitFor({state:'visible'});await locator.scrollIntoViewIfNeeded();const box=await locator.boundingBox();if(!box)throw Error('No visible click target');await page.mouse.move(box.x+box.width*.52,box.y+box.height*.52,{steps:18});await pause(220);await locator.click();}
async function type(locator,text){await click(locator);await locator.fill('');await locator.pressSequentially(text,{delay:55});}
const nav=name=>page.locator('.sidebar nav').getByRole('button',{name,exact:true});
async function screenshot(name){await page.screenshot({path:`${dir}/${name}.png`});}
try{
 chapter('SmartSpend | Know your money. Spend smarter.\nA desktop walkthrough using sample data only.');
 const response=await page.goto('https://smartspend-save.vercel.app/',{waitUntil:'networkidle'});if(response?.status()!==200)throw Error('Live site did not return HTTP 200');
 await page.addStyleTag({content:'html{scroll-behavior:smooth} .recording-pointer{position:fixed;left:0;top:0;width:18px;height:18px;border:2px solid #214e3c;border-radius:50%;background:#d7e9b985;z-index:2147483647;pointer-events:none;transform:translate(-50%,-50%);box-shadow:0 0 0 4px #ffffff80}'});
 await page.evaluate(()=>{const dot=document.createElement('div');dot.className='recording-pointer';document.body.append(dot);document.addEventListener('mousemove',e=>{dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';});});
 await pause(2200);await click(page.getByRole('button',{name:'Explore demo workspace'}));await page.getByRole('heading',{name:'Your money, with a plan.'}).waitFor();
 const dismiss=page.getByRole('button',{name:'Dismiss installation suggestion'});if(await dismiss.isVisible())await click(dismiss);
 await pause(2000);
 chapter('One overview for income, spending, bills and available funds.\nAll figures in this recording are demo data.');
 await page.locator('.record-row').first().waitFor();await screenshot('01-overview');await pause(6500);await page.mouse.wheel(0,420);await pause(4500);await page.mouse.wheel(0,-520);await pause(1800);
 chapter('Add everyday expenses in a few steps.\nThe dashboard updates from the entries you record.');
 await click(page.getByRole('button',{name:'Add entry',exact:true}));const dialog=page.getByRole('dialog');await type(dialog.getByLabel('Title',{exact:true}),'Coffee with friends');await type(dialog.getByLabel('Amount (EGP)'),'38.50');await type(dialog.locator('input[name=category]'),'Food');await pause(2200);await click(dialog.getByRole('button',{name:'Save entry'}));await dialog.waitFor({state:'hidden'});await pause(2500);
 chapter('Search and review transactions without losing the big picture.');
 await click(nav('Transactions'));await pause(2500);await type(page.getByRole('textbox',{name:'Search transactions'}),'Coffee with friends');await page.getByText('Coffee with friends',{exact:true}).waitFor();await screenshot('02-transactions');await pause(3500);await page.getByRole('textbox',{name:'Search transactions'}).fill('');await pause(1800);
 chapter('Keep upcoming bills visible and record when they are paid.');
 await click(nav('Bills'));await pause(2500);const unpaid=page.getByRole('button',{name:'Mark paid',exact:true}).first();if(await unpaid.isVisible()){await click(unpaid);await pause(1700);}await screenshot('03-bills');await pause(3500);
 chapter('Give your savings a purpose.\nCreate goals alongside budgets, debts and recurring plans.');
 await click(nav('Plans'));await pause(2300);await click(page.locator('.plan-actions button').first());await type(dialog.getByLabel('Title',{exact:true}),'New laptop');await type(dialog.getByLabel('Amount (EGP)'),'18000');await type(dialog.locator('input[name=progress]'),'1200');await pause(2200);await click(dialog.getByRole('button',{name:'Save entry'}));await dialog.waitFor({state:'hidden'});await page.getByRole('heading',{name:'New laptop',exact:true}).scrollIntoViewIfNeeded();await screenshot('04-goals');await pause(3800);
 chapter('Offline-friendly tracking: changes stay on this device.\nDemo mode never synchronizes to a real account.');
 await context.setOffline(true);await click(nav('Transactions'));await page.waitForFunction(()=>!navigator.onLine);await pause(2500);await click(page.getByRole('button',{name:'Add entry',exact:true}));await type(dialog.getByLabel('Title',{exact:true}),'Offline grocery entry');await type(dialog.getByLabel('Amount (EGP)'),'125');await click(dialog.getByRole('button',{name:'Save entry'}));await dialog.waitFor({state:'hidden'});await page.getByText('Offline grocery entry',{exact:true}).waitFor();await screenshot('05-offline');await pause(3500);await context.setOffline(false);await pause(1200);
 chapter('Export backups and manage your preferences in Settings.');
 await click(nav('Settings'));await pause(2500);await page.getByRole('button',{name:'Export backup'}).scrollIntoViewIfNeeded();await pause(1000);const downloadEvent=page.waitForEvent('download');await click(page.getByRole('button',{name:'Export backup'}));const download=await downloadEvent;if(download.suggestedFilename()!=='smartspend-backup.json')console.log('Backup downloaded');await screenshot('06-settings');await pause(3500);await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await pause(1200);
 chapter('AI budget chat is available for signed-in accounts.\nDemo mode does not generate or simulate AI answers.');
 await click(nav('Assistant'));await page.getByRole('region',{name:'SmartSpend AI chat'}).waitFor();await pause(2000);await screenshot('07-assistant');await pause(4500);
 chapter('A responsive interface with Arabic support and a dark theme.');
 await click(page.getByRole('button',{name:'Switch language'}));await pause(3000);await click(page.getByRole('button',{name:'Toggle theme'}));await screenshot('08-arabic-dark');await pause(3000);await click(page.getByRole('button',{name:'Switch language'}));await click(page.getByRole('button',{name:'Toggle theme'}));
 chapter('SmartSpend | Know your money. Spend smarter.\nTry it: smartspend-save.vercel.app');
 await click(nav('Overview'));await pause(5000);await screenshot('09-final');
 if(errors.length)throw Error('Browser runtime errors: '+errors.join('; '));
 await fs.writeFile(`${dir}/capture.json`,JSON.stringify({url:'https://smartspend-save.vercel.app/',mode:'actual live-site demo',sampleDataOnly:true,aiRepliesSimulated:false,viewport:{width:1600,height:900},duration:(Date.now()-started)/1000,cues},null,2));
 const video=page.video();await context.close();const path=await video.path();await fs.rename(path,`${dir}/SmartSpend-desktop-demo.webm`);await browser.close();
 console.log('DEMO_CAPTURE_OK sample_data_only=true ai_answers_simulated=false');
}catch(error){await screenshot('failure').catch(()=>{});await context.close();await browser.close();throw error;}
