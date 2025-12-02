// script.js
// Animações e interatividade leve

document.addEventListener('DOMContentLoaded', () => {
  // 1) Toggle tema simples (só altera ícone; cores já são escuras por padrão)
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.hasAttribute('data-alt-theme');
    if (!isDark) {
      document.documentElement.setAttribute('data-alt-theme', 'true');
      themeToggle.textContent = '☀️';
      // exemplo pequeno de alteração
      document.documentElement.style.setProperty('--bg-1', '#04040a');
      document.documentElement.style.setProperty('--bg-2', '#071024');
    } else {
      document.documentElement.removeAttribute('data-alt-theme');
      themeToggle.textContent = '🌙';
      document.documentElement.style.removeProperty('--bg-1');
      document.documentElement.style.removeProperty('--bg-2');
    }
  });

  // 2) Reveal on scroll using IntersectionObserver
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.style.opacity = 1;
        e.target.style.transform = 'translateY(0) scale(1)';
        e.target.style.transitionDelay = '0s';
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });

  reveals.forEach(r => io.observe(r));

  // 3) Contadores animados (stats)
  const counters = document.querySelectorAll('.num[data-target]');
  counters.forEach(el => {
    const target = +el.getAttribute('data-target');
    const duration = 1100;
    let start = 0;
    const step = (timestamp) => {
      start += Math.max(1, Math.round(target / (duration / 16)));
      if (start >= target) start = target;
      el.textContent = start;
      if (start < target) requestAnimationFrame(step);
    };
    // start when visible
    const cobs = new IntersectionObserver((ents) => {
      if (ents[0].isIntersecting) {
        requestAnimationFrame(step);
        cobs.unobserve(el);
      }
    }, {threshold:0.4});
    cobs.observe(el);
  });

  // 4) Form handler (demo - não envia realmente)
  window.handleForm = function (e) {
    e.preventDefault();
    const f = e.target;
    const data = {
      nome: f.nome.value,
      email: f.email.value,
      mensagem: f.mensagem.value
    };
    // feedback simples
    alert(`Obrigado, ${data.nome}! Mensagem recebida (demo).`);
    f.reset();
  };

  // 5) Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({behavior: 'smooth', block: 'center'});
    })
  });
});

