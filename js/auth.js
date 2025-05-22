document.addEventListener('DOMContentLoaded', () => {
    // Registro de usuario
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Validación de contraseña en tiempo real
        const passwordInput = document.getElementById('password');
        const strengthBar = document.getElementById('strengthBar');
        const lengthReq = document.getElementById('lengthReq');
        const uppercaseReq = document.getElementById('uppercaseReq');
        const numberReq = document.getElementById('numberReq');
        
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                const password = this.value;
                let strength = 0;
                
                // Requisito de longitud
                if (password.length >= 8) {
                    lengthReq.classList.add('valid');
                    lengthReq.innerHTML = '<i class="fas fa-check-circle"></i> Al menos 8 caracteres';
                    strength += 33;
                } else {
                    lengthReq.classList.remove('valid');
                    lengthReq.innerHTML = '<i class="far fa-circle"></i> Al menos 8 caracteres';
                }
                
                // Requisito de mayúsculas
                if (/[A-Z]/.test(password)) {
                    uppercaseReq.classList.add('valid');
                    uppercaseReq.innerHTML = '<i class="fas fa-check-circle"></i> Al menos una mayúscula';
                    strength += 33;
                } else {
                    uppercaseReq.classList.remove('valid');
                    uppercaseReq.innerHTML = '<i class="far fa-circle"></i> Al menos una mayúscula';
                }
                
                // Requisito de números
                if (/\d/.test(password)) {
                    numberReq.classList.add('valid');
                    numberReq.innerHTML = '<i class="fas fa-check-circle"></i> Al menos un número';
                    strength += 34;
                } else {
                    numberReq.classList.remove('valid');
                    numberReq.innerHTML = '<i class="far fa-circle"></i> Al menos un número';
                }
                
                // Actualizar barra de fortaleza
                strengthBar.style.width = `${strength}%`;
                
                if (strength < 33) {
                    strengthBar.style.backgroundColor = '#dc3545';
                } else if (strength < 66) {
                    strengthBar.style.backgroundColor = '#ffc107';
                } else {
                    strengthBar.style.backgroundColor = '#28a745';
                }
            });
        }
        
        // Envío del formulario de registro
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;
            
            // Validaciones
            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }
            
            if (!terms) {
                alert('Debes aceptar los términos y condiciones');
                return;
            }
            
            // Verificar si el correo o usuario ya existen
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.some(user => user.email === email)) {
                alert('Este correo electrónico ya está registrado');
                return;
            }
            
            if (users.some(user => user.username === username)) {
                alert('Este nombre de usuario ya está en uso');
                return;
            }
            
            // Crear nuevo usuario
            const newUser = {
                id: Date.now(),
                firstName,
                lastName,
                username,
                email,
                password,
                avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
                joinDate: new Date().toISOString(),
                recipes: [],
                favorites: []
            };
            
            // Guardar usuario en localStorage
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Autenticar usuario
            localStorage.setItem('currentUser', JSON.stringify({
                id: newUser.id,
                username: newUser.username,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                avatar: newUser.avatar
            }));
            
            alert('¡Registro exitoso!');
            window.location.href = 'index.html';
        });
    }
    
    // Inicio de sesión
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember')?.checked || false;
            
            // Verificar credenciales
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(user => user.email === email && user.password === password);
            
            if (user) {
                // Usuario autenticado
                localStorage.setItem('currentUser', JSON.stringify({
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.avatar
                }));
                
                if (remember) {
                    localStorage.setItem('rememberedUser', email);
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                
                window.location.href = 'index.html';
            } else {
                alert('Correo electrónico o contraseña incorrectos');
            }
        });
        
        // Autocompletar correo si hay usuario recordado
        const rememberedUser = localStorage.getItem('rememberedUser');
        if (rememberedUser) {
            document.getElementById('email').value = rememberedUser;
            if (document.getElementById('remember')) {
                document.getElementById('remember').checked = true;
            }
        }
    }
});