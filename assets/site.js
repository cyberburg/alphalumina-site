/* shared: mobile nav */
(function(){var b=document.getElementById('navBurger'),l=document.getElementById('navLinks');if(!b||!l)return;
b.addEventListener('click',function(){var open=l.classList.toggle('open');b.setAttribute('aria-expanded',open);b.textContent=open?'✕':'☰'});
l.querySelectorAll('.nav-link').forEach(function(a){a.addEventListener('click',function(){l.classList.remove('open');b.setAttribute('aria-expanded','false');b.textContent='☰'})})})();
