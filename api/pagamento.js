import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verifica se o Token está configurado na Vercel
  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Token do Mercado Pago não configurado nas Variáveis de Ambiente da Vercel.' });
  }

  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
  });

  try {
    // Ação 1: Criar o pagamento Pix
    if (req.method === 'POST') {
      const payment = new Payment(client);
      
      const body = {
        transaction_amount: 3.49,
        description: 'Liberacao de Recibo - Recibo Barato',
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@recibobarato.com.br',
          first_name: 'Cliente',
          last_name: 'Recibo',
          identification: {
            type: 'CPF',
            number: '19119119119'
          }
        }
      };

      const response = await payment.create({ body });

      return res.status(200).json({
        id: response.id,
        status: response.status,
        qr_code: response.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64
      });
    }

    // Ação 2: Verificar o status do pagamento
    if (req.method === 'GET') {
      const { action, id } = req.query;

      if (action === 'verificar' && id) {
        const payment = new Payment(client);
        const response = await payment.get({ id });

        return res.status(200).json({
          status: response.status
        });
      }
    }

    return res.status(400).json({ error: 'Ação inválida' });

  } catch (error) {
    console.error('Erro no Mercado Pago:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}