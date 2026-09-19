# Guest responses and memories — deferred

The current forms preview a named yes/no RSVP and a favourite story with up to three photos (20 MB each). All processing stays in the guest’s browser; neither a response nor a file is transmitted. Selecting photos makes temporary local previews. Reloading clears the contribution. Do not tell invitees their reply has been collected until storage is connected.

## Invitation flow

The simplest first release is one shared invitation URL. Send it privately to guests; each guest enters their name and selects “I will be there” or “Got better stuff to do”. An organiser screen should show replied / attending / declined. To show exactly who has not replied, keep a private guest roster and reconcile names, or issue opaque individual invitation links. Avoid guest names in URLs and prevent duplicate updates from creating duplicate guests.

## Later storage work

The user considered Google Forms, then asked to defer and consider another store. No provider has been chosen. GitHub Pages only serves static files, so collecting responses from different devices needs a separate service.

Choose a private submission API with a database and object storage. Keep privileged credentials on the server. Limit photo number/size/type on the server as well as in the UI; use scoped upload URLs, rate limiting, private photo access, and an authenticated organiser view. Guests should only change their own submission. Add an explicit explanation that supplied stories/photos may be used in the birthday collage or quiz, plus a contact/removal route.

The organiser should be able to review contributions, export RSVPs, download selected photos, approve stories for the game, and remove submissions after the party. Never commit guests’ uploads or RSVP records into the public Git repository. Shared invitation access does not imply access to submissions or game answers.
