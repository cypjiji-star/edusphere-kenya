
'use client';

export const MetaTheme = ({ color }: { color: string }) => (
  <>
    <meta name="theme-color" content={color} />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    {/* By using dangerouslySetInnerHTML, we tell React not to compare the contents of this tag during hydration,
        which prevents mismatches caused by browser extensions modifying style tags. */}
    <style
      dangerouslySetInnerHTML={{
        __html: `html,body{background:${color}}`,
      }}
    />
  </>
);
