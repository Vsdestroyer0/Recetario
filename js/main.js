// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return localStorage.getItem('currentUser') !== null;
}

// Función para obtener el usuario actual
function getCurrentUser() {
    const userJSON = localStorage.getItem('currentUser');
    return userJSON ? JSON.parse(userJSON) : null;
}

// Función para actualizar la UI según el estado de autenticación
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const profileBtn = document.getElementById('profileBtn');
    const addRecipeBtn = document.getElementById('addRecipeBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const heroAddRecipeBtn = document.getElementById('heroAddRecipeBtn');

    if (isAuthenticated()) {
        // Usuario autenticado
        if (loginBtn) loginBtn.classList.add('hidden');
        if (registerBtn) registerBtn.classList.add('hidden');
        if (profileBtn) profileBtn.classList.remove('hidden');
        if (addRecipeBtn) addRecipeBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        
        // Si estamos en la página principal
        if (heroAddRecipeBtn) {
            heroAddRecipeBtn.setAttribute('href', 'add-recipe.html');
        }
    } else {
        // Usuario no autenticado
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (registerBtn) registerBtn.classList.remove('hidden');
        if (profileBtn) profileBtn.classList.add('hidden');
        if (addRecipeBtn) addRecipeBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        
        // Si estamos en la página principal
        if (heroAddRecipeBtn) {
            heroAddRecipeBtn.setAttribute('href', 'login.html');
            heroAddRecipeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Debes iniciar sesión para publicar una receta');
                window.location.href = 'login.html';
            });
        }
    }
}

// Función para formatear fechas
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Función para generar estrellas de valoración
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && halfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    
    return starsHTML;
}

// Inicialización cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Actualizar la UI según el estado de autenticación
    updateAuthUI();
    
    // Evento para cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
});