# Invitation check — 20 September 2026

Public invitation: https://0xdrchkn.github.io/saras-30th/

## What has been verified

Ten simulated guests submitted through the invitation's real client adapter using separate authenticated local sessions: seven accepted, three declined, ten stories, and twenty JPEG uploads (one to three per guest). Each response restored through a fresh adapter using its saved session. All twenty organiser download links returned bytes matching the source files. These are marked `TEST 01` through `TEST 10` and remain in the local guest book for inspection. Existing replies were preserved.

The organiser browser showed the expected totals, filtered the three declined replies, found a guest by name, and displayed that guest's story and three photos. The separate integration suite passed all 25 assertions covering RSVP updates, story-only submissions, photo replacement, interrupted-upload recovery, file validation, guest isolation, organiser access and deletion of its own disposable records.

This checks the local service, not submission delivery from public GitHub Pages. Demo photos came from the existing invitation album; demo stories are explicitly fictional. No guests were contacted. Private test evidence is in the ignored local `tmp/TEN-GUESTS-CHECK.json` file.

| Capability | Current status |
| --- | --- |
| Public invitation, English/Norwegian, photo album | Published at the new URL |
| RSVP, story, photo save and organiser review | Verified locally on this Mac |
| Guest submissions from the public URL | Not connected |
| Music | Player exists; no recording is configured |
| Guest editing | Same browser/session restores and updates its reply |
| Tracking invited people who have not replied | No invite roster; dashboard only knows submitted replies |
| Identifying the same guest on another device | No cross-device identity; another device may create a duplicate |
| HEIC photo previews | Browser-dependent; originals remain downloadable |

## Simplest proposed route to send invitations

Keep the Gatsby website on GitHub Pages and embed one Tally form for name, RSVP, optional story and up to three photos. An English/Norwegian form can collect the actual answers; the host uses Tally's Submissions dashboard and email notifications. The free tier accepts files up to 10 MB each and respondents do not need an account. Free embeds retain Tally branding. A host account and a published form are still needed; this option has **not** been connected.

Using Tally's dashboard is the short route. Automatically mirroring its responses into the custom local organiser would be an additional integration, so it is not part of this proposal. Replies and uploads would be stored by Tally and could be downloaded to the host's computer.

Alternatives:

- Google Forms collects responses and files, but guests must sign into Google to upload photos.
- Discord can receive messages and attachments through a webhook. Its secret must stay off the public website, so a safe website integration still needs a server or relay and does not eliminate setup.
- Local storage keeps data on the Mac. The current local stack uses Supabase software in Docker, with no cloud account. A purely local address cannot receive remote guests' replies. An Internet-facing HTTPS connection and an awake, connected Mac would be required; none has been exposed.

Sources checked 20 September 2026: [Tally uploads](https://tally.so/help/file-uploads), [embedding](https://tally.so/help/embed-your-form), [host email notifications](https://tally.so/help/self-email-notifications), [Google file-upload sign-in](https://support.google.com/docs/answer/15473134?hl=en), [Discord webhooks](https://docs.discord.com/developers/resources/webhook), [GitHub Pages static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
