describe('Module Statistiques - Local', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@clinique.com');
    cy.get('input[type="password"]').type('admin123');
    cy.contains('button', 'Se connecter').click();
    cy.url().should('include', '/dashboard');
  });

  it('ADMIN devrait consulter les statistiques et voir les indicateurs globaux', () => {
    // 1. Navigation (Correction de la route)
    cy.contains('a', 'Statistiques').click();
    cy.url().should('include', '/stats'); // Modifié pour correspondre à ton app

    // 2. Vérification des éléments visuels du tableau de bord
    cy.contains('Classement médecins par nombre de RDV').should('be.visible');
    cy.contains('Dr. Pierre Bernard').should('be.visible');

    // Vérifier que le canvas ou conteneur du graphique est bien présent
    cy.get('canvas').should('exist');
  });
});
