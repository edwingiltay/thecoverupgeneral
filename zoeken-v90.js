//  Zoekfunctie behorend bij dedoofpotgeneraal.nl  (vanilla JS, geen afhankelijkheden)
//
//  Zelfstandige module: injecteert eigen CSS, een zoekknop in de menubalk en een
//  overlay met resultaten. De index wordt LIVE uit de DOM opgebouwd, zodat hij
//  automatisch meeloopt met elke tekstwijziging in alle taalversies — er hoeft
//  nooit een aparte index te worden bijgewerkt.
//
//  Doorzoekt twee soorten inhoud:
//    1. Secties op de pagina  (koppen met een id + hun alineatekst)  -> scroll ernaartoe
//    2. Brondocumenten        (links naar doc/ en externe bronnen)   -> open het stuk
//
//  Integratie: plaats onder aan de <body>  <script src="zoeken-v90.js" defer></script>
//  (mobiele pagina's in m/ gebruiken  ../zoeken-v90.js ).

(function () {
  'use strict';

  // ---- Teksten per taal (afgeleid van <html lang>) -------------------------
  var LANG = (document.documentElement.getAttribute('lang') || 'nl').slice(0, 2).toLowerCase();
  var TALEN = {
    nl: { knop:'Zoeken', ph:'Zoek in de webpagina, het boek en de bronnen…', secties:'Op deze pagina', docs:'Documenten en bronnen', docsInhoud:'In de documenten zelf', verantwoording:'Verantwoording', boek:'In het boek', pagina:'Pagina', geen:'Geen resultaten voor', sluit:'Sluit', tip:'om te zoeken',
          lblBoek:'Boek: Intro', lblEssay:'Essay: Intro', lblBio:'Biografie', lblStem:'Stemmen: Intro', synopsis:'Synopsis', pfxEssay:'Essay: ', pfxStem:'Stemmen: ', pfxSleutel:'Sleutelcitaat ' },
    en: { knop:'Search', ph:'Search the page, the book and sources…', secties:'On this page', docs:'Documents and sources', docsInhoud:'In the documents themselves', verantwoording:'Credits', boek:'In the book', pagina:'Page', geen:'No results for', sluit:'Close', tip:'to search',
          lblBoek:'Book: Intro', lblEssay:'Essay: Intro', lblBio:'Biography', lblStem:'Voices: Intro', synopsis:'Synopsis', pfxEssay:'Essay: ', pfxStem:'Voices: ', pfxSleutel:'Key quote ' },
    de: { knop:'Suchen', ph:'Seite, Buch und Quellen durchsuchen…', secties:'Auf dieser Seite', docs:'Dokumente und Quellen', docsInhoud:'In den Dokumenten selbst', verantwoording:'Nachweise', boek:'Im Buch', pagina:'Seite', geen:'Keine Treffer für', sluit:'Schließen', tip:'zum Suchen',
          lblBoek:'Buch: Intro', lblEssay:'Essay: Intro', lblBio:'Biografie', lblStem:'Stimmen: Intro', synopsis:'Exposé', pfxEssay:'Essay: ', pfxStem:'Stimmen: ', pfxSleutel:'Schlüsselzitat ' },
    fr: { knop:'Rechercher', ph:'Rechercher dans la page, le livre et les sources…', secties:'Sur cette page', docs:'Documents et sources', docsInhoud:'Dans les documents mêmes', verantwoording:'Crédits', boek:'Dans le livre', pagina:'Page', geen:'Aucun résultat pour', sluit:'Fermer', tip:'pour rechercher',
          lblBoek:'Livre : Intro', lblEssay:'Essai : Intro', lblBio:'Biographie', lblStem:'Voix : Intro', synopsis:'Synopsis', pfxEssay:'Essai : ', pfxStem:'Voix : ', pfxSleutel:'Citation clé ' },
    hr: { knop:'Pretraga', ph:'Pretraži stranicu, knjigu i izvore…', secties:'Na ovoj stranici', docs:'Dokumenti i izvori', docsInhoud:'U samim dokumentima', verantwoording:'Zahvale', boek:'U knjizi', pagina:'Stranica', geen:'Nema rezultata za', sluit:'Zatvori', tip:'za pretragu',
          lblBoek:'Knjiga: Uvod', lblEssay:'Esej: Uvod', lblBio:'Biografija', lblStem:'Glasovi: Uvod', synopsis:'Sinopsis', pfxEssay:'Esej: ', pfxStem:'Glasovi: ', pfxSleutel:'Ključni citat ' }
  };
  var T = TALEN[LANG] || TALEN.nl;

  // Boek per taal: NL -> boek.pdf (NL-editie); de andere talen linken naar de
  // Engelse editie book.pdf. Paden relatief aan het scriptbestand (m/ krijgt ../).
  var zelfScript = document.querySelector('script[src*="zoeken-v90.js"]');
  var basisPad = zelfScript ? (zelfScript.getAttribute('src') || '').replace(/zoeken-v90\.js.*$/, '') : '';
  var boekBestand = (LANG === 'nl') ? { pdf: 'boek.pdf', index: 'boek-index-v90.js' } : { pdf: 'book.pdf', index: 'book-index-v90.js' };
  var BOEK = { pdf: basisPad + boekBestand.pdf, index: basisPad + boekBestand.index + '' };
  // Volledige tekst van de documenten in doc/ (dezelfde bestanden voor alle talen).
  var DOCIDX = { url: basisPad + 'doc-index-v90.js?r=69', map: basisPad + 'doc/' };

  // ---- Hulpfuncties ---------------------------------------------------------
  // Normaliseer: kleine letters + diacritische tekens weg, zodat "Srebrenica"
  // ook op "srebrenica" en "cafe" op "café" matcht.
  function norm(s) {
    // kleine letters, zachte afbreekstreepjes (&shy;) weg, en diacritische tekens weg.
    return (s || '').toLowerCase().replace(/­/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  // Diacriet-ongevoelig regexpatroon: bouw uit een (genormaliseerde) term een
  // patroon waarin elke basisletter ook zijn accentvarianten matcht — zodat een
  // zoekopdracht op "general" ook "général" markeert.
  var ACCENT = { a:'aàáâãäåā', c:'cçćč', e:'eèéêëē', i:'iìíîï', n:'nñń', o:'oòóôõöø', s:'sśš', u:'uùúûü', y:'yÿý', z:'zźž' };
  function accentPatroon(term) {
    return norm(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                     .replace(/[a-z]/g, function (ch) { return ACCENT[ch] ? '[' + ACCENT[ch] + ']' : ch; });
  }
  function esc(s) {
    return (s || '').replace(/[&<>"]/g, function (c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  }

  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Index opbouwen -------------------------------------------------------
  var entries = [];

  // Dichtstbijzijnde element met een id dat vóór `node` in de documentvolgorde
  // staat — als scroll-anker voor een verborgen labelkop.
  function precedingAnchor(node) {
    var ids = document.querySelectorAll('[id]');
    var best = null;
    for (var i = 0; i < ids.length; i++) {
      var e = ids[i];
      if (e === node) continue;
      var rel = node.compareDocumentPosition(e);
      if (rel & 2) best = e;        // e staat vóór node -> onthoud de laatste
      else if (rel & 4) break;      // vanaf hier komt e ná node
    }
    return best;
  }

  // Eerste zichtbare element ná `node` in documentvolgorde (voor het scrollen
  // naar een sectie waarvan de kop verborgen is).
  function eersteZichtbaarNa(node) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
    w.currentNode = node;
    var el, r;
    while ((el = w.nextNode())) {
      r = el.getBoundingClientRect();
      if (r.height > 2 && r.width > 2) return el;   // rendered (werkt ook waar offsetParent null is)
    }
    return null;
  }
  // Verborgen labelkop = met display:none (zo zijn Nieuws/Stemmen/Auteur verborgen).
  // Betrouwbaarder dan offsetParent, dat op mobiel ook zichtbare koppen null geeft.
  function isVerborgenLabel(h) { return getComputedStyle(h).display === 'none'; }

  // (1) Secties: elke kop h1–h4, met een aanscrollbaar doel.
  // Zone-detectie op VOLGORDE (taalonafhankelijk): de 3 verborgen labelkoppen
  // staan in elke taalversie in dezelfde volgorde — 1e = Nieuws/News (essay-zone),
  // 2e = Stemmen/Voices (stemmen-zone), 3e = Auteur/Author (biografie).
  var headings = document.querySelectorAll('h1, h2, h3, h4');
  var labelTeller = 0;
  // Begin van de footer. De laatste kop-sectie (Biografie) heeft geen volgende
  // kop en zou anders met een Range tot documenteinde de footercredits/bronnen
  // opslokken — die hebben nu eigen zoekingangen (Verantwoording enz.). Cap daar.
  var footerStart = document.querySelector('p.creditsstyle');
  footerStart = footerStart ? (footerStart.closest('table') || footerStart) : null;
  // Blurb-blok (deel-blurb + downloadknoppen incl. de perskit), zonder eigen kop.
  // Hook op .blurbstyle (de deel-tekst): op desktop staat .blurbbar óók om de blurb,
  // maar op mobiel is .blurbbar juist de headerbalk — .blurbstyle klopt op beide.
  var blurbBlok = null;
  (function () {
    var bbar = document.querySelector('.blurbstyle');
    if (!bbar) return;
    var innerT = bbar.closest('table');
    blurbBlok = (innerT && innerT.parentElement) ? (innerT.parentElement.closest('table') || innerT) : innerT;
  })();
  // Mobiel herkennen aan de stemmen-SEO-koppen (h2.extkop). Daar tonen we Essay:/
  // Stemmen: op een eigen manier en indexeren we de stemmenkaarten los (zie onder).
  var isMobiel = !!document.querySelector('h2.extkop');
  // Mobiel-only structurele grenzen. De mobiele pagina's hebben veel minder koppen:
  // het "Warum/Waarom"-blok, de stemmen-intro en de biografie hebben géén eigen kop.
  // Zonder grenzen slokt de boek-intro (H1) alles tot de eerste stemmenkaart op, en
  // de laatste essay-kop de biografie. Daarom leiden we die grenzen structureel af.
  // Warum-blok (de vid5-titel + de opsomming eronder). Op desktop zit dat in
  // .waaromtable; op mobiel is het een gewone .boxshadow-tabel -> pak dan de tabel.
  var waaromBlok = null;
  (function () {
    var wp = document.querySelector('.waaromtable p.vid5') || document.querySelector('p.vid5');
    if (wp) waaromBlok = wp.closest('.waaromtable') || wp.closest('table') || wp;
  })();
  // Biografie (mobiel): geen kop, herkenbaar aan tr.authorbar; het bijbehorende
  // anker (#autor/#auteur/#author…) is de grens waar het essay stopt.
  var bioBlok = null, bioAnchor = null;
  if (isMobiel) {
    var ab = document.querySelector('tr.authorbar');
    bioBlok = ab ? (ab.closest('table') || ab) : null;
    if (bioBlok) bioAnchor = precedingAnchor(bioBlok);
  }
  // Grens waar de laatste kop-sectie stopt: mobiel vóór de biografie (#autor),
  // anders vóór de blurb als die er is, anders vóór de footer. Zo slokt de laatste
  // kop-sectie de biografie/blurb/downloads/footer niet op.
  var laatsteGrens = (bioAnchor || bioBlok) || blurbBlok || footerStart;
  // De zone-labeling (Essay:/Stemmen:/Biografie) geldt alleen bij de volledige
  // desktop-structuur: 3 verborgen labelkoppen. De mobiele bestanden hebben een
  // vereenvoudigde indeling; daar tonen we gewoon de eigen koptekst.
  var zoneLogica = Array.from(headings).filter(function (h) {
    return h.tagName !== 'H1' && isVerborgenLabel(h);
  }).length === 3;

  headings.forEach(function (h, idx) {
    var ruw = clean(h.textContent);
    if (!ruw) return;
    // Mobiel: de stemmen-SEO-koppen (h2.extkop) niet als sectie indexeren; de
    // stemmenkaarten worden hieronder los, per kaart met nummer, geïndexeerd.
    if (isMobiel && h.classList && h.classList.contains('extkop')) return;
    var isLabel = isVerborgenLabel(h);          // verborgen labelkop (display:none)
    // De 3 zone-markers zijn de verborgen h2's (Nieuws/Stemmen/Auteur). De h1
    // (boek-intro) telt níét mee, ook al is die eveneens 'verborgen'.
    if (isLabel && h.tagName !== 'H1') labelTeller++;
    var essayZone = zoneLogica && (labelTeller === 1);
    var stemmenZone = zoneLogica && (labelTeller === 2);

    // Label + prefix + scrollmarge + scroll-doel + hash.
    var title, prefix = '', marge, target, hashId, citKop = false;
    if (h.tagName === 'H1') {                   // hoofdkop bovenaan = het boek-intro
      title = T.lblBoek; marge = 99999;         // grote marge -> scrollt naar de top
      target = h; hashId = h.id;
    } else if (isLabel) {
      // De verborgen labelkop zelf krijgt (bij de desktop-structuur) een mooiere
      // naam en eigen marge. Scroll naar de EERSTE ZICHTBARE inhoud van de sectie;
      // anker alleen voor de URL-hash.
      if (zoneLogica && labelTeller === 1) { title = T.lblEssay; marge = 17; }     // Nieuws -> Essay: Intro
      else if (zoneLogica && labelTeller === 2) { title = ruw; marge = 3; }        // Stemmen -> eigen tekst
      else if (zoneLogica && labelTeller === 3) { title = T.lblBio; marge = 17; }  // Auteur -> Biografie
      else if (isMobiel && labelTeller === 1) { title = T.lblEssay; marge = 26; }  // mobiel: 1e verborgen label = essay-intro
      else { title = ruw; marge = 15; }
      var anker = precedingAnchor(h);
      target = eersteZichtbaarNa(h) || anker;
      hashId = anker ? anker.id : '';
    } else {
      title = ruw; target = h; hashId = h.id; marge = 15;
      // Mobiel: de stemmen-SEO-koppen (0px, class=extkop) zitten in het ingeklapte
      // #citExtended-blok (display:none). eersteZichtbaarNa overschiet daar (het
      // hele blok is verborgen), dus wijs naar de eigen kaart (.tabletext) en
      // markeer de entry; go() maakt #citExtended bij navigatie zichtbaar.
      var citBlok = h.closest && h.closest('#citExtended');
      if (citBlok) { target = h.closest('.tabletext') || h; citKop = true; }
      // Degenererende kop (0px hoog, bv. onzichtbare SEO-koppen): scroll naar de
      // eerste zichtbare inhoud eronder.
      else if (h.getBoundingClientRect().height < 3) { var vis = eersteZichtbaarNa(h); if (vis) target = vis; }
      if (essayZone) prefix = T.pfxEssay;                               // essay-tussenkopjes
      else if (stemmenZone) {
        prefix = T.pfxStem; marge = 11;                                 // stemmensecties
        var bar = h.closest('.tablehead'); if (bar) target = bar;       // scroll naar de donkergrijze balk
      }
      else if (isMobiel && h.tagName === 'H3') prefix = T.pfxEssay;      // mobiel: essay-tussenkopjes
    }
    if (!target) return;

    // Bodytekst in DOCUMENTVOLGORDE tot de volgende kop (via een Range), zodat
    // ook inhoud in andere DOM-takken meekomt — zoals de recensiekaarten in de
    // stemmensectie, die géén siblings van de kop zijn.
    var body = '';
    try {
      var endH = headings[idx + 1] || null;
      var range = document.createRange();
      range.setStartAfter(h);
      // Mobiel: de boek-intro (H1) heeft pas heel diep de volgende kop (de eerste
      // stemmenkaart), waardoor zijn body anders het Warum-blok, de stemmen-intro
      // en de kaarten opslokt. Cap daarom op het Warum-blok.
      if (h.tagName === 'H1' && isMobiel && waaromBlok && (h.compareDocumentPosition(waaromBlok) & 4)) range.setEndBefore(waaromBlok);
      else if (endH) range.setEndBefore(endH);
      else if (laatsteGrens && (h.compareDocumentPosition(laatsteGrens) & 4)) range.setEndBefore(laatsteGrens); // 4 = grens volgt op h
      else range.setEndAfter(document.body);
      var frag = range.cloneContents();
      // Blokken met een eigen zoekingang uit de kop-sectie knippen, anders staat
      // hun tekst dubbel — in de kop-sectie én in zijn eigen ingang (Waarom-blok,
      // de media-aandacht-tijdlijn; de footer is al door footerStart afgevangen).
      frag.querySelectorAll('.waaromtable, #publicationsList').forEach(function (b2) {
        if (b2.parentNode) b2.parentNode.removeChild(b2);
      });
      body = frag.textContent || '';
      if (body.length > 10000) body = body.slice(0, 10000);
    } catch (e) { body = ''; }
    // Bronlabels opschonen (net als bij de documentnamen): vlaggen, "Bron:" en
    // losse URL-bronverwijzingen, zodat de fragmenten netjes blijven.
    body = body.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
               .replace(/\bBron\s*:/gi, '')
               .replace(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/\S*/gi, '');
    body = clean(body);
    // De hero-kop bovenaan (.kop2) staat deels vóór de h1 en valt zo buiten de
    // Range; voeg die tekst toe aan de body van de boek-intro (h1) zodat de
    // openingsregel ("Het énige Nederlandse boek…") ook vindbaar is.
    if (h.tagName === 'H1') {
      var hero = [];
      document.querySelectorAll('.kop2').forEach(function (k) { hero.push(k.textContent); });
      if (hero.length) body = clean(hero.join(' ') + ' ' + body);
    }

    entries.push({ type: 'sec', el: target, id: hashId || '', title: title, prefix: prefix,
                   marge: marge, body: body, nt: norm(title), nb: norm(body), cit: citKop });
  });

  // Extra sectie: het "Waarom deze internationale editie…"-blok. Dat is een
  // <p class=vid5>-titel (geen echte kop), dus valt buiten de koppen-indexering.
  // Structureel herkend (eerste vid5 in een .waaromtable) zodat het in élke taal
  // werkt; we gebruiken de eigen titeltekst.
  (function () {
    var titelP = document.querySelector('.waaromtable p.vid5') || document.querySelector('p.vid5');
    if (!titelP) return;
    // Desktop: .waaromtable. Mobiel: geen .waaromtable, maar de titel + opsomming
    // staan samen in één .boxshadow-tabel -> pak die zodat de body (incl. de drie
    // opsommingspunten, zoals "…Pressefreiheit…") volledig meekomt.
    var blok = titelP.closest('.waaromtable') || titelP.closest('table') || titelP;
    var wtitel = clean(titelP.textContent);
    if (!wtitel || wtitel.length < 4) return;
    var wbody = clean(blok.textContent);
    entries.push({ type: 'sec', el: titelP, id: '', title: wtitel, prefix: '',
                   marge: 15, body: wbody, nt: norm(wtitel), nb: norm(wbody) });
  })();

  // Extra sectie: de mediaselectie-kop "Een selectie van de media-aandacht:".
  // Dat is een <p class=ddg-stats-note> (geen echte kop), net als het Waarom-blok,
  // dus hij valt buiten de koppen-indexering. Structureel herkend zodat het in
  // elke taal werkt. De tijdlijn eronder wordt de doorzoekbare body: zo zijn de
  // medianamen vindbaar én landt een klik op deze eigen tussenkop.
  (function () {
    var note = document.querySelector('.ddg-stats-note');
    if (!note) return;
    var ntitel = clean(note.textContent);
    if (!ntitel || ntitel.length < 4) return;
    var tl = note.parentNode ? note.parentNode.querySelector('.ddg-timeline') : null;
    var nbody = tl ? clean(tl.textContent) : '';
    nbody = nbody.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
                 .replace(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/\S*/gi, '');
    if (nbody.length > 10000) nbody = nbody.slice(0, 10000);
    entries.push({ type: 'sec', el: note, id: '', title: ntitel, prefix: '',
                   marge: 15, body: nbody, nt: norm(ntitel), nb: norm(nbody) });
  })();

  // Footer-secties: de drie blokken onderaan (elk een <p class=creditsstyle> met
  // een leidende <b>-kop) krijgen een eigen zoekingang, zodat de credits, de
  // bronnenlijst en de mirror-/continuïteitstekst vindbaar zijn. Elk blok is een
  // eigen tussenkopje in de resultaten, net als de media-aandacht-kop. Structureel
  // herkend (creditsstyle) zodat het in elke taal werkt. Het tweede blok (bronnen)
  // kan ingeklapt zijn (#bronnenLijst); dat klapt go() bij navigatie alsnog uit.
  document.querySelectorAll('p.creditsstyle').forEach(function (p) {
    var b = p.querySelector('b');
    var ftitel = b ? clean(b.textContent) : '';
    var blok = p.closest('table') || p;                 // hele tabel: vangt ook de ingeklapte bronnenlijst
    // Het credits-blok (foto-/video-/pictogram-/kaartcredits + codering, herkenbaar
    // aan #epcredits) is breder dan alleen 'Fotocredits'; geef het de umbrella-titel.
    if (blok.querySelector && blok.querySelector('#epcredits')) ftitel = T.verantwoording;
    if (!ftitel || ftitel.length < 4) return;
    var fbody = clean(blok.textContent);
    fbody = fbody.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
                 .replace(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/\S*/gi, '');
    if (fbody.length > 10000) fbody = fbody.slice(0, 10000);
    var fentry = { type: 'sec', el: p, id: '', title: ftitel, prefix: '',
                   marge: 15, body: fbody, nt: norm(ftitel), nb: norm(fbody) };
    if (blok.querySelector && blok.querySelector('#bronnenLijst')) {
      fentry.klap = { id: 'bronnenLijst', fn: 'toggleBronnen' };   // bronnenlijst uitklappen bij navigatie
    }
    entries.push(fentry);
  });

  // Blurb-sectie: het blok vóór de footer met de deel-blurb en de downloadknoppen
  // (Nederlandse/Engelse editie, luisterboek en de perskit-zip). Geen eigen kop en
  // geen doc/-link, dus zonder aparte ingang onvindbaar. Eén zoekingang "Blurb"
  // van het blurb-blok tot aan de footer.
  if (blurbBlok && footerStart) {
    try {
      var br = document.createRange();
      br.setStartBefore(blurbBlok);
      br.setEndBefore(footerStart);
      var bbody = clean((br.cloneContents().textContent || '')
        .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
        .replace(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/\S*/gi, ''));
      if (bbody.length > 10000) bbody = bbody.slice(0, 10000);
      entries.push({ type: 'sec', el: blurbBlok, id: '', title: 'Blurb', prefix: '',
                     marge: -89, body: bbody, nt: norm('Blurb'), nb: norm(bbody) });
    } catch (e) {}
  }

  // Mobiel: de stemmen-intro (de vid3-alinea boven de citaatschakelaar) heeft geen
  // eigen kop en werd door de H1-cap uit de boek-intro geknipt; geef 'm een eigen
  // ingang zodat de inleidende tekst vindbaar is en een klik naar de stemmensectie
  // scrolt. Titel "Stemmen: Intro" (lblStem), consistent met de kaart-prefixen.
  if (isMobiel) {
    var introP = document.querySelector('p.vid3');
    if (introP) {
      var sIntro = '';
      var vids = document.querySelectorAll('p.vid3');
      for (var vi = 0; vi < vids.length; vi++) sIntro += ' ' + vids[vi].textContent;
      sIntro = clean(sIntro.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
                           .replace(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/\S*/gi, ''));
      var sAnk = precedingAnchor(introP);
      entries.push({ type: 'sec', el: sAnk || introP, id: sAnk ? sAnk.id : '', title: T.lblStem, prefix: '',
                     marge: 5, body: sIntro, nt: norm(T.lblStem), nb: norm(sIntro) });
    }
  }

  // Mobiel: de biografie (#autor) heeft geen eigen kop (op desktop is dat de
  // verborgen 'Auteur'-labelkop, die hier ontbreekt). Eigen ingang van het
  // biografie-anker tot aan de blurb/footer, met de auteurstekst als body.
  if (isMobiel && bioBlok) {
    try {
      var bStart = bioAnchor || bioBlok;
      var bGrensNa = blurbBlok || footerStart;
      var bir = document.createRange();
      bir.setStartBefore(bStart);
      if (bGrensNa && (bStart.compareDocumentPosition(bGrensNa) & 4)) bir.setEndBefore(bGrensNa);
      else bir.setEndAfter(document.body);
      var biobody = clean((bir.cloneContents().textContent || '')
        .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
        .replace(/\bBron\s*:/gi, '')
        .replace(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/\S*/gi, ''));
      if (biobody.length > 10000) biobody = biobody.slice(0, 10000);
      // Scrollen naar de zichtbare sectiestart (de donkere "AUTEUR"-balk,
      // table.authorbar) i.p.v. het #auteur-anker: dat anker heeft margin-top:-48px
      // (sticky-offset-truc) waardoor je anders ~77px te hóóg landt, met de staart
      // van het essay nog in beeld. Hash blijft wel het anker.
      var bioDoel = document.querySelector('table.authorbar') || bStart;
      entries.push({ type: 'sec', el: bioDoel, id: (bioAnchor && bioAnchor.id) ? bioAnchor.id : '', title: T.lblBio, prefix: '',
                     marge: 15, body: biobody, nt: norm(T.lblBio), nb: norm(biobody) });
    } catch (e) {}
  }

  // Mobiel: de synopsis (het "De doofpotgeneraal / door Edwin Giltay"-blok met de
  // uitklapbare volledige samenvatting, incl. de Moniek/Overduyn-noot) heeft geen
  // eigen kop. Structureel herkend aan de uitklapbare volledige tekst (#C16jojo);
  // body = het hele blok (teaser + volledige tekst). Klik klapt 'm uit (moreC16)
  // en scrolt naar het synopsis-anker (#synopsis/#expose/#sinopsis).
  if (isMobiel) {
    var jojo = document.getElementById('C16jojo');
    var synBlok = jojo ? (jojo.closest('.boxshadow') || jojo.closest('table')) : null;
    if (synBlok) {
      var synBody = clean((synBlok.textContent || '')
        .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
        .replace(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/\S*/gi, ''));
      if (synBody.length > 10000) synBody = synBody.slice(0, 10000);
      var synAnk = precedingAnchor(synBlok);
      var synE = { type: 'sec', el: synAnk || synBlok, id: synAnk ? synAnk.id : '', title: T.synopsis, prefix: '',
                   marge: 4, body: synBody, nt: norm(T.synopsis), nb: norm(synBody) };
      synE.klap = { id: 'C16jojo', fn: 'moreC16' };   // "Lees meer" uitklappen bij navigatie
      entries.push(synE);
    }
  }

  // Mobiel: de stemmenkaarten (100) in #citExtended individueel indexeren — elk met
  // zijn sectie (extkop) en kaartnummer. Titel "Stemmen: <sectie> · <nr>"; klikken
  // zet het citatenfilter zo nodig op "alles" (cit:true) en scrolt naar de kaart. BELANGRIJK: de sectienaam (extkop) krijgt ÉÉN eigen ingang, niet per
  // kaart — anders vloeit een term die alleen in de sectiekop zit (bv. "alle" in
  // "SamenvALLEnde") uit over álle kaarten van die sectie (6× hetzelfde kopje).
  // Kaarten matchen daarom enkel op de eigen inhoud (nt leeg, nb = kaarttekst).
  (function () {
    var citExt = document.getElementById('citExtended');
    if (!citExt) return;
    var stemWoord = (T.pfxStem || 'Stemmen: ').replace(/\s*:\s*$/, '');   // "Stemmen" (zonder dubbele punt)
    var sectie = '';
    citExt.querySelectorAll('.extkop, .number').forEach(function (el) {
      if (el.classList.contains('extkop')) {
        sectie = clean(el.textContent);
        // De sectie zelf: één ingang die alléén op de sectienaam matcht (nb leeg).
        var kop = el.closest('tr') || el.closest('.tabletext') || el;
        entries.push({ type: 'sec', el: kop, id: '', title: sectie, prefix: stemWoord + ': ',
                       marge: 7, body: '', nt: norm(sectie), nb: '', cit: true });
        return;
      }
      // Het filter hernummert wat in beeld staat, dus niet op textContent afgaan:
      // data-nr houdt het nummer vast dat de kaart in de volledige lijst heeft.
      var nr = clean(el.getAttribute('data-nr') || el.textContent);
      var numRow = el.closest('tr');
      var contentRow = numRow ? numRow.nextElementSibling : null;
      if (!numRow || !contentRow || !nr) return;
      var kaart = clean(contentRow.textContent)
        .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
        .replace(/\bBron\s*:/gi, '')
        .replace(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/\S*/gi, '');
      entries.push({ type: 'sec', el: numRow, id: '', title: sectie, prefix: stemWoord + ' ' + nr + ': ',
                     marge: 7, body: kaart, nt: '', nb: norm(kaart), cit: true });
    });
  })();

  // (2) Documenten: links naar doc/ of externe bronnen (rechtspraak, media).
  // De beschrijvende title-tekst van de link is de zoekbare naam.
  // Bewust NIET indexeren (op verzoek): alléén deze .jpg-versies. Eventuele
  // .pdf-varianten (bv. bijlage4.pdf) blijven dus gewoon vindbaar.
  var NEGEER = ['aanbieding.jpg', 'bijlage3.jpg', 'bijlage4.jpg', 'bijlage6.jpg',
                'bijlage16.jpg', 'bijlage17.jpg', 'bijlage18.jpg', 'bijlage19.jpg',
                'haarlemsweekblad.jpg', 'minister.jpg', 'ontslag.jpg',
                'vanbaal1.jpg', 'vanbaal2.jpg'];
  function negeerDoc(href) {
    var bestand = (href.split('/').pop() || '').split(/[?#]/)[0].toLowerCase();
    // Het e-boek zelf (boek.pdf/book.pdf) hoort niet in de bronnengroep: het heeft
    // zijn eigen groep "In het boek" (met paginadeeplinks). Een citaatkaart die het
    // boek als bron aanhaalt zou anders het boek dubbel tonen, en dan zonder pagina.
    if (bestand === 'boek.pdf' || bestand === 'book.pdf') return true;
    return NEGEER.indexOf(bestand) !== -1;   // verder alleen de losse .jpg's
  }
  var seen = {};
  document.querySelectorAll('a[href]').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var isDoc = /(^|\/)doc\//.test(href) || /\.pdf($|\?)/i.test(href);
    var isBron = /^https?:/i.test(href) && /(rechtspraak|deeplink|ecli|vimeo|youtube|aljazeera|overheid|tweedekamer)/i.test(href);
    if (!isDoc && !isBron) return;
    if (negeerDoc(href)) return;      // bewust overgeslagen documenten
    if (seen[href]) return;

    // Naam: liefst de title (die is beschrijvend), anders de linktekst.
    var name = a.getAttribute('title') || a.textContent || '';
    name = name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '');   // vlag-emoji weg
    name = name.replace(/\s*Bron\s*:[\s\S]*/i, '');        // "Bron: …" en alles erna weg
    name = clean(name);
    // Stemmen-citaten: em-dash tussen het citaat (…”) en het bijschrift.
    name = name.replace(/^(“[\s\S]*?”)\s+(?=\S)/, '$1 — ');
    if (!name || name.length < 4) return;
    seen[href] = true;
    entries.push({ type: 'doc', href: href, title: name, body: '',
                   nt: norm(name), nb: '' });
  });

  if (!entries.length) return; // niets te indexeren -> module stil houden
  entries.forEach(function (e, i) { e.i = i; });   // stabiele verwijzing voor de UI

  // Documentvolgorde-rang voor secties, zodat de resultaten in dezelfde volgorde
  // als op de pagina verschijnen (bv. "Waarom…" vóór het essay).
  var secEntries = entries.filter(function (e) { return e.type === 'sec' && e.el; });
  secEntries.sort(function (a, b) {
    var rel = a.el.compareDocumentPosition(b.el);
    if (rel & 4) return -1;   // a staat vóór b
    if (rel & 2) return 1;    // a staat ná b
    return 0;
  });
  secEntries.forEach(function (e, i) { e.docPos = i; });

  // ---- E-boek-index (lazy) --------------------------------------------------
  // De boekindex (~550 KB) wordt pas geladen zodra iemand het zoekvenster opent,
  // zodat de pagina snel blijft. Als de gebruiker al iets had getypt, zoeken we
  // na het laden opnieuw zodat de boekresultaten alsnog verschijnen.
  var boekPaginas = [];      // { p:paginanr, t:tekst, n:genormaliseerd }
  var boekStatus = 0;        // 0=niet geladen, 1=bezig, 2=klaar
  function laadBoek() {
    if (!BOEK || boekStatus !== 0) return;
    boekStatus = 1;
    var s = document.createElement('script');
    s.src = BOEK.index;
    s.onload = function () {
      var data = window.ZK_BOEK || [];
      boekPaginas = data.map(function (pg) { return { p: pg.p, t: pg.t, n: norm(pg.t) }; });
      boekStatus = 2;
      if (input && clean(input.value)) render(search(input.value), clean(input.value));
    };
    s.onerror = function () { boekStatus = 0; };   // mislukt: later opnieuw proberen
    document.head.appendChild(s);
  }

  // Volledige tekst van de doc/-documenten (lazy, net als het boek).
  var docPaginas = [];       // { f:bestand, p:paginanr, t:tekst, n:genormaliseerd }
  var docStatus = 0;
  // Bestanden die NIET in de documentinhoud-index horen — niet-gelinkte wees-
  // duplicaten van een wél-gelinkt document (verzoekschrift.pdf ~ ombudsman.pdf,
  // eichelsheim.pdf = bijlage19.pdf); anders staat dezelfde inhoud dubbel in
  // "In de documenten zelf".
  var DOC_NEGEER = { 'verzoekschrift.pdf': 1, 'eichelsheim.pdf': 1 };
  function laadDocs() {
    if (docStatus !== 0) return;
    docStatus = 1;
    var s = document.createElement('script');
    s.src = DOCIDX.url;
    s.onload = function () {
      var data = window.ZK_DOCS || [];
      docPaginas = data.filter(function (d) { return !DOC_NEGEER[d.f]; })
                       .map(function (d) { return { f: d.f, p: d.p, t: d.t, n: norm(d.t) }; });
      docStatus = 2;
      if (input && clean(input.value)) render(search(input.value), clean(input.value));
    };
    s.onerror = function () { docStatus = 0; };
    document.head.appendChild(s);
  }

  // ---- Zoeken ---------------------------------------------------------------
  // Losse aliassen: een getypte variant of pseudoniem laat óók de canonieke vorm
  // vinden én markeren. Moniek (NL) / Monica (EN) was destijds de geanonimiseerde
  // naam van Barbara Overduyn (overleden in 2024); Overduijn/Overduin zijn
  // schrijfvarianten. Sleutels en waarden in genormaliseerde vorm (zie norm()).
  var ALIAS = { 'overduijn': 'overduyn', 'overduin': 'overduyn' };
  if (LANG === 'nl') ALIAS['moniek'] = 'barbara overduyn';   // NL-editie: pseudoniem 'Moniek'
  else ALIAS['monica'] = 'barbara overduyn';                 // Engelse editie (ook DE/FR/BA linken hiernaar): 'Monica'
  function termIn(t, hay) { return hay.indexOf(t) !== -1 || (!!ALIAS[t] && hay.indexOf(ALIAS[t]) !== -1); }
  function alleTermenIn(terms, hay) { return terms.every(function (t) { return termIn(t, hay); }); }
  // Termen + alias-expansies als losse woorden, voor snippet-centrering en markering.
  function markeerWoorden(terms) {
    var out = [];
    terms.forEach(function (t) {
      (ALIAS[t] ? [t, ALIAS[t]] : [t]).forEach(function (s) {
        s.split(/\s+/).forEach(function (w) { if (w && out.indexOf(w) < 0) out.push(w); });
      });
    });
    return out;
  }
  // Toelichting die boven de resultaten verschijnt wanneer op een alias wordt gezocht.
  var ALIAS_NOTES = {
    nl: { pseud: 'Moniek is de geanonimiseerde naam die in het boek wordt gebruikt voor Barbara Overduyn.',
          spell: 'Barbara Overduyn hanteerde naast de officiële spelling van haar achternaam ook Overduin en Overduijn.' },
    en: { pseud: 'Monica is the anonymised name used in the book for Barbara Overduyn.',
          spell: 'Besides the official spelling of her surname, Barbara Overduyn also used Overduin and Overduijn.' },
    de: { pseud: 'Monica ist der im Buch verwendete anonymisierte Name für Barbara Overduyn.',
          spell: 'Neben der offiziellen Schreibweise ihres Nachnamens verwendete Barbara Overduyn auch Overduin und Overduijn.' },
    fr: { pseud: 'Monica est le nom anonymisé utilisé dans le livre pour Barbara Overduyn.',
          spell: 'Outre l’orthographe officielle de son nom de famille, Barbara Overduyn utilisait aussi Overduin et Overduijn.' },
    hr: { pseud: 'Monica je anonimizirano ime koje se u knjizi koristi za Barbaru Overduyn.',
          spell: 'Osim službenog pisanja svog prezimena, Barbara Overduyn koristila je i Overduin i Overduijn.' }
  };
  var ALIAS_TYPE = { 'moniek': 'pseud', 'monica': 'pseud', 'overduijn': 'spell', 'overduin': 'spell' };
  function aliasNotities(q) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    var N = ALIAS_NOTES[LANG] || ALIAS_NOTES.nl, gezien = {}, out = [];
    terms.forEach(function (t) {
      var ty = ALIAS_TYPE[t];
      if (ty && ALIAS[t] && !gezien[ty]) { gezien[ty] = 1; out.push(N[ty]); }
    });
    return out;
  }

  function search(q) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    var markeer = markeerWoorden(terms);   // termen + alias-woorden, voor snippet & markering
    // Secties en documenten APART verzamelen. Documenten matchen vaak in hun
    // titel (hoge score) en secties alleen in hun body (lage score); in één
    // gedeelde, op score gesorteerde lijst zouden veel documenten de secties er
    // dan uit duwen. Elk een eigen limiet lost dat op.
    var secRes = [], docRes = [];
    entries.forEach(function (e) {
      var hay = e.nt + ' ' + e.nb;
      if (!alleTermenIn(terms, hay)) return;
      var score = 0;
      terms.forEach(function (t) {
        if (termIn(t, e.nt)) score += 10;
        if (termIn(t, e.nb)) score += 1;
      });
      if (e.type === 'doc') docRes.push({ e: e, score: score });
      else secRes.push({ e: e, score: score, snip: snippet(e, markeer) });
    });

    // Boekpagina's (alle termen moeten op de pagina staan).
    var boekRes = [];
    boekPaginas.forEach(function (pg) {
      if (!alleTermenIn(terms, pg.n)) return;
      var score = 0;
      terms.forEach(function (t) { if (termIn(t, pg.n)) score++; });
      boekRes.push({ e: { type: 'boek', p: pg.p, title: T.pagina + ' ' + pg.p }, score: score, snip: maakSnippet(pg.t, markeer) });
    });

    // Volledige tekst van de documenten (alle termen moeten op de pagina staan).
    var docFullRes = [];
    docPaginas.forEach(function (pg) {
      if (!alleTermenIn(terms, pg.n)) return;
      var score = 0;
      terms.forEach(function (t) { if (termIn(t, pg.n)) score++; });
      docFullRes.push({ e: { type: 'docfull', f: pg.f, p: pg.p, title: pg.f },
                        score: score, snip: maakSnippet(pg.t, markeer) });
    });

    var opScore = function (a, b) { return b.score - a.score; };
    // Secties op paginavolgorde; boek en documenten op relevantie.
    secRes.sort(function (a, b) { return (a.e.docPos || 0) - (b.e.docPos || 0); });
    // Boek op paginanummer (net als op de pagina); secties op paginavolgorde, documenten op relevantie.
    boekRes.sort(function (a, b) { return a.e.p - b.e.p; });
    docRes.sort(opScore);
    // Documentinhoud: op relevantie, dan bestand en pagina bij gelijke score.
    docFullRes.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.e.f !== b.e.f) return a.e.f < b.e.f ? -1 : 1;
      return a.e.p - b.e.p;
    });
    // Geen limieten: alle treffers tonen (secties, boek, documentlinks én documentinhoud).
    return secRes.concat(boekRes).concat(docRes).concat(docFullRes);
  }

  // Maak een fragment rond de eerste treffer, met de term(en) gemarkeerd.
  function maakSnippet(text, terms) {
    var nText = norm(text);
    var pos = -1;
    for (var i = 0; i < terms.length; i++) {
      var p = nText.indexOf(terms[i]);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    }
    if (pos === -1) pos = 0;
    var start = Math.max(0, pos - 60);
    var frag = text.slice(start, start + 180);
    if (start > 0) frag = '… ' + frag;
    if (start + 180 < text.length) frag = frag + ' …';
    return highlight(frag, terms);
  }
  function snippet(e, terms) { return maakSnippet(e.body || e.title, terms); }

  function highlight(text, terms) {
    var out = esc(text);
    // Markeer per term, hoofdletterongevoelig en diacriet-tolerant is lastig op
    // geëncodeerde tekst; we doen een eenvoudige, veilige woordmarkering.
    terms.forEach(function (t) {
      if (!t) return;
      var re = new RegExp('(' + accentPatroon(t) + ')', 'ig');   // ook accentvarianten markeren
      out = out.replace(re, '$1');
    });
    return out.replace(//g, '<mark class="zk-mark">').replace(//g, '</mark>');
  }

  // ---- CSS injecteren -------------------------------------------------------
  var css = ''
    // De menubalk-knop erft de bestaande .menubutton-pil (grijs, witte inhoud,
    // rode hover). De hoogte moet exact die van de tekstknoppen zijn — óók in
    // Safari, waar de regelhoogte nét iets anders rendert dan een icoon. Daarom
    // krijgt de knop een ONZICHTBARE tekst-strut (.zk-sp met een spatie): net als
    // de andere knoppen tekst bevatten, bepaalt de tekst-regelhoogte nu de hoogte.
    // Het vergrootglas ligt er absoluut-gecentreerd overheen (buiten de flow), dus
    // het beïnvloedt hoogte noch breedte en zit links/rechts en boven/onder gelijk.
    + '.zk-menubtn{position:relative;padding-left:15px;padding-right:15px}'
    + '.menubar .zk-menubtn, .SM-scherm .zk-menubtn{margin-left:6px}'   // wat extra ruimte tussen Auteur en de zoekknop (L én S/M)   // ruimer rond het icoon
    + '.zk-menubtn .zk-sp{visibility:hidden}'
    // De rij is met de zoekknop erbij aan de lange kant; daarom de tekstknoppen én
    // Download in DEZE balk 1px smaller (links+rechts). Alleen binnen .menubar,
    // zodat het mobiele hamburgermenu (zelfde .menubutton-klasse) ongemoeid blijft.
    + '.menubar .menubutton:not(.zk-menubtn){padding-left:14px;padding-right:14px}'   // was 15px
    + '.menubar .downloadbutton{padding-left:12px;padding-right:12px}'                // was 13px
    // Franse pagina: alleen op L-schermen (≥1080px, de horizontale .menubar) de
    // knoppen smaller maken vanwege de langere Franse woorden. Op S/M staan de
    // knoppen in het hamburgermenu (.SM-scherm #myLinks) en houden ze — net als in
    // de andere talen — hun gewone padding; daarom deze drie regels binnen de query.
    + '@media only screen and (min-width:1080px){'
    +   'html[lang="fr"] .menubar .menubutton:not(.zk-menubtn){padding-left:12.5px;padding-right:12.5px}'
    +   'html[lang="fr"] .menubar .downloadbutton{padding-left:11px;padding-right:11px}'
    +   'html[lang="fr"] .menubar .zk-menubtn{padding-left:12.5px;padding-right:12.5px}'
    + '}'
    // Tussenruimte exact 7,2px: de regeleinde-witruimte tussen de knoppen op nul
    // (font-size:0 op de balk; knoppen houden hun eigen 14.8px), afstand puur via marge.
    + '.menubar p{font-size:0}'
    + '.menubar .menubutton{margin-right:6.5px}'
    // De extra translate(-0.4px,-0.4px) corrigeert dat de tekening van het
    // vergrootglas (handvat rechtsonder) net rechts-onder van het viewBox-midden ligt.
    + '.zk-menubtn svg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) translate(-0.4px,-0.4px);width:17.5px;height:17.5px;stroke:currentColor;fill:none;stroke-width:2}'
    + '.zk-overlay{position:fixed;inset:0;z-index:99999;background:rgba(30,33,38,.55);display:none;box-sizing:border-box;padding:calc(8vh + 2px) 16px 16px}'
    + '.zk-overlay.zk-open{display:block}'
    + '.zk-panel{max-width:680px;margin:0 auto;background:#fff;border-radius:2.5px;box-shadow:0 18px 60px rgba(0,0,0,.35);overflow:hidden;box-sizing:border-box;font-family:"Helvetica","Arial",sans-serif}'
    + '.zk-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #e6e6e6}'
    + '.zk-head svg{width:20px;height:20px;stroke:#000;fill:none;stroke-width:2.2;flex:0 0 auto}'   // zwart vergrootglas in de pop-up
    + '.zk-input{flex:1 1 auto;border:0;outline:0;font-size:17px;color:#222;background:none;padding:4px 0;font-family:inherit}'   // formulier-elementen erven het lettertype niet vanzelf
    // Sluitknop: een donkerrood kruis, vuurrood bij aanwijzen (Edwin, 18 sept 2026), net als op de bewijskaarten
    + '.zk-x{border:0;background:none;cursor:pointer;padding:4px;margin:-4px -4px -4px 0;flex:0 0 auto;display:flex;align-items:center;justify-content:center;border-radius:3px}'
    + '.zk-x svg{width:18px;height:18px;stroke:#900000;fill:none;stroke-width:2.6;stroke-linecap:round}'
    + '.zk-x:hover svg,.zk-x:focus-visible svg{stroke:#F00000}'
    + '.zk-x:focus-visible{outline:2px solid #900000;outline-offset:1px}'
    + '.zk-results{max-height:64vh;overflow:auto;padding:6px 0}'
    + '.zk-group{font-family:"Helvetica","Arial",sans-serif;font-weight:700;font-size:16px;line-height:1;letter-spacing:.05em;text-transform:uppercase;color:#1a1d21;padding:14px 18px 7px}'
    + '.zk-group ~ .zk-group{border-top:1px solid #cfcfcf;margin-top:6px}'   // dunne scheidingslijn, alleen als er een groep boven staat
    + '.zk-item{display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;padding:9px 18px;color:#222;font:inherit;box-sizing:border-box}'
    + '.zk-item:hover,.zk-item.zk-sel{background:#f4f6f7}'
    + '.zk-item .zk-t{font-weight:600;font-size:15px;color:#1a1d21;display:block}'
    + '.zk-item.zk-doc .zk-t{font-weight:400;font-size:14px}'   // documentlinks niet vet, iets kleiner
    + '.zk-item.zk-docfull .zk-t{font-weight:400;font-size:14px}'   // documentinhoud idem
    + '.zk-item .zk-s{font-size:13px;color:#484d54;display:block;margin-top:2px}'   // fragmenttekst iets donkerder grijs
    + '.zk-mark{background:#ffe58a;color:inherit;border-radius:2px}'
    + 'mark.zk-pagemark{background:#ffe58a;color:inherit;border-radius:2px}'   // gemarkeerd woord op de pagina zelf
    + '.zk-empty{padding:22px 18px;color:#777;font-size:14px}'
    + '.zk-note{margin:10px 18px 2px;padding:9px 12px;background:#f4f6f7;border-left:3px solid #900000;border-radius:3px;font-size:13px;line-height:1.45;color:#3a3d42}'
    // Zwevende zoekknop: alleen als vangnet voor losse mobiele bestanden (geen menubalk én geen hamburgermenu)
    + '.zk-fab{position:fixed;right:16px;bottom:16px;z-index:9998;width:46px;height:46px;border-radius:50%;border:0;cursor:pointer;background:#900000;box-shadow:0 4px 14px rgba(0,0,0,.3);display:none;align-items:center;justify-content:center;padding:0}'
    + '.zk-fab.zk-show{display:flex}'
    + '.zk-fab svg{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2.4}';
  var st = document.createElement('style');
  st.appendChild(document.createTextNode(css));
  document.head.appendChild(st);

  // ---- Zoekknop in de menubalk(en) ------------------------------------------
  var searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>';
  function makeBtn() {
    var b = document.createElement('button');
    b.type = 'button';
    b.tabIndex = -1;                         // net als de andere menuknoppen
    b.className = 'menubutton zk-menubtn';   // zelfde pil-stijl als Boek/Nieuws/…
    b.setAttribute('aria-label', T.knop);
    b.title = T.knop;
    // Onzichtbare tekst-strut (bepaalt de hoogte, net als de tekst in de andere
    // knoppen) + het absoluut-gecentreerde vergrootglas eroverheen.
    b.innerHTML = '<span class="zk-sp">&nbsp;</span>' + searchIcon;
    b.addEventListener('click', open);
    return b;
  }
  // Ingangspunt(en). De site is responsief: op brede schermen toont hij de
  // horizontale menubalk (.menubar), op smalle/mobiele schermen een hamburger.
  // Het hand-getunede, absoluut gepositioneerde hamburgermenu verdraagt geen
  // ingevoegde knop, dus daar gebruiken we een zwevende zoekknop. We plaatsen op
  // basis van wat op dít moment zichtbaar is, en herevalueren bij resize.
  // (a) Brede schermen (L / G-scherm): knop in de horizontale menubalk, tussen
  // Auteur en Download.
  var deskbar = document.querySelector('.menubar p');
  var deskBtn = null;
  if (deskbar) {
    deskBtn = makeBtn();
    var dl = deskbar.querySelector('a[download], a[href$=".pdf"]');
    if (dl) {
      deskbar.insertBefore(deskBtn, dl);
      // Tussen de andere knoppen staat een regeleinde dat als spatie meetelt
      // (~4px) bovenop de marge (4px) = 8px. Rechts van de ingevoegde knop
      // ontbreekt die spatie; voeg hem toe zodat de tussenruimte gelijk is.
      deskbar.insertBefore(document.createTextNode(' '), dl);
    } else {
      deskbar.appendChild(deskBtn);
    }
  }

  // (b) Smalle schermen (S/M): zoekknop ín het hamburgermenu, links van Download,
  // net als op L. Het SM-scherm-menu staat in normale flow (de knoppen staan op een
  // rij zodra het menu open is), dus we voegen de knop gewoon vóór de downloadlink in.
  // (De losse m/-bestanden hebben een absoluut gepositioneerd #myLinks; die vallen
  // hier buiten en gebruiken de zwevende knop.)
  var menuBtn = null;
  var mylinks = document.querySelector('.SM-scherm #myLinks');
  if (mylinks) {
    menuBtn = makeBtn();
    var mdl = mylinks.querySelector('a[download], a[href$=".pdf"]');
    if (mdl) {
      mylinks.insertBefore(menuBtn, mdl);
      mylinks.insertBefore(document.createTextNode(' '), mdl);   // spatie, zoals tussen de andere menuknoppen
    } else {
      mylinks.appendChild(menuBtn);
    }
  }

  // (c) Eigen menu-trigger(s): een element met [data-zk-open] op de pagina (bv. de
  // mobiele hamburger-regel 'Zoeken') opent het zoekvenster. Dan is de zwevende
  // knop niet nodig.
  var eigenTriggers = document.querySelectorAll('[data-zk-open]');
  eigenTriggers.forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });

  // (d) Vangnet: zwevende knop, alleen als er geen menubalk, hamburgermenu of eigen
  // trigger is. Op de desktoppagina bestaan deskBtn/menuBtn, dus daar nooit.
  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'zk-fab';
  fab.setAttribute('aria-label', T.knop);
  fab.title = T.knop;
  fab.innerHTML = searchIcon;
  fab.addEventListener('click', open);
  document.body.appendChild(fab);

  if (deskBtn || menuBtn || eigenTriggers.length) fab.classList.remove('zk-show');
  else fab.classList.add('zk-show');

  // ---- Overlay --------------------------------------------------------------
  var overlay = document.createElement('div');
  overlay.className = 'zk-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', T.knop);
  overlay.innerHTML =
      '<div class="zk-panel">'
    +   '<div class="zk-head">' + searchIcon
    +     '<input class="zk-input" type="text" autocomplete="off" spellcheck="false" placeholder="' + esc(T.ph) + '" aria-label="' + esc(T.ph) + '">'
    +     '<button class="zk-x" type="button" aria-label="' + esc(T.sluit) + '" title="' + esc(T.sluit) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button>'
    +   '</div>'
    +   '<div class="zk-results" role="listbox"></div>'
    + '</div>';
  document.body.appendChild(overlay);

  var input   = overlay.querySelector('.zk-input');
  var results = overlay.querySelector('.zk-results');
  var sel = -1;

  function open() {
    overlay.classList.add('zk-open');
    laadBoek();   // e-boek-index lazy inladen zodra het venster opengaat
    laadDocs();   // documentinhoud-index idem
    // Achtergrond-scroll vergrendelen. In quirks mode is <body> de scroller,
    // dus beide afdekken.
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    input.value = '';
    render([]);
    input.focus();
  }
  function close() {
    overlay.classList.remove('zk-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function render(res, q) {
    sel = -1;
    if (!q) { results.innerHTML = ''; return; }
    var notitieHtml = aliasNotities(q).map(function (n) {
      return '<div class="zk-note">' + esc(n) + '</div>';
    }).join('');
    if (!res.length) {
      results.innerHTML = notitieHtml + '<div class="zk-empty">' + esc(T.geen) + ' “' + esc(q) + '”.</div>';
      return;
    }
    var secs = res.filter(function (r) { return r.e.type === 'sec'; });
    var boeks = res.filter(function (r) { return r.e.type === 'boek'; });
    var docs = res.filter(function (r) { return r.e.type === 'doc'; });
    var docsF = res.filter(function (r) { return r.e.type === 'docfull'; });
    var html = '';
    if (secs.length) {
      html += '<div class="zk-group">' + esc(T.secties) + '</div>';
      secs.forEach(function (r, i) { html += itemHtml(r, 's' + i); });
    }
    if (boeks.length) {
      html += '<div class="zk-group">' + esc(T.boek) + '</div>';
      boeks.forEach(function (r, i) { html += itemHtml(r, 'b' + i); });
    }
    if (docs.length) {
      html += '<div class="zk-group">' + esc(T.docs) + '</div>';
      docs.forEach(function (r, i) { html += itemHtml(r, 'd' + i); });
    }
    if (docsF.length) {
      html += '<div class="zk-group">' + esc(T.docsInhoud) + '</div>';
      docsF.forEach(function (r, i) { html += itemHtml(r, 'f' + i); });
    }
    results.innerHTML = notitieHtml + html;
  }

  function itemHtml(r, key) {
    var type = r.e.type;
    var cls = 'zk-item' + (type === 'doc' ? ' zk-doc' : '') + (type === 'boek' ? ' zk-boek' : '')
            + (type === 'docfull' ? ' zk-docfull' : '');
    var termen = markeerWoorden(norm(input.value).split(/\s+/).filter(Boolean));
    var titel = r.e.title;
    if (type === 'docfull') titel = r.e.title + ' · ' + T.pagina + ' ' + r.e.p;   // onderschrift + paginanr
    var t = highlight(titel, termen);
    if (r.e.prefix) t = r.e.prefix + t;        // essay-/stemmen-kopjes labelen
    // Documentlinks tonen geen fragment; secties, boekpagina's én documentinhoud wel.
    var s = type === 'doc' ? '' : '<span class="zk-s">' + r.snip + '</span>';
    var dest = type === 'doc' ? 'doc:' + r.e.href
             : type === 'boek' ? 'boek:' + r.e.p
             : type === 'docfull' ? 'docp:' + r.e.p + ':' + r.e.f
             : 'sec:' + r.e.i;
    return '<button class="' + cls + '" data-dest="' + esc(dest) + '" role="option">'
         + '<span class="zk-t">' + t + '</span>' + s + '</button>';
  }

  function scrollY() { return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0; }
  // Absolute Y-positie van een element t.o.v. het document (verse berekening).
  // Via getBoundingClientRect zodat het voor élk elementtype werkt — ook SVG en
  // tabelcellen, die geen bruikbare offsetTop/offsetParent hebben.
  function elementOffset(el) {
    var r = el.getBoundingClientRect();
    // Mobiel: de `.anchor`-spans hebben `margin-top:-48px` (offset-truc zodat een
    // native #id-sprong nét onder de sticky balk landt). Hun visuele sectie begint
    // bij hun ONDERkant, niet hun top. Meet dan de bottom, anders telt de -48px
    // dubbel met stickyOffset en land je ~een schermbalk te laag.
    var y = (isMobiel && el.classList && el.classList.contains('anchor')) ? r.bottom : r.top;
    return Math.max(0, y + scrollY());
  }
  // Hoogte van de sticky/fixed header, zodat het kopje er niet onder verdwijnt.
  // Er kunnen meerdere .header-elementen zijn (desktop/mobiel); pak de échte
  // sticky/fixed en zichtbare.
  function stickyOffset() {
    var hoog = 0;
    var hs = document.querySelectorAll('.header');
    for (var i = 0; i < hs.length; i++) {
      var cs = getComputedStyle(hs[i]);
      if ((cs.position === 'sticky' || cs.position === 'fixed') && hs[i].offsetHeight > 5) { hoog = hs[i].offsetHeight; break; }
    }
    // Mobiel: onder de vaste balk rolt in de citatenlijst een tweede baan uit met de
    // filterstand. Die telt mee zolang hij uitgerold staat, anders belandt het gezochte
    // citaat er precies achter. scrollNaar() herberekent het doel nog drie seconden na,
    // dus een baan die pas ná de sprong uitrolt wordt alsnog verrekend.
    var baan = document.querySelector('.ddg-mini.uitgerold');
    if (baan && baan.offsetHeight > 5) hoog += baan.offsetHeight;
    return hoog;
  }
  // Scroll-doel voor een element: net onder de sticky header, met wat lucht
  // (marge in px; standaard 15, per sectie instelbaar).
  function scrollDoel(el, marge) { return Math.max(0, elementOffset(el) - stickyOffset() - (marge == null ? 15 : marge)); }

  // Eigen smooth-scroll (rAF) naar een ELEMENT. Onafhankelijk van native 'smooth'
  // (in quirks mode onbetrouwbaar) en robuust tegen layout-verschuiving: het doel
  // wordt elke frame opnieuw uit het element berekend, zodat lazy-ladende media
  // (Vimeo, afbeeldingen) boven het doel — die de pagina omlaag duwen — worden
  // gevolgd. Na-correcties vangen traag ladende media op; ze stoppen zodra de
  // gebruiker zelf scrollt.
  function scrollNaar(el, marge) {
    var start = scrollY();
    if (reduceMotion || !window.requestAnimationFrame) { window.scrollTo(0, scrollDoel(el, marge)); return; }
    var duur = Math.min(700, Math.max(250, Math.abs(scrollDoel(el, marge) - start) * 0.4));
    var t0 = null, gezet = start, settleActief = false;

    // Na de animatie: houd het kopje ~3s bovenaan terwijl trage media (Vimeo,
    // afbeeldingen) nog laadt en de layout verschuift. Stopt meteen zodra de
    // gebruiker zelf scrollt.
    function startSettle() {
      if (settleActief) return;
      settleActief = true;
      var n = 0;
      var timer = setInterval(function () {
        n++;
        if (Math.abs(scrollY() - gezet) > 30) { clearInterval(timer); return; }  // gebruiker scrolde
        var doel = scrollDoel(el, marge);
        if (Math.abs(scrollY() - doel) > 1) { gezet = doel; window.scrollTo(0, doel); }
        if (n >= 30) clearInterval(timer);
      }, 100);
    }

    function stap(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / duur);
      var e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;   // easeInOutQuad
      var doel = scrollDoel(el, marge);                             // herberekend -> volgt verschuiving
      gezet = Math.round(start + (doel - start) * e);
      window.scrollTo(0, gezet);
      if (p < 1) requestAnimationFrame(stap);
      else { gezet = scrollDoel(el, marge); window.scrollTo(0, gezet); startSettle(); }
    }
    requestAnimationFrame(stap);
    // Vangnet als rAF helemaal niet loopt (verborgen tab e.d.): alsnog landen + settelen.
    setTimeout(function () {
      if (!settleActief) { gezet = scrollDoel(el, marge); window.scrollTo(0, gezet); startSettle(); }
    }, duur + 80);
  }

  // ---- Zoekterm markeren op de pagina zelf ---------------------------------
  var paginaMarks = [];
  function wisPaginaMarkeringen() {
    paginaMarks.forEach(function (m) {
      var p = m.parentNode;
      if (p) { p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); }
    });
    paginaMarks = [];
  }
  function markeerOpPagina(termen) {
    wisPaginaMarkeringen();
    termen = (termen || []).filter(Boolean);
    if (!termen.length) return;
    var re = new RegExp('(' + termen.map(accentPatroon).join('|') + ')', 'gi');   // ook accentvarianten
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'MARK') return NodeFilter.FILTER_REJECT;
        if (p.closest && (p.closest('.zk-overlay') || p.closest('.header') || p.closest('.zk-fab'))) return NodeFilter.FILTER_REJECT;
        re.lastIndex = 0;
        return re.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], nd;
    while ((nd = walker.nextNode())) nodes.push(nd);
    nodes.forEach(function (node) {
      re.lastIndex = 0;
      var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var mk = document.createElement('mark');
        mk.className = 'zk-pagemark';
        mk.textContent = m[0];
        frag.appendChild(mk);
        paginaMarks.push(mk);
        last = m.index + m[0].length;
        if (m[0].length === 0) re.lastIndex++;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      if (node.parentNode) node.parentNode.replaceChild(frag, node);
    });
  }

  function go(dest) {
    if (dest.indexOf('doc:') === 0) {
      window.open(dest.slice(4), '_blank', 'noopener');
      return;
    }
    if (dest.indexOf('boek:') === 0) {
      // Open het e-boek op de juiste pagina (PDF-deeplink).
      if (BOEK) window.open(BOEK.pdf + '#page=' + dest.slice(5), '_blank', 'noopener');
      return;
    }
    if (dest.indexOf('docp:') === 0) {
      // Open het document op de juiste pagina. Formaat: docp:<pagina>:<bestand>
      var rest = dest.slice(5);
      var sp = rest.indexOf(':');
      var pag = rest.slice(0, sp), best = rest.slice(sp + 1);
      window.open(DOCIDX.map + best + '#page=' + pag, '_blank', 'noopener');
      return;
    }
    var entry = entries[parseInt(dest.slice(4), 10)];
    var termen = markeerWoorden(norm(input.value).split(/\s+/).filter(Boolean));   // termen + alias-woorden, vóór close()
    close();
    if (!entry || !entry.el) return;
    var el = entry.el;
    // Staat het doel in een ingeklapt blok (de secties 13–17, of de
    // media-aandacht-tijdlijn)? Dan eerst uitklappen (direct, zonder animatie),
    // anders scrollen we naar clipped/leegte.
    var klapblokken = [
      { id: 'extraStemmen', fn: 'toggleExtraStemmen' },
      { id: 'publicationsList', fn: 'togglePublications' }
    ];
    klapblokken.forEach(function (kb) {
      var klapblok = el.closest && el.closest('#' + kb.id);
      if (!klapblok) return;
      var mh = klapblok.style.maxHeight;
      if (mh === '' || mh === '0px') {
        if (typeof window[kb.fn] === 'function') { try { window[kb.fn](); } catch (e3) {} }
        klapblok.style.transition = 'none';
        klapblok.style.maxHeight = 'none';        // direct volledig open (geen clipping)
      }
    });
    // Footer-bronnenblok: de kop staat NIET ín het ingeklapte blok, dus dat vangt
    // de lus hierboven niet. Klap het expliciet uit als de entry erom vraagt.
    if (entry.klap) {
      var fb = document.getElementById(entry.klap.id);
      if (fb) {
        var fmh = fb.style.maxHeight;
        if (fmh === '' || fmh === '0px') {
          if (typeof window[entry.klap.fn] === 'function') { try { window[entry.klap.fn](); } catch (e4) {} }
          fb.style.transition = 'none';
          fb.style.maxHeight = 'none';        // direct volledig open (geen clipping)
        }
      }
    }
    // Mobiel: de kaart kan door het citatenfilter verborgen staan (de pagina opent
    // op de sleutelcitaten). Dan eerst op "alles" klikken, anders valt er niets te
    // tonen. De knop regelt zelf de nummering en de aria-pressed van de balk.
    if (entry.cit && el && !el.offsetParent) {
      /* De knop zit in de kopregel en niet in de rij eronder — sinds september 2026
         staat hij daar op de tweede regel, achter het opschrift met de huidige keuze.
         Vandaar zoeken op het attribuut in beide balken en niet op één balk. */
      var alles = document.querySelector('#stemKop button[data-groep="all"], ' +
                                         '#stemFilter button[data-groep="all"]');
      if (alles) { try { alles.click(); } catch (e5) {} }
    }
    // Naar het element scrollen (robuust tegen layout-verschuiving door lazy media).
    scrollNaar(el, entry.marge);
    markeerOpPagina(termen);   // het gezochte woord op de pagina geel markeren
    if (entry.id) { try { history.pushState(null, '', '#' + entry.id); } catch (e2) {} }
  }

  // ---- Interactie -----------------------------------------------------------
  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    var q = input.value;
    timer = setTimeout(function () { render(search(q), clean(q)); }, 90);
  });

  results.addEventListener('click', function (e) {
    var btn = e.target.closest('.zk-item');
    if (btn) go(btn.getAttribute('data-dest'));
  });

  function items() { return results.querySelectorAll('.zk-item'); }
  function moveSel(d) {
    var list = items();
    if (!list.length) return;
    if (sel >= 0) list[sel].classList.remove('zk-sel');
    sel = (sel + d + list.length) % list.length;
    list[sel].classList.add('zk-sel');
    list[sel].scrollIntoView({ block: 'nearest' });
  }

  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter') {
      var list = items();
      var btn = sel >= 0 ? list[sel] : list[0];
      if (btn) { e.preventDefault(); go(btn.getAttribute('data-dest')); }
    }
  });

  overlay.querySelector('.zk-x').addEventListener('click', close);
  overlay.addEventListener('mousedown', function (e) {
    if (e.target === overlay) close();      // klik op donkere rand sluit
  });

  // Sneltoetsen: "/" of Cmd/Ctrl-K openen het zoekvenster.
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K'))) {
      e.preventDefault();
      open();
    }
  });

})();
