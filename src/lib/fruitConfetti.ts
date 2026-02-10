import { CELEBRATION_FRUITS } from '@/types/puzzle';

export function createFruitConfetti() {
  const container = document.createElement('div');
  container.id = 'fruit-confetti-container';
  container.className = 'fixed inset-0 overflow-hidden pointer-events-none';
  container.style.zIndex = '100';
  document.body.appendChild(container);

  // Inject the keyframes if not already present
  if (!document.getElementById('fruit-confetti-keyframes')) {
    const style = document.createElement('style');
    style.id = 'fruit-confetti-keyframes';
    style.textContent = `
      @keyframes fruitConfettiFall {
        0% {
          transform: translateY(-10vh) translateX(0) rotate(0deg);
          opacity: 1;
        }
        25% {
          transform: translateY(25vh) translateX(var(--sway1)) rotate(var(--rot1));
          opacity: 1;
        }
        50% {
          transform: translateY(50vh) translateX(var(--sway2)) rotate(var(--rot2));
          opacity: 0.9;
        }
        75% {
          transform: translateY(75vh) translateX(var(--sway3)) rotate(var(--rot3));
          opacity: 0.7;
        }
        100% {
          transform: translateY(110vh) translateX(var(--sway4)) rotate(var(--rot4));
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  for (let i = 0; i < 120; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.left = Math.random() * 100 + '%';
      el.style.top = '-5%';
      el.style.fontSize = (Math.random() * 16 + 18) + 'px';
      el.style.userSelect = 'none';
      el.textContent = CELEBRATION_FRUITS[Math.floor(Math.random() * CELEBRATION_FRUITS.length)];

      const duration = (Math.random() * 3 + 2.5) + 's';
      const sign = () => Math.random() > 0.5 ? '' : '-';
      el.style.setProperty('--sway1', `${sign()}${Math.random() * 40 + 10}px`);
      el.style.setProperty('--sway2', `${sign()}${Math.random() * 60 + 20}px`);
      el.style.setProperty('--sway3', `${sign()}${Math.random() * 40 + 10}px`);
      el.style.setProperty('--sway4', `${sign()}${Math.random() * 50 + 15}px`);
      el.style.setProperty('--rot1', `${Math.random() * 180}deg`);
      el.style.setProperty('--rot2', `${Math.random() * 360}deg`);
      el.style.setProperty('--rot3', `${Math.random() * 540}deg`);
      el.style.setProperty('--rot4', `${Math.random() * 720}deg`);

      el.style.animation = `fruitConfettiFall ${duration} ease-out forwards`;

      container.appendChild(el);

      setTimeout(() => el.remove(), parseFloat(duration) * 1000);
    }, i * 20);
  }

  setTimeout(() => container.remove(), 9000);
}
