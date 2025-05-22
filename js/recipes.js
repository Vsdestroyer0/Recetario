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
    
    // Obtener filtros
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const sortFilter = document.getElementById('sortFilter')?.value || 'latest';
    
    // Cargar recetas desde localStorage o datos de ejemplo
    let recipes = JSON.parse(localStorage.getItem('recipes')) || getSampleRecipes();
    
    // Aplicar filtro de categoría
    if (categoryFilter !== 'all') {
        recipes = recipes.filter(recipe => recipe.category === categoryFilter);
    }
    
    // Aplicar ordenamiento
    recipes = sortRecipes(recipes, sortFilter);
    
    // Mostrar recetas en el contenedor
    recipesContainer.innerHTML = recipes.map(recipe => `
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
    
    // Si no hay recetas
    if (recipes.length === 0) {
        recipesContainer.innerHTML = `
            <div class="no-recipes">
                <p>No se encontraron recetas con los filtros seleccionados.</p>
            </div>
        `;
    }
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
    
    // Cargar recetas desde localStorage o datos de ejemplo
    const recipes = JSON.parse(localStorage.getItem('recipes')) || getSampleRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
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
    loadComments(recipe.id);
}

// Cargar comentarios de una receta
function loadComments(recipeId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    // Obtener recetas
    const recipes = JSON.parse(localStorage.getItem('recipes')) || getSampleRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe || !recipe.comments || recipe.comments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments">
                <p>No hay comentarios para esta receta. ¡Sé el primero en comentar!</p>
            </div>
        `;
        return;
    }
    
    // Mostrar comentarios
    commentsList.innerHTML = recipe.comments.map(comment => `
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
}

// Añadir un comentario
function addComment(e) {
    e.preventDefault();
    
    if (!isAuthenticated()) {
        alert('Debes iniciar sesión para comentar');
        return;
    }
    
    // Obtener datos del formulario
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = parseInt(urlParams.get('id'));
    const ratingValue = document.querySelector('input[name="rating"]:checked')?.value;
    const commentText = document.getElementById('commentText').value;
    
    if (!ratingValue) {
        alert('Por favor, selecciona una valoración');
        return;
    }
    
    // Obtener usuario actual
    const currentUser = getCurrentUser();
    
    // Obtener recetas
    const recipes = JSON.parse(localStorage.getItem('recipes')) || getSampleRecipes();
    const recipeIndex = recipes.findIndex(r => r.id === recipeId);
    
    if (recipeIndex === -1) {
        alert('Receta no encontrada');
        return;
    }
    
    // Crear comentario
    const newComment = {
        id: Date.now(),
        userId: currentUser.id,
        author: `${currentUser.firstName} ${currentUser.lastName}`,
        rating: parseFloat(ratingValue),
        content: commentText,
        createdAt: new Date().toISOString()
    };
    
    // Inicializar array de comentarios si no existe
    if (!recipes[recipeIndex].comments) {
        recipes[recipeIndex].comments = [];
    }
    
    // Añadir comentario
    recipes[recipeIndex].comments.unshift(newComment);
    
    // Actualizar valoración media
    updateRecipeRating(recipes[recipeIndex]);
    
    // Guardar cambios
    localStorage.setItem('recipes', JSON.stringify(recipes));
    
    // Recargar comentarios
    loadComments(recipeId);
    
    // Limpiar formulario
    document.getElementById('commentText').value = '';
    document.querySelector('input[name="rating"]:checked').checked = false;
    
    alert('¡Comentario añadido con éxito!');
}

// Actualizar valoración media de una receta
function updateRecipeRating(recipe) {
    if (!recipe.comments || recipe.comments.length === 0) return;
    
    const ratings = recipe.comments.map(comment => comment.rating);
    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    recipe.rating = parseFloat(avgRating.toFixed(1));
    recipe.ratingCount = ratings.length;
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

// Enviar formulario de receta
function submitRecipe(e) {
    e.preventDefault();
    
    if (!isAuthenticated()) {
        alert('Debes iniciar sesión para publicar una receta');
        window.location.href = 'login.html';
        return;
    }
    
    // Obtener datos del formulario
    const title = document.getElementById('recipeTitle').value;
    const description = document.getElementById('recipeDescription').value;
    const category = document.getElementById('recipeCategory').value;
    const difficulty = document.getElementById('recipeDifficulty').value;
    const prepTime = parseInt(document.getElementById('prepTime').value);
    const cookTime = parseInt(document.getElementById('cookTime').value);
    const servings = parseInt(document.getElementById('servings').value);
    
    // Obtener imagen
    let imageUrl = document.getElementById('recipeImageUrl').value;
    const imageFile = document.getElementById('recipeImage').files[0];
    
    // Si hay un archivo de imagen seleccionado, usar eso en lugar de la URL
    if (imageFile) {
        // En una aplicación real, esto subiría el archivo a un servidor
        // y obtendríamos una URL, pero para esta demo usaremos URL.createObjectURL
        imageUrl = URL.createObjectURL(imageFile);
    }
    
    // Si no hay imagen subida ni URL, usar una imagen aleatoria
    if (!imageUrl) {
        imageUrl = `https://source.unsplash.com/random/800x600/?food,${title.replace(/\s+/g, '-')}`;
    }
    
    // Obtener ingredientes
    const ingredientInputs = document.querySelectorAll('.ingredient-input');
    const quantityInputs = document.querySelectorAll('.quantity-input');
    const ingredients = [];
    
    for (let i = 0; i < ingredientInputs.length; i++) {
        const ingredient = ingredientInputs[i].value;
        const quantity = quantityInputs[i].value;
        
        if (ingredient) {
            ingredients.push(quantity ? `${quantity} de ${ingredient}` : ingredient);
        }
    }
    
    // Obtener instrucciones
    const instructionInputs = document.querySelectorAll('.instruction-input');
    const instructions = Array.from(instructionInputs)
        .map(input => input.value)
        .filter(instruction => instruction.trim() !== '');
    
    // Validar datos
    if (ingredients.length === 0) {
        alert('Debes añadir al menos un ingrediente');
        return;
    }
    
    if (instructions.length === 0) {
        alert('Debes añadir al menos una instrucción');
        return;
    }
    
    // Obtener usuario actual
    const currentUser = getCurrentUser();
    
    // Crear nueva receta
    const newRecipe = {
        id: Date.now(),
        title,
        description,
        category,
        difficulty,
        prepTime,
        cookTime,
        servings,
        ingredients,
        instructions,
        authorId: currentUser.id,
        author: `${currentUser.firstName} ${currentUser.lastName}`,
        image: imageUrl,
        rating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
        comments: []
    };
    
    // Guardar receta en localStorage
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    recipes.unshift(newRecipe); // Añadir al inicio para que aparezca primero
    localStorage.setItem('recipes', JSON.stringify(recipes));
    
    // Actualizar recetas del usuario
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex !== -1) {
        if (!users[userIndex].recipes) {
            users[userIndex].recipes = [];
        }
        users[userIndex].recipes.push(newRecipe.id);
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    alert('¡Receta publicada con éxito!');
    window.location.href = `recipe.html?id=${newRecipe.id}`;
}

// Obtener recetas de ejemplo desde el archivo JSON
function getSampleRecipes() {
    // En un entorno real, esto se haría con una petición fetch,
    // pero para simplificar usaremos datos estáticos
    return [
        {
            "id": 1,
            "title": "Tacos al Pastor",
            "description": "Deliciosos tacos al pastor con piña, cebolla y cilantro. Una receta tradicional mexicana que te encantará.",
            "category": "main",
            "difficulty": "medium",
            "prepTime": 30,
            "cookTime": 20,
            "servings": 4,
            "ingredients": [
                "500g de carne de cerdo marinada",
                "8 tortillas de maíz",
                "1/2 piña cortada en cubos",
                "1 cebolla picada",
                "Cilantro fresco picado",
                "2 limones",
                "Salsa al gusto"
            ],
            "instructions": [
                "Cortar la carne en trozos pequeños y dorarla en una sartén.",
                "Calentar las tortillas en un comal o sartén.",
                "Colocar la carne sobre las tortillas.",
                "Añadir piña, cebolla y cilantro al gusto.",
                "Exprimir jugo de limón y añadir salsa."
            ],
            "authorId": 1,
            "author": "Chef Master",
            "image": "https://source.unsplash.com/random/800x600/?tacos",
            "rating": 4.8,
            "ratingCount": 24,
            "createdAt": "2025-05-15T10:30:00Z",
            "comments": [
                {
                    "id": 101,
                    "userId": 2,
                    "author": "María López",
                    "rating": 5,
                    "content": "¡Excelente receta! La hice para mi familia y les encantó.",
                    "createdAt": "2025-05-16T14:20:00Z"
                }
            ]
        },
        {
            "id": 2,
            "title": "Pastel de Chocolate",
            "description": "Un delicioso pastel de chocolate húmedo con cobertura de ganache. Perfecto para cualquier celebración.",
            "category": "dessert",
            "difficulty": "medium",
            "prepTime": 20,
            "cookTime": 40,
            "servings": 8,
            "ingredients": [
                "200g de chocolate negro",
                "200g de mantequilla",
                "200g de azúcar",
                "4 huevos",
                "150g de harina",
                "1 cucharadita de polvo de hornear",
                "100ml de crema para la cobertura"
            ],
            "instructions": [
                "Precalentar el horno a 180°C.",
                "Derretir el chocolate con la mantequilla.",
                "Batir los huevos con el azúcar e incorporar la mezcla de chocolate.",
                "Añadir la harina y el polvo de hornear tamizados.",
                "Hornear durante 35-40 minutos.",
                "Preparar la cobertura y cubrir el pastel una vez frío."
            ],
            "authorId": 1,
            "author": "Chef Master",
            "image": "https://source.unsplash.com/random/800x600/?chocolate-cake",
            "rating": 4.7,
            "ratingCount": 18,
            "createdAt": "2025-05-10T15:45:00Z",
            "comments": [
                {
                    "id": 102,
                    "userId": 2,
                    "author": "María López",
                    "rating": 5,
                    "content": "Este pastel es una delicia. La textura es perfecta.",
                    "createdAt": "2025-05-12T11:30:00Z"
                }
            ]
        },
        {
            "id": 3,
            "title": "Ensalada César",
            "description": "Una clásica ensalada César con pollo a la parrilla, croutones caseros y aderezo cremoso.",
            "category": "main",
            "difficulty": "easy",
            "prepTime": 15,
            "cookTime": 10,
            "servings": 2,
            "ingredients": [
                "1 lechuga romana",
                "200g de pechuga de pollo",
                "50g de queso parmesano",
                "Croutones",
                "2 cucharadas de mayonesa",
                "1 cucharada de mostaza",
                "1 diente de ajo",
                "Jugo de limón",
                "Sal y pimienta"
            ],
            "instructions": [
                "Cocinar el pollo a la parrilla y cortarlo en tiras.",
                "Lavar y cortar la lechuga en trozos.",
                "Preparar el aderezo mezclando mayonesa, mostaza, ajo, jugo de limón, sal y pimienta.",
                "Mezclar la lechuga con el aderezo.",
                "Añadir el pollo, croutones y queso parmesano rallado."
            ],
            "authorId": 2,
            "author": "María López",
            "image": "https://source.unsplash.com/random/800x600/?caesar-salad",
            "rating": 4.5,
            "ratingCount": 12,
            "createdAt": "2025-05-18T09:15:00Z",
            "comments": [
                {
                    "id": 103,
                    "userId": 1,
                    "author": "Chef Master",
                    "rating": 4,
                    "content": "Muy buena receta. El aderezo quedó perfecto.",
                    "createdAt": "2025-05-19T13:40:00Z"
                }
            ]
        }
    ];
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
