export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt, messages } = await req.json();
    const query = prompt || (messages && messages[messages.length - 1]?.content);

    if (!query) {
      return new Response(JSON.stringify({ error: 'Пустой запрос' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================================
    // НОДА 1: GROQ (Llama 3.3 70B / Qwen)
    // ========================================================
    if (process.env.GROQ_API_KEY) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: query }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return new Response(JSON.stringify({ node: 'Groq (Llama 3.3 70B)', reply }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.warn('Groq fail, switching to Gemini...', e);
      }
    }

    // ========================================================
    // НОДА 2: GOOGLE GEMINI (Flash)
    // ========================================================
    if (process.env.GEMINI_API_KEY) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: query }] }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return new Response(JSON.stringify({ node: 'Gemini 2.0 Flash', reply }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.warn('Gemini fail, switching to Mistral...', e);
      }
    }

    // ========================================================
    // НОДА 3: MISTRAL (Open Mistral Nemo)
    // ========================================================
    if (process.env.MISTRAL_API_KEY) {
      try {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'open-mistral-nemo',
            messages: [{ role: 'user', content: query }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return new Response(JSON.stringify({ node: 'Mistral Nemo', reply }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.warn('Mistral fail, switching to OpenRouter...', e);
      }
    }

    // ========================================================
    // НОДА 4: OPENROUTER (Free Pool)
    // ========================================================
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openrouter/free',
            messages: [{ role: 'user', content: query }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return new Response(JSON.stringify({ node: 'OpenRouter Free', reply }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.warn('OpenRouter fail, switching to Cohere...', e);
      }
    }

    // ========================================================
    // НОДА 5: COHERE (Command R+)
    // ========================================================
    if (process.env.COHERE_API_KEY) {
      try {
        const res = await fetch('https://api.cohere.com/v2/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'command-r-plus-08-2024',
            messages: [{ role: 'user', content: { type: 'text', text: query } }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.message?.content?.[0]?.text;
          if (reply) {
            return new Response(JSON.stringify({ node: 'Cohere (Command R+)', reply }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.warn('Cohere fail, switching to Cloudflare Workers AI...', e);
      }
    }

    // ========================================================
    // НОДА 6: CLOUDFLARE WORKERS AI (Llama 3.1 8B)
    // ========================================================
    if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
      try {
        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
        const res = await fetch(cfUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: query,
            max_tokens: 512,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.result?.response;
          if (reply) {
            return new Response(JSON.stringify({ node: 'Cloudflare Workers AI', reply }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.warn('Cloudflare Workers AI fail', e);
      }
    }

    throw new Error('Все 6 нод роя временно недоступны или исчерпали лимиты.');
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
