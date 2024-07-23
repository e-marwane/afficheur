document.addEventListener('DOMContentLoaded', function() {
function changerTheme(theme, element) {
        // Appliquer le thème à l'arrière-plan
        document.body.style.backgroundImage = `url('./img/${theme}.jpg')`;
        localStorage.setItem('theme', theme);
    
        // Mise à jour des divs de thème et du texte des <p>
        const slides = document.querySelectorAll('.swiper-slide');
        slides.forEach(div => {
            div.classList.remove('active');  // Retire la classe active de tous les thèmes
            const p = div.querySelector('.current-theme');
            if (p) {
                if (div.contains(element)) {
                    // Sauvegarder le texte original s'il n'est pas déjà sauvegardé
                    if (!p.hasAttribute('data-original-text')) {
                        p.setAttribute('data-original-text', p.textContent);
                    }
                    p.textContent = "Actuel";
                } else {
                    // Restaurer le texte original
                    if (p.hasAttribute('data-original-text')) {
                        p.textContent = p.getAttribute('data-original-text');
                    }
                }
            }
        });
        element.closest('.swiper-slide').classList.add('active');  // Ajoute la classe active au thème choisi
    }
    function checkAndSetTheme() {
        // Check if 'theme' exists in local storage
        if (!localStorage.getItem('theme')) {
            // If 'theme' doesn't exist, set the body's background
            document.body.style.backgroundImage = "url('./img/wallpapaper.jpg')";
        }
        if (!localStorage.getItem('banniere')) {
            // If 'banniere' doesn't exist, change the src of the image with class 'profile-pic'
            const profilePic = document.querySelector('.profile-pic');
            if (profilePic) {
                profilePic.src = "./img/banniere-acceuil.png";
            }
        }
    }
    
    // Run the function to check and set the theme
    checkAndSetTheme();
    // Charger le thème depuis le localStorage au chargement de la page
    window.onload = function() {
        const theme = localStorage.getItem('theme');
        console.log(theme);
        if (theme) {
            const selectedButton = document.querySelector(`.boutonTheme[data-theme="${theme}"]`);
            if (selectedButton) {
                changerTheme(theme, selectedButton);
            } else {
                document.body.style.backgroundImage = `url('./img/${theme}.jpg')`;
            }
        }
    }
  
    const buttons = document.querySelectorAll('.boutonTheme');
    
    // Ajouter un écouteur d'événement de clic à chaque bouton
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            changerTheme(theme, this); // Passer 'this' qui est le bouton cliqué
        });
    });
    
   
    // Charger l'image depuis le stockage local lors du chargement de la page
    const storedBanniere = localStorage.getItem('banniere');
    if (storedBanniere) {
        const banniereImage = document.querySelector('.banniere img');
        if (banniereImage) {
            banniereImage.src = storedBanniere;
        }
    }

    // Sélection des éléments nécessaires
    const importButton = document.querySelector('.choix-bann button');
    const popupban = document.getElementById('popupban');
    const ouiButton = document.getElementById('oui-btn');
    const nonButton = document.getElementById('non-btn');

    // Ajout d'un gestionnaire d'événements au clic sur le bouton d'importation
    if (importButton) {
        importButton.addEventListener('click', function() {
            // Ouvrir la boîte de dialogue pour sélectionner un fichier
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*'; // Accepter uniquement les fichiers image
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (file) {
                    // Créer un objet FileReader pour lire le fichier sélectionné
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        // Enregistrer l'image dans le stockage local
                        localStorage.setItem('banniere', e.target.result);
                        // Mettre à jour l'image dans index.html avec l'image sélectionnée
                        const banniereImage = document.querySelector('.banniere img');
                        if (banniereImage) {
                            banniereImage.src = e.target.result;
                        }
                        // Afficher le popupban
                        if (popupban) {
                            popupban.classList.remove('hidden');
                        }
                    };
                    // Lire le contenu du fichier en tant qu'URL de données
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
    }

    // Ajout d'un gestionnaire d'événements au clic sur le bouton OUI
    if (ouiButton) {
        ouiButton.addEventListener('click', function() {
            // Rediriger vers la page d'accueil
            window.location.href = "./index.html";
        });
    }

    // Ajout d'un gestionnaire d'événements au clic sur le bouton NON
    if (nonButton) {
        nonButton.addEventListener('click', function() {
            // Cacher le popupban
            if (popupban) {
                popupban.classList.add('hidden');
            }
        });
    }
});
