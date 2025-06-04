document.addEventListener('DOMContentLoaded', () => {
    // Carga de recetas en la página principal
    const recipesContainer = document.getElementById('recipesContainer');
    if (recipesContainer) {
        // Cargar datos de recetas
        loadRecipes();
        
        // Filtrado y ordenamiento
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', loadRecipes);
        }
        
        if (sortFilter) {
            sortFilter.addEventListener('change', loadRecipes);
        }
    }
    
    // Carga de receta individual
    const recipeContainer = document.getElementById('recipeContainer');
    if (recipeContainer) {
        loadRecipeDetails();
    }
    
    // Formulario de comentarios
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', addComment);
        
        // Mostrar/ocultar sección de comentarios según autenticación
        const addCommentSection = document.getElementById('addCommentSection');
        const loginPrompt = document.getElementById('loginPrompt');
        
        if (isAuthenticated()) {
            if (addCommentSection) addCommentSection.classList.remove('hidden');
            if (loginPrompt) loginPrompt.classList.add('hidden');
        } else {
            if (addCommentSection) addCommentSection.classList.add('hidden');
            if (loginPrompt) loginPrompt.classList.remove('hidden');
        }
    }
    
    // Formulario para añadir receta
    const addRecipeForm = document.getElementById('addRecipeForm');
    if (addRecipeForm) {
        // Verificar autenticación
        if (!isAuthenticated()) {
            alert('Debes iniciar sesión para publicar una receta');
            window.location.href = 'login.html';
        }
        
        // Botones para añadir ingredientes e instrucciones
        const addIngredientBtn = document.getElementById('addIngredientBtn');
        const addInstructionBtn = document.getElementById('addInstructionBtn');
        
        if (addIngredientBtn) {
            addIngredientBtn.addEventListener('click', addIngredientRow);
        }
        
        if (addInstructionBtn) {
            addInstructionBtn.addEventListener('click', addInstructionRow);
        }
        
        // Envío del formulario
        addRecipeForm.addEventListener('submit', submitRecipe);
    }
});

// Cargar recetas en la página principal
function loadRecipes() {
    const recipesContainer = document.getElementById('recipesContainer');
    if (!recipesContainer) return;

    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const sortFilter = document.getElementById('sortFilter')?.value || 'latest';

    fetch('/recipes')
        .then(res => res.json())
        .then(recipes => {
            if (categoryFilter !== 'all') recipes = recipes.filter(r => r.category === categoryFilter);
            recipes = sortRecipes(recipes, sortFilter);
            recipesContainer.innerHTML = recipes.map(recipe => `
                <div class="recipe-card">
                    <div class="recipe-image"><img src="${recipe.image}" alt="${recipe.title}"></div>
                    <div class="recipe-content">
                        <h3 class="recipe-title">${recipe.title}</h3>
                        <div class="recipe-meta">
                            <span>${formatDate(recipe.createdAt)}</span>
                            <span class="recipe-rating">${generateStarRating(recipe.rating)} (${recipe.ratingCount || 0})</span>
                        </div>
                        <p class="recipe-description">${recipe.description}</p>
                        <div class="recipe-footer">
                            <div class="recipe-author">
                                <img src="${recipe.authorAvatar || getUserAvatar(recipe.authorId)}" alt="${recipe.author}">
                                <span>${recipe.author}</span>
                            </div>
                            <a href="recipe.html?id=${recipe._id}" class="view-recipe">Ver Receta <i class="fas fa-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
            `).join('');
            if (recipes.length === 0) recipesContainer.innerHTML = `<div class="no-recipes"><p>No hay recetas.</p></div>`;
        })
        .catch(err => console.error('Error cargando recetas:', err));
}

// Cargar detalles de una receta
function loadRecipeDetails() {
    const recipeContainer = document.getElementById('recipeContainer');
    if (!recipeContainer) return;
    
    // Obtener ID de la receta de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = parseInt(urlParams.get('id'));
    
    if (!recipeId) {
        window.location.href = 'index.html';
        return;
    }
    
    fetch(`/recipes/${recipeId}`)
        .then(res => res.json())
        .then(recipe => {
            if (!recipe) {
                recipeContainer.innerHTML = `
                    <div class="recipe-not-found">
                        <h2>Receta no encontrada</h2>
                        <p>La receta que buscas no existe o ha sido eliminada.</p>
                        <a href="index.html" class="btn btn-primary">Volver al inicio</a>
                    </div>
                `;
                return;
            }
            
            // Actualizar título de la página
            document.title = `${recipe.title} - KiwiLimón`;
            
            // Mostrar detalles de la receta
            recipeContainer.innerHTML = `
                <div class="recipe-header">
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-header-image">
                    <div class="recipe-header-overlay">
                        <h1 class="recipe-title-large">${recipe.title}</h1>
                        <div class="recipe-author-large">
                            <img src="${getUserAvatar(recipe.authorId)}" alt="${recipe.author}">
                            <span>Por ${recipe.author}</span>
                        </div>
                    </div>
                </div>
                
                <div class="recipe-stats">
                    <div class="stat-item">
                        <span class="stat-value">${recipe.prepTime}</span>
                        <span class="stat-label">Prep (min)</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${recipe.cookTime}</span>
                        <span class="stat-label">Cocción (min)</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${recipe.servings}</span>
                        <span class="stat-label">Porciones</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${generateStarRating(recipe.rating)}</span>
                        <span class="stat-label">${recipe.rating.toFixed(1)} (${recipe.ratingCount || 0})</span>
                    </div>
                </div>
                
                <div class="recipe-body">
                    <p class="recipe-description-large">${recipe.description}</p>
                    
                    <div class="recipe-section">
                        <h2 class="recipe-section-title">Ingredientes</h2>
                        <ul class="ingredients-list">
                            ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="recipe-section">
                        <h2 class="recipe-section-title">Instrucciones</h2>
                        <ol class="instructions-list">
                            ${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
            
            // Cargar comentarios
            loadComments(recipeId);
        })
        .catch(err => console.error('Error cargando receta:', err));
}

// Cargar comentarios de una receta
function loadComments(recipeId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    fetch(`/recipes/${recipeId}/comments`)
        .then(res => res.json())
        .then(comments => {
            if (!comments || comments.length === 0) {
                commentsList.innerHTML = `
                    <div class="no-comments">
                        <p>No hay comentarios para esta receta. ¡Sé el primero en comentar!</p>
                    </div>
                `;
                return;
            }
            
            // Mostrar comentarios
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <div class="comment-author">
                            <img src="${getUserAvatar(comment.userId)}" alt="${comment.author}">
                            <span>${comment.author}</span>
                        </div>
                        <div class="comment-date">${formatDate(comment.createdAt)}</div>
                    </div>
                    <div class="comment-rating">${generateStarRating(comment.rating)}</div>
                    <p class="comment-text">${comment.content}</p>
                </div>
            `).join('');
        })
        .catch(err => console.error('Error cargando comentarios:', err));
}

// Añadir un comentario
function addComment(e) {
    e.preventDefault();
    if (!isAuthenticated()) return alert('Debes iniciar sesión para comentar');
    const urlParams = new URLSearchParams(window.location.search);
    const rid = urlParams.get('id');
    const content = document.getElementById('commentContent').value;
    const rating = parseInt(document.getElementById('commentRating').value);
    const currentUser = getCurrentUser();
    fetch(`/recipes/${rid}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, content, rating })
    })
        .then(res => res.json())
        .then(() => window.location.reload())
        .catch(err => alert('Error al agregar comentario: ' + err.message));
}

// Enviar formulario de receta
function submitRecipe(e) {
    e.preventDefault();
    if (!isAuthenticated()) {
        alert('Debes iniciar sesión para publicar una receta');
        window.location.href = 'login.html';
        return;
    }
    const currentUser = getCurrentUser();
    const recipeData = {
        title: document.getElementById('recipeTitle').value,
        description: document.getElementById('recipeDescription').value,
        category: document.getElementById('recipeCategory').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        prepTime: parseInt(document.getElementById('prepTime').value),
        cookTime: parseInt(document.getElementById('cookTime').value),
        servings: parseInt(document.getElementById('servings').value),
        ingredients: Array.from(document.querySelectorAll('.ingredient-input')).map(inp => inp.value).filter(v => v),
        instructions: Array.from(document.querySelectorAll('.instruction-input')).map(inp => inp.value).filter(v => v.trim()),
        image: document.getElementById('recipeImage').files[0] ? URL.createObjectURL(document.getElementById('recipeImage').files[0]) : document.getElementById('recipeImageUrl').value,
        authorId: currentUser.id
    };
    fetch('/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
    })
        .then(res => res.json())
        .then(result => fetch(`/users/${currentUser.id}/recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeId: result.insertedId })
        }).then(() => result.insertedId))
        .then(id => {
            alert('Receta publicada con éxito');
            window.location.href = `recipe.html?id=${id}`;
        })
        .catch(err => alert('Error al publicar receta: ' + err.message));
}

// Añadir fila de ingrediente
function addIngredientRow() {
    const ingredientsList = document.getElementById('ingredientsList');
    const ingredientRows = ingredientsList.querySelectorAll('.ingredient-row');
    
    // Mostrar botones de eliminar en filas existentes
    ingredientRows.forEach(row => {
        row.querySelector('.remove-btn').classList.remove('hidden');
    });
    
    // Añadir nueva fila
    const newRow = document.createElement('div');
    newRow.className = 'ingredient-row';
    newRow.innerHTML = `
        <input type="text" class="ingredient-input" placeholder="Ingrediente" required>
        <input type="text" class="quantity-input" placeholder="Cantidad">
        <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Añadir evento para eliminar fila
    newRow.querySelector('.remove-btn').addEventListener('click', function() {
        ingredientsList.removeChild(newRow);
    });
    
    ingredientsList.appendChild(newRow);
}

// Añadir fila de instrucción
function addInstructionRow() {
    const instructionsList = document.getElementById('instructionsList');
    const instructionRows = instructionsList.querySelectorAll('.instruction-row');
    
    // Mostrar botones de eliminar en filas existentes
    instructionRows.forEach(row => {
        row.querySelector('.remove-btn').classList.remove('hidden');
    });
    
    // Añadir nueva fila
    const newRow = document.createElement('div');
    newRow.className = 'instruction-row';
    newRow.innerHTML = `
        <span class="step-number">${instructionRows.length + 1}</span>
        <textarea class="instruction-input" placeholder="Instrucción" required></textarea>
        <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Añadir evento para eliminar fila
    newRow.querySelector('.remove-btn').addEventListener('click', function() {
        instructionsList.removeChild(newRow);
        // Actualizar números de paso
        updateStepNumbers();
    });
    
    instructionsList.appendChild(newRow);
}

// Actualizar números de paso
function updateStepNumbers() {
    const instructionRows = document.querySelectorAll('.instruction-row');
    instructionRows.forEach((row, index) => {
        row.querySelector('.step-number').textContent = index + 1;
    });
}

// Obtener el avatar de un usuario
function getUserAvatar(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || getSampleUsers();
    const user = users.find(user => user.id === userId);
    return user ? user.avatar : 'https://ui-avatars.com/api/?name=Usuario&background=random';
}

// Obtener usuarios de ejemplo
function getSampleUsers() {
    return [
        {
            "id": 1,
            "firstName": "Chef",
            "lastName": "Master",
            "username": "chefmaster",
            "email": "chef@example.com",
            "password": "Password123",
            "avatar": "https://ui-avatars.com/api/?name=Chef+Master&background=random",
            "joinDate": "2025-01-15T10:30:00Z",
            "recipes": [1, 2],
            "favorites": [3]
        },
        {
            "id": 2,
            "firstName": "María",
            "lastName": "López",
            "username": "marialopez",
            "email": "maria@example.com",
            "password": "Password123",
            "avatar": "https://ui-avatars.com/api/?name=María+López&background=random",
            "joinDate": "2025-02-20T14:15:00Z",
            "recipes": [3],
            "favorites": [1, 2]
        }
    ];
}

// Ordenar recetas según el criterio seleccionado
function sortRecipes(recipes, sortCriteria) {
    switch(sortCriteria) {
        case 'latest':
            return [...recipes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'popular':
            return [...recipes].sort((a, b) => b.ratingCount - a.ratingCount);
        case 'rating':
            return [...recipes].sort((a, b) => b.rating - a.rating);
        default:
            return recipes;
    }
}
