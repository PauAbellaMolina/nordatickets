import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from success function!");

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const responseHtml = `
      <h1>Pagament completat.</h1>
      <p>S'ha guardat aquest mètode de pagament al teu compte per futures compres.</p>
      <p style="margin-top: 1rem;">Ja pots tancar aquesta finestra.</p>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 5dvh 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          background-color: #fff;
        }
        p {
          margin: 1dvh 15dvw 0;
          text-align: center;
        }
      </style>
    `;

    return new Response(
      responseHtml,
      { headers: { "Content-Type": "text/html; charset=UTF-8" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
