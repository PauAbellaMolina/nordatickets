import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "supabase-js"
import {
  createRedsysAPI,
  TRANSACTION_TYPES,
  randomTransactionId,
  SANDBOX_URLS,
  CURRENCIES
} from "redsys-easy";

const { createRedirectForm } = createRedsysAPI({
  urls: SANDBOX_URLS,
  secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'
});
const merchantInfo = {
  DS_MERCHANT_MERCHANTCODE: '999008881',
  DS_MERCHANT_TERMINAL: '1'
};

const supabase = createClient(
  Deno.env.get("SUPABASE_PUBLIC_API_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } }
);

console.log("Hello from get-form-info function!");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, userId, userRedsysToken, eventId } = await req.json();
    const currency = 'EUR';
    const orderId = randomTransactionId();

    supabase.from('redsys_orders').insert({
      order_id: orderId,
      user_id: userId,
      event_id: eventId,
      amount: amount,
      currency: currency,
      order_status: 'PENDING_PAYMENT'
    });

    const currencyInfo = CURRENCIES[currency];
    const redsysAmount = amount.toFixed(0); // Convert 49.99€ -> 4999
    const redsysCurrency = currencyInfo.num; // Convert EUR -> 978
  
    const form = createRedirectForm({
      ...merchantInfo,
      DS_MERCHANT_MERCHANTCODE: '999008881',
      DS_MERCHANT_TERMINAL: '1',
      DS_MERCHANT_TRANSACTIONTYPE: TRANSACTION_TYPES.AUTHORIZATION, // '0'
      DS_MERCHANT_ORDER: orderId,
      // amount in smallest currency unit(cents)
      DS_MERCHANT_AMOUNT: redsysAmount,
      DS_MERCHANT_CURRENCY: redsysCurrency,
      DS_MERCHANT_MERCHANTNAME: 'ElTeuTikt',
      DS_MERCHANT_MERCHANTURL: `https://notification-estcwhnvtq-ew.a.run.app`, //TODO PAU replace url to supabase url when deployed
      DS_MERCHANT_IDENTIFIER: userRedsysToken ?? 'REQUIRED',
      DS_MERCHANT_URLOK: `https://success-estcwhnvtq-ew.a.run.app`, //TODO PAU replace url to supabase url when deployed
      DS_MERCHANT_URLKO: `https://error-estcwhnvtq-ew.a.run.app` //TODO PAU replace url to supabase url when deployed
    });

    const output = {
      formUrl: form.url,
      Ds_SignatureVersion: form.body.Ds_SignatureVersion,
      Ds_MerchantParameters: form.body.Ds_MerchantParameters,
      Ds_Signature: form.body.Ds_Signature,
      orderId: orderId
    };

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-form-info' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
