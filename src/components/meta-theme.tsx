
'use client';

export const MetaTheme = ({ color }: { color: string }) => (
  <>
    <meta name="theme-color" content={color} />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <style>{`html,body{background:${color}}`}</style>
  </>
);
