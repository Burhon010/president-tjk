// header scroll state
const header = document.getElementById('siteHeader');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

// блокировка скролла страницы, пока открыто мобильное меню, поиск или корзина
function syncScrollLock(){
  const navOpen = nav.classList.contains('is-open');
  const cartOverlay = document.getElementById('cartOverlay');
  const searchOverlay = document.getElementById('searchOverlay');
  const cartOpen = cartOverlay && cartOverlay.classList.contains('is-open');
  const searchOpen = searchOverlay && searchOverlay.classList.contains('is-open');
  document.body.classList.toggle('no-scroll', navOpen || cartOpen || searchOpen);
}
window.syncScrollLock = syncScrollLock;

// mobile nav
const burger = document.getElementById('burgerBtn');
const nav = document.getElementById('siteNav');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
  syncScrollLock();
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  syncScrollLock();
}));

// scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
}, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

// hero particle field
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
function resize(){
  w = canvas.width = canvas.offsetWidth * devicePixelRatio;
  h = canvas.height = canvas.offsetHeight * devicePixelRatio;
}
function makeParticles(){
  const count = Math.min(70, Math.floor((w * h) / 90000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: (Math.random() * 1.6 + .4) * devicePixelRatio,
    vy: (Math.random() * .18 + .04) * devicePixelRatio,
    a: Math.random() * .5 + .15
  }));
}
function draw(){
  ctx.clearRect(0, 0, w, h);
  particles.forEach(p => {
    p.y -= p.vy;
    if (p.y < -10) p.y = h + 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,162,75,${p.a})`;
    ctx.fill();
  });
  if (!reduceMotion) requestAnimationFrame(draw);
}
window.addEventListener('resize', () => { resize(); makeParticles(); });
resize(); makeParticles(); draw();
