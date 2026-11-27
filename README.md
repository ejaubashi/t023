# Afterglow Studio

Afterglow is a browser-based creator tool with two screens for making social content. Each screen starts with an editable example and has a separate draft. The canvas sits between the effect controls and the editor on wide screens. On a narrow screen, the **Canvas**, **Effects**, and **Edit** dock opens the tools below the live preview.

- **Post Studio** lets you edit a main post and its context layer, upload photos, and compare a color treatment against the original by dragging a divider. Export the selected layer as a 1080 × 1350 PNG.
- **Story Studio** lets you write an opening and two routes with independent frames and endings. Edit the choice labels, play both routes in the preview, and export individual frames as 1080 × 1920 PNGs. The interactive paths live in the studio preview.

## Work with spatial effects

- **Prism** refracts the photo through six offset rings.
- **Echo** displaces horizontal samples around the center of an effect.
- **Fork Lens** uses the first photo from each story route as a movable overlay.

Drag on the artwork or focus the position marker and use the arrow keys. Adjust **Intensity** and **Spread** in the effect rail. **Play orbit** moves the effect along a loop, and **Freeze here** keeps the current position. PNG export renders the spatial effect at the current position. The Grade tab shows and exports the color treatment on its own.

## Record motion

1. Select **Record** and drag the effect directly on the canvas. You can also move the focused point with the arrow keys and select **Finish**.
2. Use the gesture track to play, pause, or scrub through the recorded path. Each layer or story frame keeps its own take.
3. Use **Export motion** to download a short video. The browser chooses MP4 or WebM. **Export PNG** captures the current frame.

Takes run for up to four seconds. The built-in examples include a playable take.

## Workspace design

The artwork sits on a single stage. The effect controls and the editor float alongside it on desktop. **Focus** hides both panels for a closer look. Press Escape or select **Show tools** to restore them. On narrow screens, the dock switches between Canvas, Effects, and Edit. Use the left and right arrow keys while a dock button is focused.

- Penpot uses a selection-aware inspector. Afterglow adapts that pattern so the editor shows the controls for the active layer or story frame. [Penpot inspector source](https://github.com/penpot/penpot/blob/develop/frontend/src/app/main/ui/workspace/sidebar/options.cljs)
- VS Code groups contextual controls around the working area. Afterglow keeps the motion controls beneath the canvas and allows the side panels to be hidden together. [VS Code UX guidelines](https://code.visualstudio.com/api/ux-guidelines/overview)
- Radix documents arrow-key navigation for toolbars. Afterglow applies that interaction to the mobile workspace dock. [Radix Toolbar](https://www.radix-ui.com/primitives/docs/components/toolbar)

Drafts and edits are saved in the current browser. All image processing and exports run locally.

## Run the studio

From the repository root, run `npm run dev` and open [http://localhost:3000](http://localhost:3000). The project uses Node.js 20+ with no install step. Set `PORT` to use a different port.

The `public/` directory can be served by a static host. The GitHub Pages workflow deploys it to [Afterglow Studio](https://ejaubashi.github.io/t023/).

## Research

- Mastodon makes earlier versions of a status available through edit history. Post Studio adapts layered context as something a creator prepares alongside the main frame. [Mastodon status history](https://github.com/mastodon/documentation/blob/main/content/en/methods/statuses.md#view-edit-history-of-a-status-history)
- H5P branching scenarios model choices that lead to different content and endings. Story Studio applies that interaction to short, editable portrait frames. [H5P branching scenario](https://github.com/h5p/h5p-branching-scenario/blob/master/semantics.json)

The example photos were generated for Afterglow. Manrope and Bricolage Grotesque are bundled under the SIL Open Font License. [Manrope license](public/assets/manrope-OFL.txt) · [Bricolage license](public/assets/bricolage-OFL.txt)
