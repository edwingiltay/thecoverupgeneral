//  Javascript behorend bij dedoofpotgeneraal.nl  (vanilla JS, geen jQuery)

document.addEventListener('DOMContentLoaded', function () {

  function all(sel){ return document.querySelectorAll(sel); }
  function setCss(sel, obj){ all(sel).forEach(function(el){ for (var k in obj){ el.style.setProperty(k, obj[k]); } }); }
  function on(sel, ev, fn){ all(sel).forEach(function(el){ el.addEventListener(ev, fn); }); }
  function hover(sel, inFn, outFn){ all(sel).forEach(function(el){ el.addEventListener('mouseenter', inFn); el.addEventListener('mouseleave', outFn); }); }

  // smooth scroll naar ankers (voorheen jQuery .animate)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (!hash || hash.charAt(0) !== '#' || hash.length < 2) return;
    var target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    history.pushState(null, '', hash);
  });

  // menubar
  on('#gloss1', 'mouseover', function(){ setCss('.navigation', {'stroke-width':'4px'}); });
  on('#gloss1', 'mouseout',  function(){ setCss('.navigation', {'stroke-width':'3.5px'}); });

  // sociale media
  var socials = [
  { container: ".container102", icon: "facebook" },
  { container: ".container103", icon: "twitter"  },
  { container: ".container104", icon: "linkedin" },
  { container: ".container105", icon: "whatsapp" },
  { container: ".container106", icon: "email"    }
];
  socials.forEach(function (s) {
    hover(s.container + ' .socialmedia',
      function(){ setCss('#'+s.icon+'1', {'stroke-width':'2px'});  setCss('#'+s.icon+'2', {'filter':'opacity(100%)'}); },
      function(){ setCss('#'+s.icon+'1', {'stroke-width':'0.5px'}); setCss('#'+s.icon+'2', {'filter':'opacity(60%)'}); }
    );
  });

  // recensies: elke citaatkaart licht op bij hover. Welke achtergrond daarna
  // terugkomt bepaalt de klasse table1/table2 op de kaart zelf, en niet langer een
  // vaste lijst per kaart: de citatenfilter hieronder legt het schaakbordpatroon
  // opnieuw, en een onthouden kleur zou dan niet meer kloppen.
  var hoverInGradient = 'linear-gradient(135deg, #CED3D7, #CED3D7 50%, #E0E1E2 100%)';
  all('.sectie a.citations').forEach(function (a) {
    var kaart = a.querySelector('table.table1, table.table2');
    if (!kaart) return;
    function plus(aan) {
      var use = kaart.querySelector('svg use');
      if (!use) return;
      if (aan) {
        if (use.getAttribute('href') === '#red') { use.dataset.originalHref = '#red'; use.setAttribute('href', '#plus-red'); }
      } else if (use.dataset.originalHref) {
        use.setAttribute('href', use.dataset.originalHref); delete use.dataset.originalHref;
      }
    }
    a.addEventListener('mouseenter', function () {
      kaart.style.setProperty('background-image', hoverInGradient);
      plus(true);
    });
    a.addEventListener('mouseleave', function () {
      // inline overschrijving weghalen; .table1 of .table2 levert daarna zelf weer
      // de juiste achtergrond, welke van de twee de kaart op dat moment ook draagt
      kaart.style.removeProperty('background');
      kaart.style.removeProperty('background-image');
      plus(false);
    });
  });

  // laatste button
  on('#ton3','mouseover', function(){ setCss('#ton4', {'background-image':'linear-gradient(110deg, #F00000, #F00000 100%)'}); });
  on('#ton3','mouseout',  function(){ setCss('#ton4', {'background-image':'linear-gradient(110deg, #C00000, #B00000 100%)'}); });

  // boxen. De rode balk boven en onder de knop is een inset-schaduw en geen rand,
  // want een rand loopt in de afgeronde hoek een stukje langs de zijkant mee.
  var balkAan  = 'inset 0 5px 0 #B00000, inset 0 -5px 0 #B00000';
  var balkUit  = 'inset 0 5px 0 #A00000, inset 0 -5px 0 #A00000';
  ['box1','box2','box5'].forEach(function(box){
    on('#'+box,'mouseover', function(){ setCss('.kleur36', {'box-shadow':balkAan}); setCss('.'+box, {'fill':'#DD0000'}); });
    on('#'+box,'mouseout',  function(){ setCss('.kleur36', {'box-shadow':balkUit}); setCss('.'+box, {'fill':'#900000'}); });
  });
  ['box3','box4'].forEach(function(box){
    on('#'+box,'mouseover', function(){ setCss('.'+box, {'color':'#FFFFFF'}); });
    on('#'+box,'mouseout',  function(){ setCss('.'+box, {'color':'#B00000'}); });
  });

  // Interactieve reveal Europakaart (#europeanim): speelt eenmalig af zodra het kaartje in beeld scrollt.
  // Progressieve verbetering: bij prefers-reduced-motion of ontbrekende IntersectionObserver blijft de kaart volledig zichtbaar.
  (function(){
    var m = document.getElementById('europeanim');
    if (!m) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    m.classList.add('arm');
    var io = new IntersectionObserver(function(en){
      en.forEach(function(e){
        if (e.isIntersecting) { requestAnimationFrame(function(){ m.classList.add('play'); }); io.disconnect(); }
      });
    }, { threshold: 0.35 });
    io.observe(m);
  })();

  // Interactieve citatenfilter: verdeelt de honderd citaatkaarten over groepen
  // en toont per keuze alleen die kaarten. In welke groep een citaat valt staat
  // als data-stem op de cel in de HTML, zodat verhuizen een kwestie van een
  // attribuut is. Een kaart mag in meer dan een groep zitten: de rollen sluiten
  // elkaar uit en tellen samen op tot honderd, maar een dwarsgroep als de
  // Bosnische stemmen loopt daar doorheen. Scheid ze met een spatie. De opschriften staan als data-attribuut op de balk
  // zelf, want die verschillen per taal. Zonder JS wordt de balk niet gevuld en
  // blijft de volledige lijst gewoon staan.
  (function () {
    var bar = document.getElementById('stemFilter');
    if (!bar) return;
    /* De herkomstbalk staat alleen op de Nederlandse pagina; op de vier andere talen
       ontbreekt de div en blijft alles hieronder eromheen werken alsof hij er niet is. */
    var vlagBar = document.getElementById('stemVlaggen');
    /* De kopregel met 'alle citaten' en de drie schakelaars, en de balk met de
       brondocumenten. Ontbreken ze, dan werkt de rest eromheen. */
    var kopBar = document.getElementById('stemKop');
    var bronBar = document.getElementById('stemBronnen');
    var secties = [].slice.call(document.querySelectorAll('table.sectie'));
    if (!secties.length) return;

    // De datum van elk citaat klein onder het bolletje, in hoofdletters. De datum
    // staat als data-datum op de cel; we tonen alleen de precisie die we echt hebben
    // (JJJJ, MAAND JJJJ of D MAAND JJJJ) en verzinnen dus nooit een dag. Maandnamen
    // per taal, gekozen op het lang-attribuut van de pagina.
    var MND = { nl:['JAN','FEB','MRT','APR','MEI','JUN','JUL','AUG','SEP','OKT','NOV','DEC'],
                en:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
                de:['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'],
                fr:['JANV','FÉVR','MARS','AVR','MAI','JUIN','JUIL','AOÛT','SEPT','OCT','NOV','DÉC'],
                hr:['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AVG','SEP','OKT','NOV','DEC'] };
    var taal = (document.documentElement.getAttribute('lang') || 'nl').slice(0,2).toLowerCase();
    var maanden = MND[taal] || MND.nl;
    // 'today' = altijd actueel (Overduyns LinkedIn-gedenkprofiel staat er nog steeds)
    function vandaag() { var d = new Date();
      return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2); }
    function res(iso) { return iso === 'today' ? vandaag() : iso; }
    function datumLabel(iso) {
      iso = res(iso);
      if (!iso) return '';
      var p = iso.split('-');
      if (p.length === 1) return p[0];
      var m = maanden[parseInt(p[1], 10) - 1];
      if (p.length === 2) return m + ' ' + p[0];
      return parseInt(p[2], 10) + ' ' + m + ' ' + p[0];
    }
    // De landcode achter een vlagteken: twee regionale-indicatorletters (de N en de L
    // van de Nederlandse vlag) terug naar 'NL'. Dat is het opschrift op de
    // herkomstknoppen en tegelijk de sleutel waaronder we tellen ('#NL'), met een '#'
    // ervoor zodat een land nooit botst met een rolgroep of een jaar.
    function landcode(vlag) {
      var uit = '';
      for (var i = 0; i < (vlag || '').length; i++) {
        var c = vlag.codePointAt(i);
        if (c >= 0x1F1E6 && c <= 0x1F1FF) { uit += String.fromCharCode(65 + c - 0x1F1E6); i++; }
      }
      return uit;
    }
    // De datum als boogje langs de onderkant van het bolletje. De cirkel in svgicon1
    // Het brontype (data-bron op de kaart-cel: Vonnis/Brief/Recensie/…), recht en
    // gecentreerd onder het bolletje (svgicon1: cirkel op 61,52, straal 38, onderkant
    // y=90). Bewust niet meegebogen met de bolling: dat oogt te speels voor deze site.
    function plaatsBrontype(svgIcon, type) {
      if (!svgIcon || !type) { return null; }
      var bestaat = svgIcon.querySelector('.kaartdatum');
      if (bestaat) { return bestaat; }
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('class', 'kaartdatum');
      t.setAttribute('x', '61');
      t.setAttribute('y', '103.4');
      t.setAttribute('text-anchor', 'middle');
      t.textContent = type;
      svgIcon.appendChild(t);
      return t;
    }

    // De eerste zes sluiten elkaar uit; de drie daarna lopen daar dwars doorheen en overlappen dus met de rest. De rollen
    // tellen samen op tot 91 en niet tot 100: zes kaarten dragen bewust geen rol,
    // omdat ze in geen van de zes passen (staatshoofd, bibliotheek, museum, bank, een
    // EU-klokkenluider en een bankier). Die blijven bereikbaar via 'alle citaten'.
    // Volgorde: eerst de rollen, aflopend naar hoe bindend de stem is, van de
    // rechter tot de verslaggeving. Daarna de vier dwarsgroepen, van dichtbij
    // naar veraf, met de tegenstemmen achteraan.
    /* 'bosnische' staat hier bewust niet meer bij: die stemmen zijn via de landenrij te
       vinden en de groep blijft op de kaarten staan, dus terugzetten is deze regel. */
    var GROEPEN = ['rechters', 'defensie', 'parlementariers',
                   'deskundigen', 'betrokkenen', 'media',
                   'veteranen', 'tegenstemmen'];
    var aantal = { all: 0 };
    GROEPEN.forEach(function (g) { aantal[g] = 0; });
    /* Per land het vlagteken zoals het op de kaart staat, zodat de knop straks
       dezelfde tekens draagt als de bronregel en dus dezelfde glyph uit
       flags-v90.woff2 pakt. */
    var vlagVan = {};

    // Per sectie de oorspronkelijke rijen bewaren. 'Alle citaten' zet daarmee de
    // pagina exact terug zoals hij zonder filter staat, schaakbordpatroon incluis.
    // We verplaatsen de bestaande cellen en maken geen kopieen, zodat de
    // hover-listeners erop blijven zitten.
    var blokken = secties.map(function (tab) {
      var body = tab.tBodies[0] || tab;
      var kop = null, origRijen = [], kaarten = [];
      [].slice.call(body.rows).forEach(function (tr) {
        if (tr.querySelector('.tablehead')) { kop = tr; return; }
        // de cellen los meenemen: bij het filteren verhuizen ze naar nieuwe
        // rijen, en dan is de oude rij leeg als hij teruggezet moet worden
        origRijen.push({ tr: tr, cellen: [].slice.call(tr.cells) });
        [].slice.call(tr.cells).forEach(function (td) {
          var kaart = td.querySelector('table.table1, table.table2');
          if (!kaart) return;
          var groepen = (td.getAttribute('data-stem') || '').split(/\s+/)
                          .filter(function (g) { return g; });
          var im = td.querySelector('img[class*=sprite-]');
          var fk = im && (im.className || '').match(/sprite-[a-z0-9]+/);
          var vl = td.querySelector('.kleinvlaggetje');
          kaarten.push({ td: td, kaart: kaart, groepen: groepen, foto: fk ? fk[0] : null,
                         klasse: kaart.className, stijl: td.getAttribute('style'),
                         datum: res(td.getAttribute('data-datum')) || '',
                         volgorde: parseFloat(td.getAttribute('data-volgorde')) || Infinity,
                         /* data-sorteer is de plek in de rij, data-datum is wat de kaart toont.
                            Ze lopen uiteen waar de bron alleen een maand prijsgeeft maar we wel
                            weten waar die stem in de reeks hoort. */
                         sleutel: res(td.getAttribute('data-sorteer')) ||
                                  res(td.getAttribute('data-datum')) || '',
                         vlag: vl ? vl.textContent.trim() : '',
                         doc: td.getAttribute('data-doc') || '' });
          var lab = plaatsBrontype(td.querySelector('.svgicon1'), td.getAttribute('data-bron'));
          var laatste = kaarten[kaarten.length - 1];
          laatste.label = lab;
          laatste.bron = td.getAttribute('data-bron') || '';
          aantal.all++;
          groepen.forEach(function (g) { if (aantal[g] != null) { aantal[g]++; } });
          // per jaar meetellen voor de tijdlijn, met '@' ervoor zodat een jaar
          // nooit botst met een rolgroep
          var jr = (res(td.getAttribute('data-datum')) || '').slice(0, 4);
          if (jr) { aantal['@' + jr] = (aantal['@' + jr] || 0) + 1; }
          // en per land van herkomst, afgelezen aan het vlaggetje bij de bronregel
          var lc = landcode(laatste.vlag);
          if (lc) {
            aantal['#' + lc] = (aantal['#' + lc] || 0) + 1;
            if (!vlagVan[lc]) { vlagVan[lc] = laatste.vlag; }
          }
          // en per soort brondocument, met '$' ervoor als eigen naamruimte
          if (laatste.doc) { aantal['$' + laatste.doc] = (aantal['$' + laatste.doc] || 0) + 1; }
        });
      });
      var ruimte = tab.nextElementSibling;
      return { tab: tab, body: body, kop: kop, origRijen: origRijen, kaarten: kaarten,
               ruimte: (ruimte && ruimte.tagName === 'P') ? ruimte : null };
    });

    // De laatste vijf secties zitten achter een leesmeerknop. Zodra er gefilterd
    // wordt moeten die mee, anders kloppen de tellingen op de knoppen niet. Bij
    // 'alle citaten' gaat het blok terug naar de stand van voor het filteren.
    var extraBlok = document.getElementById('extraStemmen');
    var extraKnop = document.getElementById('extraStemmenLink');
    var credits = document.getElementById('epcredits');
    var bewaardeStand = null;
    function extra(actief) {
      if (!extraBlok) return;
      if (actief) {
        if (bewaardeStand === null) { bewaardeStand = extraBlok.style.maxHeight || '0px'; }
        extraBlok.style.transition = 'none';
        extraBlok.style.maxHeight = 'none';
        if (extraKnop) { extraKnop.style.display = 'none'; }
        if (credits) { credits.style.display = 'inline'; }
      } else if (bewaardeStand !== null) {
        var dicht = (bewaardeStand === '0px' || bewaardeStand === '');
        extraBlok.style.transition = 'none';
        extraBlok.style.maxHeight = bewaardeStand;
        if (extraKnop) { extraKnop.style.display = ''; }
        if (credits) { credits.style.display = dicht ? 'none' : 'inline'; }
        bewaardeStand = null;
      }
    }

    // De zeventien sectiekoppen vertellen het verhaal op volgorde. Een filter snijdt
    // daar juist dwars doorheen, en dan slaan die koppen niet meer op wat eronder
    // staat: bij de veteranen bleef er een kop met ondertitel over elk citaat staan.
    // Daarom gaan ze bij een filter weg en komt er een enkele kop met de naam van
    // het filter. Die kop is een kopie van een sectiekop, zodat de opmaak gelijk is;
    // het nummerbolletje gaat eruit, want dit is geen genummerde sectie. De tekst
    // eronder staat als data-attribuut op de balk, want die verschilt per taal.
    var filterRij = null;
    if (blokken[0] && blokken[0].kop) {
      filterRij = blokken[0].kop.cloneNode(true);
      var bolletje = filterRij.querySelector('td.tablewidth');
      if (bolletje && bolletje.parentNode) { bolletje.parentNode.removeChild(bolletje); }
    }
    var kopSjabloon = bar.getAttribute('data-kop') || '';

    // Een filter is een rolgroep ('media'), een jaar ('@2015') of een land ('#BA').
    // Het jaar komt uit data-datum, dat als JJJJ begint; 'today' telt als dit jaar.
    // Het land komt uit het vlaggetje bij de bronregel.
    function jaarVan(k) { return (k.datum || '').slice(0, 4); }
    function past(k, groep) {
      if (groep.charAt(0) === '@') { return jaarVan(k) === groep.slice(1); }
      // '#*' is de restknop: elk land dat geen eigen knop heeft
      if (groep === '#*') { return getoondeLanden.indexOf(landcode(k.vlag)) === -1; }
      if (groep.charAt(0) === '#') { return landcode(k.vlag) === groep.slice(1); }
      if (groep.charAt(0) === '$') { return k.doc === groep.slice(1); }
      return k.groepen.indexOf(groep) !== -1;
    }

    /* De landnamen staan als 'NL=Nederland,BA=...' op de herkomstbalk zelf, want ze zijn
       taalgebonden, net als de opschriften op de sprekerbalk. Ze staan er voor alle
       vlaggen in het font, ook die nu geen citaat dragen: dan hoeft er bij een nieuwe
       stem alleen een kaart bij. Ontbreekt een land, dan blijft de code zelf de naam. */
    /* Welke landen een eigen knop krijgen. De rest gaat samen in een restknop, want negen
       knoppen die elk een enkel citaat opleveren maken de rij druk zonder iets te vinden. */
    var getoondeLanden = (vlagBar ? (vlagBar.getAttribute('data-tonen') || '') : '')
                           .split(',').map(function (x) { return x.trim(); })
                           .filter(function (x) { return x; });
    var landNaam = {}, landKort = {};
    if (vlagBar) {
      [['data-landen', landNaam], ['data-kort', landKort]].forEach(function (paarLijst) {
        (vlagBar.getAttribute(paarLijst[0]) || '').split(',').forEach(function (paar) {
          var d = paar.indexOf('=');
          if (d > 0) { paarLijst[1][paar.slice(0, d).trim()] = paar.slice(d + 1).trim(); }
        });
      });
    }

    // het opschrift van een filter: een rolgroep leest zijn naam van de balk, een jaar
    // gebruikt het sjabloon met {j} (zodat het Bosnisch er een punt achter kan zetten),
    // een land geeft zijn volle naam en niet de twee letters van de knop
    function opschriftVan(groep) {
      if (groep.charAt(0) === '@') {
        return (bar.getAttribute('data-jaar') || 'Jaar {j}').replace('{j}', groep.slice(1));
      }
      if (groep === '#*') {
        return ((vlagBar && vlagBar.getAttribute('data-overig')) || '{n}')
                 .replace('{n}', aantal['#*'] || 0);
      }
      if (groep.charAt(0) === '#') { return landNaam[groep.slice(1)] || groep.slice(1); }
      if (groep.charAt(0) === '$') {
        return (bronBar && bronBar.getAttribute('data-' + groep.slice(1))) || groep.slice(1);
      }
      return bar.getAttribute('data-' + groep) || groep;
    }

    function filterKop(groep, inBeeld) {
      if (!filterRij) return;
      if (filterRij.parentNode) { filterRij.parentNode.removeChild(filterRij); }
      blokken.forEach(function (b) {
        if (b.kop) { b.kop.style.display = (groep === 'all') ? '' : 'none'; }
      });
      if (groep === 'all' || !inBeeld.length) return;
      var h = filterRij.querySelector('.tableheader');
      var p = filterRij.querySelector('.tabletext');
      if (h) {
        var opschrift = opschriftVan(groep);
        /* Een landnaam als kop zou lezen als 'stemmen uit Bosnie'; het gaat om de
           herkomst van de bron, en dat zegt het sjabloon erbij. */
        var kopVlag = vlagBar && vlagBar.getAttribute('data-kopvlag');
        if (groep.charAt(0) === '#' && kopVlag) { opschrift = kopVlag.replace('{x}', opschrift); }
        h.textContent = opschrift;
      }
      // Bij één citaat vervalt de zinsnede over de volgorde: van een volgorde spreken
      // bij één item is onzin. Daar staat een eigen sjabloon voor op de balk.
      if (p) {
        var sj = (aantal[groep] === 1 && bar.getAttribute('data-kop1'))
                   ? bar.getAttribute('data-kop1') : kopSjabloon;
        p.textContent = sj.replace('{n}', aantal[groep]).replace('{t}', aantal.all);
      }
      inBeeld[0].body.insertBefore(filterRij, inBeeld[0].body.firstChild);
    }

    /* Het onderschrift onder het bolletje: het brontype, behalve zolang de jaarla in de
       kopregel openstaat, dan de verkorte datum. Een kaart zonder datum houdt zijn brontype.
       Eerder volgde het onderschrift ook de sprekers- en de landenla (rol, land); dat was
       meer mechaniek dan een bezoeker opmerkt en is teruggedraaid. */
    function labelVan(k) {
      var la = (typeof openPaneel !== 'undefined' && openPaneel) ? openPaneel.attr : '';
      if (la === 'data-kopjaar') { return datumLabel(k.datum) || k.bron; }
      return k.bron;
    }
    function labelsBij() {
      blokken.forEach(function (b) {
        b.kaarten.forEach(function (k) {
          if (k.label) { k.label.textContent = labelVan(k); }
        });
      });
    }

    function toon(groep) {
      actief = groep;
      labelsBij();
      var fotos = {};
      // eerst alle secties leegmaken; de koppen zelf blijven staan
      blokken.forEach(function (b) {
        [].slice.call(b.body.rows).forEach(function (tr) {
          if (tr !== b.kop) { b.body.removeChild(tr); }
        });
      });
      if (groep === 'all') {
        blokken.forEach(function (b) {
          b.kaarten.forEach(function (k) {
            k.kaart.className = k.klasse;
            if (k.stijl === null) { k.td.removeAttribute('style'); }
            else { k.td.setAttribute('style', k.stijl); }
            if (k.foto) { fotos[k.foto] = true; }
          });
          b.origRijen.forEach(function (r) {
            r.cellen.forEach(function (td) { r.tr.appendChild(td); });
            b.body.appendChild(r.tr);
          });
          b.tab.classList.remove('stem-leeg');
          b.zichtbaar = true;
        });
      } else {
        // Bij een filter lopen de kaarten door als een doorlopende lijst en niet
        // als zeventien losse roostertjes. Elke sectie begint anders zijn eigen rij,
        // en dan staat de halve breedte leeg zodra er maar een kaart in past: bij de
        // veteranen leverde dat zeven halve kaarten onder elkaar op. Ze verhuizen
        // daarom allemaal naar de eerste sectie, die als drager dient.
        var gekozen = [];
        blokken.forEach(function (b) {
          b.kaarten.forEach(function (k) {
            if (past(k, groep)) { gekozen.push(k); }
          });
        });
        // Op datum zetten. De datums staan als data-datum op de cel, geschreven als
        // JJJJ-MM-DD, of korter waar de bron niet meer prijsgaf: JJJJ-MM of JJJJ.
        // Zo staat er nooit een verzonnen dag. Vergelijken als tekst geeft vanzelf
        // de goede volgorde, want een kort jaartal is een beginstuk van elke datum
        // in dat jaar en komt er dus voor. Een kaart zonder datum zakt naar het
        // eind; bij gelijke datum blijft de oorspronkelijke volgorde staan, want
        // sorteren is stabiel.
        gekozen.sort(function (a, b) {
          if (!a.sleutel && !b.sleutel) { return 0; }
          if (!a.sleutel) { return 1; }
          if (!b.sleutel) { return -1; }
          if (a.sleutel !== b.sleutel) { return a.sleutel < b.sleutel ? -1 : 1; }
          // Op dezelfde dag beslist data-volgorde, waar de bron een uur of een
          // aanleiding prijsgeeft die de datum niet vastlegt: 1 gaat voor 2, en een
          // kaart zonder dat cijfer komt achteraan. Verder blijft de volgorde die van
          // de pagina, want sorteren is stabiel.
          if (a.volgorde !== b.volgorde) { return a.volgorde < b.volgorde ? -1 : 1; }
          return 0;
        });
        var drager = blokken[0], rij = null;
        gekozen.forEach(function (k, i) {
          // schaakbord opnieuw leggen: grijs waar rijnummer plus kolomnummer
          // even uitkomt, precies zoals het patroon in de ongefilterde pagina
          var basis = (((i >> 1) + (i & 1)) % 2 === 0) ? 'table1' : 'table2';
          k.kaart.className = k.klasse.replace(/table[12]/, basis);
          k.td.setAttribute('style', 'width:50%');
          if (i % 2 === 0) { rij = drager.body.insertRow(-1); }
          rij.appendChild(k.td);
          if (k.foto) { fotos[k.foto] = true; }
        });
        if (rij && gekozen.length % 2 === 1) {
          // oneven aantal: een lege cel ernaast houdt de kaart op halve breedte
          var vul = document.createElement('td');
          vul.setAttribute('colspan', '2');
          vul.setAttribute('style', 'width:50%');
          rij.appendChild(vul);
        }
        blokken.forEach(function (b, i) {
          var zicht = (i === 0 && gekozen.length > 0);
          b.zichtbaar = zicht;
          b.tab.classList.toggle('stem-leeg', !zicht);
        });
      }
      // De fotocredits in de voettekst volgen het filter: een credit hoort er alleen
      // te staan als de foto waar hij bij hoort ook in beeld is. De credit die drie
      // Europarlementariers samen noemt telt mee zodra een van de drie te zien is;
      // die drie dragen dezelfde groep en komen dus altijd samen. Credits die achter
      // de leesmeerknop staan blijven daarnaast verborgen zolang dat blok dicht is.
      [].slice.call(document.querySelectorAll('.fotocredit')).forEach(function (c) {
        var bij = (c.getAttribute('data-foto') || '').split(/\s+/);
        c.style.display = bij.some(function (f) { return fotos[f]; }) ? '' : 'none';
      });
      // Tussenruimtes. Elke sectie heeft er een onder zich, maar die onder de
      // allerlaatste sectie is kleiner: dat is de staart van het hele blok. Wordt
      // er gefilterd, dan mag de laatste sectie in beeld dus niet zijn eigen ruime
      // tussenruimte houden, want dan komt de staart daar nog bovenop en staat er
      // bij het ene filter meer wit onder de citaten dan bij het andere.
      var inBeeld = blokken.filter(function (b) { return b.zichtbaar; });
      var staart = blokken[blokken.length - 1];
      var laatsteInBeeld = inBeeld[inBeeld.length - 1];
      blokken.forEach(function (b) {
        if (!b.ruimte) return;
        var toonRuimte = (b === staart) || (b.zichtbaar && b !== laatsteInBeeld);
        b.ruimte.classList.toggle('stem-leeg', !toonRuimte);
      });
      filterKop(groep, inBeeld);
      extra(groep !== 'all');
    }

    /* Drie balken filteren dezelfde lijst: de rollen bovenaan, de jaren in de tijdlijn
       en de herkomst onderaan. Er is er steeds \u00E9\u00E9n actief, dus alle knoppen \u2014 waar ze
       ook staan \u2014 delen \u00E9\u00E9n selectie. */
    var alleKnoppen = [], kopKnoppen = [], groepKnoppen = [], jaarKnoppen = [],
        vlagKnoppen = [], docKnoppen = [], actief = 'all';
    /* Haak voor de herkomstbalk: die verbergt een deel van zijn knoppen en moet na elke
       keuze opnieuw bepalen welke er te zien zijn. */
    var naKeuze = null;
    function kies(knop, groep) {
      alleKnoppen.forEach(function (k) {
        k.setAttribute('aria-pressed', k === knop ? 'true' : 'false');
      });
      metOvergang(function () { toon(groep); });
      if (naKeuze) { naKeuze(); }
    }
    /* De opties: vlag = het vlagteken voor het opschrift, kaal = zonder telling (het
       bolletje blijft), klasse = een omhulsel om het opschrift zodat het apart te zetten
       is, tip = een kant-en-klare tooltip, naam = wat een schermlezer voorleest als het
       opschrift zelf te kort is, reeks = de lijst waarin de knop meeloopt bij het
       stappen. */
    function maakKnop(groep, opschrift, opt) {
      opt = opt || {};
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      if (opt.vlag) {
        var vv = document.createElement('span');
        vv.className = 'vlag';
        vv.textContent = opt.vlag;
        b.appendChild(vv);
        b.appendChild(document.createTextNode(' '));
      }
      if (opt.klasse) {
        var op = document.createElement('span');
        op.className = opt.klasse;
        op.textContent = opschrift;
        b.appendChild(op);
      } else {
        b.appendChild(document.createTextNode(opschrift + ' '));
      }
      /* Een kale knop draagt alleen zijn vlag en zijn opschrift, zonder telling. Het
         bolletje blijft altijd staan, want dat zegt in alle drie de balken hetzelfde:
         dit is de stand van het filter. */
      if (!opt.kaal) {
        var telling = document.createElement('span');
        telling.className = 'mf-count';
        telling.textContent = aantal[groep];
        b.appendChild(telling);
        b.appendChild(document.createTextNode(' '));
      }
      var stip = document.createElement('span');
      stip.className = 'mf-dot';
      stip.setAttribute('aria-hidden', 'true');
      b.appendChild(stip);
      // Twee letters zeggen een schermlezer niets; die krijgt de volle landnaam.
      if (opt.naam) { b.setAttribute('aria-label', opt.naam); }
      /* Tooltip uit de taalpagina: 'all' krijgt zijn eigen zin, de rest het sjabloon met
         het opschrift erin. Staat het sjabloon er niet, dan blijft de knop zonder tooltip. */
      if (opt.tip) {
        b.title = opt.tip;
      } else {
        var tipSjabloon = bar.getAttribute(groep === 'all' ? 'data-tipall' : 'data-tip');
        if (tipSjabloon) {
          b.title = tipSjabloon.replace('{x}', opschrift).replace('{n}', aantal[groep]);
        }
      }
      b.addEventListener('click', function () { kies(b, groep); });
      alleKnoppen.push(b);
      (opt.reeks || groepKnoppen).push({ sleutel: groep, knop: b });
      return b;
    }

    ['all'].concat(GROEPEN).forEach(function (g, i) {
      if (g !== 'all' && !aantal[g]) return;
      /* 'alle citaten' staat in de kopregel en loopt in de stapreeks vooraan, los van de
         rollen: die zitten in een rij die open- en dichtklapt. */
      var b = maakKnop(g, bar.getAttribute('data-' + g) || g,
                       (i === 0 && kopBar) ? { klasse: 'paneel-tekst', reeks: kopKnoppen }
                                           : undefined);
      if (i === 0) { b.setAttribute('aria-pressed', 'true'); }
      // 'alle citaten' hoort bij de kopregel: die knop staat altijd in beeld
      ((i === 0 && kopBar) ? kopBar : bar).appendChild(b);
    });

    /* De knoppen vullen hun regel uit, zoals uitgevulde tekst: de ruimte die aan het
       eind van een regel overblijft, wordt gelijk over de knoppen van die regel verdeeld
       en links en rechts binnen elke knop bijgeteld. De laatste regel blijft ongemoeid —
       die uitvullen zou twee knoppen over de volle breedte uitrekken. Bij een andere
       vensterbreedte lopen de regels anders, dus opnieuw rekenen bij resize. */
    /* ookEenRegel: staan alle knoppen op een regel, vul die dan toch uit. Dat is de
       herkomstbalk: veertien knoppen van bijna gelijke breedte laten anders een gat van
       ruim honderdvijftig pixels rechts open, onder een tijdlijn die wel de volle
       breedte pakt. Bij de sprekerbalk blijft de slotregel ongemoeid; daar zou hij twee
       of drie knoppen over de hele breedte uitrekken. */
    function vulRegelsUit(balk, ookEenRegel) {
      if (!balk) { return; }
      var knoppen = [].slice.call(balk.querySelectorAll('button'));
      if (!knoppen.length) { return; }
      knoppen.forEach(function (b) { b.style.paddingLeft = ''; b.style.paddingRight = ''; });
      var rijen = [], rij = [], vorige = null;
      knoppen.forEach(function (b) {
        var top = Math.round(b.offsetTop);
        if (vorige !== null && top !== vorige) { rijen.push(rij); rij = []; }
        rij.push(b); vorige = top;
      });
      if (rij.length) { rijen.push(rij); }
      if (rijen.length < 2 && !ookEenRegel) { return; }
      var stijl = getComputedStyle(balk);
      var gat = parseFloat(stijl.columnGap || stijl.gap) || 0;
      var binnen = balk.clientWidth - parseFloat(stijl.paddingLeft) - parseFloat(stijl.paddingRight);
      var laatsteErbij = 0;
      // een enkele regel is zijn eigen slotregel: die moet dan wel meedoen
      (rijen.length < 2 ? rijen : rijen.slice(0, -1)).forEach(function (r) {
        var som = 0;
        r.forEach(function (b) { som += b.getBoundingClientRect().width; });
        var over = binnen - som - gat * (r.length - 1);
        if (over < 2) { return; }
        // een pixel marge laten staan, anders duwt afronding de laatste knop een regel omlaag
        var erbij = Math.floor(((over - 1) / (r.length * 2)) * 100) / 100;
        laatsteErbij = erbij;
        r.forEach(function (b) {
          var p = parseFloat(getComputedStyle(b).paddingLeft);
          b.style.paddingLeft = (p + erbij) + 'px';
          b.style.paddingRight = (p + erbij) + 'px';
        });
      });
      // De slotregel wordt niet uitgevuld, maar krijgt wel dezelfde padding als de regel
      // erboven: knoppen van gelijke tekstlengte horen even breed te zijn, ongeacht op
      // welke regel ze staan.
      if (laatsteErbij > 0 && rijen.length > 1) {
        rijen[rijen.length - 1].forEach(function (b) {
          var p = parseFloat(getComputedStyle(b).paddingLeft);
          b.style.paddingLeft = (p + laatsteErbij) + 'px';
          b.style.paddingRight = (p + laatsteErbij) + 'px';
        });
      }
    }
    /* De herkomstbalk vult niet uit maar krijgt knoppen van gelijke breedte: veertien
       vlaggen naast elkaar horen een raster te vormen en geen rij van veertien verschillende
       maten. Hoeveel er op een regel staan bepaalt data-perrij op de balk; hieruit volgt de
       breedte, zodat de regel precies vol is. Past dat aantal niet meer, op een smaller
       scherm, dan zakt het vanzelf tot het wel kan. */
    function gelijkeBreedte(balk, perRij) {
      if (!balk || !perRij) { return; }
      /* De uitklapknop telt niet mee: die is breder dan een landknop en zou de hele
         rekensom naar zich toe trekken. Verborgen knoppen meten we niet, maar ze krijgen
         wel dezelfde breedte, zodat er bij het uitklappen niets verspringt. */
      var knoppen = [].slice.call(balk.querySelectorAll('button:not(.vlag-meer)'));
      if (!knoppen.length) { return; }
      knoppen.forEach(function (b) { b.style.width = ''; b.style.paddingLeft = ''; b.style.paddingRight = ''; });
      var inBeeld = knoppen.filter(function (b) { return b.offsetParent; });
      if (!inBeeld.length) { return; }
      var breedste = 0;
      inBeeld.forEach(function (b) {
        var w = b.getBoundingClientRect().width;
        if (w > breedste) { breedste = w; }
      });
      var stijl = getComputedStyle(balk);
      var gat = parseFloat(stijl.columnGap || stijl.gap) || 0;
      var binnen = balk.clientWidth - parseFloat(stijl.paddingLeft) - parseFloat(stijl.paddingRight);
      /* Een pixel van de regel afhalen voordat we delen. Zonder die marge komt de rij
         precies op de breedte van de balk uit, en dan is een fractie van een pixel in de
         opmaak genoeg om de laatste knop een regel omlaag te duwen. Dezelfde marge die
         het uitvullen van de sprekerbalk aanhoudt. */
      var n = Math.min(perRij, knoppen.length), breed = 0;
      while (n > 1) {
        breed = (binnen - gat * (n - 1) - 1) / n;
        if (breed >= breedste) { break; }
        n--;
      }
      if (n < 2 || breed < breedste) { return; }
      breed = Math.floor(breed * 100) / 100;
      knoppen.forEach(function (b) { b.style.width = breed + 'px'; });
      /* Controleren of het ook echt zo valt. Bij een afwijkende zoomfactor of een andere
         afronding kan er alsnog een knop omvallen; dan halen we er nog een pixel af en
         kijken opnieuw. Drie pogingen is ruim: elke ronde scheelt een hele pixel per knop. */
      for (var poging = 0; poging < 3; poging++) {
        var eersteRij = 0, top = Math.round(inBeeld[0].offsetTop);
        inBeeld.forEach(function (b) { if (Math.round(b.offsetTop) === top) { eersteRij++; } });
        if (eersteRij >= n || inBeeld.length < n) { break; }
        breed = Math.floor((breed - 1) * 100) / 100;
        if (breed < breedste) { break; }
        knoppen.forEach(function (b) { b.style.width = breed + 'px'; });
      }
    }

    vulRegelsUit(bar);
    // beide balken opnieuw meten, en niet de functie zelf als luisteraar: die krijgt
    // dan het event mee als balk
    window.addEventListener('resize', function () {
      // alleen de rij die openstaat valt te meten; de andere staan op display:none
      if (typeof openPaneel !== 'undefined' && openPaneel) { meetPaneel(openPaneel); }
      else { vulRegelsUit(bar); }
    });

    /* Landen op de filterbalk, net onder de header. De headerhoogte meten we op het
       moment zelf, want die verschilt per schermbreedte. */
    function naarBalk() {
      var hdr = document.querySelector('.header');
      var hoog = hdr ? Math.round(hdr.getBoundingClientRect().height) : 0;
      var off = (window.pageYOffset || document.documentElement.scrollTop);
      /* Naar de kopregel en niet naar de sprekerbalk: die laatste is een uitklapbare rij
         en kan dichtstaan, en een verborgen element heeft geen plek op de pagina. */
      var anker = (kopBar && kopBar.querySelector('button')) ? kopBar : bar;
      var y = Math.max(0, Math.round(anker.getBoundingClientRect().top + off - hoog - 8));
      // Oudere Safari kent het optie-object van scrollTo niet en leest het als
      // scrollTo(undefined, undefined): je belandt dan boven aan de pagina.
      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo(0, y);
      }
    }
    /* ---- Meegestuurde filterstanden -----------------------------------------------
       Een link met een stand erin wordt gehonoreerd: ?filter=land-BA#stemmen opent de
       citaten met een Bosnische bron. Andersom niet — de knoppen laten de adresbalk met
       rust, want een URL die bij elke keuze meeverandert leidt af van waar het om gaat.
       De hash blijft van de gewone ankers, alleen de query is van het filter, zodat
       #stemmen gewoon zijn werk blijft doen. De sleutels binnenin zijn kort en cryptisch
       (@2015, #BA, $gerecht); van buiten komen ze binnen als leesbare woorden. */
    function tekstNaarFilter(t){
      if(!t) return null;
      t = String(t).toLowerCase();
      if(/^\d{4}$/.test(t))        return '@' + t;
      if(t === 'land-overig')      return '#*';
      if(t.indexOf('land-') === 0) return '#' + t.slice(5).toUpperCase();
      if(t.indexOf('doc-') === 0)  return '$' + t.slice(4);
      return t;
    }
    function urlFilter(){
      var m = /[?&]filter=([^&#]*)/.exec(location.search);
      return m ? tekstNaarFilter(decodeURIComponent(m[1])) : null;
    }
    /* Een gedeelde link opent zijn selectie en zet de bezoeker bij de bediening, want
       anders begint hij midden in een lijst zonder te zien waarom die is ingekort. */
    function pasURLFilterToe(){
      var start = urlFilter();
      if(!start) return false;
      var raak = null;
      stapReeks().forEach(function(x){ if(x.sleutel === start){ raak = x; } });
      if(!raak) return false;
      raak.knop.click();
      naarBalk();
      return true;
    }

    /* Zachte overgang bij het filteren: de browser maakt een momentopname van voor en na
       en kruist die over elkaar heen, in plaats van dat de lijst hard verspringt. Kent de
       browser het niet, of heeft de bezoeker beweging beperkt, dan gebeurt precies wat er
       eerst gebeurde. */
    function metOvergang(fn){
      /* Ook overslaan in een tabblad dat niet in beeld is: zonder frames blijft de
         terugroepfunctie van startViewTransition wachten en zou de lijst niet bijwerken. */
      var rustig = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
                || document.visibilityState !== 'visible';
      if(!document.startViewTransition || rustig){ fn(); return; }
      /* De browser roept fn aan tijdens de overgang. Blijft dat uit, bijvoorbeeld omdat er
         geen beeld wordt opgebouwd, dan doen we het na een kwart seconde alsnog; de vlag
         zorgt dat het dan niet twee keer gebeurt. Filteren mag nooit blijven hangen. */
      var gedaan = false, doe = function(){ if(!gedaan){ gedaan = true; fn(); } };
      var vt;
      try { vt = document.startViewTransition(doe); } catch(e){ doe(); return; }
      /* Klikt iemand door voordat de vorige overgang klaar is, dan breekt de browser die af
         en wijst hij de beloftes van die overgang af. Wij wachten er niet op — het werk is
         in doe() al gedaan — maar zonder vangnet belandt zo'n afwijzing als fout in de
         console. Vandaar deze twee lege vangers. */
      if (vt) {
        if (vt.ready && vt.ready.catch) { vt.ready.catch(function () {}); }
        if (vt.finished && vt.finished.catch) { vt.finished.catch(function () {}); }
      }
      setTimeout(doe, 250);
    }

    /* De reeks loopt in de volgorde van de kopregel: alle citaten, de sprekers, de jaren,
       de landen en de documenten. Een meegestuurde ?filter= vindt hierin zijn knop. */
    function stapReeks() {
      return kopKnoppen.concat(groepKnoppen, jaarKnoppen, vlagKnoppen, docKnoppen);
    }

    /* De tijdlijn: één staafje per jaar tussen het eerste en het laatste citaat, met
       een hoogte naar het aantal stemmen van dat jaar. De lege jaren blijven staan —
       de stilte tussen 2000 en 2014 hoort bij het verhaal, en dat is precies wat een
       bezoeker moet zien: hoe lang deze zaak al sleept. Een klik filtert op dat jaar;
       de knoppenbalk gaat dan uit, want er is steeds één filter tegelijk. */
    var tijdlijn = document.getElementById('stemTijdlijn');
    if (tijdlijn) {
      var jaren = Object.keys(aantal).filter(function (k) { return k.charAt(0) === '@'; })
                        .map(function (k) { return parseInt(k.slice(1), 10); }).sort();
      var eerste = jaren[0], laatste = jaren[jaren.length - 1];
      var hoogste = 0;
      jaren.forEach(function (j) { if (aantal['@' + j] > hoogste) { hoogste = aantal['@' + j]; } });
      var sjabloon = tijdlijn.getAttribute('data-titel') || '{n}';
      // Eén citaat vraagt om enkelvoud; staat die variant er niet, dan blijft het meervoud.
      var sjabloonEen = tijdlijn.getAttribute('data-titel1') || sjabloon;

      var balk = document.createElement('div');
      balk.className = 'tl-balk';
      for (var j = eerste; j <= laatste; j++) {
        var n = aantal['@' + j] || 0;
        var kolom = document.createElement(n ? 'button' : 'span');
        kolom.className = 'tl-jaar' + (n ? '' : ' tl-leeg');
        kolom.title = (n === 1 ? sjabloonEen : sjabloon).replace('{j}', j).replace('{n}', n);
        // Hetzelfde radiobolletje als in de knoppenbalk erboven, nu onder het staafje.
        // Het zegt in beide balken hetzelfde: dit is de stand van het filter. Ook de lege
        // jaren krijgen er een; die is onzichtbaar (zie de stylesheet) en houdt alleen de
        // plek vrij, zodat hun streepje op dezelfde hoogte blijft als de staven ernaast.
        var punt = document.createElement('span');
        punt.className = 'tl-punt';
        punt.setAttribute('aria-hidden', 'true');
        kolom.appendChild(punt);
        var staaf = document.createElement('span');
        staaf.className = 'tl-staaf';
        // Basis plus schaal, en niet een ondergrens met Math.max: met een ondergrens kregen
        // 1 en 3 stemmen allebei dezelfde hoogte en verdween het verschil.
        // Een jaar zonder stemmen houdt een dun streepje, zodat de stille jaren meetellen.
        // De basis staat nu op 1,6 en de schaal op 55,4: samen nog steeds 57, dus de hoogste
        // staaf blijft even hoog en de hoogte van .tl-balk in de stylesheet klopt nog. Die
        // basis is wat de kleinste staven optilt — elk jaar krijgt hem er even hard bij, of
        // het er nu één stem heeft of eenentwintig — en hij stond te hoog: een jaar met één
        // stem besloeg twaalf procent van de hoogste staaf terwijl het er ruim vier hoort te
        // zijn. Nu is dat zeven procent. Lager kan niet: bij een basis van nul valt het
        // verschil tussen één en twee stemmen binnen een pixel weg.
        var hoog = n ? Math.round(1.6 + (n / hoogste) * 55.4) : 1;
        staaf.style.height = hoog + 'px';
        /* Het aantal citaten in de staaf, en waar de staaf daar te laag voor is — onder de
           zeventien pixels loopt het cijfer tegen de randen aan — komt het er donkergrijs
           bovenop te staan. Elk jaar houdt zo zijn telling; anders zou het lijken alsof de
           jaren mét cijfer om een of andere reden belangrijker zijn, terwijl het verschil
           alleen is dat hun staaf hoog genoeg is. De kolom stapelt naar beneden en lijnt uit
           op de onderkant, dus een cijfer dat vóór de staaf wordt toegevoegd komt er vanzelf
           boven. Anders dan op mobiel blijft het liggen: een kolom is hier ruim dertig pixels
           breed en twee cijfers passen daar gewoon in. aria-hidden, want de knop zegt
           hetzelfde al voluit in zijn aria-label. */
        if (n) {
          var getal = document.createElement('span');
          /* Niet 'past' noemen: zo heet de functie die verderop bepaalt of een citaat bij
             het gekozen filter hoort, en een var met dezelfde naam in dezelfde scope
             overschrijft die. */
          var erin = hoog >= 17;
          getal.className = 'tl-getal' + (erin ? '' : ' tl-getal-boven');
          getal.setAttribute('aria-hidden', 'true');
          getal.textContent = n;
          if (erin) { staaf.appendChild(getal); } else { kolom.appendChild(getal); }
        }
        kolom.appendChild(staaf);
        if (n) {
          kolom.type = 'button';
          kolom.setAttribute('aria-pressed', 'false');
          kolom.setAttribute('aria-label', kolom.title);
          (function (jaar, knop) {
            knop.addEventListener('click', function () { kies(knop, '@' + jaar); });
          })(j, kolom);
          alleKnoppen.push(kolom);
          jaarKnoppen.push({ sleutel: '@' + j, knop: kolom });
        }
        balk.appendChild(kolom);
      }
      tijdlijn.appendChild(balk);
      /* IJkpunten onder de staven, in hetzelfde stramien zodat elk jaartal precies
         onder zijn eigen staafje valt. Naast het eerste en het laatste jaar krijgt
         ook het jaar na de langste stilte een label: dat is het beginpunt van de
         tweede golf (nu 2014). Dat jaar wordt berekend, zodat het meeschuift als er
         citaten bijkomen. */
      var metStemmen = jaren.slice().sort(function (a, b) { return a - b; });
      var grootsteGat = 0, naGat = null;
      for (var g = 1; g < metStemmen.length; g++) {
        var gat = metStemmen[g] - metStemmen[g - 1];
        if (gat > grootsteGat) { grootsteGat = gat; naGat = metStemmen[g]; }
      }
      var merk = {};
      merk[eerste] = merk[laatste] = 1;
      // het jaar ná de langste stilte krijgt een label: dat markeert waar de tweede
      // golf begint (nu 2014). Het jaar ervóór blijft onbenoemd, dat werd te vol.
      if (naGat && grootsteGat > 2) { merk[naGat] = 1; }
      var as = document.createElement('div');
      as.className = 'tl-as';
      for (var y = eerste; y <= laatste; y++) {
        var cel = document.createElement('span');
        // De middelste ijkjaren houden een eigen klasse als aangrijpingspunt. Ze stonden
        // op S- en M-schermen verborgen omdat 2014 daar tegen zijn buren zou botsen; dat
        // blijkt niet zo te zijn, dus de regel die het verborg is weg en het label staat
        // er op elk formaat. Zonder dat ijkpunt zegt de sprong na de stille jaren niets.
        cel.className = 'tl-ascel' + (merk[y] && y !== eerste && y !== laatste ? ' tl-asmidden' : '');
        if (merk[y]) { cel.textContent = y; }
        as.appendChild(cel);
      }
      tijdlijn.appendChild(as);
    }

    /* De herkomstbalk onder de tijdlijn: een knop per land waaruit een bron komt, met
       het vlaggetje van de bronregel en de landcode van twee letters erachter. De
       landen staan op aantal, aflopend, en bij een gelijk aantal op alfabet. Er is
       bewust geen 'alle citaten' bij: die knop staat in de balk bovenaan en zet ook
       deze balk weer uit, want alle drie de balken delen een selectie. */
    if (vlagBar) {
      var tipVlag = vlagBar.getAttribute('data-tipvlag') || '';
      var tipVlag1 = vlagBar.getAttribute('data-tipvlag1') || tipVlag;
      // de volgorde van data-tonen aanhouden: die loopt van veel naar weinig citaten
      getoondeLanden.filter(function (lc) { return aantal['#' + lc]; }).forEach(function (lc) {
        var n = aantal['#' + lc];
        var naam = landNaam[lc] || lc;
        /* Op de knop de korte naam (Bosnië), in de tooltip en de kop de volle (Bosnië en
           Herzegovina). Ontbreekt een korte naam, dan blijft het de landcode. */
        vlagBar.appendChild(maakKnop('#' + lc, landKort[lc] || lc, {
          vlag: vlagVan[lc], klasse: 'landcode', naam: naam, reeks: vlagKnoppen,
          tip: (n === 1 ? tipVlag1 : tipVlag).replace('{x}', naam).replace('{n}', n)
        }));
      });
      /* En dan de rest in één knop. Negen landen leveren elk een enkel citaat; als knop
         vinden ze niets wat de lijst niet ook al toont, maar samen zijn ze wel een groep:
         de losse buitenlandse stemmen. */
      aantal['#*'] = Object.keys(aantal).filter(function (k) {
        return k.charAt(0) === '#' && k !== '#*' && getoondeLanden.indexOf(k.slice(1)) === -1;
      }).reduce(function (som, k) { return som + aantal[k]; }, 0);
      if (aantal['#*']) {
        vlagBar.appendChild(maakKnop('#*', opschriftVan('#*'), { reeks: vlagKnoppen }));
      }
    }

    /* De brondocumenten. Op de kaarten staan 35 verschillende brontypen; als knoppenrij is
       dat onbruikbaar, dus ze zijn samengenomen tot zes groepen. Welke groep een kaart
       draagt staat als data-doc op de cel, de opschriften staan op de balk, precies zoals
       bij de sprekergroepen. De volgorde loopt van het zwaarste stuk naar het lichtste:
       eerst wat een rechter of een ministerie op papier zette, dan de correspondentie en de
       verklaringen, dan wat er gepubliceerd werd, en als laatste de meningen en de tweets. */
    var DOCGROEPEN = ['gerecht', 'officieel', 'email', 'verklaring', 'publicatie',
                      'recensie', 'sociaal'];
    if (bronBar) {
      DOCGROEPEN.forEach(function (d) {
        if (!aantal['$' + d]) { return; }
        bronBar.appendChild(maakKnop('$' + d, bronBar.getAttribute('data-' + d) || d,
                                     { reeks: docKnoppen }));
      });
    }

    /* Vier rijen achter vier schakelaars in de kopregel, waarvan er hooguit een openstaat:
       zo dijt het blok niet ongemerkt uit. Bij het laden staat er geen enkele open. De
       jaarstaven zijn een plaatje van de stilte tussen 2000 en 2014, maar ze vullen ook een
       flinke strook, en samen met de knoppen eronder werd dat te veel om binnen te komen. */
    /* Dezelfde chevron als bij de leesmeerknoppen: hetzelfde vak van 20 bij 20 en
       dezelfde twee puntenreeksen, omlaag als hij dicht is en omhoog als hij open is. */
    var OMLAAG = '4.5,6.5 10,13.5 15.5,6.5';
    /* eenRegel: staan alle knoppen van een rij op één regel, vul die dan toch uit. Zonder
       dat blijft zo'n regel links hangen met een gat rechts, terwijl de rijen die wel
       omvallen tot in de kantlijn lopen. */
    /* De volgorde van de schakelaars: het jaar vooraan, want die rij staat bij het laden
       open en dan hoort zijn schakelaar naast de staafjes eronder te staan; zo legt de
       openingsstand zichzelf uit. Daarna de spreker als sterkste ingang, en het
       brondocument en het land als tweede laag. */
    /* Spreker eerst: dat is de ingang waar een bezoeker aan denkt bij een citaat. Dan het
       jaar, daarna het land, en het documenttype als laatste: dat is de meest technische
       van de vier. Toen de jaarstaven nog vanzelf openstonden ging het jaar voorop; nu er
       niets meer openstaat, bepaalt de volgorde welke knop het eerst wordt geprobeerd. */
    var PANELEN = [
      { el: bar,      attr: 'data-kopspreker', meet: 'uitvullen', eenRegel: true, lijnen: true,
        eersteRij: true, rijlijnen: true, railBij: { vanaf: '(max-width:1079.9px)', px: -1 } },
      /* De tijdlijn heeft geen pillen maar staafjes: de lijntjes lopen naar de bovenkant van
         het staafje van elk jaar met citaten. Het doel is de staaf zelf en niet zijn kolom:
         die kolom is altijd de volle hoogte van de balk, dus dan zouden alle lijnen op
         dezelfde hoogte eindigen in plaats van op de top van hun eigen staaf. De lege jaren
         zijn geen knop en krijgen er dus ook geen. */
      { el: tijdlijn, attr: 'data-kopjaar',    meet: '',                          lijnen: true,
        /* Geen eigen maxDiepte meer: de diepste 'doel' is de top van de kórtste staaf en die
           ligt ver onder de rail, en bij een omgevallen kopregel komt daar de hoogte van die
           kopregel bij. De ruime standaardgrens volstaat; of de stam onderweg iets raakt
           wordt apart gecontroleerd. */
        doelen: 'button.tl-jaar > .tl-staaf', eenRij: false,
        railVlak: '.tl-balk', pootje: 14,
        railBij: [{ vanaf: '(min-width:1080px)', px: 2 },
                  { vanaf: '(max-width:1079.9px)', px: -1 }] },
      { el: vlagBar,  attr: 'data-kopland',    meet: 'uitvullen', eenRegel: true, lijnen: true,
        eersteRij: true, rijlijnen: true, railBij: { vanaf: '(max-width:1079.9px)', px: -1 } },
      { el: bronBar,  attr: 'data-kopdoc',     meet: 'uitvullen', eenRegel: true, lijnen: true,
        eersteRij: true, rijlijnen: true, railBij: { vanaf: '(max-width:1079.9px)', px: -1 } }
    ].filter(function (q) { return q.el && q.el.querySelector('button'); });
    var openPaneel = null;

    function meetPaneel(q) {
      if (q.meet === 'raster') { gelijkeBreedte(q.el, parseInt(q.el.getAttribute('data-perrij'), 10)); }
      else if (q.meet === 'uitvullen') { vulRegelsUit(q.el, q.eenRegel); }
      if (q.lijnen) { tekenPaneelLijnen(q); }
    }
    function zetPaneel(q) {
      openPaneel = q;
      labelsBij();
      /* Staat er niets open, dan is de kopregel zelf de onderkant van het kader en moet hij
         dat kader ook sluiten: anders eindigt het grijze vlak in een rand die er niet is. */
      kopBar.classList.toggle('kop-dicht', !q);
      PANELEN.forEach(function (r) {
        var aan = (r === q);
        r.el.style.display = aan ? '' : 'none';
        if (r.knop) {
          r.knop.setAttribute('aria-expanded', aan ? 'true' : 'false');
          r.knop.title = kopBar.getAttribute(aan ? 'data-dicht' : 'data-open') || '';
          /* De chevron draait om via aria-expanded in de stylesheet (.paneel-pijl), in
             hetzelfde tempo als de rij eronder open- of dichtschuift; de punten blijven
             dus staan. */
        }
      });
      /* Pas meten als élke rij op zijn nieuwe stand staat, en niet binnen de lus hierboven.
         De tijdlijn staat als laatste in de HTML: meet je hem terwijl de rij die net nog
         openstond nog zichtbaar is, dan staat hij op dat moment een rij te laag en valt de
         afstand tot zijn schakelaar buiten de marge, waarna de verbindingslijntjes wegvallen.
         Dat gebeurde bij elke overstap naar het jaar vanaf een van de drie andere rijen. */
      if (q) { meetPaneel(q); }
    }
    /* Staat er een filter aan dat in een dichte rij zit, dan gaat die rij open: anders
       toont de bediening geen enkele gekozen knop terwijl de lijst wel gefilterd is. Dat
       gebeurt bij het stappen met de meelopende knop, en bij de zoekfunctie. */
    function paneelBijFilter() {
      var q = null;
      PANELEN.forEach(function (r) {
        if (r.el.querySelector('button[aria-pressed="true"]')) { q = r; }
      });
      if (q && q !== openPaneel) { zetPaneel(q); }
    }

    if (kopBar && PANELEN.length) {
      /* De uitleg hoort in hetzelfde grijze kader als de knoppen, bovenaan. Hij staat in
         de HTML gewoon als alinea boven het blok, zodat er zonder javascript geen leeg
         kader met een aanwijzing naar knoppen die er niet zijn overblijft; hier verhuist
         hij naar binnen. */
      var uitleg = document.getElementById('stemUitleg');
      if (uitleg) {
        uitleg.classList.add('kaderuitleg');
        // de marges van de alinea vervallen binnen het kader; die zitten in de klasse
        uitleg.removeAttribute('style');
        kopBar.insertBefore(uitleg, kopBar.firstChild);
      }
      PANELEN.forEach(function (q) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'paneel-knop';
        b.setAttribute('aria-expanded', 'false');
        /* Het opschrift in een eigen omhulsel, zodat het los van het bolletje een halve
           pixel kan zakken; een kale tekstknoop is niet te verschuiven. */
        var op = document.createElement('span');
        op.className = 'paneel-tekst';
        op.textContent = kopBar.getAttribute(q.attr) || '';
        b.appendChild(op);
        b.insertAdjacentHTML('beforeend',
          '<svg class=paneel-pijl viewBox="0 0 20 20" aria-hidden="true">' +
          '<polyline points="' + OMLAAG + '"/></svg>');
        b.title = kopBar.getAttribute('data-open') || '';
        /* Van de ene rij naar de andere is een sprong: de rijen verschillen in hoogte, dus
           alles eronder schuift mee. Dezelfde overgang als bij het filteren van de lijst
           kruist de oude en de nieuwe stand over elkaar heen. Alleen hier en niet in
           zetPaneel zelf: die wordt ook aangeroepen vanuit paneelBijFilter, en dat gebeurt
           al binnen een overgang — een overgang in een overgang laat de browser vallen. */
        b.addEventListener('click', function () {
          metOvergang(function () { zetPaneel(openPaneel === q ? null : q); });
        });
        q.knop = b;
        kopBar.appendChild(b);
      });
      /* Alles dicht bij het laden: elke rij wacht op een tik op zijn schakelaar. */
      zetPaneel(null);
      naKeuze = paneelBijFilter;
      pasURLFilterToe();
    }

    /* De vlaggen komen uit een webfont. Zolang dat nog laadt rekent de browser met de
       vlaggen van het systeem, en die zijn breder: de knoppen passen dan net niet en de
       rekensom klopt even later niet meer. Zodra het font binnen is dus opnieuw meten,
       voor de rij die op dat moment openstaat. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        vulRegelsUit(bar);
        if (openPaneel) { meetPaneel(openPaneel); }
      });
    }
  })();

  // Header "tilt op": subtiele schaduw zodra de pagina gescrold is (klasse .elevated). Werkt op elke pagina met een .header.
  (function(){
    var hdr = document.querySelector('.header');
    if (!hdr) return;
    function onScroll(){ hdr.classList.toggle('elevated', window.scrollY > 4); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

});

/* De lijntjes-tekenaar staat op bestandsniveau en niet in het blok van het citatenfilter
   hierboven: sinds 4 september 2026 hangt ook de regiorij van de mediafilter (#mediaSub,
   inline script in de vijf desktopbestanden) met dezelfde lijntjes aan zijn schakelaar.
   Dat script draait bij DOMContentLoaded, en dit bestand is met defer geladen, dus dan
   bestaat deze functie al. Hij leunt op niets uit dat blok: alles komt uit het
   paneelobject q (el, knop en de opties) en uit de opmaak. */
  /* Dunne grijze lijntjes van een schakelaar naar wat er bij het openklappen onder
     verschijnt: uit het midden van de onderkant van de pil loopt er een naar het midden
     van de bovenkant van elke knop eronder. Zo is te zien dat die rij bij die schakelaar
     hoort en niet zomaar onder het kader hangt. Alle vier de rijen krijgen ze; bij de
     tijdlijn zijn de doelen de staafjes van de jaren met citaten (doelen in PANELEN), en
     die staan niet op een lijn maar elk op de hoogte van hun eigen top.
     De laag ligt in het paneel zelf en steekt met een negatieve top de kopregel in: die
     twee vakken sluiten naadloos op elkaar aan, dus de lijntjes lopen door een
     doorlopend grijs vlak. Ze vangen geen muis, dus klikken gaat er gewoon doorheen.
     Opnieuw tekenen hoort bij elke meting: de knoppen verspringen met de vensterbreedte,
     en na het uitvullen staan ze pas op hun eindbreedte. */
  function tekenPaneelLijnen(q) {
    var laag = q.laag;
    if (!laag) {
      laag = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      laag.setAttribute('class', 'paneel-lijnen');
      laag.setAttribute('aria-hidden', 'true');
      q.el.insertBefore(laag, q.el.firstChild);
      q.laag = laag;
    }
    while (laag.firstChild) { laag.removeChild(laag.firstChild); }
    laag.style.display = 'none';
    if (!q.knop) { return; }
    /* Een rij mag zijn lijntjes tot een schermformaat beperken. Dat doet de tijdlijn: op
       een S- en een M-scherm staat de rail nog geen tien pixels boven de staven en wordt
       het geheel een kluwen, terwijl er op een L-scherm ruimte genoeg is. De grens staat
       in dezelfde media query als in de stylesheet; bij een andere vensterbreedte wordt
       er opnieuw getekend, dus hij blijft kloppen. */
    if (q.alleen && !window.matchMedia(q.alleen).matches) { return; }
    var doelen = [].slice.call(q.el.querySelectorAll(q.doelen || 'button'));
    if (!doelen.length) { return; }
    /* Alles wordt gemeten met getBoundingClientRect en daarna omgerekend naar dezelfde
       nulhoek: de linkerbovenhoek van het binnenwerk van het paneel, want daar begint de
       tekenlaag ook. Niet met offsetLeft en offsetTop: die tellen vanaf de dichtstbijzijnde
       geplaatste voorouder, en dat is voor de staafjes van de tijdlijn de balk eromheen
       (die staat op position:relative om achter de lijntjes langs te kunnen) en niet het
       paneel. De lijnen kwamen daardoor de padding van het paneel naast hun doel uit. */
    var vak = q.el.getBoundingClientRect();
    var rand = getComputedStyle(q.el);
    var nulX = vak.left + (parseFloat(rand.borderLeftWidth) || 0);
    var nulY = vak.top + (parseFloat(rand.borderTopWidth) || 0);
    var punten = doelen.map(function (d) {
      var r = d.getBoundingClientRect();
      return { x: r.left + r.width / 2 - nulX, y: r.top - nulY, onder: r.bottom - nulY,
               links: r.left - nulX, rechts: r.right - nulX };
    });
    var alleP = punten;
    /* Een rij pillen hoort op een regel te staan: valt hij om, dan blijven de lijntjes
       weg, want een lijn naar de tweede regel zou dwars over de eerste lopen. De
       tijdlijn slaat die eis over (eenRij:false): daar staat alles per definitie naast
       elkaar, maar elk staafje op de hoogte van zijn eigen top. */
    /* Valt een rij pillen over meer dan een regel, dan wijst de rail alleen naar de
       bovenste regel; de regels daaronder hangen aan hun eigen buurman erboven (zie
       rijlijnen verderop). Zo loopt er nooit een lijn dwars over een knop heen. */
    if (q.eersteRij) {
      var bovenste = Math.round(punten[0].y);
      punten.forEach(function (p) { if (Math.round(p.y) < bovenste) { bovenste = Math.round(p.y); } });
      punten = punten.filter(function (p) { return Math.round(p.y) === bovenste; });
    }
    if (q.eenRij !== false && !q.eersteRij) {
      for (var i = 1; i < punten.length; i++) {
        if (Math.round(punten[i].y) !== Math.round(punten[0].y)) { return; }
      }
    }
    var kr = q.knop.getBoundingClientRect();
    var x0 = kr.left + kr.width / 2 - nulX;
    var y0 = kr.bottom - nulY;
    /* Op een smal venster valt de kopregel zelf om en staat de schakelaar niet meer op de
       onderste regel. De stam zakt dan dwars door die kopregel heen. Dat mag zolang hij
       onderweg niets raakt — meestal staat er niets onder de schakelaar — maar raakt hij
       wel een knop, dan blijven de lijntjes weg. En de rail hangt in dat geval niet
       halverwege de schakelaar en de pillen, want dat is midden in de kopregel, maar
       halverwege de ónderkant van de kopregel en de pillen. */
    var yRef = y0, botst = false;
    [].slice.call(q.knop.parentNode.querySelectorAll('button')).forEach(function (b) {
      var rb = b.getBoundingClientRect();
      if (rb.bottom - nulY > yRef) { yRef = rb.bottom - nulY; }
      if (b === q.knop || rb.top < kr.bottom - 0.5) { return; }
      if (rb.left - 1 <= nulX + x0 && nulX + x0 <= rb.right + 1) { botst = true; }
    });
    if (botst) { return; }
    var diepst = 0;
    punten.forEach(function (p) { if (p.y > diepst) { diepst = p.y; } });
    var hoog = diepst - y0;
    /* Staat de schakelaar niet vlak boven de rij — de kopregel is omgevallen en hij
       staat op de bovenste regel — dan is de afstand veel groter dan de twee stroken
       padding ertussen, en zou de lijn over de knoppen ernaast lopen. Dan liever niets.
       De tijdlijn mag verder reiken: daar hangt de diepte aan het laagste staafje. */
    /* Een ondergrens tegen rare tussenstanden; de bovengrens is ruim, want bij een
       omgevallen kopregel is de afstand tot de pillen vanzelf groter. Of de stam daar
       iets raakt is hierboven al gecontroleerd. */
    if (hoog < 6 || hoog > (q.maxDiepte || 200)) { return; }
    laag.style.left = '0';
    laag.style.top = y0 + 'px';
    laag.style.width = q.el.clientWidth + 'px';
    laag.style.display = '';
    /* Haakse verbindingen, zoals een stamboom ze tekent: recht omlaag uit de schakelaar,
       dan een horizontale rail, en van die rail per doel een pootje recht naar beneden.
       Schuine lijnen van de schakelaar naar elk doel lagen bij duizend pixels breedte en
       dertig pixels hoogte bijna vlak en liepen bij de schakelaar samen tot een veeg;
       haaks blijft het op elke breedte te volgen.
       De rail ligt halverwege tussen de schakelaar en het hoogste doel, dus bij de
       tijdlijn boven de langste staaf: zo kruist hij geen enkele staaf, en elk pootje
       blijft binnen zijn eigen kolom. Halve pixels omdat een lijn van een pixel anders
       over twee rijen wordt uitgesmeerd. */
    function halve(v) { return Math.round(v) + 0.5; }
    /* De rail ligt halverwege tussen de schakelaar en de bovenkant van wat eronder staat.
       Bij een rij pillen is dat de rij zelf; bij de tijdlijn de balk met de staafjes
       (railVlak), en niet de langste staaf, want de staven zijn allemaal even lang als
       hun jaar zwaar is en dan zou de rail per taal en per telling verspringen. Zo ligt
       hij bij alle vier de rijen op dezelfde hoogte onder de kopregel: die vier balken
       beginnen immers alle vier op dezelfde padding. */
    var vlak = q.railVlak ? q.el.querySelector(q.railVlak) : null;
    var hoogste;
    if (vlak) {
      hoogste = vlak.getBoundingClientRect().top - nulY;
    } else {
      hoogste = punten[0].y;
      punten.forEach(function (p) { if (p.y < hoogste) { hoogste = p.y; } });
    }
    /* De rail hangt halverwege de ónderste regel van de kopregel en de rij eronder, en niet
       halverwege deze schakelaar en die rij. Bij een omgevallen kopregel staat de ene
       schakelaar een regel hoger dan de andere, en dan zou de rail per schakelaar op een
       andere hoogte komen te liggen; nu ligt hij voor alle vier gelijk en verspringt hij
       niet als je van rij wisselt. Staat de schakelaar zelf op de onderste regel, dan is
       yRef gelijk aan y0 en verandert er niets. */
    /* Op halve pixels afgerond binnen het paneel en niet binnen de tekenlaag: die laag
       begint bij de onderkant van de eigen schakelaar, en bij een omgevallen kopregel
       verschilt dat nulpunt per schakelaar. Afronden in de laag gaf dan een rail die per
       schakelaar een fractie hoger of lager uitkwam; zo ligt hij voor alle vier op precies
       dezelfde hoogte in het paneel. */
    var rail = halve((yRef + hoogste) / 2) - y0;
    /* Eén rij mag zijn rail verschuiven zonder dat zijn knoppen meeschuiven. Dat is de
       tijdlijn op een L-scherm. Halverwege tussen de schakelaar en de staafbalk zou de
       rail daar op 14,5px onder de schakelaar uitkomen, en de drie knoppenrijen hebben
       hem op 16,5px; deze twee pixels leggen hem gelijk. De staafbalk staat er vijf pixels
       krapper onder dan die rijen (zie .ddg-tijdlijn in de stylesheet), zodat er tussen de
       rail en de top van de hoogste staaf twaalf pixels overblijven. De grens staat in
       dezelfde media query als in de stylesheet; bij een andere vensterbreedte wordt er
       opnieuw getekend, dus hij blijft kloppen. */
    /* railBij mag ook een lijstje regels zijn: de tijdlijn heeft er een voor het L-scherm
       en een voor S en M, omdat zijn staafbalk daar een andere padding heeft dan de
       knoppenrijen en de rail toch op dezelfde hoogte moet uitkomen. */
    [].concat(q.railBij || []).forEach(function (rb) {
      if (window.matchMedia(rb.vanaf).matches) { rail += rb.px; }
    });
    /* Waar een pootje eindigt. Normaal op zijn doel: de bovenkant van de pil. De tijdlijn
       doet het anders (pootje in PANELEN): daar krijgt elk jaar een even lang, kort
       pootje onder de rail in plaats van een lijn die tot op zijn staaf doorloopt. Een
       doorlopende lijn is daar namelijk het langst waar de staaf het kortst is, en dan
       loopt de hoeveelheid grijs precies tegengesteld aan de waarde eronder — en vijftien
       van die lijnen lezen bovendien als een tweede reeks kolommen naast de rode. */
    function eind(p) {
      return (q.pootje ? rail + q.pootje : p.y - y0).toFixed(2);
    }
    var laagst = diepst;
    if (q.rijlijnen) { alleP.forEach(function (p) { if (p.y > laagst) { laagst = p.y; } }); }
    laag.style.height = (q.pootje ? rail + q.pootje + 1 : laagst - y0) + 'px';
    /* Alle aftakkingen op een rij: elk doel hangt onder de rail, de stam naar de schakelaar
       staat erboven. Door de stam als gewone aftakking mee te nemen loopt de rail vanzelf
       door tot onder de schakelaar, ook als die links of rechts naast de rij staat — bij de
       sprekerpillen op een telefoon is dat zo, en daar hing de stam eerst los van de rail.
       De twee buitenste takken krijgen een boogje; wat ertussen ligt is een T-splitsing en
       blijft haaks. */
    var takken = punten.map(function(p){ return { x: halve(p.x), y: parseFloat(eind(p)) }; });
    takken.push({ x: halve(x0), y: 0 });
    takken.sort(function(a, b){ return a.x - b.x; });
    var L = takken[0], R = takken[takken.length - 1];
    var r = Math.min(3, (R.x - L.x) / 2);
    var tekening = [], poten = [];
    /* Bij een vast pootje (de tijdlijn) tekent het hoofdpad alleen de stam, de rail en de
       twee boogjes. De pootjes zelf gaan in een tweede pad met een verloop dat naar
       onderen in het grijs van het paneel oplost: zo mogen ze wat langer zijn zonder
       als een hek onder de rail te staan. Het buitenste pootje begint waar zijn boogje
       ophoudt, de andere op de rail zelf. */
    function poot(x, van, tot) {
      if (q.pootje && tot > rail) {
        poten.push('M' + x + ' ' + van.toFixed(2) + 'V' + tot);
        return van.toFixed(2);
      }
      return tot;
    }
    if (r >= 1) {
      tekening.push('M' + L.x + ' ' + poot(L.x, rail + r, L.y) +
                    'V' + (rail + (L.y > rail ? r : -r)) +
                    'Q' + L.x + ' ' + rail + ' ' + (L.x + r) + ' ' + rail +
                    'H' + (R.x - r) +
                    'Q' + R.x + ' ' + rail + ' ' + R.x + ' ' + (rail + (R.y > rail ? r : -r)) +
                    'V' + poot(R.x, rail + r, R.y));
    } else {
      tekening.push('M' + L.x + ' ' + poot(L.x, rail, L.y) + 'V' + rail +
                    'H' + R.x + 'V' + poot(R.x, rail, R.y));
    }
    takken.slice(1, -1).forEach(function(t){
      if (poot(t.x, rail, t.y) === t.y) { tekening.push('M' + t.x + ' ' + rail + 'V' + t.y); }
    });
    /* Valt de rij over meer regels, dan loopt de boom door tussen die regels. Welke knop
       erboven de ouder is, bepaalt de overlap in de breedte: van elke knop op de onderste
       regel zoeken we de knop erboven waarmee hij het breedst overlapt. De lijn staat recht
       naar beneden, op het midden van juist dat overlappende stuk — niet op het midden van
       de ene of de andere knop, want dan komt hij bij ongelijke breedtes scheef onder zijn
       ouder of naast zijn kind uit. Overlapt een knop met niets erboven, wat bij deze
       uitgevulde rijen niet voorkomt, dan valt hij terug op zijn eigen midden. */
    if (q.rijlijnen) {
      var regels = {};
      alleP.forEach(function (p) { var k = Math.round(p.y); (regels[k] = regels[k] || []).push(p); });
      var sleutels = Object.keys(regels).map(Number).sort(function (a, b) { return a - b; });
      for (var ri = 1; ri < sleutels.length; ri++) {
        (function (boven, onder) {
          var onderkant = boven[0].onder - y0;
          onder.forEach(function (kind) {
            var beste = 0, x = kind.x;
            boven.forEach(function (b) {
              var van = Math.max(b.links, kind.links), tot = Math.min(b.rechts, kind.rechts);
              if (tot - van > beste) { beste = tot - van; x = (van + tot) / 2; }
            });
            tekening.push('M' + halve(x) + ' ' + onderkant.toFixed(2) +
                          'V' + (kind.y - y0).toFixed(2));
          });
        })(regels[sleutels[ri - 1]], regels[sleutels[ri]]);
      }
    }
    var pad = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pad.setAttribute('d', tekening.join(''));
    laag.appendChild(pad);
    /* De pootjes: vol van kleur op de rail, daarna uitdovend tot niets op de onderkant.
       Het verloop staat in de ruimte van de laag (userSpaceOnUse), dus alle pootjes delen
       er een; de kleur van de stops staat in de stylesheet bij de andere lijnkleur. */
    if (poten.length) {
      var NS = 'http://www.w3.org/2000/svg';
      var gid = 'paneel-verloop-' + (q.el.id || 'x');
      var defs = document.createElementNS(NS, 'defs');
      var verloop = document.createElementNS(NS, 'linearGradient');
      verloop.setAttribute('id', gid);
      verloop.setAttribute('gradientUnits', 'userSpaceOnUse');
      verloop.setAttribute('x1', '0'); verloop.setAttribute('x2', '0');
      verloop.setAttribute('y1', rail.toFixed(2)); verloop.setAttribute('y2', (rail + q.pootje).toFixed(2));
      [[0, 1], [0.3, 1], [1, 0]].forEach(function (st) {
        var stop = document.createElementNS(NS, 'stop');
        stop.setAttribute('offset', st[0]); stop.setAttribute('stop-opacity', st[1]);
        verloop.appendChild(stop);
      });
      defs.appendChild(verloop);
      laag.appendChild(defs);
      var voet = document.createElementNS(NS, 'path');
      voet.setAttribute('d', poten.join(''));
      voet.style.stroke = 'url(#' + gid + ')';
      laag.appendChild(voet);
    }
  }

/* ==========================================================================
   Hieronder drie blokken die tot 28 augustus 2026 inline in elk van de vijf
   desktopbestanden stonden en daar woordelijk gelijk waren. De fade-in bij het
   laden en de omleiding naar de mobiele site zijn bewust NIET meeverhuisd: die
   moeten tijdens het parsen draaien, niet erna.
   ========================================================================== */

  function showmenu() {
  var x = document.getElementById('myLinks');
  var y = document.getElementById('ddg');
  if (x.style.display === 'block') {
x.style.display = 'none';
y.style.display = 'block';
document.getElementById('navi1').style.opacity="1";
document.getElementById('navi2').style.opacity="1";
document.getElementById('navi3').style.opacity="1";
document.getElementById('navi4').style.opacity="0";
document.getElementById('navi5').style.opacity="0";
  }
  else {
x.style.display = 'block';
y.style.display = 'none';
document.getElementById('navi1').style.opacity="0";
document.getElementById('navi2').style.opacity="0";
document.getElementById('navi3').style.opacity="0";
document.getElementById('navi4').style.opacity="1";
document.getElementById('navi5').style.opacity="1";
 }
 var mt = document.querySelector('[onclick*="showmenu"]');
 var n4 = document.getElementById('navi4');
 if (mt && n4) mt.setAttribute('aria-expanded', n4.style.opacity === '1' ? 'true' : 'false');
}
 

/* -------------------------------------------------------------------------- */

/* role=button betekent: de spatiebalk hoort te bedienen. Op een <a> doet die
   standaard niets (hij scrollt), dus dat vangen we hier af. Enter werkt al. */
document.addEventListener('keydown', function (e) {
  if (e.key !== ' ' && e.key !== 'Spacebar') return;
  var t = e.target;
  if (!t || !t.getAttribute || t.getAttribute('role') !== 'button') return;
  e.preventDefault();
  t.click();
});

/* -------------------------------------------------------------------------- */

/* Duur van het uit- en inklappen, per blok apart in milliseconden: [openen, sluiten].
   Bewust losse getallen en geen formule: het ene blok wil rustig opengaan en het
   andere juist vlot, en dat valt niet uit de hoogte af te leiden. Hoger is
   langzamer. Wil je er één bijstellen, verander dan alleen dat getal.
   Blokken die hoger zijn dan het scherm lopen linear. Bij een ease-kromme valt de
   snelle helft van de beweging in het stuk dat je ziet en de trage helft eronder,
   waardoor het getal nauwelijks nog stuurt. De bronnenlijst past wel op één scherm
   en houdt daarom ease-out bij openen en ease-in bij sluiten.
   Bij 'beperk bewegingen' in de systeeminstellingen wordt er niet geanimeerd. */
var KLAPTIJD = {
  bronnenLijst:     [ 880,  610],   /* lijst met 61 bronnen             - ease   */
  publicationsList: [ 630,  440],   /* selectie van de media-aandacht   - linear */
  extraStemmen:     [1110,  400]    /* vijf extra secties met citaten   - linear */
};
function klapDuur(blok, sluiten) {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  var t = KLAPTIJD[blok] || [800, 550];
  return t[sluiten ? 1 : 0];
}

/* -------------------------------------------------------------------------- */

/* Deelknoppen. De vier diensten krijgen dezelfde gegevens, en die staan op de body:
   elke taal deelt namelijk zijn eigen domeinnaam (thecoverupgeneral.com,
   dercoverupgeneral.de, legeneraldedissimulation.fr, generalzataskavanja.com) en
   NIET de pagina waar de bezoeker toevallig op staat. Dat is opzet, dus niet
   vervangen door location.href. De WhatsApp-tekst staat er los bij, want die noemt
   de domeinnaam net iets anders dan de deel-URL zelf. */
(function(){
  var b = document.body;
  var url   = b.getAttribute('data-deel-url')   || location.origin;
  var tekst = b.getAttribute('data-deel-tekst') || document.title;
  function venster(adres){
    window.open(adres, '_blank', 'top=400,left=400,width=800,height=800');
  }
  window.facebook = function(){ venster('https://www.facebook.com/sharer/sharer.php?u=' + url); };
  window.twitter  = function(){ venster('https://x.com/intent/tweet?url=' + url); };
  window.linkedin = function(){ venster('https://www.linkedin.com/sharing/share-offsite/?url=' + url); };
  window.whatsapp = function(){ venster('https://wa.me/?text=' + encodeURIComponent(tekst)); };
})();

/* -------------------------------------------------------------------------- */

/* Het aantal citaten achter de leesmeerknop staat in de knoptekst zelf, zodat een
   lezer ziet dat de genummerde lijst doorloopt en niet ophoudt bij tweeenzeventig.
   Bewust geteld en niet ingetikt: haal je ooit een citaat weg of verhuist er een
   sectie, dan klopt het getal vanzelf nog. In de HTML staat een terugvalgetal voor
   het geval er geen javascript is. De knoptekst wordt bij het inklappen opnieuw
   opgebouwd, dus roept toggleExtraStemmen deze functie daarna nog eens aan. */
window.vulExtraAantal = function(){
  var blok = document.getElementById('extraStemmen');
  if(!blok) return;
  var n = blok.querySelectorAll('td[data-stem]').length;
  if(!n) return;
  [].slice.call(document.querySelectorAll('.extraAantal')).forEach(function(el){
    el.textContent = n;
  });
};
window.vulExtraAantal();

/* -------------------------------------------------------------------------- */

/* De personen- en iconensprite worden pas opgehaald als de bezoeker in de buurt van
   de citaten komt. Samen zijn ze 261 KB, en de eerste kaart staat rond y=11900 op een
   pagina van 22000 pixels; ze meteen halen kost bandbreedte die de bovenkant beter kan
   gebruiken. De marge van 1200 px zorgt dat ze er staan voordat de eerste kaart in
   beeld schuift. Kent de browser IntersectionObserver niet, dan gaan ze meteen aan;
   zonder javascript doet de noscript-regel in de pagina hetzelfde.
   Sinds 22 sept 2026 worden álle zeventien sectietabellen bewaakt en niet alleen de eerste
   (Edwin: iconen bleven leeg na een sprong via de zoekfunctie). Een sprong ineens, zoals de
   zoekfunctie die maakt bij 'verminder beweging' of in een verborgen tabblad, en ook een
   #-anker, laat de eerste tabel in één stap van onder naar boven het beeld passeren: de
   observer ziet dan geen verandering en meldt niets. Land je in een van de secties, dan
   snijdt die tabel het beeld wél en gaan de sprites alsnog aan. */
(function(){
  var tabellen = [].slice.call(document.querySelectorAll('table.sectie'));
  if(!tabellen.length) return;
  function aan(){ document.body.classList.add('stemmenzicht'); }
  if(!('IntersectionObserver' in window)){ aan(); return; }
  var kijker = new IntersectionObserver(function(waarnemingen){
    waarnemingen.forEach(function(w){
      // isIntersecting dekt het naderen van bovenaf; boundingClientRect.top < 0 dekt het
      // herladen ónder de citaten, waar de sentinel al voorbij is gescrold en dus nooit
      // meer intersect: dan staan de iconen anders nooit aan.
      if(w.isIntersecting || w.boundingClientRect.top < 0){ aan(); kijker.disconnect(); }
    });
  }, { rootMargin: '1200px 0px' });
  tabellen.forEach(function(t){ kijker.observe(t); });
})();


/* -------------------------------------------------------------------------- */

/* De zwijgmatrix in "Nooit een inhoudelijk antwoord" heeft links in de kopregel een schakelaar
   twee knoppen waarmee de kolom met de pdf-pillen en de kolom met de ministers aan en uit gaan
   (Edwin, 8 sept 2026). Zonder javascript
   staat die kolom er gewoon en is de knop verborgen; hier draaien we dat om: de knop verschijnt
   en de kolom gaat dicht. Zo blijven de brieven bereikbaar als dit script niet draait. */
(function(){
  [].slice.call(document.querySelectorAll('.ddg-zwijgmatrix')).forEach(function(blok){
    var knoppen = [].slice.call(blok.querySelectorAll('.zm-schakel'));
    if(!knoppen.length) return;
    function zet(knop, aan){
      blok.setAttribute('data-' + knop.getAttribute('data-doel'), aan ? 'aan' : 'uit');
      knop.setAttribute('aria-pressed', aan ? 'true' : 'false');
    }
    var balk = blok.querySelector('.zm-knoprij');
    if(balk){ balk.hidden = false; }
    /* Elke knop heeft zijn eigen standaardstand: alleen de kolom met het beroep op
       staatsgeheim staat meteen aan (Edwin, 8 sept 2026). */
    knoppen.forEach(function(knop){ knop.hidden = false; zet(knop, knop.getAttribute('data-standaard') === 'aan'); });
    /* Klikken gaat door dezelfde zachte overgang als het filteren van de citaten en de media:
       de browser maakt een momentopname van vóór en ná en kruist die over elkaar heen, zodat
       de kolom niet hard verschijnt en de kolom ernaast niet verspringt. Kent de browser het
       niet, staat het tabblad op de achtergrond of heeft de bezoeker beweging beperkt, dan
       schakelt hij gewoon meteen om. */
    function metOvergang(fn){
      var rustig = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
                || document.visibilityState !== 'visible';
      if(!document.startViewTransition || rustig){ fn(); return; }
      var gedaan = false, doe = function(){ if(!gedaan){ gedaan = true; fn(); } };
      var vt;
      try { vt = document.startViewTransition(doe); } catch(e){ doe(); return; }
      if (vt) {
        if (vt.ready && vt.ready.catch) { vt.ready.catch(function () {}); }
        if (vt.finished && vt.finished.catch) { vt.finished.catch(function () {}); }
      }
      setTimeout(doe, 250);
    }
    knoppen.forEach(function(knop){
      knop.addEventListener('click', function(){
        var aan = knop.getAttribute('aria-pressed') !== 'true';
        metOvergang(function(){ zet(knop, aan); });
      });
    });
  });
})();


/* -------------------------------------------------------------------------- */

/* Inhoudstabel naast het essay (L-scherm, sticky; zie .essay-l in de stylesheet): de regels
   van de secties die op dit moment in beeld zijn krijgen een lichte achtergrond (Edwin,
   25 sept 2026). Een sectie loopt van haar kop tot de volgende kop, de laatste tot het eind
   van de essaykolom. "In beeld" is het stuk venster onder de sticky header. Alleen op een
   L-scherm; daaronder staat de inhoudstabel boven het essay en blijft hij onaangeroerd. */
(function(){
  var toc = document.querySelector('.essay-l > .mini-toc');
  var kol = document.querySelector('.essay-l > .essay-kol');
  if(!toc || !kol) return;
  var header = document.querySelector('.header');
  var groot = window.matchMedia ? matchMedia('(min-width:1080px)') : { matches: true };
  var regels = [].slice.call(toc.querySelectorAll('li')).map(function(li){
    var a = li.querySelector('a[href^="#"]');
    return { li: li, kop: a && document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function(r){ return r.kop; });
  if(!regels.length) return;
  var gepland = false;
  function bijwerken(){
    gepland = false;
    /* De bovengrens is niet de onderkant van de header maar de plek waar een kop na een klik
       in de inhoudstabel terechtkomt (scroll-margin-top, 75px). Anders telt na die sprong het
       strookje van de vorige sectie tussen header en kop mee en licht die regel ook op. */
    var marge = parseFloat(getComputedStyle(regels[0].kop).scrollMarginTop) || 0;
    var boven = Math.max(header ? header.getBoundingClientRect().bottom : 0, marge) + 1;
    var onder = window.innerHeight;
    var eind = kol.getBoundingClientRect().bottom;
    regels.forEach(function(r, i){
      var aan = false;
      if(groot.matches){
        var top = r.kop.getBoundingClientRect().top;
        var bodem = i + 1 < regels.length ? regels[i + 1].kop.getBoundingClientRect().top : eind;
        aan = top < onder && bodem > boven;
      }
      r.li.classList.toggle('inbeeld', aan);
    });
  }
  function plan(){ if(!gepland){ gepland = true; requestAnimationFrame(bijwerken); } }
  window.addEventListener('scroll', plan, { passive: true });
  window.addEventListener('resize', plan);
  if(groot.addEventListener) groot.addEventListener('change', plan);
  window.addEventListener('load', plan);
  bijwerken();
})();
