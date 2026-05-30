document.querySelectorAll('pre').forEach((pre) => {
  const btn = document.createElement('button');
  btn.className = 'code-copy-btn';
  btn.textContent = 'COPY';
  btn.setAttribute('aria-label', 'Copy code to clipboard');
  btn.type = 'button';

  btn.addEventListener('click', async () => {
    const code = pre.querySelector('code');
    const text = (code ?? pre).innerText;
    await navigator.clipboard.writeText(text);
    btn.textContent = 'COPIED';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'COPY';
      btn.classList.remove('copied');
    }, 2000);
  });

  pre.style.position = 'relative';
  pre.appendChild(btn);
});
