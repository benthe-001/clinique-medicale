-- Comptes de demonstration. Mot de passe commun : Passer@123
-- Hash BCrypt cost 10, prefixe $2a$ compatible BCryptPasswordEncoder.

INSERT INTO users (id, email, password, nom, prenom, role, actif, created_at) VALUES
                                                                                  ('11111111-1111-4111-8111-111111111111', 'admin@clinique.com',
                                                                                   '$2a$10$AvCWelq1Mp.9coCpEesUW.Rm8dPonoKlETE0a0MKuSTmBNtdH0xV6',
                                                                                   'Admin', 'Principal', 'ADMIN', TRUE, NOW()),
                                                                                  ('22222222-2222-4222-8222-222222222222', 'medecin@clinique.com',
                                                                                   '$2a$10$AvCWelq1Mp.9coCpEesUW.Rm8dPonoKlETE0a0MKuSTmBNtdH0xV6',
                                                                                   'Camara', 'Fatoumata', 'MEDECIN', TRUE, NOW()),
                                                                                  ('33333333-3333-4333-8333-333333333333', 'medecin2@clinique.com',
                                                                                   '$2a$10$AvCWelq1Mp.9coCpEesUW.Rm8dPonoKlETE0a0MKuSTmBNtdH0xV6',
                                                                                   'Barry', 'Mamadou', 'MEDECIN', TRUE, NOW()),
                                                                                  ('44444444-4444-4444-8444-444444444444', 'secretaire@clinique.com',
                                                                                   '$2a$10$AvCWelq1Mp.9coCpEesUW.Rm8dPonoKlETE0a0MKuSTmBNtdH0xV6',
                                                                                   'Sow', 'Aissatou', 'SECRETAIRE', TRUE, NOW())
    ON CONFLICT (email) DO NOTHING;