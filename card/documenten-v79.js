/* Scriptje bij de documentpagina's in /doc.
   Doet zes dingen: de schaduw onder de kopregel zodra er gescrold is, ruimte
   onderaan bij een link naar een passage, het sluiten van het tabblad, de raadpleegdatum in het citaatblok, de uitsnedelink
   alleen op mobiel, en de kopieerknop.
   Bewust klein en gedeeld: de taalgebonden woorden staan als data-attribuut in
   de HTML, zodat dit bestand voor alle vijf de talen hetzelfde kan blijven. */
(function () {
  'use strict';

  /* Kopregel tilt op bij scrollen, net als op de mobiele site. */
  var kop = document.querySelector('.header');
  if (kop) {
    var meet = function () { kop.classList.toggle('elevated', window.scrollY > 2); };
    meet();
    window.addEventListener('scroll', meet, { passive: true });
  }

  /* Link naar een passage (#ro-4-9). De kop hoort 45 pixel onder de bovenrand uit te
     komen (scroll-margin-top in de stylesheet), maar bij de laatste passage van een
     korte kaart is de pagina in een hoog venster te kort om zo ver te scrollen: de kop
     bleef dan halverwege het scherm staan (novini#ontkenning, 1280 x 1300). Daarom
     komt er onderaan precies zoveel ruimte bij als nodig is, en alleen als de kaart
     met een anker is geopend. */
  /* Een los blok, geen padding op body: die heeft een minimale hoogte met
     border-box, waarbinnen extra padding niets toevoegt (vanrossem, schadevergoeding). */
  var ruimte = document.createElement('div');
  ruimte.setAttribute('aria-hidden', 'true');
  var naarAnker = function () {
    var id = decodeURIComponent(location.hash.slice(1));
    var doel = id && document.getElementById(id);
    ruimte.style.height = '0';
    if (!doel) return;
    if (!ruimte.parentNode) document.body.appendChild(ruimte);
    var marge = parseFloat(getComputedStyle(doel).scrollMarginTop) || 0;
    var nodig = doel.getBoundingClientRect().top + window.scrollY - marge + window.innerHeight;
    /* Gemeten vanaf de onderkant van de inhoud, niet met scrollHeight: is de kaart
       korter dan het venster, dan geeft scrollHeight de vensterhoogte en valt de
       ruimte te klein uit (vanrossem in een venster van 1300 pixel). */
    var tekort = Math.ceil(nodig - (ruimte.getBoundingClientRect().top + window.scrollY));
    if (tekort > 0) ruimte.style.height = tekort + 'px';
    doel.scrollIntoView();
  };
  naarAnker();
  window.addEventListener('load', naarAnker);
  window.addEventListener('hashchange', naarAnker);


  /* Sluitknop. De documentpagina's openen in een eigen tabblad, dus terugbladeren
     brengt je nergens: het kruis sluit het tabblad. Een tabblad met een eigen
     geschiedenis mag een script niet sluiten; weigert de browser, dan volgt alsnog
     de href, en die wijst naar de sectie waar dit stuk wordt aangehaald. Zonder
     javascript is die href gewoon de link. */
  var sluit = document.querySelector('.sluitknop');
  if (sluit) {
    sluit.addEventListener('click', function (e) {
      e.preventDefault();
      var terug = sluit.getAttribute('href');
      window.close();
      setTimeout(function () { if (terug) location.href = terug; }, 200);
    });
  }

  /* Raadpleegdatum. In de HTML staat een vaste datum als terugval, zodat de
     pagina zonder javascript een compleet citaat toont; hier wordt hij vervangen
     door de datum van vandaag. Bosnisch kent geen bruikbare maandnamen via
     toLocaleDateString, vandaar de eigen reeks. */
  var BOS = ['januara','februara','marta','aprila','maja','juna',
             'jula','augusta','septembra','oktobra','novembra','decembra'];
  var vak = document.getElementById('vandaag');
  if (vak) {
    var d = new Date(), taal = document.documentElement.lang || 'en';
    var tekst;
    try {
      if (taal.indexOf('bs') === 0 || taal.indexOf('hr') === 0) {
        tekst = d.getDate() + '. ' + BOS[d.getMonth()] + ' ' + d.getFullYear() + '.';
      } else {
        tekst = d.toLocaleDateString(taal, { day: 'numeric', month: 'long', year: 'numeric' });
        /* Frans: de eerste van de maand is 1er, zoals op francais.htm en in de terugval. */
        if (taal.indexOf('fr') === 0 && d.getDate() === 1) tekst = tekst.replace(/^1(?=\s)/, '1er');
      }
      vak.textContent = tekst;
    } catch (e) { /* terugval in de HTML blijft staan */ }
  }

  /* Uitsnedelink. Op mobiel opent een tik de uitsnede op ware grootte; op desktop is
     hij groot genoeg en is de link weg (de CSS zet hem daar buiten werking). Hier gaat
     hij op desktop ook uit de tabvolgorde, en weer terug als het venster smaller wordt.
     De grens is die van het stylesheet: 709,1 pixel. */
  var uitsnedes = document.querySelectorAll('.uitsnedelink');
  var breed = window.matchMedia ? window.matchMedia('(min-width: 709.1px)') : null;
  if (uitsnedes.length && breed) {
    var tabvolgorde = function () {
      for (var i = 0; i < uitsnedes.length; i++) {
        if (breed.matches) uitsnedes[i].setAttribute('tabindex', '-1');
        else uitsnedes[i].removeAttribute('tabindex');
      }
    };
    tabvolgorde();
    if (breed.addEventListener) breed.addEventListener('change', tabvolgorde);
    else if (breed.addListener) breed.addListener(tabvolgorde);
  }

  /* Kopieerknop: neemt de volledige tekst van het citaatblok mee. */
  var knop = document.querySelector('[data-kopieer]');
  var blok = document.getElementById('citaat');
  if (!knop || !blok) return;
  knop.hidden = false;

  var melding = document.querySelector('.gelukt');
  knop.addEventListener('click', function () {
    var tekst = blok.innerText.replace(/\u00ad/g, '').replace(/\n{3,}/g, '\n\n').trim();
    var klaar = function () {
      if (!melding) return;
      melding.textContent = knop.getAttribute('data-gelukt') || '';
      clearTimeout(knop._t);
      knop._t = setTimeout(function () { melding.textContent = ''; }, 3000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tekst).then(klaar, function () { terugval(tekst, klaar); });
    } else {
      terugval(tekst, klaar);
    }
  });

  /* Oudere browsers en pagina's zonder veilige verbinding. */
  function terugval(tekst, klaar) {
    var v = document.createElement('textarea');
    v.value = tekst;
    v.setAttribute('readonly', '');
    v.style.cssText = 'position:absolute;left:-9999px;top:0;';
    document.body.appendChild(v);
    v.select();
    try { document.execCommand('copy'); klaar(); } catch (e) { /* stil */ }
    document.body.removeChild(v);
  }
})();
