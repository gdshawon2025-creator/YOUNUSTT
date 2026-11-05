import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  console.log('Launching browser for AI Agent verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });

    // Step 1: Login through password gate
    console.log('Entering password...');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 8000 });
    await passwordInput.fill('admin1234');
    await page.getByRole('button', { name: 'পাসওয়ার্ড দিয়ে লগইন করুন' }).click();

    // Step 2: Verify Dashboard with AI Banner & Action Button
    console.log('Waiting for Dashboard...');
    await page.waitForSelector('text=এআই খামার গাইড', { timeout: 10000 });
    await page.screenshot({ path: '/tmp/dashboard-with-ai.png' });
    console.log('Screenshot 1 saved: Dashboard with AI banner & button');

    // Step 3: Navigate to AI Advisor View
    console.log('Navigating to AI Advisor...');
    await page.getByRole('button', { name: 'এআই খামার গাইড' }).first().click();

    // Verify AI Advisor View components
    await page.waitForSelector('text=খামার পরামর্শক এআই এজেন্ট', { timeout: 10000 });
    await page.waitForSelector('text=আজকের খামার স্বয়ংক্রিয় অডিট ও মূল্যায়ন', { timeout: 10000 });
    await page.waitForSelector('text=আজকের শীর্ষ অগ্রাধিকার পদক্ষেপ', { timeout: 10000 });
    await page.screenshot({ path: '/tmp/ai-advisor-view.png' });
    console.log('Screenshot 2 saved: AI Advisor View with Proactive Audit');

    // Step 4: Interact with Checklist
    console.log('Testing checklist interaction...');
    const firstChecklistBtn = page.locator('button:has(svg)').filter({ hasText: /জরুরি|পশুর|খাদ্য|বকেয়া|অসুস্থ/i }).first();
    if (await firstChecklistBtn.isVisible()) {
      await firstChecklistBtn.click();
      console.log('Checked off priority recommendation.');
    }

    // Step 5: Test Chat Interaction
    console.log('Testing AI chat message...');
    const chatInput = page.locator('input[placeholder*="পশুর লক্ষণ, খাবারের ফর্মুলা"]');
    await chatInput.waitFor({ state: 'visible' });
    await chatInput.fill('দুধের উৎপাদন বাড়াতে কী খাবার দেব?');
    await page.getByRole('button', { name: 'পাঠান' }).click();

    // Wait for agent reply
    console.log('Waiting for agent reply...');
    await page.waitForSelector('.whitespace-pre-wrap:has-text("খাদ্য")', { timeout: 12000 });
    await page.screenshot({ path: '/tmp/ai-chat-response.png' });
    console.log('Screenshot 3 saved: AI Chat response received');

    // Step 6: Navigate back to Animals and test Floating AI Assistant
    console.log('Navigating to Animals tab...');
    await page.getByRole('button', { name: 'পশুর তালিকা' }).click();
    await page.waitForSelector('text=পশু নথিভুক্তকরণ', { timeout: 8000 });

    console.log('Testing Floating AI Assistant widget...');
    const floatingBtn = page.locator('button[aria-label="এআই খামার গাইড খুলুন"]');
    await floatingBtn.waitFor({ state: 'visible' });
    await floatingBtn.click();

    await page.waitForSelector('text=সবুজ এআই গাইড', { timeout: 6000 });
    await page.screenshot({ path: '/tmp/floating-ai-drawer.png' });
    console.log('Screenshot 4 saved: Floating AI assistant open over Animals tab');

    console.log('ALL AI AGENT VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Verification failed:', err);
    await page.screenshot({ path: '/tmp/verification-failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
