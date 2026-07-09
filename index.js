require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const { Pool } = require('pg');
const OpenAI = require('openai');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const UNIVERSE_ID = '10201536579';
const PLACE_ID    = '109348910187641';

// ── Hard-coded fallbacks so Railway works even without .env being loaded ─────
const CONFIG = {
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_cGA6nyC2QtYk@ep-autumn-meadow-atzzef3o-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  NVIDIA_API_KEY:    process.env.NVIDIA_API_KEY    || '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',
  ROBLOX_API_KEY:    process.env.ROBLOX_API_KEY    || 'h87DjlpbJkajvPicZ7IGb5m+CMx2vF/OTg2j6rzAEJpK/1zIZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNkluTnBaeTB5TURJeExUQTNMVEV6VkRFNE9qVXhPalE1V2lJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaGRXUWlPaUpTYjJKc2IzaEpiblJsY201aGJDSXNJbWx6Y3lJNklrTnNiM1ZrUVhWMGFHVnVkR2xqWVhScGIyNVRaWEoyYVdObElpd2lZbUZ6WlVGd2FVdGxlU0k2SW1nNE4wUnFiSEJpU210aGFuWlFhV05hTjBsSFlqVnRLME5OZURKMlJpOVBWR2N5YWpaeWVrRkZTbkJMTHpGNlNTSXNJbTkzYm1WeVNXUWlPaUl4TURrNE5UZzRPRGc0TXlJc0ltVjRjQ0k2TVRjNE16VTFPVGszT0N3aWFXRjBJam94Tnpnek5UVTJNemM0TENKdVltWWlPakUzT0RNMU5UWXpOemg5LlVERU9KNHEtYUd3VTllWVd2b25Dd3FqWmZkcmJENUdyeUF3ZG1PRWVzYWhxR05PbVU3ZGpXaUt4VTlUQ3RTQnNRcGNrOVZla2RvMzJCcUpuNHNETHIyckp3Qnp0YUV1bWJ5WDU0MzJVM3ZPNm5qSnotME92azlOXzVIellHQjZ4NDJrWDJ3SHpMRXVONU5pX2J4OHFJeG1jYlYwajhyM2hTX3lteFk0YmZMbWEwYUI4R0U3RldGMDdER3R0bnZnd0Q1bWxjWlY5SEg1enRLOGpBVzBFUV9Sa20zb0VkN0ZRS1RFSE5IUlhiVjZzd3hvMDJvZzhHWWc2dEtua2FsaFhEdWhJR1d0WGNQTjkwcjdROHFST2g5Z0VSVHBCbXRfeGw0Mkh4aE9uMFllbVdMd0RoaFNXZzhuNDJqa1NaUHZ5Ny1uQVA0M0JqSnM3cS13U2FaQ1owZw==',
  APP_SECRET:        process.env.APP_SECRET        || '33805136135d8236f846b7c9a05575bcae33dea6adabaaa85686115bc9636de6',
};

// ── Database ─────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: CONFIG.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_code (
      id   INTEGER PRIMARY KEY,
      code TEXT    NOT NULL DEFAULT ''
    );
    INSERT INTO game_code (id, code) VALUES (1, '') ON CONFLICT (id) DO NOTHING;
  `);
  console.log('Database ready.');
}

// ── NVIDIA AI ─────────────────────────────────────────────────────────────────
const ai = new OpenAI({
  apiKey: CONFIG.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const CODE_SYSTEM_PROMPT =
  'You are an expert Roblox Luau developer. The user will give you a prompt and existing code. ' +
  'Modify or add to the code to fulfill the prompt. ' +
  'Return ONLY raw, valid Luau code. Do not include markdown formatting, backticks, or explanations.';

const DISCUSS_SYSTEM_PROMPT =
  'You are an expert Roblox game developer and creative director. ' +
  'The user wants to build something in Roblox. Before any code is written, your job is to: ' +
  '1) Briefly confirm you understand their idea. ' +
  '2) Ask any important clarifying questions if the prompt is vague (max 2-3 short questions). ' +
  '3) If you have a genuinely better or cooler idea that improves on their prompt, suggest it briefly. ' +
  '4) If the prompt is clear and good, just say so and confirm you\'re ready. ' +
  'Be concise, friendly, and conversational. No code yet — just discuss.';

// ── Roblox .rbxlx builder ─────────────────────────────────────────────────────
function buildRbxlx(luauCode) {
  const safeCode = luauCode.replace(/\]\]>/g, ']]]]><![CDATA[>');
  return `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd"
        version="4">
  <External>null</External>
  <External>nil</External>
  <Item class="DataModel" referent="RBX0000000">
    <Properties><string name="Name">Place</string></Properties>
    <Item class="Workspace" referent="RBX0000001">
      <Properties>
        <bool name="FilteringEnabled">true</bool>
        <string name="Name">Workspace</string>
      </Properties>
    </Item>
    <Item class="ServerScriptService" referent="RBX0000002">
      <Properties><string name="Name">ServerScriptService</string></Properties>
      <Item class="Script" referent="RBX0000003">
        <Properties>
          <string name="Name">AIGeneratedScript</string>
          <ProtectedString name="Source"><![CDATA[${safeCode}]]></ProtectedString>
          <bool name="Disabled">false</bool>
        </Properties>
      </Item>
    </Item>
    <Item class="Lighting" referent="RBX0000004">
      <Properties><string name="Name">Lighting</string></Properties>
    </Item>
    <Item class="ReplicatedStorage" referent="RBX0000005">
      <Properties><string name="Name">ReplicatedStorage</string></Properties>
    </Item>
  </Item>
</roblox>`;
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  const token = req.headers['x-app-token'];
  if (!token || token !== CONFIG.APP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/token', (req, res) => {
  res.json({ token: CONFIG.APP_SECRET });
});

app.get('/api/code', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT code FROM game_code WHERE id = 1');
    res.json({ code: result.rows[0]?.code ?? '' });
  } catch (err) {
    console.error('GET /api/code:', err.message);
    res.status(500).json({ error: 'Failed to fetch code.' });
  }
});

// Discuss endpoint — AI chats before generating
app.post('/api/discuss', requireAuth, async (req, res) => {
  const { prompt, history } = req.body;
  if (!prompt && (!history || history.length === 0)) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const messages = [{ role: 'system', content: DISCUSS_SYSTEM_PROMPT }];

    // Include conversation history if provided
    if (history && history.length > 0) {
      messages.push(...history);
    } else {
      messages.push({ role: 'user', content: prompt.trim() });
    }

    const completion = await ai.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
      messages,
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content.trim();
    res.json({ reply });
  } catch (err) {
    console.error('POST /api/discuss:', err?.response?.data ?? err.message);
    res.status(500).json({ error: 'AI discussion failed. Check server logs.' });
  }
});

// Generate + publish
app.post('/api/generate', requireAuth, async (req, res) => {
  const { prompt, history } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    // 1. Fetch existing code
    const dbResult = await pool.query('SELECT code FROM game_code WHERE id = 1');
    const existingCode = dbResult.rows[0]?.code ?? '';

    // 2. Build messages — include discussion history if provided so AI has full context
    const messages = [{ role: 'system', content: CODE_SYSTEM_PROMPT }];
    if (history && history.length > 0) {
      // Summarise the discussion as context, then give the final instruction
      const discussion = history.map(m => `${m.role}: ${m.content}`).join('\n');
      messages.push({
        role: 'user',
        content: `Discussion context:\n${discussion}\n\nExisting Luau code:\n${existingCode || '(empty)'}\n\nFinal prompt: ${prompt.trim()}`,
      });
    } else {
      messages.push({
        role: 'user',
        content: `Existing Luau code:\n${existingCode || '(empty)'}\n\nPrompt: ${prompt.trim()}`,
      });
    }

    // 3. Generate
    const completion = await ai.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
      messages,
      max_tokens: 8192,
      temperature: 0.2,
    });

    const newCode = completion.choices[0].message.content.trim();

    // 4. Save
    await pool.query('UPDATE game_code SET code = $1 WHERE id = 1', [newCode]);

    // 5. Publish to Roblox
    const rbxlx = buildRbxlx(newCode);
    const robloxUrl = `https://apis.roblox.com/universes/v1/${UNIVERSE_ID}/places/${PLACE_ID}/versions?versionType=Published`;
    console.log('Publishing to Roblox URL:', robloxUrl);

    try {
      const robloxRes = await axios.post(
        robloxUrl,
        Buffer.from(rbxlx, 'utf-8'),
        {
          headers: {
            'x-api-key': CONFIG.ROBLOX_API_KEY,
            'Content-Type': 'application/octet-stream',
          },
          validateStatus: () => true,
        }
      );
      console.log(`Roblox status: ${robloxRes.status}`);
      console.log('Roblox headers:', JSON.stringify(robloxRes.headers));
      console.log('Roblox body:', JSON.stringify(robloxRes.data));

      if (robloxRes.status < 200 || robloxRes.status >= 300) {
        return res.status(502).json({
          error: `Roblox returned ${robloxRes.status}: ${JSON.stringify(robloxRes.data)}`,
          code: newCode,
        });
      }
    } catch (robloxErr) {
      console.error('Roblox publish error:', robloxErr.message);
      return res.status(502).json({
        error: `Roblox publish failed: ${robloxErr.message}`,
        code: newCode,
      });
    }

    res.json({ success: true, code: newCode });
  } catch (err) {
    console.error('POST /api/generate:', err?.response?.data ?? err.message);
    res.status(500).json({ error: 'Generation failed. Check server logs.' });
  }
});

// ── Roblox debug endpoint (hit /api/debug-roblox in your browser to diagnose) ─
app.get('/api/debug-roblox', requireAuth, async (req, res) => {
  const results = {};

  // 1. Check universe exists
  try {
    const r = await axios.get(
      `https://apis.roblox.com/universes/v1/${UNIVERSE_ID}`,
      { headers: { 'x-api-key': CONFIG.ROBLOX_API_KEY }, validateStatus: () => true }
    );
    results.universe = { status: r.status, body: r.data };
  } catch (e) { results.universe = { error: e.message }; }

  // 2. Try publishing with application/xml
  try {
    const testXml = buildRbxlx('print("debug test")');
    const r = await axios.post(
      `https://apis.roblox.com/universes/v1/${UNIVERSE_ID}/places/${PLACE_ID}/versions?versionType=Published`,
      Buffer.from(testXml, 'utf-8'),
      {
        headers: { 'x-api-key': CONFIG.ROBLOX_API_KEY, 'Content-Type': 'application/xml' },
        validateStatus: () => true,
      }
    );
    results.publishXml = { status: r.status, headers: r.headers, body: r.data };
  } catch (e) { results.publishXml = { error: e.message }; }

  // 3. Try publishing with application/octet-stream
  try {
    const testXml = buildRbxlx('print("debug test")');
    const r = await axios.post(
      `https://apis.roblox.com/universes/v1/${UNIVERSE_ID}/places/${PLACE_ID}/versions?versionType=Published`,
      Buffer.from(testXml, 'utf-8'),
      {
        headers: { 'x-api-key': CONFIG.ROBLOX_API_KEY, 'Content-Type': 'application/octet-stream' },
        validateStatus: () => true,
      }
    );
    results.publishOctet = { status: r.status, headers: r.headers, body: r.data };
  } catch (e) { results.publishOctet = { error: e.message }; }

  console.log('Debug results:', JSON.stringify(results, null, 2));
  res.json(results);
});

// ── Boot ──────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀  Listening on port ${PORT}`));
}).catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
