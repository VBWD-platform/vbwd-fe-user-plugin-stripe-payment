<template>
  <div class="stripe-success">
    <div
      v-if="polling"
      class="stripe-success__verifying"
    >
      <div class="spinner" />
      <p>{{ $t('stripe.success.verifying') }}</p>
    </div>
    <div
      v-else-if="error"
      class="stripe-success__error"
    >
      <p>{{ error }}</p>
      <router-link
        to="/dashboard/invoices"
        class="btn btn-primary"
      >
        {{ $t('stripe.success.viewInvoices') }}
      </router-link>
    </div>
    <div
      v-else-if="timedOut || confirmed"
      class="stripe-success__done"
    >
      <p v-if="redirecting">
        {{ $t('stripe.success.redirecting') || 'Redirecting...' }}
      </p>
      <p v-else>
        {{ $t('stripe.success.processing') }}
      </p>
      <router-link
        :to="confirmationUrl"
        class="btn btn-primary"
      >
        {{ $t('stripe.success.viewOrder') || 'View Order' }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePaymentStatus } from 'vbwd-view-component';
import { api } from '@/api';

const router = useRouter();
const redirecting = ref(false);

const { polling, confirmed, timedOut, error, statusData, readSessionFromQuery, startPolling } =
  usePaymentStatus('/plugins/stripe', api);

const invoiceId = computed(() => (statusData.value?.invoice_id as string) || '');

const confirmationUrl = computed(() => ({
  path: '/checkout/confirmation',
  query: invoiceId.value ? { invoice_id: invoiceId.value } : {},
}));

// Redirect to confirmation page when payment confirmed OR timed out
// (timed out usually means webhook already processed — payment succeeded)
function redirectToConfirmation() {
  redirecting.value = true;
  router.replace(confirmationUrl.value);
}

watch(confirmed, (isConfirmed) => {
  if (isConfirmed) {
    redirectToConfirmation();
  }
});

watch(timedOut, (isTimedOut) => {
  if (isTimedOut) {
    // Auto-redirect after 2 seconds — payment likely succeeded via webhook
    setTimeout(redirectToConfirmation, 2000);
  }
});

onMounted(() => {
  readSessionFromQuery();
  startPolling();
});
</script>

<style scoped>
.stripe-success {
  max-width: 600px;
  margin: 0 auto;
  padding: 80px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-primary {
  display: inline-block;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 15px;
}

.btn-primary:hover {
  background: #2980b9;
}
</style>
