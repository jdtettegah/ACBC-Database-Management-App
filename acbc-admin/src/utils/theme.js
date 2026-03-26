export const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  };
  
  export const toggleTheme = () => {
    const currentTheme =
      document.documentElement.getAttribute('data-theme') || 'light';
  
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  