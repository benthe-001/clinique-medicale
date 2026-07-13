describe('Module Facturation - Local', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@clinique.com'); // Corrigé : @clinique.com
    cy.get('input[type="password"]').type('admin123');
    cy.contains('button', 'Se connecter').click();
    cy.url().should('include', '/dashboard');
  });

  it('ADMIN devrait consulter le module facturation et voir les cartes de factures', () => {
    cy.contains('a', 'Facturation').click();
    cy.url().should('include', '/billing');
    cy.contains('Facturation').should('be.visible');
    cy.contains('Revenus encaissés').should('be.visible');
    cy.contains('160 050 FCFA').should('be.visible');
    cy.contains('Yaya Camara').should('be.visible');
  });

  it('ADMIN devrait créer une nouvelle facture avec succès', () => {
    // 1. Aller sur le module Facturation
    cy.contains('a', 'Facturation').click();

    // 2. Cliquer sur le bouton "Nouvelle facture"
    cy.contains('button', 'Nouvelle facture').click();

    // 3. Remplir le formulaire
    cy.get('select[formControlName="patientId"]').select(
      'Ibrahima Bobo Diallo',
    );

    // LA CORRECTION : On remplit le champ de date obligatoire
    cy.get('input[type="date"]').first().type('2026-06-25');

    // Remplissage de la ligne de facturation
    cy.get('input[formControlName="description"]')
      .first()
      .clear()
      .type('Consultation générale');
    cy.get('input[formControlName="prixUnitaire"]')
      .first()
      .clear()
      .type('50000');
    cy.get('input[formControlName="quantite"]').first().clear().type('1');

    // 4. Soumettre le formulaire (le bouton ne sera plus désactivé !)
    cy.contains('button', 'Créer la facture').click();

    // 5. Validation : On attend la fermeture de la modale et on vérifie l'affichage
    cy.get('div.fixed.inset-0').should('not.exist');
    cy.contains('Facturation').should('be.visible');
    cy.get('body').should('contain', 'Ibrahima Bobo Diallo');
  });
});
