// auth.js - Manejo de autenticación
document.addEventListener('DOMContentLoaded', function() {
    
    // ✅ Manejar formulario de LOGIN
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // ✅ Prevenir recarga de página
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Validación básica
            if (!email || !password) {
                alert('Por favor, completa todos los campos');
                return;
            }
            
            try {
                console.log('Intentando login con:', { email }); // Debug
                
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                console.log('Respuesta del servidor:', data); // Debug
                
                if (response.ok) {
                    // ✅ Login exitoso
                    localStorage.setItem('currentUser', JSON.stringify(data));
                    alert('¡Bienvenido!');
                    window.location.href = 'index.html';
                } else {
                    // ❌ Error en login
                    alert(data.error || 'Error en las credenciales');
                }
                
            } catch (error) {
                console.error('Error en login:', error);
                alert('Error de conexión. Intenta de nuevo.');
            }
        });
    }
    
    // ✅ Manejar formulario de REGISTRO
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validaciones
            if (!firstName || !lastName || !username || !email || !password) {
                alert('Por favor, completa todos los campos obligatorios');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }
            
            if (password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        username,
                        email,
                        password,
                        avatar: 'https://via.placeholder.com/150' // Avatar por defecto
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
                    window.location.href = 'login.html';
                } else {
                    alert(data.error || 'Error en el registro');
                }
                
            } catch (error) {
                console.error('Error en registro:', error);
                alert('Error de conexión. Intenta de nuevo.');
            }
        });
    }
});
