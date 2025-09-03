import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const pendingToast = ref(null);

  function setPendingToast(toast) {
    pendingToast.value = toast;
  }

  function consumePendingToast() {
    const toast = pendingToast.value;
    pendingToast.value = null;
    return toast;
  }

  return {
    pendingToast,
    setPendingToast,
    consumePendingToast
  };
}); 