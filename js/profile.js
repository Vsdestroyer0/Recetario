// profile.js - VERSIÓN ACTUALIZADA PARA ORACLE
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Cargar datos del usuario
    loadUserProfile();
    
    // Event listeners para tabs
    setupTabs();
    
    // Event listeners para editar perfil
    setupEditProfile();
});

// ✅ CARGAR PERFIL DESDE ORACLE - ACTUALIZADO
async function loadUserProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        console.log('🔍 Cargando perfil para usuario ID:', currentUser.id);
        
        // Obtener usuario con recetas desde el servidor
        const response = await fetch(`/users/${currentUser.id}/with-recipes`);
        
        if (!response.ok) {
            throw new Error('Error al cargar el perfil');
        }
        
        const userData = await response.json();
        console.log('👤 Datos del usuario:', userData);
        
        // Actualizar UI con los datos
        updateProfileUI(userData);
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        // Usar datos del localStorage como fallback
        loadProfileFromLocalStorage();
    }
}

// ✅ ACTUALIZAR INTERFAZ CON DATOS DE ORACLE - ACTUALIZADO
function updateProfileUI(userData) {
    // Elementos básicos del perfil
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const joinDate = document.getElementById('joinDate');
    
    // Actualizar datos básicos con estructura actualizada
    if (userAvatar) {
        userAvatar.src = userData.avatar || `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`;
    }
    if (userName) {
        userName.textContent = `${userData.firstName} ${userData.lastName}`;
    }
    if (userEmail) {
        userEmail.textContent = userData.email;
    }
    if (joinDate) {
        joinDate.textContent = 'Recién registrado'; // Puedes agregar fecha real después
    }
    
    // Actualizar estadísticas
    updateUserStats(userData);
    
    // Cargar recetas del usuario
    loadUserRecipesFromData(userData.recipes || []);
    
    // Pre-llenar formulario de edición
    prefillEditForm(userData);
}

// ✅ ACTUALIZAR ESTADÍSTICAS - ACTUALIZADO
function updateUserStats(userData) {
    const recipesCount = document.getElementById('recipesCount');
    const likesCount = document.getElementById('likesCount');
    const commentsCount = document.getElementById('commentsCount');
    
    // Usar totalRecipes del backend o contar las recetas
    if (recipesCount) {
        recipesCount.textContent = userData.totalRecipes || (userData.recipes ? userData.recipes.length : 0);
    }
    
    // Por ahora, valores por defecto (puedes implementar después)
    if (likesCount) likesCount.textContent = '0';
    if (commentsCount) commentsCount.textContent = '0';
}

// ✅ CARGAR RECETAS DEL USUARIO - ACTUALIZADO
function loadUserRecipesFromData(recipes) {
    const userRecipesContainer = document.getElementById('userRecipesContainer');
    if (!userRecipesContainer) return;
    
    if (!recipes || recipes.length === 0) {
        userRecipesContainer.innerHTML = `
            <div class="no-recipes">
                <p>Aún no has publicado ninguna receta.</p>
                <a href="add-recipe.html" class="btn btn-primary">Publicar mi primera receta</a>
            </div>
        `;
        return;
    }
    
    // Mostrar recetas con estructura actualizada
    userRecipesContainer.innerHTML = recipes.map(recipe => `
        <div class="recipe-card">
            <div class="recipe-image">
                <img src="${recipe.image || 'https://via.placeholder.com/300x200'}" alt="${recipe.title}">
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <div class="recipe-meta">
                    <span>${formatDate(recipe.createdAt)}</span>
                    <span class="recipe-rating">${generateStarRating(recipe.rating || 0)} (${recipe.ratingCount || 0})</span>
                </div>
                <p class="recipe-description">${recipe.description || 'Sin descripción'}</p>
                <div class="recipe-footer">
                    <div class="recipe-actions">
                        <a href="recipe.html?id=${recipe._id}" class="view-recipe">Ver <i class="fas fa-eye"></i></a>
                        <button class="edit-recipe" data-id="${recipe._id}">Editar <i class="fas fa-edit"></i></button>
                        <button class="delete-recipe" data-id="${recipe._id}">Eliminar <i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Event listeners para acciones
    setupRecipeActions();
}

// ✅ CONFIGURAR TABS
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Añadir clase active
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Cargar contenido según la tab
            loadTabContent(tabId);
        });
    });
}

// ✅ CARGAR CONTENIDO DE TABS
function loadTabContent(tabId) {
    switch(tabId) {
        case 'favorites':
            loadUserFavorites();
            break;
        case 'comments':
            loadUserComments();
            break;
        // 'my-recipes' ya se carga automáticamente
    }
}

// ✅ CARGAR FAVORITOS (placeholder por ahora)
function loadUserFavorites() {
    const favoritesContainer = document.getElementById('favoritesContainer');
    if (!favoritesContainer) return;
    
    favoritesContainer.innerHTML = `
        <div class="no-recipes">
            <p>Funcionalidad de favoritos próximamente.</p>
            <a href="index.html#recipes-section" class="btn btn-primary">Explorar recetas</a>
        </div>
    `;
}

// ✅ CARGAR COMENTARIOS (placeholder por ahora)
function loadUserComments() {
    const userCommentsContainer = document.getElementById('userCommentsContainer');
    if (!userCommentsContainer) return;
    
    userCommentsContainer.innerHTML = `
        <div class="no-comments">
            <p>Funcionalidad de comentarios próximamente.</p>
            <a href="index.html#recipes-section" class="btn btn-primary">Explorar recetas</a>
        </div>
    `;
}

// ✅ CONFIGURAR EDICIÓN DE PERFIL
function setupEditProfile() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const editProfileForm = document.getElementById('editProfileForm');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditProfileModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEditProfileModal);
    }
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            closeEditProfileModal();
        }
    });
    
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', updateUserProfile);
    }
}

// ✅ PRE-LLENAR FORMULARIO DE EDICIÓN - ACTUALIZADO
function prefillEditForm(userData) {
    const editFirstName = document.getElementById('editFirstName');
    const editLastName = document.getElementById('editLastName');
    const editUsername = document.getElementById('editUsername');
    const editBio = document.getElementById('editBio');
    
    if (editFirstName) editFirstName.value = userData.firstName || '';
    if (editLastName) editLastName.value = userData.lastName || '';
    if (editUsername) editUsername.value = userData.username || '';
    if (editBio) editBio.value = userData.bio || '';
}

// ✅ ABRIR/CERRAR MODAL
function openEditProfileModal() {
    const editProfileModal = document.getElementById('editProfileModal');
    if (editProfileModal) {
        editProfileModal.style.display = 'block';
    }
}

function closeEditProfileModal() {
    const editProfileModal = document.getElementById('editProfileModal');
    if (editProfileModal) {
        editProfileModal.style.display = 'none';
    }
}

// ✅ ACTUALIZAR PERFIL - MEJORADO
async function updateUserProfile(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const formData = new FormData(e.target);
    const updateData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        username: formData.get('username'),
        bio: formData.get('bio')
    };
    
    try {
        const response = await fetch(`/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            alert('Perfil actualizado correctamente');
            closeEditProfileModal();
            // Recargar el perfil
            loadUserProfile();
        } else {
            throw new Error('Error al actualizar el perfil');
        }
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        alert('Error al actualizar el perfil. Inténtalo de nuevo.');
    }
}

// ✅ CONFIGURAR ACCIONES DE RECETAS
function setupRecipeActions() {
    // Eliminar receta
    document.querySelectorAll('.delete-recipe').forEach(btn => {
        btn.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            if (confirm('¿Estás seguro de que deseas eliminar esta receta?')) {
                deleteRecipe(recipeId);
            }
        });
    });
    
    // Editar receta
    document.querySelectorAll('.edit-recipe').forEach(btn => {
        btn.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            editRecipe(recipeId);
        });
    });
}

// ✅ ELIMINAR RECETA - MEJORADO
async function deleteRecipe(recipeId) {
    try {
        const response = await fetch(`/recipes/${recipeId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Receta eliminada correctamente');
            // Recargar el perfil
            loadUserProfile();
        } else {
            throw new Error('Error al eliminar la receta');
        }
    } catch (error) {
        console.error('Error eliminando receta:', error);
        alert('Error al eliminar la receta. Inténtalo de nuevo.');
    }
}

// ✅ EDITAR RECETA
function editRecipe(recipeId) {
    window.location.href = `edit-recipe.html?id=${recipeId}`;
}

// ✅ FALLBACK A LOCALSTORAGE - ACTUALIZADO
function loadProfileFromLocalStorage() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    console.log('📱 Usando datos de localStorage como fallback');
    
    // Mostrar datos básicos del usuario logueado
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    
    if (userAvatar) {
        userAvatar.src = currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=random`;
    }
    if (userName) {
        userName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    }
    if (userEmail) {
        userEmail.textContent = currentUser.email;
    }
    
    // Resetear estadísticas
    const recipesCount = document.getElementById('recipesCount');
    if (recipesCount) recipesCount.textContent = '0';
    
    // Mostrar mensaje de que no hay recetas
    const userRecipesContainer = document.getElementById('userRecipesContainer');
    if (userRecipesContainer) {
        userRecipesContainer.innerHTML = `
            <div class="no-recipes">
                <p>Aún no has publicado ninguna receta.</p>
                <a href="add-recipe.html" class="btn btn-primary">Publicar mi primera receta</a>
            </div>
        `;
    }
}

// ✅ FUNCIONES AUXILIARES
function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return 'Fecha inválida';
    }
}

function generateStarRating(rating) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        stars.push('<i class="fas fa-star"></i>');
    }
    
    if (hasHalfStar) {
        stars.push('<i class="fas fa-star-half-alt"></i>');
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars.push('<i class="far fa-star"></i>');
    }
    
    return stars.join('');
}