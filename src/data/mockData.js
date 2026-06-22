export const RESTAURANT = {
  id: 'r1',
  name: 'Tasty Bites',
  tagline: 'Multi-cuisine • Home-style cooking',
  rating: 4.5,
  deliveryTime: '25-30 min',
  address: '123 Food Street, Flavor Town',
  emoji: '🍽️',
};

export const MENU_ITEM = {
  id: 'i1',
  name: 'Margherita Pizza',
  description:
    'Classic delight made with 100% real mozzarella cheese, fresh basil, and a tangy tomato base, baked in a wood-fired oven.',
  price: 0,
  emoji: '🍕',
  restaurantId: RESTAURANT.id,
};

export const DELIVERY_PARTNER = {
  id: 'p1',
  name: 'Raj Kumar',
  phone: '+919876543210',
  vehicle: 'Bike • DL 4S AB 1234',
  rating: 4.8,
  emoji: '🛵',
};

export const ORDER_STAGES = [
  { key: 'placed', label: 'Order Placed', icon: '🧾' },
  { key: 'preparing', label: 'Preparing your food', icon: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];
