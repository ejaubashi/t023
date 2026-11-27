# Afterglow

Afterglow is a two-screen social web prototype. It uses an editorial feed and immersive story viewer to try out four social formats.

## Run locally

Run this command from the repository root.

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses plain JavaScript, HTML, and CSS with a Node.js 20+ development server. It needs no package installation. Use `PORT` to override the default port, or set `HOST=127.0.0.1` to bind to loopback only.

## Try the formats

| Format | Where to try it |
| --- | --- |
| **Living posts** | On Feed, open the timeline on **Blue hour, off the grid.** Create a living post to add a chapter of your own. |
| **Remixes** | Use **Remix** on a post. The resulting post links back to its source and credits the original author. |
| **Shared stories** | On Stories, open **Poolside** and select **Add your frame**. Creating a story lets you choose whether to open it to contributions. |
| **Reveal frames** | Open **Reveal frames** in the lab, or go to the second frame of **Night shift**. The photo and caption appear when you select **Tap to reveal**. |

Use the arrow keys to move between frames and Escape to close the viewer. The demo uses one local profile, retains stories, and keeps new content and interactions in the current browser.

## Research

- Mastodon exposes a post’s edit history. Afterglow turns that pattern into authored chapters visible directly on a living post. [Mastodon status methods](https://github.com/mastodon/documentation/blob/main/content/en/methods/statuses.md)
- Bluesky’s composer embeds a quoted post while composing a new post. Afterglow keeps provenance visible on published remixes and links each one to the source. [Bluesky composer source](https://github.com/bluesky-social/social-app/blob/main/src/view/com/composer/Composer.tsx)
- Pixelfed’s story model includes duration, expiration, and interactions. Afterglow explores a story as a sequence of attributed frames that can accept contributions. [Pixelfed story model](https://github.com/pixelfed/pixelfed/blob/dev/app/Models/Story.php)
- Mastodon allows viewers to open obscured media on demand. Afterglow applies that explicit interaction to individual story frames. [Mastodon content warnings](https://github.com/mastodon/documentation/blob/main/content/en/user/posting.md#content-warnings-cw)

The demo photographs and portraits were generated for Afterglow. Manrope is bundled under the [SIL Open Font License](public/assets/manrope-OFL.txt).
