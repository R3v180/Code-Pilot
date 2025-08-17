// Futuras funcionalidades interactivas para la web de Piscinas Jorge Díaz.

document.addEventListener('DOMContentLoaded', function() {
    // Ejemplo de funcionalidad: desplazamiento suave al hacer clic en los enlaces de navegación
    const navLinks = document.querySelectorAll('.nav-links a');

    for (const link of navLinks) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
});
