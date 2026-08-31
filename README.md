# isle-website

The marketing and documentation site for [Isle](https://github.com/matthewhamilton3141/isle) —
a Dynamic Island for the MacBook notch, for Spotify and Claude Code.

Static HTML, no build step. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
```

## Pages

| File | What's on it |
|---|---|
| `index.html` | Hero and the recording, the two live activities, how the media layer works, the marker catalogue, requirements |
| `install.html` | The four install steps, the quarantine explanation, permissions, troubleshooting, building from source |
| `changelog.html` | Release history |

## Assets

- `assets/isle.css` — all styles, tokens at the top
- `assets/isle.js` — the island replica, the recording, and the marker catalogue
- `assets/favicon.svg` — the app's 3×3 dot mark

## The design

The page is the display, so the bar at the top of every page is the macOS menu
bar with the notch cut out of it for real: `initBarSheet()` in `assets/isle.js`
paints the bar as a filled rectangle with the island's shape subtracted from
it. The island is drawn behind the bar and shows through the hole, which makes
it the only true black on the page.

The replica opens once and never again. On load it widens out of the camera
housing (`--cutout-w`) to its collapsed width, on the same spring the app uses,
with the hole in the bar opening alongside it because they are the same path —
then it holds still. There is no panel, no transport and no hover state: the
recording is where you watch it move. What it does do is follow the page: each
section names a state in `data-marker`, and the marker and its word change as
you pass.
Everything else is
cool aluminium; the marker catalogue and the Claude field notes are the one
place the sheet gives way to black, because that is the ground markers live on
in the app.

Type is Archivo (display, run wide), Inter Tight (body) and Martian Mono
(labels, state names, data). Code is set in the system mono — SF Mono on the
machines this app runs on.

## Colour from the cover

The app tints its `palette` markers and its waveform from the album artwork.
The demo cover here is drawn rather than decoded, so `ART` in `assets/isle.js`
holds the stops of the gradient `.art` paints, and `artColor(t)` samples it.
Every waveform bar and every dot of a palette marker takes its colour from that
one function — change `ART` and the whole page follows.

## The recording

The hero plays one capture, `assets/demo.mp4`, with `assets/demo.jpg` as its
poster. It is muted, looping and autoplaying, so it carries no audio track and
needs none.

It is cut from `isle-final.mp4` — a 1440×1080 screen recording of the notch on a
14-inch MacBook Pro — cropped to the island itself. The expanded panel spans x 28–1324 of the 1440
wide capture, so there is no margin to be had on the left by cropping — the
crop takes the panel's own bounds and `.demo__stage` supplies the margins as
padding, which is why the video sits on a dark mat:

```bash
ffmpeg -i isle-final.mp4 -an -vf "crop=1298:540:28:280" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset slow \
  -movflags +faststart assets/demo.mp4

ffmpeg -ss 10 -i isle-final.mp4 -frames:v 1 -vf "crop=1298:540:28:280" \
  -q:v 4 assets/demo.jpg
```

The crop is what makes it usable on a page: the raw capture is 4:3 with a dead
band of desktop above and below, which would push everything else off the
screen. `540` tall is enough for the panel at its full height. If you re-record
at a different size, re-derive the crop and update the `aspect-ratio` on
`.demo__stage` to match — the stage reserves the video's shape so the page
doesn't jump when it loads.

Until a capture exists the stage keeps a stand-in rather than collapsing, so the
page is never broken by a missing file. `initDemo()` marks the stage ready on
the first `loadeddata`, which is what hides the stand-in.

## Staying in sync with the app

The island in the menu bar is a working replica. The notch outline is the same
path the app draws (`NotchShape.swift`), and each marker — its lit dots, colour,
animation and speed — comes from `MarkerDesign.default(for:)`.

Those values are not copied by hand. `scripts/sync-from-swift.mjs` reads the
app's source and rewrites the generated block in each file:

```bash
node scripts/sync-from-swift.mjs            # expects the app at ../isle
node scripts/sync-from-swift.mjs ~/src/isle # or pass the repo
node scripts/sync-from-swift.mjs --check    # verify only, exits 1 if stale
```

| From | What it takes |
|---|---|
| `MarkerDesign.swift` | every marker's lit dots, colour mode, animation, speed, intensity, ghost |
| `MarkerKind.swift` | each state's title and one-line detail |
| `NotchShape.swift` | the default corner radii of the outline |
| `NotchMetrics.swift` | the size of the expanded panel |

Run it after touching any of those four files. Everything outside the generated
blocks is the site's own and is safe to edit.

The site draws four of the app's sixteen states — working, question, waiting for
input, done — listed in `SHOWN` in `assets/isle.js` along with the word the
island puts beside each one. (`working` reads *Thinking…* there: it is the app's
word for the state, in the site's voice.) Those four are also the site's
structure: every section is typed by one of them, shown in the label above its
heading. To show another state, add a line to `SHOWN`; the design comes from the
generated block. Pages point at a marker by key through `data-marker` (drives the
island as you scroll past a section) and `data-dots` (a static grid inline in the
page); the script fails if either points at a state `SHOWN` doesn't list.

## Structure

Three pages, and every one of them earns its own destination in the bar: the
overview, the install steps, the changelog. Music and Claude Code are cards in
`#activities` on the overview rather than pages of their own — they are what the
product *is*, not somewhere you go.

The overview runs: recording, the two activities, how the media layer works, the
marker set, requirements, download.

## Deploying

Any static host. For GitHub Pages, push this folder to a repository and enable
Pages on the branch root — there is nothing to compile.
