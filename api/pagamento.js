export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Token do Mercado Pago não configurado no servidor.' });
  }

  // Se for GET (verificação de status)
  if (req.method === 'GET' && req.query.action === 'verificar') {
    const paymentId = req.query.id;
    try {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
      });
      const paymentData = await mpResponse.json();
      return res.status(200).json({ status: paymentData.status });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao verificar pagamento' });
    }
  }

  // Se for POST (criar pagamento Pix)
  try {
    const body = {
      transaction_amount: 3.49,
      description: "Emissão de Recibo Profissional",
      payment_method_id: "pix",
      payer: {
        email: "cliente@geradorderecibos.com",
        first_name: "Cliente",
        last_name: "Web"
      }
    };

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "X-Idempotency-Key": Math.random().toString(36).substring(2)
      },
      body: JSON.stringify(body)
    });

    const data = await mpResponse.json();

    if (data.point_of_interaction) {
      const qrCodeBase64 = data.point_of_interaction.transaction_data.qr_code_base64;
      const qrCodeText = data.point_of_interaction.transaction_data.qr_code;
      
      return res.status(200).json({
        id: data.id,
        qr_code_base64: qrCodeBase64,
        qr_code: qrCodeText
      });
    } else {
      return res.status(400).json({ error: "Erro ao gerar Pix no Mercado Pago", details: data });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}