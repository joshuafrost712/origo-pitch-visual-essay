# Adding a recommendation

The Recommendations tab reads `src/content/recommendations.json`. Cards appear in the order of the array.

1. **Photo.** Crop a square headshot to 400 x 400 px, JPEG, under about 80 KB. Save it as `public/recommendations/<id>.jpg`, where `<id>` is the person's name in lowercase with hyphens (`jane-doe`). Keep any full-size source images in `tools/headshot-candidates/<id>/`, which git ignores.
2. **Entry.** Add an object to the `recommendations` array:
   - `id`: the same `<id>`. It becomes the link `#/recommendations/<id>`.
   - `name`, `title` (the person's latest title, as they or their organization state it), `org`.
   - `photo`: the file name, such as `jane-doe.jpg`. Leave it `""` to show their initials until a photo arrives.
   - `photoCredit`: where the photo came from.
   - `date`: the letter's date, `YYYY-MM-DD`.
   - `full`: the letter, one string per paragraph, **verbatim**. Drop only the greeting and the sign-off.
   - `snippet`: one to three sentences copied **verbatim** from `full`. Join non-adjacent pieces with ` … ` (space, ellipsis, space). Every piece must appear word for word in the letter.
3. **Check.** Run `npm run build`, then open `#/recommendations` and the new detail page at desktop and phone width. Commit and push; GitHub Pages deploys it.
