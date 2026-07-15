// Vérifie que les modales tiennent dans un viewport court (pas de débordement).
// S'appuie sur le harnais dev (?devmodals=Nom) qui monte chaque modale isolée.
import { test, expect } from '@playwright/test';
const VH = 560;
test.use({ viewport: { width: 390, height: VH }, serviceWorkers: 'block' });

const NAMES = ['ConfirmDialog','FeedbackModal','FollowModal','CreateRideModal','JoinRideModal','QuickAddTeamModal','ClubFormModal','SendAnnouncementModal','PushBroadcastModal','ConvocReplyPanel'];

for (const name of NAMES) {
  test(`modale ${name} tient dans le viewport`, async ({ page }) => {
    await page.goto(`/?devmodals=${name}`);
    await page.waitForTimeout(1000);
    const r = await page.evaluate((vh) => {
      const dl = [...document.querySelectorAll('[role="dialog"],[aria-modal="true"]')].map(d=>d.getBoundingClientRect()).filter(b=>b.width>150&&b.height>60);
      if(!dl.length) return {none:1};
      const panels = dl.filter(b=> b.height <= vh+1 || b.width < 380);
      const p = (panels.length?panels:dl).sort((a,b)=>a.height-b.height)[0];
      return { top:Math.round(p.top), bot:Math.round(p.bottom), fit: p.top>=-2 && p.bottom<=vh+3 };
    }, VH);
    expect(r.none, `modale ${name} non détectée (role=dialog manquant ?)`).toBeFalsy();
    expect(r.fit, `modale ${name} déborde (top=${r.top} bot=${r.bot} > ${VH})`).toBeTruthy();
  });
}
