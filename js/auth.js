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

            // Enviar datos al servidor Oracle
            const avatar = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;
            fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, username, email, password, avatar })
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || res.statusText);
                return data;
            })
            .then(data => {
                localStorage.setItem('currentUser', JSON.stringify({
                    id: data.id,
                    username,
                    firstName,
                    lastName,
                    email,
                    avatar
                }));
                alert('¡Registro exitoso!');
                window.location.href = 'index.html';
            })
            .catch(err => alert('Error en registro: ' + err.message));
        });
    }
    
    // Inicio de sesión CON ORACLE
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember')?.checked || false;
            
            // Autenticar con Oracle via backend
            fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error de autenticación');
                return data;
            })
            .then(user => {
                // Usuario autenticado desde Oracle
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                if (remember) {
                    localStorage.setItem('rememberedUser', email);
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                
                alert('¡Inicio de sesión exitoso!');
                window.location.href = 'index.html';
            })
            .catch(err => {
                alert('Error: ' + err.message);
            });
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