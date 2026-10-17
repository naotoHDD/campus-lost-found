INSERT INTO "Category" ("name", "slug", "updatedAt")
VALUES
    ('Électronique', 'électronique', CURRENT_TIMESTAMP),
    ('Documents', 'documents', CURRENT_TIMESTAMP),
    ('Clés', 'clés', CURRENT_TIMESTAMP),
    ('Sacs', 'sacs', CURRENT_TIMESTAMP),
    ('Vêtements', 'vêtements', CURRENT_TIMESTAMP),
    ('Bijoux', 'bijoux', CURRENT_TIMESTAMP),
    ('Portefeuilles', 'portefeuilles', CURRENT_TIMESTAMP),
    ('Animaux', 'animaux', CURRENT_TIMESTAMP),
    ('Téléphones et tablettes', 'téléphones-et-tablettes', CURRENT_TIMESTAMP),
    ('Ordinateurs', 'ordinateurs', CURRENT_TIMESTAMP),
    ('Audio et accessoires', 'audio-et-accessoires', CURRENT_TIMESTAMP),
    ('Cartes bancaires', 'cartes-bancaires', CURRENT_TIMESTAMP),
    ('Chaussures', 'chaussures', CURRENT_TIMESTAMP),
    ('Montres', 'montres', CURRENT_TIMESTAMP),
    ('Lunettes', 'lunettes', CURRENT_TIMESTAMP),
    ('Jouets', 'jouets', CURRENT_TIMESTAMP),
    ('Articles de sport', 'articles-de-sport', CURRENT_TIMESTAMP),
    ('Outils', 'outils', CURRENT_TIMESTAMP),
    ('Véhicules et accessoires', 'véhicules-et-accessoires', CURRENT_TIMESTAMP),
    ('Autre', 'autre', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;