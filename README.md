# FoodExpress — Food Delivery App (Frontend)

A React Native (Expo) frontend for a food delivery app. This is a **frontend-only**
demo: there is no backend yet, so all data (the restaurant, the menu item, the
delivery partner) is mocked locally. Authentication is also simulated entirely
on-device using local storage — there is no real server-side auth.

## Tech Stack

- **Expo SDK 54** (React Native 0.81, React 19)
- **JavaScript** (no TypeScript)
- **React Navigation v6** — stack + bottom tab navigation
- **React Context** — global app state (auth, cart, order)
- **AsyncStorage** — persists the registered user and active session on-device

## Demo Scope

This build intentionally covers a single, minimal flow rather than a full catalog:

- 1 restaurant
- 1 customer (you, after signing up)
- 1 delivery partner
- 1 menu item, priced **free**

## Features / Screens

| Screen | Description |
|---|---|
| Sign Up | Create a local account (name, email, phone, address, password) |
| Log In | Authenticate against the locally stored account |
| Home | Shows the restaurant and the featured menu item |
| Item Detail | Item info, quantity picker, add to cart |
| Cart | Review items, quantities, delivery address, order summary, place order |
| Orders | Live order status (Placed → Preparing → Out for Delivery → Delivered) with delivery partner info and a call button |
| Profile | Account details and log out |

## Project Structure

```
App.js                      Entry point — wraps the app in providers
src/
  context/
    AppContext.js            Global state: auth, cart, order (+ AsyncStorage persistence)
  data/
    mockData.js              The mock restaurant, menu item, delivery partner, order stages
  navigation/
    index.js                 Auth stack vs. main tab navigator, switches based on login state
  screens/
    LoginScreen.js
    SignupScreen.js
    HomeScreen.js
    ItemDetailScreen.js
    CartScreen.js
    OrdersScreen.js
    ProfileScreen.js
  components/
    PrimaryButton.js          Reusable button (solid/outline variants)
    QuantityStepper.js        Reusable +/- quantity control
  theme/
    colors.js                 Shared color palette
```

## Running the App

1. Install dependencies (first time only):
   ```
   npm install
   ```
2. Start the dev server:
   ```
   npx expo start
   ```
3. Install **Expo Go** on your phone (App Store / Play Store).
4. Make sure your phone is on the **same Wi-Fi network** as your computer.
5. Scan the QR code Expo Go displays, or open Expo Go and enter the URL manually
   (e.g. `exp://<your-computer's-LAN-IP>:8081`).

If your phone can't reach the dev server (firewall, different network), run
`npx expo start --tunnel` instead — it routes through Expo's relay so it works
across networks, at the cost of a slower connection.

## How Auth Works (No Backend)

- **Sign Up** stores your account (including password, for this demo only) in
  AsyncStorage on your device, then logs you in.
- **Log In** checks the email/password you enter against that stored account.
- Your session persists across app restarts until you tap **Log Out**.
- None of this is secure storage — it's a stand-in for a real backend and should
  not be used as-is once a real auth API exists.

## Swapping in a Real Backend Later

All mock data lives in `src/data/mockData.js` and all app state logic lives in
`src/context/AppContext.js`. To connect a real backend, replace the
AsyncStorage calls and static imports in those two files with API calls — the
screens themselves don't need to change since they only consume the context.
