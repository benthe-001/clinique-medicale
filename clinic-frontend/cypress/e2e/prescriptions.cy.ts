describe('Module Prescriptions - Local', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@clinique.com');
    cy.get('input[type="password"]').type('admin123');
    cy.contains('button', 'Se connecter').click();
    cy.url().should('include', '/dashboard');
  });

  it('ADMIN ou MEDECIN devrait pouvoir créer une nouvelle prescription', () => {
    // 1. Navigation vers le menu Prescriptions
    cy.contains('a', 'Prescriptions').click();
    cy.url().should('include', '/prescriptions');
    cy.contains('Prescriptions').should('be.visible');

    // 2. Ouvrir la modale
    cy.contains('button', 'Nouvelle prescription').click();

    // 3. Remplir les informations générales obligatoires
    cy.get('select[formControlName="patientId"]').select(
      'Ibrahima Bobo Diallo',
    );
    cy.get('select[formControlName="medecinId"]').select(1); // Sélectionne le premier médecin de la liste

    // Saisie des dates obligatoires
    cy.get('input[formControlName="datePrescription"]').type('2026-06-25');
    cy.get('input[formControlName="dateExpiration"]').type('2026-07-25');

    // Optionnel : Ajout d'un diagnostic
    cy.get('input[formControlName="diagnostic"]').type('Suivi général');

    // 4. Remplir la section Médicaments (ciblage par placeholders)
    cy.get('input[placeholder="Amlodipine"]').first().type('Paracétamol');
    cy.get('input[placeholder="5mg"]').first().type('500mg');
    cy.get('input[placeholder="1 fois/jour"]').first().type('3 fois par jour');
    cy.get('input[placeholder="30 jours"]').first().type('5 jours');

    // 5. Enregistrer l'ordonnance
    cy.contains('button', 'Créer la prescription').click();

    // 6. Validation : Attendre la fermeture de la modale et vérifier le retour à la liste
    cy.get('div.fixed.inset-0').should('not.exist');
    cy.contains('Prescriptions').should('be.visible');
    cy.get('body').should('contain', 'Ibrahima Bobo Diallo');
  });
});
