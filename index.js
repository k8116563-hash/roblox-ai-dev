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

  const CONFIG = {
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_cGA6nyC2QtYk@ep-autumn-meadow-atzzef3o-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    NVIDIA_API_KEY:    process.env.NVIDIA_API_KEY    || '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',
    ROBLOX_API_KEY:    process.env.ROBLOX_API_KEY    || 'h87DjlpbJkajvPicZ7IGb5m+CMx2vF/OTg2j6rzAEJpK/1zIZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNkluTnBaeTB5TURJeExUQTNMVEV6VrRFTjBOVEU0T1RZNVdpSXNJblI1Y0NJNklrcFhWQ0o5Lm...',
    APP_SECRET:        process.env.APP_SECRET        || '33805136135d8236f846b7c9a05575bcae33dea6adabaaa85686115bc9636de6',
  };

  // ── Database ──────────────────────────────────────────────────────────────────
  const pool = new Pool({ connectionString: CONFIG.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  async function initDB() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_code (id INTEGER PRIMARY KEY, code TEXT NOT NULL DEFAULT '');
      INSERT INTO game_code (id, code) VALUES (1, '') ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Database ready.');
  }

  // ── NVIDIA AI ─────────────────────────────────────────────────────────────────
  const ai = new OpenAI({ apiKey: CONFIG.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });
  const MODEL = 'meta/llama-3.1-70b-instruct';

  // ── Roblox publish helper ─────────────────────────────────────────────────────
  // FIX: Workspace now includes a Baseplate + SpawnLocation so players never fall through
  function buildRbxlx(luauCode) {
    const safe = luauCode.replace(/\]\]>/g, ']]]]><![CDATA[>');
    return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
      <External>null</External>
      <External>nil</External>
      <Item class="DataModel" referent="RBX0000000">
          <Properties>
              <int name="CreatorId">0</int>
              <int name="CreatorType">0</int>
              <int name="GameType">0</int>
              <bool name="IsGenR15">true</bool>
              <string name="Name">Place</string>
          </Properties>
          <Item class="ServerScriptService" referent="RBX0000001">
              <Properties>
                  <string name="Name">ServerScriptService</string>
                  <bool name="LoadStringEnabled">false</bool>
              </Properties>
              <Item class="Script" referent="RBX0000002">
                  <Properties>
                      <string name="Name">AIScript</string>
                      <ProtectedString name="Source"><![CDATA[${safe}]]></ProtectedString>
                      <bool name="Disabled">false</bool>
                  </Properties>
              </Item>
          </Item>
          <Item class="Workspace" referent="RBX0000003">
              <Properties>
                  <bool name="FilteringEnabled">true</bool>
                  <string name="Name">Workspace</string>
                  <float name="Gravity">196.2</float>
              </Properties>
              <Item class="SpawnLocation" referent="RBX0000010">
                  <Properties>
                      <string name="Name">SpawnLocation</string>
                      <bool name="Anchored">true</bool>
                      <BrickColor name="BrickColor">194</BrickColor>
                      <CoordinateFrame name="CFrame">
                          <X>0</X><Y>0.5</Y><Z>0</Z>
                          <R00>1</R00><R01>0</R01><R02>0</R02>
                          <R10>0</R10><R11>1</R11><R12>0</R12>
                          <R20>0</R20><R21>0</R21><R22>1</R22>
                      </CoordinateFrame>
                      <Vector3 name="Size"><X>6</X><Y>1</Y><Z>6</Z></Vector3>
                      <bool name="AllowTeamChangeOnTouch">false</bool>
                      <bool name="Neutral">true</bool>
                      <token name="TopSurface">0</token>
                      <token name="BottomSurface">1</token>
                  </Properties>
              </Item>
              <Item class="Part" referent="RBX0000011">
                  <Properties>
                      <string name="Name">Baseplate</string>
                      <bool name="Anchored">true</bool>
                      <BrickColor name="BrickColor">194</BrickColor>
                      <CoordinateFrame name="CFrame">
                          <X>0</X><Y>-10</Y><Z>0</Z>
                          <R00>1</R00><R01>0</R01><R02>0</R02>
                          <R10>0</R10><R11>1</R11><R12>0</R12>
                          <R20>0</R20><R21>0</R21><R22>1</R22>
                      </CoordinateFrame>
                      <Vector3 name="Size"><X>512</X><Y>20</Y><Z>512</Z></Vector3>
                      <bool name="Locked">true</bool>
                      <token name="TopSurface">0</token>
                      <token name="BottomSurface">1</token>
                  </Properties>
              </Item>
          </Item>
          <Item class="Lighting" referent="RBX0000004">
              <Properties>
                  <string name="Name">Lighting</string>
                  <float name="Brightness">2</float>
                  <Color3 name="Ambient">4278190080</Color3>
                  <float name="FogEnd">100000</float>
                  <float name="FogStart">0</float>
                  <bool name="GlobalShadows">true</bool>
                  <Color3 name="OutdoorAmbient">4286611584</Color3>
                  <float name="ShadowSoftness">0.5</float>
                  <string name="TimeOfDay">14:00:00</string>
              </Properties>
          </Item>
          <Item class="ReplicatedStorage" referent="RBX0000005">
              <Properties>
                  <string name="Name">ReplicatedStorage</string>
              </Properties>
          </Item>
          <Item class="StarterPack" referent="RBX0000006">
              <Properties>
                  <string name="Name">StarterPack</string>
              </Properties>
          </Item>
          <Item class="StarterGui" referent="RBX0000007">
              <Properties>
                  <string name="Name">StarterGui</string>
                  <bool name="ResetPlayerGuiOnSpawn">true</bool>
              </Properties>
          </Item>
          <Item class="Teams" referent="RBX0000008">
              <Properties>
                  <string name="Name">Teams</string>
              </Properties>
          </Item>
          <Item class="SoundService" referent="RBX0000009">
              <Properties>
                  <string name="Name">SoundService</string>
                  <float name="DistanceFactor">3.33</float>
                  <float name="DopplerScale">1</float>
                  <bool name="RespectFilteringEnabled">true</bool>
                  <float name="RolloffScale">1</float>
              </Properties>
          </Item>
      </Item>
  </roblox>`;
  }

  async function publishToRoblox(luauCode) {
    const xml = buildRbxlx(luauCode);
    const buf = Buffer.from(xml, 'utf-8');
    const url = `https://apis.roblox.com/universes/v1/${UNIVERSE_ID}/places/${PLACE_ID}/versions?versionType=Published`;

    for (const ct of ['application/octet-stream', 'application/xml']) {
      const r = await axios.post(url, buf, {
        headers: { 'x-api-key': CONFIG.ROBLOX_API_KEY, 'Content-Type': ct },
        validateStatus: () => true,
      });
      console.log(`[Roblox] ${ct} → ${r.status}`, JSON.stringify(r.data));
      if (r.status >= 200 && r.status < 300) return { ok: true };
      if (r.status !== 415) return { ok: false, status: r.status, body: r.data };
    }
    return { ok: false, status: 415, body: 'Both content types rejected' };
  }

  // ── Middleware ────────────────────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  function requireAuth(req, res, next) {
    if (req.headers['x-app-token'] !== CONFIG.APP_SECRET) return res.status(401).json({ error: 'Unauthorized.' });
    next();
  }

  // ── Debug page ────────────────────────────────────────────────────────────────
  app.get('/debug', async (req, res) => {
    const results = {};

    try {
      const c = await ai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: 'Say "NVIDIA OK" and nothing else.' }],
        max_tokens: 20,
      });
      results.nvidia = { ok: true, reply: c.choices[0].message.content };
    } catch (e) { results.nvidia = { ok: false, error: e.message }; }

    try {
      const r = await axios.get(`https://apis.roblox.com/universes/v1/${UNIVERSE_ID}`, {
        headers: { 'x-api-key': CONFIG.ROBLOX_API_KEY },
        validateStatus: () => true,
      });
      results.robloxUniverse = { status: r.status, body: r.data };
    } catch (e) { results.robloxUniverse = { error: e.message }; }

    const pub = await publishToRoblox('print("debug — ground fix active")');
    results.robloxPublish = pub;

    try {
      const r = await pool.query('SELECT code FROM game_code WHERE id=1');
      results.db = { ok: true, codeLength: (r.rows[0]?.code || '').length };
    } catch (e) { results.db = { ok: false, error: e.message }; }

    res.send(`
      <html><head><style>
        body{background:#0e0f14;color:#e2e4f0;font-family:monospace;padding:20px}
        pre{background:#16181f;border:1px solid #2a2d3a;border-radius:8px;padding:16px;overflow-x:auto;white-space:pre-wrap;word-break:break-all}
        h2{color:#6c63ff}
      </style></head><body>
      <h2>🔍 Roblox AI Dev — Debug</h2>
      <pre>${JSON.stringify(results, null, 2)}</pre>
      </body></html>
    `);
  });

  // ── API routes ────────────────────────────────────────────────────────────────
  app.get('/api/token', (req, res) => res.json({ token: CONFIG.APP_SECRET }));

  app.get('/api/code', requireAuth, async (req, res) => {
    try {
      const r = await pool.query('SELECT code FROM game_code WHERE id=1');
      res.json({ code: r.rows[0]?.code ?? '' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Chat with AI
  app.post('/api/discuss', requireAuth, async (req, res) => {
    const { messages } = req.body;
    if (!messages || !messages.length) return res.status(400).json({ error: 'No messages.' });

    try {
      const completion = await ai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a friendly expert Roblox game developer and creative director. ' +
              'Chat with the user about their game idea. Ask clarifying questions if the idea is vague. ' +
              'Suggest cool improvements or ideas when you have them. ' +
              'Keep replies short, friendly, and conversational. No code yet — just discuss.',
          },
          ...messages,
        ],
        max_tokens: 400,
        temperature: 0.75,
      });
      res.json({ reply: completion.choices[0].message.content.trim() });
    } catch (e) {
      console.error('[discuss]', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Generate Luau + publish to Roblox
  app.post('/api/generate', requireAuth, async (req, res) => {
    const { prompt, messages } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt is required.' });

    try {
      const dbRes = await pool.query('SELECT code FROM game_code WHERE id=1');
      const existing = dbRes.rows[0]?.code ?? '';

      const completion = await ai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert Roblox Luau developer. The user will give you a prompt and existing code. ' +
              'Modify or add to the code to fulfill the prompt. ' +
              'IMPORTANT: The place already has a Baseplate and SpawnLocation in the Workspace from the template — ' +
              'do NOT try to create a ground or baseplate via script; it is already there. ' +
              'Return ONLY raw, valid Luau code. No markdown, no backticks, no explanations.',
          },
          ...(messages || []),
          {
            role: 'user',
            content: `Existing code:\n${existing || '(empty)'}\n\nPrompt: ${prompt.trim()}`,
          },
        ],
        max_tokens: 8192,
        temperature: 0.2,
      });

      const newCode = completion.choices[0].message.content.trim();

      await pool.query('UPDATE game_code SET code=$1 WHERE id=1', [newCode]);

      const pub = await publishToRoblox(newCode);
      if (!pub.ok) {
        return res.status(502).json({
          error: `Roblox publish failed (${pub.status}): ${JSON.stringify(pub.body)}`,
          code: newCode,
        });
      }

      res.json({ success: true, code: newCode });
    } catch (e) {
      console.error('[generate]', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── AI Check: verify the game works properly and auto-fix issues ──────────────
  app.post('/api/ai-check', requireAuth, async (req, res) => {
    try {
      const dbRes = await pool.query('SELECT code FROM game_code WHERE id=1');
      const existing = dbRes.rows[0]?.code ?? '';

      const completion = await ai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert Roblox Luau developer and QA engineer. ' +
              'The user has a game that publishes a single Script into ServerScriptService. ' +
              'The Workspace already has a Baseplate (512x20x512 Part at Y=-10) and a SpawnLocation at Y=0.5 — ' +
              'these are in the place template and do NOT need to be created by the script. ' +
              'Review the given Luau code for bugs, errors, or missing basic functionality. ' +
              'Fix any issues you find. If the code is empty, generate a simple starter game ' +
              'with a welcome message and basic player-join handling. ' +
              'Return ONLY raw, valid Luau code. No markdown, no backticks, no explanations.',
          },
          {
            role: 'user',
            content: `Review and fix this Luau code. Return the corrected version:\n${existing || '(empty — generate a starter script)'}`,
          },
        ],
        max_tokens: 8192,
        temperature: 0.1,
      });

      const fixedCode = completion.choices[0].message.content.trim();
      await pool.query('UPDATE game_code SET code=$1 WHERE id=1', [fixedCode]);

      const pub = await publishToRoblox(fixedCode);
      if (!pub.ok) {
        return res.status(502).json({
          error: `Roblox publish failed (${pub.status}): ${JSON.stringify(pub.body)}`,
          code: fixedCode,
        });
      }

      res.json({ success: true, code: fixedCode, message: 'AI reviewed and fixed your game code.' });
    } catch (e) {
      console.error('[ai-check]', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── Boot ──────────────────────────────────────────────────────────────────────
  initDB()
    .then(() => app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`)))
    .catch(e => { console.error('DB init failed:', e.message); process.exit(1); });
  