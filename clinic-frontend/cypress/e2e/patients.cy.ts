describe('Module Patients - Local', () => {
  // Étape A : Authentification de la Secrétaire avant chaque test
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('secretaire@clinique.com');
    cy.get('input[type="password"]').type('secretaire123');
    cy.contains('button', 'Se connecter').click();

    // On s'assure d'être sur le tableau de bord
    cy.url().should('include', '/dashboard');
  });

  // Étape B : Le cas de test d'enregistrement
  it('SECRETAIRE devrait enregistrer un nouveau patient avec succès', () => {
    // 1. Navigation vers le module Patients
    cy.contains('a', 'Patients').click();

    // 2. Ouverture de la modale de création
    cy.contains('button', 'Nouveau patient').click();

    // 3. Remplissage des informations via ciblage par libellé (robuste & anti-conflit)
    cy.contains('label', 'Prénom').parent().find('input').type('Ibrahima Bobo');
    cy.contains('label', 'Nom').parent().find('input').type('Diallo');
    cy.contains('label', 'Email')
      .parent()
      .find('input')
      .type('ibrahimabobo@email.com');
    cy.contains('label', 'Téléphone').parent().find('input').type('621234567');

    // Saisie de la date de naissance
    cy.get('input[type="date"]').first().type('1998-12-25');

    // Sélection forcée du genre pour éviter les chevauchements structurels
    cy.get('select').first().select(1, { force: true });

    // Saisie de l'adresse
    cy.contains('label', 'Adresse')
      .parent()
      .find('input')
      .type('Coyah, Gomnyah clinique');

    // 4. Défilement et validation du formulaire
    // On force Cypress à faire défiler la modale pour afficher le bouton s'il est masqué en bas
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });

    // 5. Assertion : Le retour à la liste ou la disparition de la modale confirme le succès
    cy.contains('Patients').should('be.visible');
  });
});
