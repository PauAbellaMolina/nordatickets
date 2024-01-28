import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "supabase-js"
import {
  createRedsysAPI,
  SANDBOX_URLS,
  isResponseCodeOk
} from "redsys-easy";

const { processRestNotification } = createRedsysAPI({
  urls: SANDBOX_URLS,
  secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'
});

const supabase = createClient(
  Deno.env.get("SUPABASE_PUBLIC_API_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } }
);

console.log("Hello from notification function!");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { notificationBody } = await req.json();
    const params = processRestNotification(notificationBody); // Always validate a notification
    const orderId = params.Ds_Order;
    const merchantIdentifier = params.Ds_Merchant_Identifier;
    const cardNumber = params.Ds_Card_Number;
    const expiryDate = params.Ds_ExpiryDate;

    if (isResponseCodeOk(params.Ds_Response)) {
      supabase.from('redsys_orders').update({ order_status: 'PAYMENT_SUCCEDED' }).eq('order_id', orderId).select()
      .then(({ data: redsysOrders, error }) => {
        if (error || !redsysOrders.length || !merchantIdentifier || !cardNumber || !expiryDate) return;
        const redsysOrder = redsysOrders[0];
        supabase.from('users').select().eq('id', redsysOrder.user_id)
        .then(({ data: users, error }) => {
          if (error || !users.length) return;
          const user = users[0];
          if (!user.redsysToken || user.redsysToken !== merchantIdentifier) {
            supabase.from('users').update({ redsys_token: merchantIdentifier, card_number: cardNumber, expiry_date: expiryDate }).eq('id', redsysOrder.user_id);
          }
        });
      });
    } else {
      supabase.from('redsys_orders').update({ order_status: 'PAYMENT_FAILED' }).eq('order_id', orderId);
    }

    return new Response(JSON.stringify(""), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 204,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});