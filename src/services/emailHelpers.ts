import { getEmailLabels } from './emailTranslations';

export function translateEmailHtml(html: string, lang: string): string {
  if (lang === 'en') return html;
  const L = getEmailLabels(lang);
  let r = html;
  const rep = (find: string, repl: string | undefined) => {
    if (repl && find) r = r.split(find).join(repl);
  };
  rep('>IMPORTANT NOTICE — MANDATORY READING<', '>' + L.importantNotice + '<');
  rep('>DAMAGE REPORT<', '>' + L.damageReport + '<');
  rep(">Skipper's Signature<", '>' + L.skipperSig + '<');
  rep(">Employee's Signature<", '>' + L.employeeSig + '<');
  rep('Thank you in advance.', L.thankYou);
  rep('>CHARTER PARTY</p>', '>' + L.charterParty + '</p>');
  rep('>CHECK-IN</p>', '>' + L.checkInH + '</p>');
  rep('>CHECK-OUT</p>', '>' + L.checkOutH + '</p>');
  if (L.documentGenerated) { r = r.split('Document generated on').join(L.documentGenerated); }
  if (L.warningText1) { r = r.replace(/If check-in is completed by the company[\s\S]*?on the yacht/, L.warningText1); }
  if (L.warningHighlight) { r = r.replace(/\(if there is any damage[\s\S]*?takes a photo\)/, L.warningHighlight); }
  if (L.warningText2) { r = r.replace(/or toilet clogging[\s\S]*?after check-in\./, L.warningText2); }
  if (L.warningText3) { r = r.replace(/The customer upon return must pay[\s\S]*?received it\./, L.warningText3); }
  if (L.warningTextShort) { rep('Customer has read and accepted', L.warningTextShort); }
  return r;
}

export function translateEmailText(text: string, lang: string): string {
  if (lang === 'en') return text;
  const L = getEmailLabels(lang);
  let r = text;
  const rep = (find: string, repl: string | undefined) => {
    if (repl && find) r = r.split(find).join(repl);
  };
  rep('IMPORTANT NOTICE', L.importantNotice);
  rep('DAMAGE REPORT', L.damageReport);
  rep('ADDITIONAL REMARKS', L.notes ? L.notes.toUpperCase() : undefined);
  rep('Customer has read and accepted', L.warningTextShort);
  if (L.documentGenerated) { r = r.split('Document generated on').join(L.documentGenerated); }
  return r;
}
