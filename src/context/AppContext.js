import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { API_BASE } from '../config';
import { getMenuItemById, loadCatalogFromBackend } from '../data/mockData';

const REGISTERED_USER_KEY = '@food_app/registeredUser';
const SESSION_KEY = '@food_app/session';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [cart, setCart] = useState({});
  const [order, setOrder] = useState(null); // the order this customer placed, straight from the backend
  const [menuItem, setMenuItem] = useState(null); // whatever the restaurant currently has live
  const socketRef = useRef(null);

  // Restore login session on app start (still local - no auth backend yet)
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  // Load the real catalog before any screen renders, so Home/Restaurant/
  // DishRestaurants/ItemDetail/Cart - which all read RESTAURANTS/DISHES/
  // MENU_ITEMS from mockData.js synchronously - see real data on their
  // very first render instead of momentarily showing the mock fallback.
  useEffect(() => {
    loadCatalogFromBackend(API_BASE).finally(() => setIsLoadingCatalog(false));
  }, []);

  // Connect to the backend once, for as long as the app is open
  useEffect(() => {
    fetch(`${API_BASE}/api/menu/displayed`)
      .then((res) => res.json())
      .then((item) => setMenuItem(item))
      .catch(() => {
        // Backend not reachable - menuItem stays null and HomeScreen
        // shows an empty state instead of crashing.
      });

    const socket = io(API_BASE);
    socketRef.current = socket;

    // Restaurant changed the displayed item - update instantly, same
    // event the web dashboard and rider app already listen for.
    socket.on('menu:updated', (item) => {
      setMenuItem(item);
    });

    // A rider accepted (or any order changed status) - only react if
    // it's the order this customer is actually tracking.
    socket.on('order:updated', (updatedOrder) => {
      setOrder((prev) => (prev && prev._id === updatedOrder._id ? updatedOrder : prev));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const signUp = useCallback(async ({ name, email, phone, address, password }) => {
    const profile = { name, email, phone, address, password };
    await AsyncStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(profile));
    const session = { name, email, phone, address };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { success: true };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const raw = await AsyncStorage.getItem(REGISTERED_USER_KEY);
    if (!raw) {
      return { success: false, message: 'No account found. Please sign up first.' };
    }
    const registered = JSON.parse(raw);
    if (registered.email.toLowerCase() !== email.trim().toLowerCase()) {
      return { success: false, message: 'No account found with that email.' };
    }
    if (registered.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }
    const session = {
      name: registered.name,
      email: registered.email,
      phone: registered.phone,
      address: registered.address,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    setCart({});
    setOrder(null);
  }, []);

  const updateProfile = useCallback(async ({ name, email, phone, address }) => {
    const session = { name, email, phone, address };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Keep the registered account's contact details in sync too, so logging
    // back in later still works and shows the updated info. Password is
    // untouched - editing profile doesn't go through the password fields.
    const raw = await AsyncStorage.getItem(REGISTERED_USER_KEY);
    if (raw) {
      const registered = JSON.parse(raw);
      await AsyncStorage.setItem(
        REGISTERED_USER_KEY,
        JSON.stringify({ ...registered, name, email, phone, address })
      );
    }

    setUser(session);
    return { success: true };
  }, []);

  const addToCart = useCallback((itemId, quantity = 1) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + quantity }));
  }, []);

  const setItemQuantity = useCallback((itemId, quantity) => {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = quantity;
      }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  // Cart entries are keyed by mock catalog item id (see src/data/mockData.js).
  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => ({ item: getMenuItemById(itemId), quantity }))
        .filter((entry) => entry.item),
    [cart]
  );

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0),
    [cartItems]
  );

  // The cart is restricted to one restaurant at a time, same as real food
  // delivery apps - this is what screens check before calling addToCart,
  // to decide whether to prompt "replace cart?" first.
  const cartRestaurantId = cartItems[0]?.item.restaurantId ?? null;

  const replaceCart = useCallback((itemId, quantity = 1) => {
    setCart({ [itemId]: quantity });
  }, []);

  // Places a real order against the backend, now that cart items carry
  // real catalog ids (see mockData.js's loadCatalogFromBackend) instead of
  // hardcoded mock ones - so the rider app can actually see and accept it.
  const placeOrder = useCallback(async () => {
    if (cartCount === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user?.name || 'Guest',
          restaurantId: cartRestaurantId,
          items: cartItems.map(({ item, quantity }) => ({
            menuItem: item.id,
            quantity,
            price: item.price,
          })),
        }),
      });
      if (!res.ok) throw new Error('Could not place your order. Please try again.');
      const created = await res.json();
      setOrder(created);
      clearCart();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [cartCount, cartItems, cartRestaurantId, clearCart, user]);

  const resetOrder = useCallback(() => setOrder(null), []);

  const value = useMemo(
    () => ({
      user,
      isRestoringSession,
      isLoadingCatalog,
      signUp,
      login,
      logout,
      updateProfile,
      cart,
      cartItems,
      cartCount,
      cartTotal,
      cartRestaurantId,
      addToCart,
      replaceCart,
      setItemQuantity,
      clearCart,
      menuItem,
      order,
      placeOrder,
      resetOrder,
    }),
    [
      user,
      isRestoringSession,
      isLoadingCatalog,
      signUp,
      login,
      logout,
      updateProfile,
      cart,
      cartItems,
      cartCount,
      cartTotal,
      cartRestaurantId,
      addToCart,
      replaceCart,
      setItemQuantity,
      clearCart,
      menuItem,
      order,
      placeOrder,
      resetOrder,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
