# Exercise image bank

Exercise demonstrations shown by Atlas come from
[Free Exercise DB](https://github.com/yuhonas/free-exercise-db), an open public-domain
dataset distributed under [The Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md).

The application references the upstream start/end JPG pair rather than vendoring 120 files into
the mobile bundle. `packages/api-client/src/mock/exercise-media.ts` contains the reviewed mapping
between every Atlas exercise slug and its source exercise ID. Atlas always retains its generated
cover art as an offline/error fallback.
