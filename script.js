function atualizarLogo(){
  const logo = document.getElementById("logoHero");
  if(!logo) return;

  if(document.body.classList.contains("light")){
    logo.src = "logo-azul.png";
  } else {
    logo.src = "logo-branca.png";
  }
}

function applyTheme(isDark){
  document.body.classList.toggle("light", !isDark);
  atualizarLogo();
}

document.getElementById("themeBtn").addEventListener("click", () => {
  const isDark = document.body.classList.contains("light");
  applyTheme(isDark);
});

atualizarLogo();
