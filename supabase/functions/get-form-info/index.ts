import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'supabase-js';
import {
  createRedsysAPI,
  TRANSACTION_TYPES,
  randomTransactionId,
  SANDBOX_URLS,
  CURRENCIES
} from "redsys-easy";

console.log("Hello from get-form-info function!");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { createRedirectForm } = createRedsysAPI({
      urls: SANDBOX_URLS,
      secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'
    });
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { amount, userId, userRedsysToken, eventId } = await req.json();
    const currency = 'EUR';
    const orderId = randomTransactionId();
    // const merchantInfo = {
    //   DS_MERCHANT_MERCHANTCODE: '999008881',
    //   DS_MERCHANT_TERMINAL: '1'
    // };

    const redsysOrderToInsert = {
      order_id: orderId,
      user_id: userId,
      event_id: +eventId,
      amount: +amount,
      currency: currency,
      order_status: 'PENDING_PAYMENT'
    };

    //for testing
    // console.log("redsysOrderToInsert", redsysOrderToInsert);

    supabase.from('redsys_orders').insert(redsysOrderToInsert).then(({ status, statusText }) => {
      if (status) console.log("insert status", status, statusText);
    });
    
    //for testing
    // supabase.from('redsys_orders').select().eq('order_id', '222').then(({ data, error }) => {
    //   if (data) console.log("read", data);
    //   if (error) console.log("read err", error);
    // });

    const currencyInfo = CURRENCIES[currency];
    const redsysAmount = amount.toFixed(0);
    const redsysCurrency = currencyInfo.num; // Convert EUR -> 978
  
    try { //all this try catch is for deving
      const form = createRedirectForm({ //TODO PAU when this is executed it throws the error "Cannot read properties of undefined (reading 'from')"
        DS_MERCHANT_MERCHANTCODE: '999008881',
        DS_MERCHANT_TERMINAL: '1',
        DS_MERCHANT_TRANSACTIONTYPE: TRANSACTION_TYPES.AUTHORIZATION, // '0'
        DS_MERCHANT_ORDER: orderId,
        // amount in smallest currency unit(cents)
        DS_MERCHANT_AMOUNT: redsysAmount,
        DS_MERCHANT_CURRENCY: redsysCurrency,
        DS_MERCHANT_MERCHANTNAME: 'ElTeuTikt',
        DS_MERCHANT_MERCHANTURL: `https://waniuunkeiqwqatzunof.supabase.co/functions/v1/notification`,
        DS_MERCHANT_IDENTIFIER: 'REQUIRED',
        DS_MERCHANT_URLOK: `https://waniuunkeiqwqatzunof.supabase.co/functions/v1/success`,
        DS_MERCHANT_URLKO: `https://waniuunkeiqwqatzunof.supabase.co/functions/v1/error`
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
      console.log("createRedirectForm error", error);
      return new Response(JSON.stringify("heh"), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
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
