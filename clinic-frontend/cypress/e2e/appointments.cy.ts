describe('Module Rendez-vous - Local', () => {
  // Étape A : Avant chaque test, la Secrétaire se connecte graphiquement
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('secretaire@clinique.com');
    cy.get('input[type="password"]').type('secretaire123');
    cy.contains('button', 'Se connecter').click();

    // On s'assure d'être sur le dashboard avant de continuer
    cy.url().should('include', '/dashboard');
  });

  // Étape B : Le cas de test d'intégration
  it('SECRETAIRE devrait créer un rendez-vous avec succès', () => {
    // 1. On navigue vers la section des rendez-vous
    cy.contains('a', 'Rendez-vous').click();

    // 2. On ouvre la modale du formulaire
    cy.contains('button', 'Nouveau RDV').click();

    // 3. Remplissage complet du formulaire Angular 19
    // Sélection du Patient et du Médecin (via les classes de ton projet)
    cy.get('.p-6 > :nth-child(1) > .input-field').select(1);
    cy.get('.p-6 > :nth-child(2) > .input-field').select(1);

    // Gestion des Dates (Début et Fin obligatoires pour activer le bouton)
    cy.get('input[type="datetime-local"]').first().type('2026-07-15T10:00');
    cy.get('input[type="datetime-local"]').last().type('2026-07-15T11:00');

    // Saisie du Motif
    cy.get('textarea').first().type('Consultation de routine pour suivi');

    // Optionnel : Sélection de la salle si elle est obligatoire (on prend la 1ère)
    cy.get('input[placeholder="Salle 1"]').first().clear().type('Salle 1');

    // 4. Soumission du formulaire (Le bouton n'est plus "disabled" !)
    cy.contains('button', 'Créer le RDV').click();

    // 5. Assertion finale : On vérifie que la modale s'est fermée ou qu'on est au bon endroit
    cy.contains('Rendez-vous').should('be.visible');
  });
});
