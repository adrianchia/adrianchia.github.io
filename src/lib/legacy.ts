/** Posts that were served at the site root before the move to /blogs/<slug>/. */
export const LEGACY_SLUGS = [
  '2014-06-16-welcome-to-my-blog',
  '2014-07-03-getting-started-with-android-application-development',
  '2014-07-12-getting-started-with-android-android-development-android-studio-edition-pt-3',
  '2014-07-12-getting-started-with-android-development',
  '2014-07-23-getting-started-on-nodejs',
  '2014-08-22-java-related-changes-since-java-se-6',
  '2014-09-19-openshift-cas-quickstart-released',
  '2015-08-10-recap-on-the-how-to-build-a-startup-on-udacity',
  '2020-08-16-a-gentle-introduction-to-mulesoft-anypoint-platform',
  '2020-08-28-my-journey-towards-aws-certifications',
] as const;

export function legacyRedirects(): Record<string, string> {
  return Object.fromEntries(LEGACY_SLUGS.map((slug) => [`/${slug}/`, `/blogs/${slug}/`]));
}
