describe('Module Messagerie - Local', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@clinique.com');
    cy.get('input[type="password"]').type('admin123');
    cy.contains('button', 'Se connecter').click();
    cy.url().should('include', '/dashboard');
  });

  it('ADMIN devrait consulter le module messagerie et envoyer un message', () => {
    // 1. Navigation vers le menu Messagerie
    cy.contains('a', 'Messagerie').click();
    cy.url().should('include', '/messaging');

    // 2. Vérification de l'état initial
    cy.contains('Messagerie').should('be.visible');
    cy.contains('Sélectionnez une conversation').should('be.visible');

    // 3. Cliquer sur la secrétaire Marie Dubois
    cy.contains('Marie Dubois').click();
    cy.contains('Sélectionnez une conversation').should('not.exist');

    // 4. Saisir et envoyer le message de façon ciblée
    // On va chercher l'input ou le textarea restant sur la page
    cy.get('textarea, input[type="text"]')
      .last()
      .type('Bonjour Marie, as-tu finalisé le rapport de facturation ?');

    // CORRECTION : On simule l'envoi en appuyant sur "Entrée" directement dans le champ,
    // ou on cible le tout dernier bouton de la page (qui est généralement celui d'envoi)
    cy.get('textarea, input[type="text"]').last().type('{enter}');

    // 5. Validation : Vérifier que le message apparaît dans le fil de discussion
    cy.contains(
      'Bonjour Marie, as-tu finalisé le rapport de facturation ?',
    ).should('be.visible');
  });
});
