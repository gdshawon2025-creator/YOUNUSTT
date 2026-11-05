import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '2mb' }));

// Initialise Google Gemini API SDK if key is configured
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Intelligent domain-heuristic fallback when Gemini API key is unset or network is throttled
 */
function buildFallbackGuidance(data: any) {
  const animals = Array.isArray(data?.animals) ? data.animals : [];
  const feedStocks = Array.isArray(data?.feedStocks) ? data.feedStocks : [];
  const sales = Array.isArray(data?.sales) ? data.sales : [];
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];

  const sickOrCare = animals.filter(
    (a: any) => a.healthCondition === 'চিকিৎসাধীন' || a.healthCondition === 'পর্যবেক্ষণে'
  );
  const pregnant = animals.filter((a: any) => a.healthCondition === 'গর্ভবতী');
  const lowStockFeeds = feedStocks.filter(
    (f: any) => Number(f.currentStock || 0) <= Number(f.minStockAlert || 0)
  );

  const totalDues = sales.reduce((acc: number, s: any) => acc + (Number(s.dueAmount) || 0), 0);
  const totalIncome = transactions
    .filter((t: any) => t.type === 'income')
    .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const totalExpense = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const netProfit = totalIncome - totalExpense;

  const topRecommendations: string[] = [];

  if (sickOrCare.length > 0) {
    topRecommendations.push(
      `জরুরি স্বাস্থ্য নজরদারি: ${sickOrCare.length} টি অসুস্থ/পর্যবেক্ষণের পশুকে আলাদা শেডে রেখে সুনির্দিষ্ট অ্যান্টিসেপটিক পরিচ্ছন্নতা ও চিকিৎসকের পরামর্শ মতো ওষুধ সেবন করান।`
    );
  } else {
    topRecommendations.push(
      `পশুর বায়োসিকিউরিটি: সব পশু সুস্থ রয়েছে। নিয়মিত জীবাণুনাশক স্প্রে করুন ও প্রতি ৩ মাস অন্তর কৃমিনাশক প্রদান বজায় রাখুন।`
    );
  }

  if (lowStockFeeds.length > 0) {
    topRecommendations.push(
      `খাদ্য সংকট রোধ: ${lowStockFeeds.map((f: any) => f.name).join(', ')} এর স্টক ন্যূনতম সতর্কসীমার নিচে। দ্রুত পাইকারি বাজার থেকে সংগ্রহ করে খাদ্য ঘাটতি এড়ান।`
    );
  } else {
    topRecommendations.push(
      `সুষম পুষ্টি বিধান: দানাদার খাদ্যের সাথে প্রয়োজনীয় খনিজ লবণ ও কাঁচা ঘাসের সঠিক অনুপাত (৬০:৪০) বজায় রেখে খাদ্য খরচ ২০% সাশ্রয় করুন।`
    );
  }

  if (totalDues > 0) {
    topRecommendations.push(
      `বকেয়া তাগাদা: বিক্রয় বাবদ মোট ৳${totalDues.toLocaleString('bn-BD')} বকেয়া রয়েছে। খামারের নিয়মিত পরিচালনা ব্যয় মেটাতে দ্রুত ক্রেতাদের সাথে যোগাযোগ করে কিস্তিতে অর্থ আদায় করুন।`
    );
  } else {
    topRecommendations.push(
      `আর্থিক সম্প্রসারণ: আপনার কোনো বকেয়া নেই এবং নগদ প্রবাহ সন্তোষজনক। অতিরিক্ত সঞ্চয় দিয়ে খামারে আধুনিক সাইলেজ সংরক্ষণাগার গড়ে তুলতে পারেন।`
    );
  }

  return {
    headline: `আজকের খামার সামগ্রিক অবস্থা: ${
      sickOrCare.length > 0 ? 'বিশেষ স্বাস্থ্য সতর্কতা ও নজরদারি আবশ্যক' : 'খামারের সার্বিক অবস্থা স্থিতিশীল ও উৎপাদনশীল'
    }`,
    healthAssessment: `মোট পশু ${animals.length} টি। সুস্থ ${
      animals.filter((a: any) => a.healthCondition === 'সুস্থ').length
    } টি, চিকিৎসাধীন/পর্যবেক্ষণে ${sickOrCare.length} টি এবং গর্ভবতী ${pregnant.length} টি। গর্ভবতী গাভীদের জন্য পর্যাপ্ত ক্যালসিয়াম ও ভিটামিন সমৃদ্ধ নরম খাবার নিশ্চিত করুন।`,
    feedAssessment: `মোট ${feedStocks.length} টি খাদ্য উপাদানের মধ্যে ${lowStockFeeds.length} টি আইটেম সতর্কসীমার নিচে। বর্ষা ও আর্দ্র আবহাওয়ায় দানাদার খাদ্য শুকনো স্থানে বায়ুরোধী পাত্রে সংরক্ষণ করুন।`,
    financeAssessment: `বর্তমান খামারের আয় ৳${totalIncome.toLocaleString('bn-BD')}, ব্যয় ৳${totalExpense.toLocaleString('bn-BD')}, নিট উদ্বৃত্ত ৳${netProfit.toLocaleString('bn-BD')} এবং বিক্রয় বকেয়া ৳${totalDues.toLocaleString('bn-BD')}। ব্যয়ের খাতগুলো পর্যালোচনা করে অপচয় কমান।`,
    topRecommendations,
  };
}

/**
 * Endpoint: Proactive farm guidance analysis
 */
app.post('/api/ai/proactive-guidance', async (req: Request, res: Response) => {
  try {
    const farmData = req.body || {};

    if (!ai) {
      const fallback = buildFallbackGuidance(farmData);
      res.json(fallback);
      return;
    }

    const prompt = `
আপনি 'সবুজ খামার এআই গাইড' — একজন অত্যন্ত অভিজ্ঞ, বাস্তবমুখী প্রাণিসম্পদ ও খামার অর্থনীতি বিশেষজ্ঞ।
নিচে খামারির বর্তমান লাইভ ডাটা দেওয়া হলো:
${JSON.stringify(farmData, null, 2)}

দয়া করে খামারির জন্য একটি সার্বক্ষণিক নির্দেশনামূলক অডিট ও পরামর্শ তৈরি করুন।
আউটপুটটি অবশ্যই সম্পূর্ণ বাংলায় এবং বৈধ JSON ফরম্যাটে হতে হবে:
{
  "headline": "সংক্ষিপ্ত শিরোনাম (১ বাক্য)",
  "healthAssessment": "পশু স্বাস্থ্য, টিকা, প্রজনন ও রোগ প্রতিরোধ বিষয়ক পরামর্শ (২-৩ বাক্য)",
  "feedAssessment": "খাদ্য মজুদ, সুষম পুষ্টি ও খাদ্য খরচ কমানোর বিশ্লেষণ (২-৩ বাক্য)",
  "financeAssessment": "আয়-ব্যয়, বিক্রয় বকেয়া আদায় ও লাভ বৃদ্ধির সুপারিশ (২-৩ বাক্য)",
  "topRecommendations": [
    "আজকের ১ম প্রধান করণীয় পদক্ষেপ",
    "আজকের ২য় প্রধান করণীয় পদক্ষেপ",
    "আজকের ৩য় প্রধান করণীয় পদক্ষেপ"
  ]
}
শুধুমাত্র JSON আউটপুট দিন, কোনো অতিরিক্ত কোডব্লক বা ব্যাখ্যা ছাড়া।
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch {
      // If parsing fails, fall back to rule-based rich advice
      res.json(buildFallbackGuidance(farmData));
    }
  } catch (err) {
    console.warn('Gemini proactive guidance error, falling back to local heuristic:', err);
    res.json(buildFallbackGuidance(req.body));
  }
});

/**
 * Endpoint: Interactive conversational chat with the farm AI Agent
 */
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, farmContext } = req.body || {};

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'বার্তা প্রদান করুন' });
      return;
    }

    if (!ai) {
      // Responsive domain knowledge fallback
      let reply = `আপনার প্রশ্নের জন্য ধন্যবাদ। `;
      const q = message.toLowerCase();

      if (q.includes('টিকা') || q.includes('ভ্যাকসিন') || q.includes('রোগ')) {
        reply += `গবাদিপশুর জন্য নিয়মিত ক্ষুরারোগ (FMD), বাদলা (Black Quarter), ও তড়কা (Anthrax) এর টিকা দেওয়া বাধ্যতামূলক। অসুস্থ বা গর্ভবতী শেষ পর্যায়ের পশুকে টিকা দেওয়া থেকে বিরত থাকুন এবং রেজিস্টার্ড পশু চিকিৎসকের তত্ত্বাবধানে কোল্ড চেইন রক্ষা করে ভ্যাকসিন প্রয়োগ করুন।`;
      } else if (q.includes('খাবার') || q.includes('খরচ') || q.includes('দানাদার')) {
        reply += `খাদ্য খরচ কমাতে উন্নত জাতের নেপিয়ার/পাকচং ঘাস চাষ করুন এবং নিজস্ব দানাদার মিশ্রণ তৈরি করুন (ভুট্টা ভাঙা ৪০%, গমের ভুষি ৩৫%, সরিষার খৈল ২০%, মিনারেল ১%)। কাঁচা ঘাস ও সাইলেজ খাওয়ালে দানাদার খাবারের ওপর নির্ভরতা ৩০% পর্যন্ত হ্রাস পায়।`;
      } else if (q.includes('বকেয়া') || q.includes('টাকা') || q.includes('লাভ') || q.includes('বিক্রি')) {
        reply += `খামারের লাভ বজায় রাখতে দুধ ও মাংসের বিক্রয় মূল্য স্থানীয় বাজার অনুযায়ী সমন্বয় করুন এবং বিক্রির সময় অন্তত ৫০-৭০% অগ্রিম বা নগদ গ্রহণ নিশ্চিত করুন। বকেয়া ক্রেতাদের সাথে সাপ্তাহিক তাগাদার শিডিউল তৈরি করুন।`;
      } else {
        reply += `সবুজ খামার এআই এজেন্ট আপনার সাথে রয়েছে। খামারের সকল পশুর সুস্থতা বজায় রাখতে নিয়মিত শেড জীবাণুমুক্ত রাখা, পর্যাপ্ত বিশুদ্ধ পানি ও পুষ্টিকর খাবার সরবরাহ করা অত্যন্ত জরুরি। নির্দিষ্ট কোনো পশুর সমস্যা হলে তার লক্ষণ বিস্তারিত লিখুন।`;
      }

      res.json({
        reply,
        suggestedActions: [
          'আজকের শীর্ষ করণীয় কী?',
          'দুধের উৎপাদন বৃদ্ধির ফর্মুলা',
          'খামারের খাদ্য খরচ কমানোর উপায়',
        ],
      });
      return;
    }

    const systemInstruction = `
আপনি 'সবুজ খামার এআই এজেন্ট' (Shobuj Farm AI Consultant) — একজন স্নেহশীল, বাস্তবমুখী ও অভিজ্ঞ প্রাণীসম্পদ বিশেষজ্ঞ ও খামার ব্যবস্থাপনা প্রশিক্ষক।
আপনার মূল লক্ষ্য খামারিকে সবসময় নিজের মতো করে সার্বক্ষণিক সঠিক গাইড করা।
খামারির বর্তমান পরিস্থিতি:
${JSON.stringify(farmContext || {}, null, 2)}

নির্দেশনাবলী:
১. সহজ, স্পষ্ট ও সম্মানজনক খাঁটি বাংলা ভাষায় উত্তর দিন।
২. উত্তর বাস্তবসম্মত এবং বাংলাদেশের আবহাওয়া ও খামার ব্যবস্থার সাথে সংগতিপূর্ণ হতে হবে।
৩. অপ্রয়োজনীয় তাত্ত্বিক কথা না বলে সরাসরি করণীয় পদক্ষেপ উল্লেখ করুন।
৪. উত্তর শেষে দরকারি হলে ১-২টি সম্পর্কিত প্রাসঙ্গিক পরামর্শ দিন।
`;

    const chatHistory = Array.isArray(history)
      ? history.slice(-6).map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: String(h.text || '') }],
        }))
      : [];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        ...chatHistory,
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ],
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'আপনার তথ্য বিশ্লেষণ করা হয়েছে। খামারের সার্বিক ব্যবস্থাপনা উন্নত রাখতে নিয়মিত তদারকি চালিয়ে যান।';

    res.json({
      reply,
      suggestedActions: [
        'আজকের স্বাস্থ্য ও খাদ্য সতর্কতা',
        'দুধ ও মাংসের উৎপাদন বাড়ানোর উপায়',
        'বকেয়া টাকা আদায়ের কৌশল',
      ],
    });
  } catch (err) {
    console.warn('Gemini chat error, returning fallback advice:', err);
    res.json({
      reply: 'বর্তমানে ক্লাউড এআই সার্ভারের সাথে সংযোগে সাময়িক বিলম্ব হচ্ছে। তবে আপনার খামারের ডাটাবেজ তথ্য নিরাপদ আছে। পশুর নিয়মিত খাবার, বিশুদ্ধ পানি ও পরিচ্ছন্নতা নিশ্চিত রাখুন।',
      suggestedActions: ['আজকের করণীয় তালিকা', 'খাদ্য তালিকা চেক'],
    });
  }
});

// Setup Vite middleware for local development, or serve built assets in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Farm Server] Running on http://localhost:${PORT} (${isProduction ? 'Production' : 'Development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
