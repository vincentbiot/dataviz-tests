# Visualisation de distributions numériques

Une application web interactive permettant de comparer différentes représentations graphiques de données numériques simulées avec D3.js. Conçue avec le design kit .VTH pour une expérience visuelle moderne et professionnelle.

## Fonctionnalités

### Mode Comparaison
- **Analyse d'un ou deux échantillons** - Comparez deux distributions simultanément
- **Visualisations synchronisées** - Échelle Y commune pour une comparaison équitable
- **Légende interactive** - Identification claire des échantillons par couleur

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
- Génération indépendante pour chaque échantillon

### Visualisations D3.js
L'application propose 3 types de visualisations :
1. **Box Plot** - Boîte à moustaches avec outliers détectés (règle 1.5 × IQR)
2. **Violin Plot** - Densité de probabilité visualisée en forme de violon
3. **Density Plot** - Courbe de densité lissée (kernel density estimation)

### Affichage des data points
- **Toggle interactif** - Afficher/masquer les points de données bruts (coché par défaut)
- **Jitter automatique** - Dispersion horizontale pour éviter la superposition
- **Mise en évidence des outliers** - Points aberrants en couleur distincte
- **Tooltips informatifs** - Valeur exacte au survol des points
- **Optimisation de performance** - Échantillonnage automatique pour grands datasets (>2000 points)

### Statistiques descriptives
Affichage automatique pour chaque échantillon :
- Nombre d'observations (N)
- Moyenne
- Médiane
- Écart-type
- Quartiles (Q1, Q3)
- Valeurs minimale et maximale

### Export
- Exportation de toutes les visualisations au format SVG

## Design

### Palette de couleurs
L'application utilise le design kit .VTH avec une palette de couleurs cohérente :
- **Échantillon 1** : Teal (#3A9484) - ATIH graph-4
- **Échantillon 2** : Rose (#D276CA) - Rose Graphs
- **Outliers** : Rose foncé (#DF6277) - HAD graph-6
- **Interface principale** : Dégradé teal (#1C7E6D → #054237)
- **Panels** : Bleu-gris (#E5E7F4) pour contraste optimal

### Typographie
- **Font principale** : Inter (Google Fonts)
- **Poids disponibles** : 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)
- Hiérarchie claire avec titres, labels et valeurs statistiques

## Installation

Aucune installation n'est nécessaire. Il suffit d'ouvrir le fichier `index.html` dans un navigateur web moderne.

Pour un serveur local (recommandé) :
```bash
python -m http.server 8000
# Puis naviguez vers http://localhost:8000
```

## Utilisation

### Configuration de l'échantillon 1
1. Ajustez les paramètres dans le panneau de contrôle :
   - Nombre de répondants (10-1000)
   - Valeurs min/max
   - Type de distribution
   - Paramètres spécifiques (moyenne, écart-type pour distribution normale)
   - Pourcentage d'outliers (0-20%)

### Ajout d'un échantillon 2 (optionnel)
2. Cliquez sur **"+ Ajouter un échantillon 2"**
3. Configurez l'échantillon 2 avec ses propres paramètres
4. Les deux échantillons apparaîtront côte à côte dans les visualisations

### Génération et visualisation
5. Cliquez sur **"Générer les données"** pour créer/actualiser les visualisations
6. Sélectionnez le type de graphique souhaité (Box Plot, Violin Plot, Density Plot)
7. Cochez/décochez **"Afficher les data points"** pour voir les points bruts
8. Survolez les points et zones pour voir les tooltips informatifs

### Export
9. Utilisez **"Exporter en SVG"** pour sauvegarder les visualisations

## Technologies utilisées

- **HTML5/CSS3** - Structure et style avec CSS variables
- **JavaScript (ES6)** - Logique applicative modulaire
- **D3.js v7** - Visualisations de données interactives
- **Inter Font (Google Fonts)** - Typographie moderne
- **Design System .VTH** - Palette de couleurs et composants
- **Design responsive** - Compatible desktop, tablette et mobile

## Structure du projet

```
dataviz-tests/
├── index.html              # Page principale
├── css/
│   └── style.css          # Styles avec CSS variables (Design Kit .VTH)
├── js/
│   ├── dataGenerator.js   # Générateur de données simulées
│   ├── visualizations.js  # Visualisations D3.js (Box, Violin, Density)
│   └── app.js            # Logique principale et gestion mode comparaison
├── divers/
│   ├── design_kit.md      # Documentation du Design Kit .VTH
│   └── design_kit.png     # Référence visuelle du Design Kit
├── CLAUDE.md              # Instructions pour Claude Code
└── README.md              # Documentation (ce fichier)
```

## Architecture

L'application utilise une architecture modulaire avec 3 composants principaux :

1. **DataGenerator** (`js/dataGenerator.js`)
   - Génère des datasets avec différentes distributions statistiques
   - Calcule les statistiques descriptives (moyenne, médiane, écart-type, quartiles)
   - Implémente la transformation Box-Muller pour distributions normales

2. **Visualizations** (`js/visualizations.js`)
   - Gère le rendu D3.js sur canvas SVG
   - Supporte mode simple et mode comparaison (2 échantillons)
   - Tooltips interactifs et optimisation de performance

3. **App** (`js/app.js`)
   - Contrôleur principal et gestion des événements
   - Coordination entre DataGenerator et Visualizations
   - Gestion de l'état de l'interface (mode comparaison, paramètres)

## Cas d'usage

Cette application est utile pour :
- **Chercheurs** - Comparer visuellement deux échantillons ou distributions
- **Analystes** - Tester différentes représentations graphiques de données
- **Enseignants** - Illustrer les concepts de distribution statistique et d'outliers
- **Data designers** - Prototyper des visualisations avec le Design Kit .VTH
- **Apprentissage** - Comprendre D3.js v7 et les visualisations statistiques

## Fonctionnalités implémentées

✅ Comparaison de deux échantillons côte à côte
✅ Affichage des data points avec jitter
✅ Détection automatique des outliers (1.5 × IQR)
✅ Tooltips interactifs
✅ Export SVG
✅ Design System .VTH
✅ Responsive design

## Améliorations futures possibles

- Export au format PNG/JPEG
- Comparaison de 3+ échantillons simultanément
- Tests statistiques (t-test, ANOVA, etc.)
- Annotations personnalisées sur les graphiques
- Import de données depuis fichier CSV
- Thèmes de couleurs alternatifs
