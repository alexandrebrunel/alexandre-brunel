# Alexandre Brunel, portfolio

One-page portfolio site. Plain HTML, CSS and JavaScript, no build step, so it runs as-is on GitHub Pages.

## What's in the folder

```
index.html            the page (all the text lives here)
css/style.css         layout, colours and fonts (colour tokens at the top)
js/main.js            search-bar intro, highlights, before/after tabs, slide viewer, full-size view, copy button
images/               screenshots, portrait, Getzem slides, share image, home-screen icon
fonts/                self-hosted fonts and their licences
videos/               put getzem-promo.mp4 here
files/                put your CV here as Alexandre-Brunel-CV.pdf
favicon.svg
.nojekyll             tells GitHub Pages to serve the files as they are
```

## Before you publish

1. **CV**: save your CV as `files/Alexandre-Brunel-CV.pdf`. Three links point to it. This copy will be public, so consider removing your phone number from it.
2. **Video**: save the promo video as `videos/getzem-promo.mp4` (MP4, H.264). Keep it under 50 MB. GitHub refuses files over 100 MB.
3. **Share image**: in `index.html`, replace `YOUR-USERNAME.github.io` in the `og:image` line with your real site address. This is the picture LinkedIn shows when you post the link.
4. **LinkedIn**: the page links to `linkedin.com/in/alexandre-brunel-b37252150`. Your CV uses `linkedin.com/in/alexandre-brunel`. Open both, keep the one that works, and use it everywhere (2 places in `index.html`).

## Publish on GitHub Pages

1. Create a repository on GitHub. Name it `your-username.github.io` to get the address `https://your-username.github.io/`. Any other name gives `https://your-username.github.io/repository-name/`.
2. Upload everything in this folder, keeping the subfolders (Add file > Upload files, then drag the folder contents in).
3. Go to Settings > Pages. Under "Build and deployment", choose "Deploy from a branch", branch `main`, folder `/ (root)`, then Save.
4. Wait a minute or two, then open the address shown at the top of that page.

To use your own domain later, add it under Settings > Pages > Custom domain.

## Check it on your computer first

Double-click `index.html`. Everything works offline. Some browsers (Firefox in particular) refuse custom fonts on a page opened straight from disk, so the preview may show a plainer font. That goes away once the site is online.

## Editing

- **Text**: everything visible is in `index.html`. Each case study is a `<section class="case">`.
- **Colours and fonts**: the variables at the top of `css/style.css` (`--ink`, `--link`, `--marker` and so on). Dark mode has its own set just below.
- **Yellow highlights**: each `<span class="mark">` has `--x`, `--y`, `--w`, `--h`, in percent of the screenshot's width and height. `--bx` and `--by` move the numbered badge (0% = left/top, 100% = right/bottom).
- **Adding a screenshot**: copy an existing `<figure class="evidence">` block, change the image, the size attributes and the marks, and write the matching "What to look for" lines (`data-mark` numbers must match).

## What was changed in the images

- `ai-max.png`: the impressions change read 3% on the original slide. 618,959 to 945,872 is +53%, so the cell now says 53%. Two red spell-check underlines were removed.
- `semrush.png`: cropped above the "Traffic Insights" panel, which spelled out the site's name.
- `ad-strength.png`, `before-launch.png`, `after-launch.png`: thin black frames trimmed. Content unchanged.
- `getzem/slide-1.webp` to `slide-7.webp`: exported from the Spanish deck after fixing its translation errors (the corrected .pptx is delivered separately).

## Credits

- Display font: TeX Gyre Heros Condensed, GUST Font License (`fonts/TeX-Gyre-Heros-GUST-FONT-LICENSE.txt`).
- Text font: Instrument Sans, SIL Open Font License 1.1 (`fonts/InstrumentSans-OFL.txt`).
