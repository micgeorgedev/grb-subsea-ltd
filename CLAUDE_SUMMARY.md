# GRB SUBSEA LTD Static Site Handoff Summary

This repository is a static clone/customization of the McDermott website, converted for GRB SUBSEA LTD and deployed for `https://grbsubsealtd.com/`.

## Current Repository

- Local repo path: `/root/grb-subsea-ltd`
- Branch: `main`
- Remote: `https://github.com/micgeorgedev/grb-subsea-ltd.git`
- Test hosting: Vercel preview deployments
- Production domain (not connected during testing): `https://grbsubsealtd.com/`

## Major Work Completed

### Static Site Clone

- The source site was recursively mirrored into a static `dist`-style folder.
- `index.html` is at the repository root.
- HTML, CSS, JS, images, fonts, videos, and Drupal-style generated assets were preserved locally where available.
- Asset paths were normalized enough for local/live static serving.
- The site is deployed to Vercel preview URLs for testing.

### GRB SUBSEA LTD Rebranding

Across the static export, McDermott branding and contact information were replaced with GRB SUBSEA LTD information:

- `McDermott` and `McDermott International` were replaced with `GRB SUBSEA LTD`.
- `mcdermott.com` / `McDermott.com` were replaced with `grbsubsealtd.com`.
- Contact/careers email references were replaced with GRB SUBSEA LTD email addresses where found.
- Contact information was updated to include:
  - `+44 20 7946 0351`
  - `London Corporate Headquarters (UK)`
  - `1 Canada Square, Canary Wharf, London, E14 5AB, United Kingdom`
- Canonical/meta/domain references were updated where found.

### Image and Broken Asset Fixes

- Broken image URLs generated from malformed Drupal-style WebP paths were repaired.
- The GRB SUBSEA LTD logo asset exists locally at:
  - `themes/custom/grbsubsealtd_corp_theme/grbsubsealtd-white-logo.svg`
- The specific Sustainability image that previously had a broken path exists locally at:
  - `sites/default/files/styles/webp/public/2026-03/Sustainability 1 (1).png__q__itok_gfMbcHd0__e879540b.webp`

Important remaining caveat: not every referenced image/icon asset is fully local/offline-clean yet. A later scan found:

- `952` local image files under `/root/grb-subsea-ltd`
- `422` unique local image references
- `12` remaining external image/icon URLs, mostly Drupal core UI icons under `https://www.grbsubsealtd.com/core/...`
- `28` missing local image/icon references, mostly Bootstrap Barrio file-type icons, Drupal misc icons, and FontAwesome SVG webfont references

The main visible content imagery appears local, but some theme/UI icon/font assets still need cleanup if full offline operation is required.

### Social, News, Press, and Helpline Removal

A repeatable cleanup script was added:

- `cleanup-social-news.js`

That script processes the static export and removes:

- Social media navigation/components:
  - `menu--social-links`
  - Facebook/Twitter/LinkedIn/YouTube social classes/links
  - homepage/header/footer social blocks
- `News & Insights` menu and footer links
- Links to `news-insights` and `press-release-detail` content
- `Subscribe to Latest News` CTAs
- The exact Convercent Helpline URL:
  - `https://app.convercent.com/en-US/LandingPage/8dba4f3d-baae-ec11-a98a-000d3ab9f296`
- Homepage latest press release block
- About page News & Insights promo card
- Investors page Press Releases card

The script also deletes dedicated News/Press archive content:

- `news-insights.html`
- `news-insights/`
- `press-release-detail/`
- `taxonomy/term/`

The cleanup intentionally leaves `Social Commitments` sustainability content intact.

## Verification Already Run

### Removed Content Marker Scan

The following marker scan returned zero matches in `/root/grb-subsea-ltd`:

```bash
rg -n "menu--social-links|facebook-social-link|twitter-social-link|linkedin-social-link|youtube-soical-link|news-insights|press-release-detail|News &amp; Insights|Subscribe to Latest News|app\.convercent\.com/en-US/LandingPage/8dba4f3d-baae-ec11-a98a-000d3ab9f296|>Helpline<" /root/grb-subsea-ltd
```

The equivalent scan should also be run against any future production document root.

```bash
rg -n "menu--social-links|news-insights|press-release-detail|Subscribe to Latest News|app\.convercent\.com/en-US/LandingPage/8dba4f3d-baae-ec11-a98a-000d3ab9f296|>Helpline<" /path/to/production-root
```

### Key Page Checks

These live pages returned HTTP `200` when checked with `curl -k -I`:

- `https://grbsubsealtd.com/`
- `https://grbsubsealtd.com/about-us.html`
- `https://grbsubsealtd.com/investors.html`
- `https://grbsubsealtd.com/sustainability/social-commitments.html`

Note: `curl` required `-k` because the server presented a self-signed certificate to the command-line client.

### Git State

After the cleanup commit and push:

```bash
git status --short --branch
```

showed:

```text
## main...origin/main
```

That means the working tree was clean at that point.

## Recommended Next Steps

1. Make the remaining theme/UI icon assets fully local:
   - Drupal core icons under `core/misc/icons`
   - Drupal misc GIFs such as loading/throbber assets
   - Bootstrap Barrio file-type icons under `themes/custom/contrib/bootstrap_barrio/images`
   - FontAwesome SVG webfont files under `assets/vendor/webfonts`

2. Re-run the external/missing asset scan after fixing those assets.

3. If additional cleanup is needed, update `cleanup-social-news.js` rather than manually editing generated HTML one file at a time.

4. After any changes, create a new Vercel preview deployment, then commit and push.

