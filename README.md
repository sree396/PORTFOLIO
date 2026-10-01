# Sree Vaastava H — Portfolio

A responsive, single-page portfolio built with plain HTML, CSS, and JavaScript. It presents Sree’s background, StudyBuddy project, skills, education, certifications, and contact details. There is no build step or package installation.

## Project structure

```text
.
├── index.html
├── README.md
├── .gitignore
└── assets/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── script.js
    │   └── particle-text.js
    └── images/
        └── hero-cutout-brushed.webp
```

The hero portrait is a transparent WebP sized for its on-page display, keeping the same cutout while loading faster.

## View locally

Open `index.html` in a browser. You can also serve the folder with a local static server if you prefer. No packages need to be installed. Google Fonts load from Google when online; system fallbacks are used offline.

## Update the portfolio

- Edit `index.html` to update the page text, links, education, skills, certifications, and contact details.
- Edit `assets/css/styles.css` to adjust colors, layout, responsive styles, and animations.
- Edit `assets/js/script.js` and `assets/js/particle-text.js` to change page interactions and the particle heading.
- Replace the portrait in `assets/images/` and update the image path in `index.html` if you choose a different version.

## Publish with GitHub Pages

Keep the folder layout above when uploading the project. In the GitHub repository, open **Settings → Pages**, choose **Deploy from a branch**, select the branch you uploaded (usually `main`) and the `/ (root)` folder, then save. GitHub Pages will publish `index.html` and its linked assets from the repository root.
