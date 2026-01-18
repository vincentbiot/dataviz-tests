# Application de Test de Datavisualisations

Une application web interactive permettant de comparer différentes représentations graphiques de données numériques simulées avec D3.js.

## Fonctionnalités

### Générateur de données simulées
- Ajustement du nombre de répondants (10 à 1000)
- Plage de valeurs personnalisable (min/max)
- 5 types de distributions statistiques :
  - Distribution normale (avec moyenne et écart-type ajustables)
  - Distribution uniforme
  - Distribution bimodale
  - Distribution asymétrique à droite
  - Distribution asymétrique à gauche
- Possibilité d'ajouter des outliers contrôlés (0-20%)

### Visualisations D3.js
L'application propose 6 types de visualisations :
1. **Histogramme** - Représentation classique de la distribution
2. **Box Plot** - Boîte à moustaches avec outliers
3. **Violin Plot** - Densité de probabilité visualisée
4. **Dot Plot** - Nuage de points avec jitter
5. **Density Plot** - Courbe de densité (kernel density estimation)
6. **Bar Chart** - Graphique en barres des statistiques descriptives

### Statistiques descriptives
Affichage automatique de :
- Nombre d'observations (N)
- Moyenne
- Médiane
- Écart-type
- Quartiles (Q1, Q3)
- Valeurs minimale et maximale

### Export
- Exportation de toutes les visualisations au format SVG

## Installation

Aucune installation n'est nécessaire. Il suffit d'ouvrir le fichier `index.html` dans un navigateur web moderne.

## Utilisation

1. Ouvrez `index.html` dans votre navigateur
2. Ajustez les paramètres dans le panneau de contrôle à gauche :
   - Nombre de répondants
   - Valeurs min/max
   - Type de distribution
   - Paramètres spécifiques (moyenne, écart-type pour distribution normale)
   - Pourcentage d'outliers
3. Cliquez sur "Générer les données" pour actualiser les visualisations
4. Utilisez "Exporter les graphiques" pour sauvegarder les visualisations en SVG

## Technologies utilisées

- **HTML5/CSS3** - Structure et style
- **JavaScript (ES6)** - Logique applicative
- **D3.js v7** - Visualisations de données
- **Design responsive** - Compatible desktop et mobile

## Structure du projet

```
dataviz-tests/
├── index.html              # Page principale
├── css/
│   └── style.css          # Styles de l'application
├── js/
│   ├── dataGenerator.js   # Générateur de données simulées
│   ├── visualizations.js  # Toutes les visualisations D3.js
│   └── app.js            # Logique principale et gestion des événements
└── README.md             # Documentation
```

## Cas d'usage

Cette application est utile pour :
- Chercheurs et analystes testant différentes visualisations
- Enseignants illustrant les concepts de distribution statistique
- Designers de données prototypant des visualisations
- Apprentissage des visualisations D3.js

## Améliorations futures possibles

- Export au format PNG/JPEG
- Personnalisation des couleurs
- Comparaison côte à côte de plusieurs jeux de données
- Annotations personnalisées
- Import de données depuis fichier CSV
