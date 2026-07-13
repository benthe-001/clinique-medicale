describe('Module Utilisateurs - Local', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@clinique.com');
    cy.get('input[type="password"]').type('admin123');
    cy.contains('button', 'Se connecter').click();
    cy.url().should('include', '/dashboard');
  });

  it('ADMIN devrait voir la liste des utilisateurs et ouvrir le formulaire d’ajout', () => {
    // 1. Navigation vers le menu Utilisateurs
    cy.contains('a', 'Utilisateurs').click();
    cy.url().should('include', '/users');

    // 2. Vérification de la présence des éléments de l'interface
    cy.contains('Gestion des utilisateurs').should('be.visible');
    cy.contains('Marie Dubois').should('be.visible');
    cy.contains('Pierre Bernard').should('be.visible');

    // 3. Clic sur le bon bouton d'ajout (Correction ici !)
    cy.contains('button', 'Nouvel utilisateur').click();
  });

  it('ADMIN devrait voir la liste des utilisateurs et créer un nouveau membre', () => {
    // 1. Navigation vers le menu Utilisateurs
    cy.contains('a', 'Utilisateurs').click();
    cy.url().should('include', '/admin/users'); // Cypress montre bien la route complète /admin/users

    // 2. Vérification de la présence des éléments de l'interface
    cy.contains('Gestion des utilisateurs').should('be.visible');

    // 3. Clic sur le bouton d'ajout
    cy.contains('button', 'Nouvel utilisateur').click();

    // 4. Remplissage du formulaire (Basé sur les placeholders visibles)
    cy.get('input[placeholder="Pierre"]').type('Mamadou');
    cy.get('input[placeholder="Bernard"]').type('Diallo');
    cy.get('input[placeholder="pierre@clinique.com"]').type(
      'mamadou.diallo@clinique.com',
    );
    cy.get('input[type="password"]').type('password123');

    // Sélection du rôle (ex: Médecin)
    cy.get('select').select('Médecin');

    // 5. Enregistrement
    cy.contains('button', 'Créer').click();

    // 6. Validation : Fermeture et présence du nouvel utilisateur dans la liste
    cy.get('div.fixed.inset-0').should('not.exist');
    cy.get('body').should('contain', 'Mamadou Diallo');
  });
});
