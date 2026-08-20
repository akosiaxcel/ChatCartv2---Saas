export const PRICING_CONFIG = {
  starter: {
    name: 'Free Starter',
    price: 0,
    priceLabel: '₱0/mo',
    maxItems: 15,
    features: [
      'Up to 15 Menu Items',
      'Basic QR Code Generator',
      'Messenger Checkout Integration',
      'Instant Live Link'
    ]
  },
  pro: {
    name: 'Pro Business',
    price: 499,
    priceLabel: '₱499/mo',
    maxItems: Infinity,
    features: [
      'Unlimited Menu Items',
      'Custom Branding & Logo Upload',
      '"Popular" / Bestseller Badge Highlighting',
      'Custom QR Code with Logo Center',
      'Priority Support via Messenger'
    ]
  }
};

export const PAYMENT_CONFIG = {
  gcashNumber: '09568302354',
  gcashAccountName: 'A**** J*** P********',
  messengerUrl: 'https://m.me/61552140432076',
  supportEmail: 'axceljohnpatriarca@gmail.com',
  amount: 499,
  currency: 'PHP'
};
