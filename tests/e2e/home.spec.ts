import {test,expect} from '@playwright/test';
test('首页四步流程：本地预览，无伪造识别或模型',async({page})=>{
 const apiCalls:string[]=[];page.on('request',r=>{if(r.url().includes('/api/') && r.method()!=='GET')apiCalls.push(r.url());});
 await page.goto('/');await expect(page.getByRole('heading',{name:'放入一张文物照片'})).toBeVisible();await expect(page.locator('.steps li')).toHaveCount(4);await expect(page.locator('canvas')).toHaveCount(0);await expect(page.locator('#identify')).toBeDisabled();await expect(page.locator('#generate-model')).toBeDisabled();
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=400;c.height=500;const x=c.getContext('2d')!;x.fillStyle='#d4c2a0';x.fillRect(0,0,400,500);x.fillStyle='#436552';x.fillRect(100,100,200,270);return c.toDataURL().split(',')[1];});
 await page.locator('#image-input').setInputFiles({name:'测试器物.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(page.locator('#photo-preview')).toBeVisible();await expect(page.locator('#identify-note')).toContainText('照片已就绪');await expect(page.locator('#step-identify')).toHaveAttribute('aria-current','step');await expect(page.locator('#identify')).toBeDisabled();await page.screenshot({path:'test-results/home-desktop.png',fullPage:true});
 await page.locator('#remove-photo').click();await expect(page.locator('#photo-preview')).toBeHidden();await expect(page.locator('#step-upload')).toHaveAttribute('aria-current','step');expect(apiCalls).toEqual([]);
});
test('手机首页无横向溢出，拒绝损坏图片',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#image-input').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('broken')});await expect(page.getByRole('alert')).toContainText('无法读取');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/home-mobile.png',fullPage:true});
});
