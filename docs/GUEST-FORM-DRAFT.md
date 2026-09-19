# Simple guest form — draft

Proposed alternative to running the existing Supabase backend. No Tally form or account is connected yet; this document is ready to use as a form-building brief once the host chooses the service.

## Form content

**Title:** Sara’s 30th · RSVP

**Introduction:** Let us know if you’re coming. You can also share your favourite Sara story and up to three photos for the birthday collage and game.

**Norwegian introduction:** Si fra om du kommer. Du kan også dele din favoritthistorie om Sara og opptil tre bilder til bursdagscollagen og spillet.

1. **Your full name / Ditt fulle navn** — required short text.
2. **Email / E-post** — optional email field, only if the host wants a way to contact guests about their replies.
3. **Are you joining us? / Kommer du?** — required single choice:
   - I will be there / Jeg kommer
   - Got better stuff to do / Har bedre ting å gjøre
4. **Your favourite Sara story / Din favoritthistorie om Sara** — optional long text. Hint: “A great memory, a classic quote, or what happened next. / Et godt minne, et klassisk sitat eller hva som skjedde etterpå.”
5. **Your top three photos / Dine tre beste bilder** — optional image uploads, maximum three files, 10 MB each on Tally’s free plan. Hint: “Choose photos you’re happy for us to show at the party. / Velg bilder du synes det er greit at vi viser på festen.”

**Submission note:** Your story and photos go to the host, who may use them in the birthday collage or quiz. / Historien og bildene sendes til verten, som kan bruke dem i bursdagscollagen eller quizen.

**Button:** Send reply / Send svar

**Confirmation:** Thanks — your reply has been received. / Takk — svaret ditt er mottatt.

Keep story and photos optional, and available to guests who decline too. A guest should be able to RSVP without searching for photographs. Use one bilingual form for one response list; avoid creating duplicate English and Norwegian inboxes.

## Host setup and website connection

- Match the invitation with black background, ivory text and gold buttons. Tally’s free form controls support basic colours and fonts; removing its branding requires a paid plan.
- Keep responses and photos in the host’s account. Do not publish a results page or add response exports to this repository.
- Enable the free owner email notification for each completed response, so the host can see who replied and follow the attached photo links.
- Publish the form, then use the real form link/embed in the invitation. Replace the current RSVP/evidence inputs with the embedded flow; do not leave two competing submit forms.
- Verify one synthetic yes reply, one no reply, and a story with up to three synthetic images in the actual host response list before calling the flow live.
- Do not promise that editing a reply, saving partial progress, or returning later with photos works until those settings have been chosen and verified in the hosted form.

## Official references

- [File uploads](https://tally.so/help/file-uploads): no guest account; free uploads up to 10 MB per file; configurable maximum file count.
- [Owner email notifications](https://tally.so/help/self-email-notifications).
- [Embedding](https://tally.so/help/embed-your-form).
- [Form colours and fonts](https://tally.so/help/customize-your-form).
- [Import a form draft](https://tally.so/help/import).

Discord remains an alternative if the guests already use it: collect attendance and photos directly in a party channel. A Discord webhook is a secret credential and must not be placed in this public website or repository.
