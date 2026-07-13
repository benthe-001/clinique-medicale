import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200', // <-- On dit à Cypress d'aller chercher TON Angular local
    setupNodeEvents(on, config) {
      // On laisse ça vide pour l'instant, on en aura besoin plus tard
    },
    viewportWidth: 1280, // Largeur de l'écran pour le test
    viewportHeight: 720, // Hauteur de l'écran
  },
});
