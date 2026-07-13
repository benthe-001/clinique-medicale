describe('Module Authentification - Local', () => {
  // Ce bloc s'exécute avant CHACUN des tests ci-dessous
  beforeEach(() => {
    cy.visit('/login');
  });

  it('Devrait charger la page de connexion de la clinique', () => {
    cy.contains('button', 'Se connecter').should('be.visible');
  });

  // NOTRE NOUVEAU TEST
  it('ADMIN se connecte avec succès et accède au tableau de bord', () => {
    // 1. On cible le champ email par son type d'attribut et on saisit l'identifiant
    cy.get('input[type="email"]').type('admin@clinique.com');

    // 2. On fait pareil pour le mot de passe (ajuste 'admin123' avec le vrai mot de passe de test s'il est différent)
    cy.get('input[type="password"]').type('admin123');

    // 3. On clique sur le bouton de connexion
    cy.contains('button', 'Se connecter').click();

    // 4. ASSERTION FINALE : On vérifie que l'URL change et contient '/dashboard'
    cy.url().should('include', '/dashboard');
  });

  it("Devrait afficher un message d'erreur en cas de mauvais mot de passe", () => {
    // 1. Saisie d'un email valide mais d'un mauvais mot de passe
    cy.get('input[type="email"]').type('admin@clinique.com');
    cy.get('input[type="password"]').type('mauvais_pass_123');

    // 2. Clic sur le bouton
    cy.contains('button', 'Se connecter').click();

    // 3. ASSERTIONS :
    // L'URL ne doit PAS avoir changé vers le dashboard, on reste sur /login
    cy.url().should('include', '/login');

    // On vérifie qu'un message d'erreur apparaît à l'écran
    // (Note : Ajuste le texte exact si ton Spring Boot renvoie un message différent)
    cy.contains('Email ou mot de passe incorrect').should('be.visible');
  });
});
