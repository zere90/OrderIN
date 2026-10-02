// Reset cancels application of in-flight work, including late cache writes.
let revision = 0;
export const aiRevision = () => revision;
export const invalidateAi = () => {
  revision++;
};
