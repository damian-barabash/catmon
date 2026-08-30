// Interim EN texts shown until site-api `policy` responds. Keep short; the real
// legal text lives in the `policies` table and is edited in the admin panel.
const contact = '\n\n---\n\nContact: **support@catmongame.app** · DBDC Studio, Warsaw, Poland.'
export const FALLBACK = {
  privacy: {
    title: 'Privacy Policy',
    body: `_Interim version — effective 2026-09-01._

## 1. Who we are
CatMon is operated by **DBDC Studio** (the "Studio", "we"). This policy explains what personal data we process when you use the CatMon mobile app and the website catmongame.app.

## 2. What we collect
- **Account data**: username, e-mail (if you link Google / Apple sign-in), device identifiers for push notifications.
- **Game data**: photos of cats you scan, approximate location of scans (used for anti-fraud and the map), game progress, purchases.
- **Technical data**: app build, OS version, crash logs, IP address (rate-limiting and abuse prevention).
- **Website**: language preference and, only with your consent, anonymous page-view statistics.

## 3. Why we process it
To run the game (contract), to prevent fraud and cheating (legitimate interest), to send you push notifications you opted in to (consent), and to comply with the law.

## 4. AI processing
Cat photos are analysed by an AI vision model to verify that a real cat is present and to generate a card. Photos are stored in our infrastructure (Supabase, EU region) and are not sold or used to train third-party models.

## 5. Sharing
Processors: Supabase (hosting), Apple / Google (sign-in, payments, push), our AI provider. No data is sold.

## 6. Retention
Account data is kept while your account exists. You can delete your account in the app settings; data is erased within 30 days.

## 7. Your rights
Access, rectification, erasure, restriction, portability and objection under GDPR. Write to support@catmongame.app. You may also complain to your local supervisory authority (in Poland: UODO).

## 8. Children
CatMon is not intended for children under 13.${contact}`,
  },
  cookies: {
    title: 'Cookie Policy',
    body: `_Interim version._

catmongame.app uses **local storage** (not third-party cookies) for:

| Key | Purpose | Lifetime |
|---|---|---|
| \`catmon.lang\` | remembers your language | until cleared |
| \`catmon.cookie\` | remembers your cookie choice | until cleared |

With your consent ("Accept") we additionally send an **anonymous page-view event** (path, language, referrer) to our own backend. No advertising cookies, no third-party trackers.

You can change your choice by clearing site data in your browser.${contact}`,
  },
  terms: {
    title: 'Terms of Service',
    body: `_Interim version._

1. **The game.** CatMon is a free mobile game with optional purchases. By installing it you accept these terms and the Game Rules.
2. **Account.** One account per person. You are responsible for keeping access to it. Guest accounts that are not linked may be lost if the device is reset.
3. **Content you upload.** You confirm that photos you scan were taken by you and do not infringe anyone's rights. You grant the Studio a licence to store and display them inside the game (e.g. on cards and leaderboards).
4. **Virtual items.** Gems, cat eyes, cards and items have no monetary value and cannot be exchanged for money. Purchases are final except where the law requires otherwise.
5. **Fair play.** Cheating, automation, fake photos, exploiting bugs or abusing other players may lead to a temporary or permanent ban.
6. **Availability.** We may change, suspend or discontinue features. We aim for high availability but do not guarantee it.
7. **Liability.** To the extent permitted by law, the Studio is not liable for indirect damages. Nothing limits liability that cannot be limited by law.
8. **Governing law.** Polish law; consumers keep the protection of their local mandatory law.${contact}`,
  },
  rules: {
    title: 'Game Rules',
    body: `_Interim version._

- **Real cats only.** Scan living cats you meet in the real world. Screens, prints, toys, drawings and other animals are rejected.
- **One cat = one card.** If someone already discovered a cat, you can still scan it and get your own copy, but the discoverer keeps the title.
- **No pay-to-win.** No item or purchase gives a guaranteed victory. Purchases are cosmetic or convenience.
- **Respect others.** No insults, harassment or spam in chats. Report players from their profile.
- **No automation.** Bots, scripts, modified clients and GPS spoofing are banned.
- **Bans.** Violations result in warnings, temporary or permanent bans. Appeals: support@catmongame.app.${contact}`,
  },
  data_processing: {
    title: 'Data Processing Information',
    body: `_Interim version — information under Art. 13 GDPR._

**Controller:** DBDC Studio, Warsaw, Poland — support@catmongame.app.

**Purposes and legal bases:** providing the game and website (Art. 6(1)(b)); anti-fraud, security and analytics (Art. 6(1)(f)); push notifications and website statistics (Art. 6(1)(a) — consent, revocable at any time); legal obligations (Art. 6(1)(c)).

**Recipients:** hosting and database provider (Supabase, EU), Apple and Google (sign-in, payments, notifications), AI vision provider (photo verification).

**Transfers outside the EEA:** only where necessary, under Standard Contractual Clauses.

**Retention:** for the life of the account and up to 30 days after deletion; anti-fraud logs up to 12 months; accounting records as required by law.

**Rights:** access, rectification, erasure, restriction, portability, objection, withdrawal of consent, complaint to a supervisory authority (UODO in Poland).

**Automated decision-making:** scans are verified automatically by an AI model. A rejected scan does not affect your account; repeated abuse is reviewed by a person before any ban.${contact}`,
  },
}
