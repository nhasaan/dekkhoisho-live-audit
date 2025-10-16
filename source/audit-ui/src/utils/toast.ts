// Toast notification utility
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export function showToast({ message, type = 'info', duration = 3000 }: ToastOptions) {
  // Remove existing toasts
  const existing = document.querySelector('.toast-container');
  if (existing) existing.remove();

  // Create toast container
  const container = document.createElement('div');
  container.className = 'toast-container fixed top-5 right-5 z-50 animate-slide-in';

  // Define colors and icons based on type
  const configs = {
    success: {
      bg: 'bg-green-50 dark:bg-green-800',
      border: 'border-green-500',
      text: 'text-green-800 dark:text-green-200',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-800',
      border: 'border-red-500',
      text: 'text-red-800 dark:text-red-200',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-800',
      border: 'border-yellow-500',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-800',
      border: 'border-blue-500',
      text: 'text-blue-800 dark:text-blue-200',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>`
    }
  };

  const config = configs[type];

  container.innerHTML = `
    <div class="flex items-center w-full max-w-xs p-4 mb-4 ${config.text} ${config.bg} rounded-lg shadow-lg border-l-4 ${config.border}" role="alert">
      <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
        ${config.icon}
      </div>
      <div class="ml-3 text-sm font-medium">
        ${message}
      </div>
      <button type="button" class="ml-auto -mx-1.5 -my-1.5 ${config.bg} ${config.text} hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:hover:bg-gray-700 dark:hover:text-white" data-dismiss-toast aria-label="Close">
        <span class="sr-only">Close</span>
        <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
  `;

  document.body.appendChild(container);

  // Add close button handler
  const closeBtn = container.querySelector('[data-dismiss-toast]');
  closeBtn?.addEventListener('click', () => {
    container.classList.add('animate-slide-out');
    setTimeout(() => container.remove(), 300);
  });

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (container.parentElement) {
        container.classList.add('animate-slide-out');
        setTimeout(() => container.remove(), 300);
      }
    }, duration);
  }
}

// Add animations to global CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slide-out {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
    .animate-slide-out {
      animation: slide-out 0.3s ease-in;
    }
  `;
  document.head.appendChild(style);
}

