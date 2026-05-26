import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { registerCheckoutPaymentMethod } from '@/registries/checkoutPaymentMethods';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import th from './locales/th.json';
import zh from './locales/zh.json';

export const stripePaymentPlugin: IPlugin = {
  name: 'stripe-payment',
  version: '1.0.0',
  description: 'Stripe payment processing — redirects to Stripe Checkout',
  _active: false,

  install(sdk: IPlatformSDK) {
    sdk.addRoute({
      path: '/pay/stripe',
      name: 'stripe-payment',
      component: () => import('./StripePaymentView.vue'),
      meta: { requiresAuth: true, noLayout: true }
    });
    sdk.addRoute({
      path: '/pay/stripe/success',
      name: 'stripe-success',
      component: () => import('./StripeSuccessView.vue'),
      meta: { requiresAuth: true, noLayout: true }
    });
    sdk.addRoute({
      path: '/pay/stripe/cancel',
      name: 'stripe-cancel',
      component: () => import('./StripeCancelView.vue'),
      meta: { requiresAuth: true, noLayout: true }
    });

    sdk.addTranslations('en', en);
    sdk.addTranslations('de', de);
    sdk.addTranslations('es', es);
    sdk.addTranslations('fr', fr);
    sdk.addTranslations('ja', ja);
    sdk.addTranslations('ru', ru);
    sdk.addTranslations('th', th);
    sdk.addTranslations('zh', zh);

    // Agnostic post-checkout dispatch: tell core to hop here after invoice creation.
    registerCheckoutPaymentMethod('stripe', {
      redirectPath: (invoiceId) => `/pay/stripe?invoice=${invoiceId}`,
    });
  },

  activate() { this._active = true; },
  deactivate() { this._active = false; }
};
