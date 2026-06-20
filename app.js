(() => {
  const recover = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.update().catch(() => {})));
      }
    } catch (_) {}
    const target = new URL('./index.html', location.href);
    target.searchParams.set('v', '0.8.1-hotfix');
    if (!location.search.includes('0.8.1-hotfix')) location.replace(target.toString());
  };
  recover();
})();
