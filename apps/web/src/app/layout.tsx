import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'MFF Data Hub',
  description: 'Account-aware MFF recommendation dashboard for ABX, ABL, PVE, PVP, gear and roster analysis.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg'
  }
};

export const viewport: Viewport = {
  themeColor: '#6d36ff',
  width: 'device-width',
  initialScale: 1
};

const extensionHydrationCleanupScript = `
(() => {
  const blockedAttributeNames = new Set(['bis_skin_checked', 'bis_register']);
  const blockedAttributePrefixes = ['__processed_'];

  const shouldRemoveAttribute = (name) => (
    blockedAttributeNames.has(name)
    || blockedAttributePrefixes.some((prefix) => name.startsWith(prefix))
  );

  const cleanElement = (element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (shouldRemoveAttribute(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }
  };

  const cleanTree = (root) => {
    if (root instanceof Element) {
      cleanElement(root);
      root.querySelectorAll('*').forEach(cleanElement);
    }
  };

  cleanTree(document.documentElement);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        cleanElement(mutation.target);
      }

      for (const node of mutation.addedNodes) {
        cleanTree(node);
      }
    }
  }).observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });
})();
`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          id="extension-hydration-cleanup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: extensionHydrationCleanupScript }}
        />
        {children}
      </body>
    </html>
  );
}
