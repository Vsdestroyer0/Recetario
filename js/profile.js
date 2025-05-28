// Funcionalidad para la página de perfil
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Obtener elementos del DOM
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const joinDate = document.getElementById('joinDate');
    const recipesCount = document.getElementById('recipesCount');
    const likesCount = document.getElementById('likesCount');
    const commentsCount = document.getElementById('commentsCount');
    
    // Elementos para tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Elementos para editar perfil
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const editProfileForm = document.getElementById('editProfileForm');
    const editFirstName = document.getElementById('editFirstName');
    const editLastName = document.getElementById('editLastName');
    const editUsername = document.getElementById('editUsername');
    const editBio = document.getElementById('editBio');
    
    // Cargar datos del usuario
    loadUserProfile();
    
    // Cargar recetas del usuario
    loadUserRecipes();
    
    // Cargar favoritos
    loadUserFavorites();
    
    // Cargar comentarios del usuario
    loadUserComments();
    
    // Event listeners para tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Añadir clase active al botón clickeado
            button.classList.add('active');
            
            // Mostrar contenido correspondiente
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Event listeners para editar perfil
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
    
    // Manejar envío del formulario de edición
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', updateUserProfile);
    }
    
    // Event listener para cambiar avatar
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', changeAvatar);
    }
    
    // Event listener para editar receta
    document.querySelectorAll('.edit-recipe').forEach(btn => {
        btn.addEventListener('click', function() {
            const recipeId = parseInt(this.getAttribute('data-id'));
            editRecipe(recipeId);
        });
    });
});

// Cargar perfil del usuario
function loadUserProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Obtener usuario completo desde localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user) return;
    
    // Mostrar datos en la interfaz
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const joinDate = document.getElementById('joinDate');
    
    if (userAvatar) userAvatar.src = user.avatar || 'https://ui-avatars.com/api/?name=Usuario&background=random';
    if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
    if (userEmail) userEmail.textContent = user.email;
    if (joinDate) joinDate.textContent = formatDate(user.joinDate);
    
    // Actualizar contadores
    updateUserStats(user);
    
    // Pre-llenar formulario de edición
    const editFirstName = document.getElementById('editFirstName');
    const editLastName = document.getElementById('editLastName');
    const editUsername = document.getElementById('editUsername');
    const editBio = document.getElementById('editBio');
    
    if (editFirstName) editFirstName.value = user.firstName || '';
    if (editLastName) editLastName.value = user.lastName || '';
    if (editUsername) editUsername.value = user.username || '';
    if (editBio) editBio.value = user.bio || '';
}

// Actualizar estadísticas del usuario
function updateUserStats(user) {
    const recipesCount = document.getElementById('recipesCount');
    const likesCount = document.getElementById('likesCount');
    const commentsCount = document.getElementById('commentsCount');
    
    // Contar recetas
    const userRecipes = user.recipes || [];
    if (recipesCount) recipesCount.textContent = userRecipes.length;
    
    // Contar favoritos
    const userFavorites = user.favorites || [];
    if (likesCount) likesCount.textContent = userFavorites.length;
    
    // Contar comentarios
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    let commentCount = 0;
    
    recipes.forEach(recipe => {
        if (recipe.comments) {
            const userComments = recipe.comments.filter(comment => comment.userId === user.id);
            commentCount += userComments.length;
        }
    });
    
    if (commentsCount) commentsCount.textContent = commentCount;
}

// Cargar recetas del usuario
function loadUserRecipes() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userRecipesContainer = document.getElementById('userRecipesContainer');
    if (!userRecipesContainer) return;
    
    // Obtener usuario completo con sus recetas
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user || !user.recipes || user.recipes.length === 0) {
        userRecipesContainer.innerHTML = `
            <div class="no-recipes">
                <p>Aún no has publicado ninguna receta.</p>
                <a href="add-recipe.html" class="btn btn-primary">Publicar mi primera receta</a>
            </div>
        `;
        return;
    }
    
    // Obtener todas las recetas
    const allRecipes = JSON.parse(localStorage.getItem('recipes')) || [];
    
    // Filtrar recetas del usuario
    const userRecipes = allRecipes.filter(recipe => user.recipes.includes(recipe.id));
    
    // Mostrar recetas
    if (userRecipes.length === 0) {
        userRecipesContainer.innerHTML = `
            <div class="no-recipes">
                <p>Aún no has publicado ninguna receta.</p>
                <a href="add-recipe.html" class="btn btn-primary">Publicar mi primera receta</a>
            </div>
        `;
    } else {
        userRecipesContainer.innerHTML = userRecipes.map(recipe => `
            <div class="recipe-card">
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.title}">
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span>${formatDate(recipe.createdAt)}</span>
                        <span class="recipe-rating">${generateStarRating(recipe.rating)} (${recipe.ratingCount || 0})</span>
                    </div>
                    <p class="recipe-description">${recipe.description}</p>
                    <div class="recipe-footer">
                        <div class="recipe-actions">
                            <a href="recipe.html?id=${recipe.id}" class="view-recipe">Ver <i class="fas fa-eye"></i></a>
                            <button class="edit-recipe" data-id="${recipe.id}">Editar <i class="fas fa-edit"></i></button>
                            <button class="delete-recipe" data-id="${recipe.id}">Eliminar <i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Añadir event listeners para eliminar
        document.querySelectorAll('.delete-recipe').forEach(btn => {
            btn.addEventListener('click', function() {
                const recipeId = parseInt(this.getAttribute('data-id'));
                if (confirm('¿Estás seguro de que deseas eliminar esta receta?')) {
                    deleteRecipe(recipeId);
                }
            });
        });
    }
}

// Cargar recetas favoritas
function loadUserFavorites() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const favoritesContainer = document.getElementById('favoritesContainer');
    if (!favoritesContainer) return;
    
    // Obtener usuario completo con sus favoritos
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user || !user.favorites || user.favorites.length === 0) {
        favoritesContainer.innerHTML = `
            <div class="no-recipes">
                <p>Aún no tienes recetas favoritas.</p>
                <a href="index.html#recipes-section" class="btn btn-primary">Explorar recetas</a>
            </div>
        `;
        return;
    }
    
    // Obtener todas las recetas
    const allRecipes = JSON.parse(localStorage.getItem('recipes')) || [];
    
    // Filtrar favoritos
    const favoriteRecipes = allRecipes.filter(recipe => user.favorites.includes(recipe.id));
    
    // Mostrar favoritos
    if (favoriteRecipes.length === 0) {
        favoritesContainer.innerHTML = `
            <div class="no-recipes">
                <p>Aún no tienes recetas favoritas.</p>
                <a href="index.html#recipes-section" class="btn btn-primary">Explorar recetas</a>
            </div>
        `;
    } else {
        favoritesContainer.innerHTML = favoriteRecipes.map(recipe => `
            <div class="recipe-card">
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.title}">
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span>${formatDate(recipe.createdAt)}</span>
                        <span class="recipe-rating">${generateStarRating(recipe.rating)} (${recipe.ratingCount || 0})</span>
                    </div>
                    <p class="recipe-description">${recipe.description}</p>
                    <div class="recipe-footer">
                        <div class="recipe-author">
                            <img src="${getUserAvatar(recipe.authorId)}" alt="${recipe.author}">
                            <span>${recipe.author}</span>
                        </div>
                        <a href="recipe.html?id=${recipe.id}" class="view-recipe">Ver Receta <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Cargar comentarios del usuario
function loadUserComments() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userCommentsContainer = document.getElementById('userCommentsContainer');
    if (!userCommentsContainer) return;
    
    // Obtener todas las recetas
    const allRecipes = JSON.parse(localStorage.getItem('recipes')) || [];
    
    // Buscar comentarios del usuario en todas las recetas
    const userComments = [];
    
    allRecipes.forEach(recipe => {
        if (recipe.comments) {
            recipe.comments.forEach(comment => {
                if (comment.userId === currentUser.id) {
                    userComments.push({
                        recipeId: recipe.id,
                        recipeTitle: recipe.title,
                        comment: comment
                    });
                }
            });
        }
    });
    
    // Mostrar comentarios
    if (userComments.length === 0) {
        userCommentsContainer.innerHTML = `
            <div class="no-comments">
                <p>Aún no has comentado en ninguna receta.</p>
                <a href="index.html#recipes-section" class="btn btn-primary">Explorar recetas</a>
            </div>
        `;
    } else {
        userCommentsContainer.innerHTML = userComments.map(item => `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-recipe">
                        <a href="recipe.html?id=${item.recipeId}">${item.recipeTitle}</a>
                    </div>
                    <div class="comment-date">${formatDate(item.comment.createdAt)}</div>
                </div>
                <div class="comment-rating">${generateStarRating(item.comment.rating)}</div>
                <p class="comment-text">${item.comment.content}</p>
            </div>
        `).join('');
    }
}

// Abrir modal para editar perfil
function openEditProfileModal() {
    const editProfileModal = document.getElementById('editProfileModal');
    if (editProfileModal) {
        editProfileModal.style.display = 'block';
    }
}

// Cerrar modal
function closeEditProfileModal() {
    const editProfileModal = document.getElementById('editProfileModal');
    if (editProfileModal) {
        editProfileModal.style.display = 'none';
    }
}

// Actualizar perfil de usuario
function updateUserProfile(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('editFirstName').value;
    const lastName = document.getElementById('editLastName').value;
    const username = document.getElementById('editUsername').value;
    const bio = document.getElementById('editBio').value;
    
    // Validaciones
    if (!firstName || !lastName || !username) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    // Obtener usuario actual
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Actualizar en localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].firstName = firstName;
        users[userIndex].lastName = lastName;
        users[userIndex].username = username;
        users[userIndex].bio = bio;
        
        // Actualizar avatar con el nuevo nombre si es necesario
        if (users[userIndex].avatar.includes('ui-avatars.com')) {
            users[userIndex].avatar = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        
        // Actualizar sesión actual
        const updatedUser = {
            ...currentUser,
            firstName,
            lastName,
            username
        };
        
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Actualizar UI
        loadUserProfile();
        
        // Cerrar modal
        closeEditProfileModal();
        
        alert('Perfil actualizado correctamente');
    }
}

// Cambiar avatar
function changeAvatar() {
    const newAvatarUrl = prompt('Ingresa la URL de tu nueva imagen de perfil:');
    
    if (newAvatarUrl) {
        // Verificar si es una URL válida
        try {
            new URL(newAvatarUrl);
            
            // Actualizar en localStorage
            const currentUser = getCurrentUser();
            if (!currentUser) return;
            
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex !== -1) {
                users[userIndex].avatar = newAvatarUrl;
                localStorage.setItem('users', JSON.stringify(users));
                
                // Actualizar UI
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) userAvatar.src = newAvatarUrl;
                
                alert('Avatar actualizado correctamente');
            }
        } catch (e) {
            alert('Por favor, ingresa una URL válida');
        }
    }
}

// Eliminar receta
function deleteRecipe(recipeId) {
    // Obtener usuario actual
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Obtener recetas
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const recipeIndex = recipes.findIndex(recipe => recipe.id === recipeId);
    
    if (recipeIndex === -1) return;
    
    // Verificar que la receta pertenece al usuario
    if (recipes[recipeIndex].authorId !== currentUser.id) {
        alert('No tienes permiso para eliminar esta receta');
        return;
    }
    
    // Eliminar receta
    recipes.splice(recipeIndex, 1);
    localStorage.setItem('recipes', JSON.stringify(recipes));
    
    // Actualizar lista de recetas del usuario
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].recipes = users[userIndex].recipes.filter(id => id !== recipeId);
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Recargar recetas
    loadUserRecipes();
    
    // Actualizar estadísticas
    updateUserStats(users[userIndex]);
    
    alert('Receta eliminada correctamente');
}

// Editar receta
function editRecipe(recipeId) {
    // Obtener usuario actual
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Obtener recetas
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        alert('No se encontró la receta');
        return;
    }
    
    // Verificar que la receta pertenece al usuario
    if (recipe.authorId !== currentUser.id) {
        alert('No tienes permiso para editar esta receta');
        return;
    }
    
    // Redireccionar a la página de edición con el ID de la receta
    window.location.href = `edit-recipe.html?id=${recipeId}`;
}
