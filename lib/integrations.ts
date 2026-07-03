export type IntegrationKey = 'openai' | 'stripe' | 'printify';

export type IntegrationStatus = 'live' | 'configured' | 'missing';

export type IntegrationConfig = {
  key: IntegrationKey;
  name: string;
  tagline: string;
  status: IntegrationStatus;
  accent: string;
  env: { key: string; present: boolean; secret?: boolean }[];
  capabilities: string[];
  nextSteps: string[];
};

function present(key: string) {
  return Boolean(process.env[key]?.trim());
}

export function getIntegrations(): IntegrationConfig[] {
  const openAiReady = present('OPENAI_API_KEY');
  const stripeSecret = present('STRIPE_SECRET_KEY');
  const stripeWebhook = present('STRIPE_WEBHOOK_SECRET');
  const stripePrice = present('STRIPE_PRICE_ID');
  const printifyToken = present('PRINTIFY_API_TOKEN');
  const printifyShop = present('PRINTIFY_SHOP_ID');

  return [
    {
      key: 'openai',
      name: 'OpenAI',
      tagline: 'AI design assistant, prompt refinement, quality review, style suggestions.',
      status: openAiReady ? 'configured' : 'missing',
      accent: '#00E5C8',
      env: [{ key: 'OPENAI_API_KEY', present: openAiReady, secret: true }],
      capabilities: [
        'Generate design ideas from a short prompt',
        'Suggest colors, placement, typography, and print fixes',
        'Review uploaded artwork before order submission',
      ],
      nextSteps: [
        'Add OPENAI_API_KEY to production env',
        'Connect the editor AI helper to a protected server route',
        'Log prompt quality and accepted suggestions in admin',
      ],
    },
    {
      key: 'stripe',
      name: 'Stripe',
      tagline: 'Purchase flow, payment confirmation, receipts, refunds, and payment webhooks.',
      status: stripeSecret && stripeWebhook && stripePrice ? 'live' : stripeSecret ? 'configured' : 'missing',
      accent: '#7C3AED',
      env: [
        { key: 'STRIPE_SECRET_KEY', present: stripeSecret, secret: true },
        { key: 'STRIPE_WEBHOOK_SECRET', present: stripeWebhook, secret: true },
        { key: 'STRIPE_PRICE_ID', present: stripePrice },
      ],
      capabilities: [
        'Create a real purchase flow before marking order requests as confirmed',
        'Unlock customer export only after payment confirmation',
        'Handle refunds and failed payments from webhooks',
      ],
      nextSteps: [
        'Add Stripe env vars',
        'Create purchase session route',
        'Move order status to PAID only from webhook success',
      ],
    },
    {
      key: 'printify',
      name: 'Printify',
      tagline: 'Print provider sync, product publishing, production routing, and shipping updates.',
      status: printifyToken && printifyShop ? 'configured' : 'missing',
      accent: '#22C55E',
      env: [
        { key: 'PRINTIFY_API_TOKEN', present: printifyToken, secret: true },
        { key: 'PRINTIFY_SHOP_ID', present: printifyShop },
      ],
      capabilities: [
        'Send confirmed orders to print production',
        'Map shirt size/color to provider variants',
        'Sync fulfillment status back into admin',
      ],
      nextSteps: [
        'Add Printify token and shop id',
        'Map STYLX variants to Printify blueprint variants',
        'Create fulfillment job after Stripe payment succeeds',
      ],
    },
  ];
}

export function integrationScore(integrations = getIntegrations()) {
  const documented = integrations.filter(i => i.env.length > 0 && i.capabilities.length > 0 && i.nextSteps.length > 0).length;
  return Math.round((documented / integrations.length) * 100);
}
