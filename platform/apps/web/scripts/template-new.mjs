#!/usr/bin/env node

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const slug = process.argv[2]?.trim();

if (!slug) {
  console.error('Usage: npm run template:new -- <slug>');
  console.error('Example: npm run template:new -- nile-night');
  process.exit(1);
}

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
if (!SLUG_REGEX.test(slug)) {
  console.error(`Error: Invalid slug "${slug}". Slug must be kebab-case (lowercase letters, numbers, and single hyphens).`);
  process.exit(1);
}

const templateDir = path.join(webRoot, 'src/templates', slug);
const registryPath = path.join(webRoot, 'src/templates/registry.ts');
const templateStylesPath = path.join(webRoot, 'src/templates/template-styles.ts');
const publicAssetDir = path.join(webRoot, 'public/assets/demo', slug);

if (existsSync(templateDir)) {
  console.error(`Error: Template directory "${templateDir}" already exists.`);
  process.exit(1);
}

const registryContent = readFileSync(registryPath, 'utf8');
if (registryContent.includes(`slug: '${slug}'`) || registryContent.includes(`'${slug}': {`)) {
  console.error(`Error: Template "${slug}" is already registered in registry.ts.`);
  process.exit(1);
}

// Convert slug to pascalCase, camelCase, Title Case
function toPascalCase(str) {
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
function toTitleCase(str) {
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

const pascalName = toPascalCase(slug);
const camelName = toCamelCase(slug);
const titleName = toTitleCase(slug);

// Create template directory and assets directory
mkdirSync(templateDir, {recursive: true});
mkdirSync(publicAssetDir, {recursive: true});

// 1. Create original starter SVG ornament
const starterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40" fill="none">
  <path d="M60 4 C45 18, 30 20, 0 20 C30 20, 45 22, 60 36 C75 22, 90 20, 120 20 C90 20, 75 18, 60 4 Z" fill="currentColor" fill-opacity="0.3"/>
  <circle cx="60" cy="20" r="3" fill="currentColor"/>
  <circle cx="40" cy="20" r="1.5" fill="currentColor" fill-opacity="0.6"/>
  <circle cx="80" cy="20" r="1.5" fill="currentColor" fill-opacity="0.6"/>
</svg>
`;
writeFileSync(path.join(publicAssetDir, 'ornament.svg'), starterSvg);

// 2. Create data.ts
const dataTsContent = `import {parseInvitationData, type InvitationData} from '@platform/shared';

const ornamentUrl = '/assets/demo/${slug}/ornament.svg';

export const ${camelName}Data: InvitationData = {
  template: {
    eventType: 'wedding',
    siteType: 'full-invitation',
    experienceType: 'interactive-reveal',
    introType: 'tap-to-open',
    layoutFamily: 'classic',
  },
  theme: {
    background: '#1A1D20',
    foreground: '#F4EFEA',
    muted: '#A5ACB5',
    ivory: '#FAF7F2',
  },
  couple: {
    firstName: {ar: 'كريم', en: 'Karim'},
    secondName: {ar: 'مريم', en: 'Mariam'},
    headline: {
      ar: 'بكل حب وسرور ندعوكم لمشاركتنا فرحة العمر',
      en: 'Together with our families, we joyfully invite you to celebrate our wedding',
    },
  },
  event: {
    date: '2027-09-18T19:00:00+02:00',
    displayDate: {
      ar: 'السبت 18 سبتمبر 2027',
      en: 'Saturday, 18 September 2027',
    },
    startTime: {ar: '7:00 مساءً', en: '7:00 PM'},
    endTime: {ar: '1:00 صباحًا', en: '1:00 AM'},
    venue: {
      ar: 'قصر النيل للاحتفالات — القاهرة',
      en: 'Nile Palace Celebration Venue — Cairo',
    },
    location: {ar: 'الزمالك، القاهرة', en: 'Zamalek, Cairo'},
    mapUrl: 'https://maps.google.com/?q=Cairo',
  },
  media: {
    ornamentUrl,
    footerOrnamentUrl: ornamentUrl,
  },
  copy: {
    tapLabel: {ar: 'اضغط للفتح', en: 'Tap to Open'},
    welcomeTitle: {ar: 'أهلاً وسهلاً بكم', en: 'Welcome to Our Celebration'},
    welcome: {
      ar: 'يسعدنا ويشرفنا حضوركم لتشاركونا أجمل لحظات العمر وأسعد الذكريات في ليلتنا المميزة.',
      en: 'We are delighted to invite you to celebrate this unforgettable evening with us.',
    },
    scheduleTitle: {ar: 'برنامج الحفل', en: 'Order of Events'},
    scheduleSubtitle: {ar: 'محطات ليلتنا السعيدة', en: 'The evening schedule'},
    detailsTitle: {ar: 'تفاصيل الحفل', en: 'The Details'},
    detailsSubtitle: {ar: 'الموعد والمكان', en: 'Time & Location'},
    messageTitle: {ar: 'دفتر التهاني', en: 'Guestbook'},
    messageSubtitle: {ar: 'شاركونا أمنياتكم الطيبة', en: 'Leave a note of congratulations'},
  },
  schedule: [
    {
      title: {ar: 'استقبال الضيوف', en: 'Welcome Reception'},
      time: {ar: '7:00 م', en: '7:00 PM'},
    },
    {
      title: {ar: 'الزفة والدخول', en: 'Zaffa & Entrance'},
      time: {ar: '8:00 م', en: '8:00 PM'},
    },
    {
      title: {ar: 'العشاء الملكي', en: 'Dinner'},
      time: {ar: '9:30 م', en: '9:30 PM'},
    },
    {
      title: {ar: 'الاحتفال والرقص', en: 'Celebration & Dancing'},
      time: {ar: '10:30 م', en: '10:30 PM'},
    },
  ],
  sections: [
    {
      type: 'hero',
      props: {
        headline: {
          ar: 'بكل حب وسرور ندعوكم لمشاركتنا فرحة العمر',
          en: 'Together with our families, we joyfully invite you to celebrate our wedding',
        },
        firstName: {ar: 'كريم', en: 'Karim'},
        secondName: {ar: 'مريم', en: 'Mariam'},
        displayDate: {
          ar: 'السبت 18 سبتمبر 2027',
          en: 'Saturday, 18 September 2027',
        },
        scrollCueLabel: {ar: 'تابع القراءة', en: 'Scroll down'},
      },
    },
    {
      type: 'countdown',
      props: {
        date: '2027-09-18T19:00:00+02:00',
        kicker: {ar: 'العد التنازلي', en: 'Countdown'},
        title: {ar: 'في انتظار موعدنا', en: 'Counting the Days'},
        untilLabel: {ar: 'حتى نجتمع معاً', en: 'Until we celebrate together'},
        showSeconds: false,
        labels: {
          days: {ar: 'يوم', en: 'Days'},
          hours: {ar: 'ساعة', en: 'Hours'},
          minutes: {ar: 'دقيقة', en: 'Minutes'},
        },
      },
    },
    {
      type: 'welcome',
      props: {
        kicker: {ar: 'مرحباً بكم', en: 'Welcome'},
        title: {ar: 'أهلاً وسهلاً بكم في ليلتنا', en: 'Welcome to Our Celebration'},
        body: {
          ar: 'يسعدنا ويشرفنا حضوركم لتشاركونا بداية رحلة جديدة مليئة بالحب والمودة والبركة.',
          en: 'We warmly welcome our family and dear friends to join us as we celebrate the beginning of our journey together.',
        },
      },
    },
    {
      type: 'story',
      props: {
        title: {ar: 'قصتنا', en: 'Our Story'},
        chapters: [
          {
            quote: {ar: 'البداية الجميلة', en: 'The Beginning'},
            prose: {
              ar: 'بدأت رحلتنا بلقاء بسيط ملأه الوفاق والمودة، وتلاقت قلوبنا على المحبة والتقدير والاهتمام المشترك.',
              en: 'Our journey began with a simple meeting filled with warmth and harmony, growing stronger with every shared conversation.',
            },
          },
          {
            quote: {ar: 'عهد المحبة', en: 'A Promise of Love'},
            prose: {
              ar: 'وها نحن اليوم نخطو خطوتنا المباركة معاً لنبني بيتاً يملؤه الدفء والسكينة، ونسعد بمشاركتكم هذه اللحظات.',
              en: 'Today we take this joyful step together to build a life filled with peace and love, surrounded by those we cherish.',
            },
          },
        ],
      },
    },
    {
      type: 'schedule',
      props: {
        title: {ar: 'برنامج الحفل', en: 'Order of Events'},
        subtitle: {ar: 'محطات أمسيتنا المميزة', en: 'Schedule of the evening'},
        items: [
          {
            title: {ar: 'استقبال الضيوف', en: 'Welcome Reception'},
            time: {ar: '7:00 م', en: '7:00 PM'},
          },
          {
            title: {ar: 'الزفة والدخول', en: 'Zaffa & Entrance'},
            time: {ar: '8:00 م', en: '8:00 PM'},
          },
          {
            title: {ar: 'العشاء الملكي', en: 'Dinner'},
            time: {ar: '9:30 م', en: '9:30 PM'},
          },
          {
            title: {ar: 'الاحتفال والرقص', en: 'Celebration & Dancing'},
            time: {ar: '10:30 م', en: '10:30 PM'},
          },
        ],
      },
    },
    {
      type: 'details',
      props: {
        title: {ar: 'تفاصيل الحفل', en: 'The Details'},
        subtitle: {ar: 'الموعد والمكان', en: 'Time & Location'},
        venue: {
          ar: 'قصر النيل للاحتفالات — القاهرة',
          en: 'Nile Palace Celebration Venue — Cairo',
        },
        startTime: {ar: '7:00 مساءً', en: '7:00 PM'},
        endTime: {ar: '1:00 صباحًا', en: '1:00 AM'},
        dateLine: {
          ar: 'السبت 18 سبتمبر 2027',
          en: 'Saturday, 18 September 2027',
        },
        addressLines: [
          {ar: 'شارع الجزيرة، حي الزمالك', en: 'Gezira Street, Zamalek'},
          {ar: 'القاهرة، جمهورية مصر العربية', en: 'Cairo, Egypt'},
        ],
        mapUrl: 'https://maps.google.com/?q=Cairo',
        mapLabel: {ar: 'عرض الموقع على الخريطة', en: 'Open in Google Maps'},
        locationLabel: {ar: 'موقع الحفل', en: 'Venue'},
      },
    },
    {
      type: 'dressCode',
      props: {
        title: {ar: 'الزي المفضل', en: 'Dress Code'},
        body: {
          ar: 'الملابس الرسمية الأنيقة (Black Tie Optional). نتطلع لرؤيتكم بأبهى حلة لتكتمل بهجة الليلة.',
          en: 'Black Tie Optional / Formal Evening Wear. We look forward to celebrating in style together.',
        },
      },
    },
    {
      type: 'gallery',
      props: {
        title: {ar: 'لحظات لا تُنسى', en: 'Cherished Moments'},
        images: [],
      },
    },
    {
      type: 'rsvp',
      props: {
        title: {ar: 'تأكيد الحضور', en: 'RSVP'},
        subtitle: {
          ar: 'يسعدنا تأكيد حضوركم قبل الأول من أغسطس',
          en: 'Please confirm your attendance by August 1st',
        },
        guestCountMode: 'stepper',
        attendingLabel: {ar: 'هل ستشاركونا الحفل؟', en: 'Will you be joining us?'},
        attendanceOptions: {
          yes: {ar: 'بكل سرور سأحضر', en: 'Joyfully accept'},
          no: {ar: 'للأسف لا أستطيع الحضور', en: 'Regretfully decline'},
        },
        nameFieldLabel: {ar: 'الاسم الكريم', en: 'Full Name'},
        namePlaceholder: {ar: 'أدخل اسمك الكريم', en: 'Enter your full name'},
        guestCountLabel: {ar: 'عدد الضيوف', en: 'Number of Guests'},
        emailLabel: {ar: 'البريد الإلكتروني', en: 'Email Address'},
        emailPlaceholder: 'name@example.com',
        submitLabel: {ar: 'إرسال التأكيد', en: 'Submit RSVP'},
        successMessage: {
          ar: 'شكرًا لتأكيد حضوركم! نتطلع لرؤيتكم.',
          en: 'Thank you for your response! We look forward to seeing you.',
        },
      },
    },
    {
      type: 'messageForm',
      props: {
        title: {ar: 'دفتر التهاني', en: 'Guestbook'},
        subtitle: {
          ar: 'كلماتكم الطيبة تسعد قلوبنا',
          en: 'Leave a warm note of love and congratulations',
        },
        nameFieldLabel: {ar: 'الاسم', en: 'Your Name'},
        namePlaceholder: {ar: 'أدخل اسمك', en: 'Enter your name'},
        messageLabel: {ar: 'رسالتك للعروسين', en: 'Your Message'},
        messagePlaceholder: {
          ar: 'اكتب أمنياتك وتهانيك للعروسين هنا...',
          en: 'Share your warm wishes and congratulations...',
        },
        submitLabel: {ar: 'إرسال التهنئة', en: 'Send Wishes'},
        successMessage: {
          ar: 'وصلت تهنئتكم ودفأت قلوبنا! شكرًا لكم.',
          en: 'Thank you for your heartfelt message!',
        },
      },
    },
    {
      type: 'footer',
      props: {
        ornamentUrl,
      },
    },
  ],
};

export function get${pascalName}Data(): InvitationData {
  const result = parseInvitationData(${camelName}Data);
  if (!result.ok) {
    throw new Error(\`Invalid ${slug} demo: \${JSON.stringify(result.errors)}\`);
  }
  return result.data;
}
`;
writeFileSync(path.join(templateDir, 'data.ts'), dataTsContent);

// 3. Create styles.css
const stylesCssContent = `/* ==========================================================================
   ${titleName} Template Styles
   ========================================================================== */

.invitation-shell[data-template="${slug}"] {
  --color-primary: #1A1D20;
  --color-accent: #C19A51;
  --color-surface: #24282D;
  --color-sand: #FAF7F2;
  --color-muted-text: #A5ACB5;

  --font-display: var(--font-amiri), serif;
  --font-body: var(--font-ibm-plex-sans-arabic), sans-serif;

  background-color: var(--color-primary);
  color: var(--color-sand);
  font-family: var(--font-body);
  max-inline-size: 100%;
  overflow-x: hidden;
}

.invitation-shell[data-template="${slug}"][dir="rtl"] {
  --font-display: var(--font-amiri), serif;
  --font-body: var(--font-ibm-plex-sans-arabic), sans-serif;
}

.invitation-shell[data-template="${slug}"][dir="ltr"] {
  --font-display: var(--font-cormorant-garamond), serif;
  --font-body: var(--font-inter), sans-serif;
}

.invitation-shell[data-template="${slug}"] .hero-section {
  text-align: center;
  padding-block: 5rem 3rem;
  padding-inline: 1.5rem;
}

.invitation-shell[data-template="${slug}"] .hero-headline {
  font-size: 1rem;
  color: var(--color-accent);
  margin-block-end: 1rem;
}

.invitation-shell[data-template="${slug}"] h1,
.invitation-shell[data-template="${slug}"] h2,
.invitation-shell[data-template="${slug}"] h3 {
  font-family: var(--font-display);
  font-weight: 400;
  color: var(--color-sand);
  margin-block: 0 0.5rem;
}

.invitation-shell[data-template="${slug}"] .section-inner {
  max-inline-size: 42rem;
  margin-inline: auto;
  padding-inline: 1.25rem;
  padding-block: 3rem;
  box-sizing: border-box;
}

.invitation-shell[data-template="${slug}"] section {
  max-inline-size: 100%;
  overflow-x: hidden;
}

.invitation-shell[data-template="${slug}"] .footer-section {
  text-align: center;
  padding-block: 3rem;
  color: var(--color-accent);
}

@media (prefers-reduced-motion: reduce) {
  .invitation-shell[data-template="${slug}"] * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
writeFileSync(path.join(templateDir, 'styles.css'), stylesCssContent);

// 4. Create index.ts
const indexTsContent = `export { get${pascalName}Data, ${camelName}Data } from './data';
export const slug = '${slug}';
`;
writeFileSync(path.join(templateDir, 'index.ts'), indexTsContent);

// 5. Create <slug>.test.ts
const testTsContent = `import fs from 'node:fs';
import path from 'node:path';
import {describe, expect, it, vi} from 'vitest';

vi.mock('next/font/local', () => ({
  default: (opts: {variable?: string}) => ({variable: opts.variable || '--mock-font'}),
}));

import {catalogEntry, parseInvitationData} from '@platform/shared';
import {get${pascalName}Data, ${camelName}Data} from './data';
import {getTemplateAny} from '../registry';

describe('${slug} template', () => {
  it('passes parseInvitationData contract', () => {
    const data = get${pascalName}Data();
    expect(data.template.eventType).toBe('wedding');
    expect(data.sections.length).toBeGreaterThanOrEqual(9);

    const parseResult = parseInvitationData(${camelName}Data);
    expect(parseResult.ok).toBe(true);
  });

  it('contains all required core sections', () => {
    const data = get${pascalName}Data();
    const types = new Set(data.sections.map((s) => s.type));

    expect(types.has('hero')).toBe(true);
    expect(types.has('countdown')).toBe(true);
    expect(types.has('welcome') || types.has('story')).toBe(true);
    expect(types.has('schedule')).toBe(true);
    expect(types.has('details')).toBe(true);
    expect(types.has('dressCode')).toBe(true);
    expect(types.has('gallery')).toBe(true);
    expect(types.has('rsvp')).toBe(true);
    expect(types.has('messageForm')).toBe(true);
    expect(types.has('footer')).toBe(true);
  });

  it('has symmetric Arabic and English text in every localized field', () => {
    const data = get${pascalName}Data();

    function assertBilingual(value: unknown, pathStr = ''): void {
      if (!value || typeof value !== 'object') return;
      if ('ar' in value || 'en' in value) {
        const loc = value as {ar?: unknown; en?: unknown};
        const hasAr = typeof loc.ar === 'string' && loc.ar.trim().length > 0;
        const hasEn = typeof loc.en === 'string' && loc.en.trim().length > 0;
        if (hasAr || hasEn) {
          expect(hasAr, \`missing ar at \${pathStr}\`).toBe(true);
          expect(hasEn, \`missing en at \${pathStr}\`).toBe(true);
        }
      }
      if (Array.isArray(value)) {
        value.forEach((item, index) => assertBilingual(item, \`\${pathStr}[\${index}]\`));
      } else {
        for (const [key, val] of Object.entries(value)) {
          if (key !== 'ar' && key !== 'en') {
            assertBilingual(val, \`\${pathStr}.\${key}\`);
          }
        }
      }
    }

    assertBilingual(data, '${slug}');
  });

  it('ensures CSS is properly scoped to .invitation-shell[data-template="${slug}"]', () => {
    const cssPath = path.resolve(__dirname, './styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const lines = cssContent.split('\\n');

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]?.trim() ?? '';
      if (!line || line.startsWith('/*') || line.startsWith('*') || line.endsWith('*/')) continue;
      if (line.startsWith('@media') || line.startsWith('@keyframes') || line.startsWith('@font-face')) continue;
      if (line === '{' || line === '}') continue;

      if (line.endsWith('{') || line.endsWith(',')) {
        expect(
          line.startsWith('.invitation-shell[data-template="${slug}"]'),
          \`Unscoped selector line in \${cssPath}:\${index + 1}: \${line}\`
        ).toBe(true);
      }
    }
  });

  it('contains no forbidden scraped strings', () => {
    const cssPath = path.resolve(__dirname, './styles.css');
    const serializedData = JSON.stringify(${camelName}Data);
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    const forbidden = ['thedigitalyes', 'typekit', '/assets/drafts'];
    for (const term of forbidden) {
      expect(serializedData.toLowerCase()).not.toContain(term);
      expect(cssContent.toLowerCase()).not.toContain(term);
    }
  });

  it('is registered in registry as draft', () => {
    const t = getTemplateAny('${slug}');
    expect(t).toBeDefined();
    expect(t?.entry.status).toBe('draft');
    expect(catalogEntry.safeParse(t?.entry).success).toBe(true);
  });
});
`;
writeFileSync(path.join(templateDir, `${slug}.test.ts`), testTsContent);

// 6. Update registry.ts
let updatedRegistry = registryContent;

// Insert import before `export interface TemplateDefinition`
const importStatement = `import {get${pascalName}Data} from './${slug}/data';\n`;
const interfaceIndex = updatedRegistry.indexOf('export interface TemplateDefinition');
if (interfaceIndex !== -1) {
  updatedRegistry = updatedRegistry.slice(0, interfaceIndex) + importStatement + updatedRegistry.slice(interfaceIndex);
}

// Insert entry definition before `export const templates:`
const entryDefinition = `const ${camelName}Entry: CatalogEntry = catalogEntry.parse({
  slug: '${slug}',
  name: {ar: '${titleName}', en: '${titleName}'},
  tagline: {
    ar: 'دعوة زفاف راقية وتصميم أصيل',
    en: 'An elegant wedding invitation design',
  },
  tier: 'classic',
  status: 'draft',
  featured: false,
  assets: [
    {path: '/assets/demo/${slug}/ornament.svg', source: 'original', license: 'original, © Invitely'},
  ],
});\n\n`;

const templatesRecordIndex = updatedRegistry.indexOf('export const templates: Record<string, TemplateDefinition>');
if (templatesRecordIndex !== -1) {
  updatedRegistry = updatedRegistry.slice(0, templatesRecordIndex) + entryDefinition + updatedRegistry.slice(templatesRecordIndex);
}

// Insert template definition into templates dictionary
const closingBraceIndex = updatedRegistry.lastIndexOf('};');
if (closingBraceIndex !== -1) {
  const templateMapping = `  '${slug}': {
    entry: ${camelName}Entry,
    getData: get${pascalName}Data,
    fontClassName: '',
  },\n`;
  updatedRegistry = updatedRegistry.slice(0, closingBraceIndex) + templateMapping + updatedRegistry.slice(closingBraceIndex);
}

writeFileSync(registryPath, updatedRegistry);

// 7. Update template-styles.ts
const templateStylesContent = readFileSync(templateStylesPath, 'utf8');
const styleImport = `import './${slug}/styles.css';\n`;
if (!templateStylesContent.includes(styleImport)) {
  writeFileSync(templateStylesPath, templateStylesContent.trimEnd() + '\n' + styleImport);
}

console.log(`✅ Template "${slug}" created successfully!`);
console.log(`  - Data:    src/templates/${slug}/data.ts`);
console.log(`  - Styles:  src/templates/${slug}/styles.css`);
console.log(`  - Entry:   src/templates/${slug}/index.ts`);
console.log(`  - Test:    src/templates/${slug}/${slug}.test.ts`);
console.log(`  - Asset:   public/assets/demo/${slug}/ornament.svg`);
console.log(`  - Wired into registry.ts (draft) & template-styles.ts`);
