export interface CartItem {
  id: number;
  name: string;
  price_min: number;
  price_max?: number | null;
  quantity: number;
}

export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const cart = localStorage.getItem('hk_cart');
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error reading cart from localStorage', error);
    return [];
  }
};

export const saveCart = (cart: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('hk_cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage', error);
  }
};

export const addToCart = (item: Omit<CartItem, 'quantity'>): CartItem[] => {
  const cart = getCart();
  const existing = cart.find((i) => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
  return cart;
};

export const removeFromCart = (id: number): CartItem[] => {
  const cart = getCart();
  const updated = cart.filter((i) => i.id !== id);
  saveCart(updated);
  return updated;
};

export const updateQuantity = (id: number, quantity: number): CartItem[] => {
  if (quantity <= 0) {
    return removeFromCart(id);
  }
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.quantity = quantity;
  }
  saveCart(cart);
  return cart;
};

export const clearCart = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('hk_cart');
};
