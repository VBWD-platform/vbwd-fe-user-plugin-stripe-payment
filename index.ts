import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { registerPaymentDataContributor } from 'vbwd-view-component';
import { registerCheckoutPaymentMethod } from '@/registries/checkoutPaymentMethods';

/**
 * Compact preview of a Stripe transaction id so a row like
 * ``pi_3TbP28Kzuf3j4i0I2wm7DLXV`` doesn't break the invoice-info layout.
 * Returns the first 14 characters + a single-character ellipsis when the
 * input is longer than 16; otherwise returns the id unchanged.
 */
function truncateTransactionId(transactionId: string): string {
  const TRUNCATE_THRESHOLD = 16;
  const KEEP_LEADING = 14;
  return transactionId.length > TRUNCATE_THRESHOLD
    ? `${transactionId.slice(0, KEEP_LEADING)}…`
    : transactionId;
}
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
  version: '26.6',
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

    // PaymentDataBlock contributor: render the ``stripe`` namespace inside the
    // shared "Payment data" block on invoice-detail. The backend stripe plugin
    // writes ``invoice.metadata.stripe = {payment_intent_id, session_id, …}``
    // on capture via the agnostic ``emit_payment_captured(metadata=…)`` seam.
    //
    // Surface the PaymentIntent id (``pi_*``) — that's the canonical
    // transaction id the user expects in their Stripe dashboard. The
    // checkout-session id (``cs_*``) is a flow-only artefact and is not
    // shown. Long ids are truncated to a compact preview.
    registerPaymentDataContributor('stripe', {
      label: 'Stripe transaction',
      format: (data) => {
        const paymentIntentId =
          ((data ?? {}) as { payment_intent_id?: string }).payment_intent_id || '';
        return paymentIntentId ? truncateTransactionId(paymentIntentId) : '—';
      },
      link: (data) => {
        const paymentIntentId =
          ((data ?? {}) as { payment_intent_id?: string }).payment_intent_id || '';
        // Stripe routes test vs live based on the logged-in dashboard session,
        // so the plain ``/payments/<pi>`` URL works in both modes.
        return paymentIntentId
          ? `https://dashboard.stripe.com/payments/${paymentIntentId}`
          : null;
      },
      order: 20,
    });
  },

  activate() { this._active = true; },
  deactivate() { this._active = false; }
};
