/* Gedeelde scripts voor de mobiele pagina's (m/).
   =================================================================
   Deze tien blokken stonden tot 28 augustus 2026 inline in elk van de vijf
   taalbestanden. Ze zijn woordelijk gelijk in alle vijf: er zit geen enkele
   taalgebonden tekst in, want de opschriften die wel per taal verschillen staan
   als data-attribuut op de knoppenbalk zelf. Vijf keer hetzelfde onderhouden is
   vijf kansen om uiteen te lopen; daarom nu een keer.

   Wat hier NIET in hoort: de blokken met vertaalde teksten (de leesmeerknoppen,
   de opschriften van de mediafilter, de datumopmaak) en de drie JSON-LD-blokken
   met de paginagegevens. Die verschillen per taal en blijven in de pagina staan.

   Wordt geladen met defer, en bewust VOOR ../zoeken-v86.js: de zoekfunctie leest
   de kaartnummers uit data-nr, en die worden hieronder gezet.
   ================================================================= */

// smooth scroll naar ankers (voorheen jQuery .animate; inline i.p.v. een apart bestand,
// zodat het niet los van de HTML kan achterblijven bij een upload of versiebump)
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


/* -------------------------------------------------------------------------- */

     function showmenu() {
     var x = document.getElementById('myLinks');
     if (x.style.display === 'block') { 

     document.getElementById('myLinks').classList.remove("oplichten2");
     document.getElementById('myLinks').classList.add("oplichten2R");
     document.getElementById('navi1').style.opacity="1";
     document.getElementById('navi2').style.opacity="1";
     document.getElementById('navi3').style.opacity="1";
     document.getElementById('navi4').style.opacity="0";
     document.getElementById('navi5').style.opacity="0";
     setTimeout(function(){ 
       x.style.display = 'none';
       document.getElementById('myLinks').classList.remove("oplichten2R");
       document.getElementById('myLinks').classList.add("oplichten2");
     }, 400);

     } 
     else { x.style.display = 'block'; 
     document.getElementById('navi1').style.opacity="0";
     document.getElementById('navi2').style.opacity="0";
     document.getElementById('navi3').style.opacity="0";
     document.getElementById('navi4').style.opacity="1";
     document.getElementById('navi5').style.opacity="1";
     }
 var mt = document.querySelector('[onclick*="showmenu"]');
 var n4 = document.getElementById('navi4');
 if (mt && n4) mt.setAttribute('aria-expanded', n4.style.opacity === '1' ? 'true' : 'false');
};

     function wegmenu() {
     var x = document.getElementById('myLinks');
     document.getElementById('myLinks').classList.remove("oplichten2");
     document.getElementById('myLinks').classList.add("oplichten2R");
     document.getElementById('navi1').style.opacity="1";
     document.getElementById('navi2').style.opacity="1";
     document.getElementById('navi3').style.opacity="1";
     document.getElementById('navi4').style.opacity="0";
     document.getElementById('navi5').style.opacity="0";
     setTimeout(function(){ 
       x.style.display = 'none';
       document.getElementById('myLinks').classList.remove("oplichten2R");
       document.getElementById('myLinks').classList.add("oplichten2");
     }, 400);
     } 

/* Het hamburgermenu gaat ook dicht als je ernaast klikt, net als het taalmenu rechts.
   Klikken op de hamburger zelf telt niet mee: die knop schakelt al, en anders zou hij het
   menu openen en in dezelfde klik weer sluiten. Klikken op een menuknop evenmin, want die
   roepen wegmenu() zelf al aan. */
document.addEventListener('click', function (e) {
  var menu = document.getElementById('myLinks');
  if (!menu || menu.style.display !== 'block') return;
  var t = e.target;
  if (!t || !t.closest) return;
  if (t.closest('#myLinks') || t.closest('.menuknop')) return;
  wegmenu();
});

/* En op Escape, net als het taalmenu. De aandacht gaat daarna terug naar de hamburger,
   zodat wie met het toetsenbord werkt niet aan het begin van de pagina belandt. */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  var menu = document.getElementById('myLinks');
  if (!menu || menu.style.display !== 'block') return;
  wegmenu();
  var knop = document.querySelector('.menuknop');
  if (knop) knop.focus();
});
    

/* -------------------------------------------------------------------------- */

/* Citatenfilter. De mobiele lijst is plat, dus filteren is kaarten tonen of verbergen;
   geen rijen herbouwen zoals op de desktop. Elke kaart bestaat uit twee rijen: een
   nummerrij en een inhoudsrij met data-stem. Een sectiekop verdwijnt zodra er onder
   hem niets meer overblijft. Zonder JS wordt de balk niet gevuld en staat alles er. */
(function(){
  var bar = document.getElementById('stemFilter');
  /* De herkomstbalk staat tussen de sprekerbalk en de jaarbalk. Ontbreekt de div, dan
     werkt alles hieronder alsof hij er niet is. */
  var vlagBar = document.getElementById('stemVlaggen');
  /* De kopregel met 'alle citaten', de sleutelcitaten en de schakelaars, en de balk met
     de brondocumenten. Ontbreken ze, dan werkt de rest eromheen. */
  var kopBar = document.getElementById('stemKop');
  var bronBar = document.getElementById('stemBronnen');
  var lijst = document.getElementById('citExtended');
  if(!bar || !lijst) return;
  var tabel = lijst.querySelector('table');
  if(!tabel) return;

  // De datum van elk citaat klein onder het nummerbolletje, in hoofdletters, op de
  // precisie die we echt hebben (JJJJ, MAAND JJJJ of D MAAND JJJJ). Maandnamen per taal.
  var MND = { nl:['JAN','FEB','MRT','APR','MEI','JUN','JUL','AUG','SEP','OKT','NOV','DEC'],
              en:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
              de:['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'],
              fr:['JANV','FÉVR','MARS','AVR','MAI','JUIN','JUIL','AOÛT','SEPT','OCT','NOV','DÉC'],
              hr:['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AVG','SEP','OKT','NOV','DEC'] };
  var maanden = MND[(document.documentElement.getAttribute('lang')||'nl').slice(0,2).toLowerCase()] || MND.nl;
  function vandaag(){ var d=new Date();
    return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function res(iso){ return iso==='today' ? vandaag() : iso; }
  function datumLabel(iso){
    iso=res(iso);
    if(!iso) return '';
    var p=iso.split('-');
    if(p.length===1) return p[0];
    var m=maanden[parseInt(p[1],10)-1];
    return (p.length===2 ? m+' '+p[0] : parseInt(p[2],10)+' '+m+' '+p[0]);
  }
  // De landcode achter een vlagteken: twee regionale-indicatorletters (de N en de L van
  // de Nederlandse vlag) terug naar 'NL'. Dat is het opschrift op de herkomstknoppen en
  // tegelijk de sleutel waaronder we tellen ('#NL'), met een '#' ervoor zodat een land
  // nooit botst met een groepsnaam of een jaar.
  function landcode(vlag){
    var uit = '';
    for(var i=0; i<(vlag||'').length; i++){
      var c = vlag.codePointAt(i);
      if(c >= 0x1F1E6 && c <= 0x1F1FF){ uit += String.fromCharCode(65 + c - 0x1F1E6); i++; }
    }
    return uit;
  }

  // datum als boogje langs de onderkant van het ronde icoon, net als op desktop. Het
  // mobiele icoon is een CSS-afgerond <img> (geen SVG), dus we leggen er een absolute
  // SVG-overlay overheen; de cirkel staat op middelpunt (45,50) in de ttd1, straal ~38.
  // het brontype (data-bron: vertaald per taalbestand), recht en gecentreerd onder het
  // icoon (SVG-overlay over het ronde <img>; icoonmiddelpunt ~45,50, basislijn y=100)
  function plaatsBrontype(ttd1, type){
    if(!ttd1 || !type || ttd1.querySelector('.kaartdatum')) return;
    var NS='http://www.w3.org/2000/svg';
    var svg=document.createElementNS(NS,'svg');
    svg.setAttribute('class','kaartdatum');
    svg.setAttribute('viewBox','0 0 90 110');
    var t=document.createElementNS(NS,'text');
    t.setAttribute('x','45');
    t.setAttribute('y','100.5');
    t.setAttribute('text-anchor','middle');
    t.textContent=type;
    svg.appendChild(t);
    ttd1.appendChild(svg);
  }

  /* Dezelfde rollen als op de desktop, plus de sleutelcitaten die alleen hier bestaan.
     'bosnische' staat er bewust niet meer bij: die stemmen zijn via de landenrij te
     vinden en de groep blijft op de kaarten staan. */
  var GROEPEN = ['sleutel','all','rechters','defensie','parlementariers','deskundigen',
                 'betrokkenen','media','veteranen','tegenstemmen'];
  // een filter is een groep ('media'), een jaar ('@2015') of een land ('#BA')
  function past(k, groep){
    if(groep === 'all') return true;
    if(groep.charAt(0) === '@') return (k.datum||'').slice(0,4) === groep.slice(1);
    if(groep === '#*') return getoondeLanden.indexOf(landcode(k.vlag)) === -1;
    if(groep.charAt(0) === '#') return landcode(k.vlag) === groep.slice(1);
    if(groep.charAt(0) === '$') return k.doc === groep.slice(1);
    return k.groepen.indexOf(groep) !== -1;
  }
  var rijen = [].slice.call(tabel.rows), blokken = [], huidig = null;
  rijen.forEach(function(tr, n){
    if(tr.querySelector('.extkop')){ huidig = {kop:tr, kaarten:[]}; blokken.push(huidig); return; }
    var cel = tr.querySelector('[data-stem]');
    if(cel && huidig){
      /* het oorspronkelijke kaartnummer vasthouden: het filter hernummert wat in beeld
         staat, en de zoekfunctie moet toch het nummer uit de volledige lijst tonen */
      var sp = rijen[n-1] && rijen[n-1].querySelector('.number');
      if(sp && !sp.hasAttribute('data-nr')) sp.setAttribute('data-nr', sp.textContent.trim());
      var im = cel.querySelector('img[class*=sprite-]');
      var fk = im && (im.className||'').match(/sprite-[a-z0-9]+/);
      var vl = cel.querySelector('.kleinvlaggetje');
      huidig.kaarten.push({nummer:rijen[n-1], rij:tr, cel:cel,
                           vlag: vl ? vl.textContent.trim() : '',
                           doc: cel.getAttribute('data-doc') || '',
                           groepen:(cel.getAttribute('data-stem')||'').split(/\s+/),
                           foto: fk ? fk[0] : null,
                           datum: res(cel.getAttribute('data-datum')) || '',
                           volgorde: parseFloat(cel.getAttribute('data-volgorde')) || Infinity,
                           /* data-sorteer is de plek in de rij, data-datum is wat de kaart toont */
                           sleutel: res(cel.getAttribute('data-sorteer')) ||
                                    res(cel.getAttribute('data-datum')) || '',
                           tabel:cel.querySelector('table')});
      // brontype eenmalig onder het icoon plaatsen
      plaatsBrontype(cel.querySelector('.ttd1'), cel.getAttribute('data-bron'));
      // op mobiel geen lange kale URL in de bronregel: de hyperlink toont het
      // brontype als onderstreept label (het adres blijft in de href; kaarten
      // zonder link, met een beschrijvende bronregel, blijven onaangeraakt)
      var bronA = cel.querySelector('p.col4 a');
      if(bronA && cel.getAttribute('data-bron')) bronA.textContent = cel.getAttribute('data-bron');
    }
  });

  var aantal = {all:0};
  GROEPEN.forEach(function(g){ aantal[g]=0; });
  /* Per land het vlagteken zoals het op de kaart staat, zodat de knop straks dezelfde
     tekens draagt als de bronregel en dus dezelfde glyph uit flags-v86.woff2 pakt. */
  var vlagVan = {};
  blokken.forEach(function(b){ b.kaarten.forEach(function(k){
    aantal.all++;
    k.groepen.forEach(function(g){ if(aantal[g]!=null) aantal[g]++; });
    // per jaar meetellen voor de tijdlijn; '@' ervoor zodat een jaar nooit botst
    // met een groepsnaam
    var jr = (k.datum||'').slice(0,4);
    if(jr){ aantal['@'+jr] = (aantal['@'+jr]||0) + 1; }
    // en per land van herkomst, afgelezen aan het vlaggetje bij de bronregel
    var lc = landcode(k.vlag);
    if(lc){
      aantal['#'+lc] = (aantal['#'+lc]||0) + 1;
      if(!vlagVan[lc]) vlagVan[lc] = k.vlag;
    }
    // en per soort brondocument, met '$' ervoor als eigen naamruimte
    if(k.doc){ aantal['$'+k.doc] = (aantal['$'+k.doc]||0) + 1; }
  });});

  /* De landnamen staan als 'NL=Nederland,BA=...' op de herkomstbalk zelf, want ze zijn
     taalgebonden. Ontbreekt een land, dan blijft de code zelf de naam. */
  /* Welke landen een eigen knop krijgen; de rest gaat samen in een restknop. */
  var getoondeLanden = (vlagBar ? (vlagBar.getAttribute('data-tonen')||'') : '')
                         .split(',').map(function(x){ return x.trim(); })
                         .filter(function(x){ return x; });
  var landNaam = {}, landKort = {};
  if(vlagBar){
    [['data-landen', landNaam], ['data-kort', landKort]].forEach(function(pl){
      (vlagBar.getAttribute(pl[0])||'').split(',').forEach(function(paar){
        var d = paar.indexOf('=');
        if(d > 0){ pl[1][paar.slice(0,d).trim()] = paar.slice(d+1).trim(); }
      });
    });
  }

  /* Het opschrift van een filter: een groep leest zijn naam van de balk, een jaar
     gebruikt het sjabloon met {j}, een land geeft zijn volle naam en niet de twee
     letters die op de knop staan. */
  function opschriftVan(groep){
    if(groep.charAt(0) === '@'){
      return (bar.getAttribute('data-jaar') || 'Jaar {j}').replace('{j}', groep.slice(1));
    }
    if(groep === '#*'){
      return ((vlagBar && vlagBar.getAttribute('data-overig')) || '{n}')
               .replace('{n}', aantal['#*'] || 0);
    }
    if(groep.charAt(0) === '#'){ return landNaam[groep.slice(1)] || groep.slice(1); }
    if(groep.charAt(0) === '$'){
      return (bronBar && bronBar.getAttribute('data-'+groep.slice(1))) || groep.slice(1);
    }
    return bar.getAttribute('data-'+groep) || groep;
  }

  /* Er is steeds één filter actief, verdeeld over drie balken. Deze zet er één aan en
     laat de rest los, waar hij ook staat. */
  /* Haak voor de kopregel: na elke keuze bepalen welke rij open hoort te staan. */
  var naKeuze = null;
  function alleenAan(knop){
    ['#stemKop','#stemFilter','#stemVlaggen','#stemBronnen','#stemTijdlijn'].forEach(function(sel){
      /* De schakelaars zelf overslaan: die klappen een rij open en zijn geen keuze. */
      document.querySelectorAll(sel+' button:not(.paneel-knop)').forEach(function(x){
        x.setAttribute('aria-pressed', x===knop ? 'true' : 'false');
      });
    });
    if(naKeuze){ naKeuze(); }
  }

  /* De zeventien sectiekoppen vertellen het verhaal op volgorde. Elk filter snijdt
     daar dwars doorheen, en dan slaat een kop niet meer op wat eronder staat. Wat bij
     de sleutelcitaten al gold, geldt dus voor elk filter: de sectiekoppen gaan weg en
     er komt een enkele kop met de naam van het filter. Die kop is een kopie van een
     sectiekop, zodat de opmaak gelijk is; de tekst eronder staat als data-attribuut
     op de balk, want die verschilt per taal. */
  var filterRij = (blokken[0] && blokken[0].kop) ? blokken[0].kop.cloneNode(true) : null;
  var kopSjabloon = bar.getAttribute('data-kop') || '';
  // de sleutelcitaten zijn een curatie, geen tijdlijn: aparte subkop zonder 'chronologisch'
  var kopSleutel = bar.getAttribute('data-kopsleutel') || kopSjabloon;

  /* Bij een filter staan de citaten op datum en niet langer in de verhaalvolgorde van
     de secties. De lijst is plat, dus dat betekent de rijen echt verplaatsen; bij
     'alle citaten' gaat de oorspronkelijke volgorde weer terug. Elke kaart is twee
     rijen: een nummerrij en een inhoudsrij, die samen moeten blijven.
     De datums staan als JJJJ-MM-DD op de cel, of korter waar de bron niet meer
     prijsgaf; als tekst vergelijken zet zo'n kort jaartal vooraan in zijn jaar. */
  var romp = tabel.tBodies[0] || tabel;
  var origVolgorde = [].slice.call(romp.rows);
  function opDatum(a, b){
    if(!a.sleutel && !b.sleutel) return 0;
    if(!a.sleutel) return 1;
    if(!b.sleutel) return -1;
    if(a.sleutel !== b.sleutel) return a.sleutel < b.sleutel ? -1 : 1;
    // Op dezelfde dag beslist data-volgorde: 1 gaat voor 2, en een kaart zonder dat
    // cijfer komt achteraan. Verder blijft de volgorde die van de pagina, want
    // sorteren is stabiel.
    if(a.volgorde !== b.volgorde) return a.volgorde < b.volgorde ? -1 : 1;
    return 0;
  }

  var actief = 'sleutel';

  /* Het nummerbolletje van een kaart bijwerken. Staat apart omdat er pas genummerd
     kan worden nadat de volgorde vaststaat: bij een filter is dat de datumvolgorde. */
  function nummer(k, n){
    var t = k.nummer.querySelector('.number'), c = k.nummer.querySelector('circle');
    if(t){ t.textContent = n; }
    if(c){
      /* Drie cijfers vragen een ruimere cirkel. Die groeit naar rechts en staat
         een fractie lager, zodat hij niet uit de lijn van de andere bolletjes
         springt; het cijfer schuift mee en blijft in het hart staan. */
      var drie = n >= 100;
      var r  = n < 10 ? 10 : (drie ? 13.25 : 11);
      var cx = n < 10 ? 44.5 : (drie ? 47.25 : 45);
      var cy = drie ? 48 : (n < 10 ? 46.5 : 46.7);
      c.setAttribute('r', r); c.setAttribute('cx', cx); c.setAttribute('cy', cy);
      if(t){
        /* De 1 is smaller dan de andere cijfers, dus een getal staat optisch niet
           in het hart zodra er een in voorkomt. Waar hij staat bepaalt de kant:
           vooraan (10 t/m 19, en de 100) trekt het getal naar rechts en moet het
           dus naar links; achteraan (11, 21 ... 91) juist andersom. Elf eindigt
           op een 1 en telt daarom bij die tweede groep, niet bij de eerste.
           Positief is naar links, negatief naar rechts. */
        var scheef;
        if (n >= 11 && n <= 91 && n % 10 === 1) { scheef = -0.5; }
        else if (n >= 10 && n <= 19)            { scheef = 0.8; }
        else if (drie)                          { scheef = 0.5; }
        else                                    { scheef = 0; }
        t.setAttribute('x', cx - scheef);
        t.setAttribute('y', drie ? 52.8 : 52);
        t.style.fontSize = drie ? '13px' : '';   /* drie cijfers net iets kleiner */
      }
    }
    /* om en om licht en donker, ook na het filteren */
    if(k.tabel) k.tabel.className = (n % 2) ? 'tablelight' : 'tabledark';
  }

  /* Meelopende knop: op een telefoon scrol je lang, en dan is de filterbalk snel uit
     beeld. Eén knop schuift daarom mee. Hij zegt welk filter aanstaat en brengt je bij
     een tik terug naar de bediening. Het meelopen doet position:sticky; geen
     scroll-listener, IntersectionObserver of requestAnimationFrame, want die staan stil
     in een verborgen of geminimaliseerd venster. */
  var mini = document.createElement('div');
  mini.className = 'ddg-mini';
  /* Eén knop, over de volle breedte van de baan: hij zegt welk filter aanstaat en brengt
     je bij een tik terug naar de bediening. Er stonden links en rechts stapknoppen naast
     die een filter terug of verder gingen; die zijn er in september 2026 af gehaald, want
     twee chevrons op een balk vragen om uitleg die er niet bij past. */
  var miniNu = document.createElement('button');
  miniNu.type = 'button';
  miniNu.className = 'mini-nu';
  mini.appendChild(miniNu);
  /* De knop hangt in een vakje van nul pixels hoog. Dat vakje doet het meelopen
     (position:sticky) en houdt zelf geen ruimte bezet, zodat er onder de filterbalk
     geen bar meer staat te wachten: de knop zit dan boven de rand van het scherm,
     achter de vaste balk met de domeinnaam, en rolt daar pas onderuit zodra de kop van
     de lijst voorbij gescrold is. */
  var miniVak = document.createElement('div');
  miniVak.className = 'ddg-minivak';
  miniVak.appendChild(mini);
  // ná de jaarselectiebalk, zodat de volgorde spreker → jaar → meelopende knop is
  var tlEl = document.getElementById('stemTijdlijn');
  var ankerEl = tlEl || bar;
  ankerEl.parentNode.insertBefore(miniVak, ankerEl.nextSibling);

  /* Wanneer de knop uitrolt: zodra de kopregel van de lijst — de kop met de subkop —
     onder de vaste balk (40px) door is verdwenen. Zolang die kop in beeld staat, staat de
     bediening zelf nog dichtbij en heeft een tweede balk geen zin.
     Het meelopen zelf blijft van position:sticky, want dat moet ook werken in een venster
     dat verborgen of geminimaliseerd is; alleen het uitrollen hangt aan de scrollstand, en
     dat hoeft niet bij te blijven in een venster waar toch niemand scrolt. Eén rechthoek
     per scrollstap, en classList.toggle met dezelfde stand verandert niets, dus de browser
     hoeft er geen stijl voor opnieuw te bepalen. */
  var kopRij = null;
  var vasteBalk = document.querySelector('.header');
  function kijkKop(){
    if(!kopRij) return;
    var uit = kopRij.getBoundingClientRect().bottom <= 40;
    /* En weg zodra de lijst zelf voorbij is. De baan hoort bij de citaten en niet bij de
       secties eronder, en de cel waarin hij meeloopt eindigt net ná het anker van de
       synopsis: sprong je via het menu daarheen, dan bleef hij over die sectiekop hangen. */
    if(uit && lijst){ uit = lijst.getBoundingClientRect().bottom > 40; }
    mini.classList.toggle('uitgerold', uit);
    /* De twee banen sluiten op elkaar aan; de schaduw hoort dan onder de onderste en niet
       ertussen. Zie .header.doorlopend in de stylesheet. */
    if(vasteBalk){ vasteBalk.classList.toggle('doorlopend', uit); }
  }
  function volgKop(){
    /* Bij een filter staat er een eigen kopregel boven de lijst, bij 'alle citaten' de
       eerste sectiekop. De ander is dan verborgen en zou als nulhoog vakje altijd melden
       dat hij uit beeld is. */
    kopRij = (filterRij && filterRij.parentNode) ? filterRij : (blokken[0] && blokken[0].kop);
    kijkKop();
  }
  window.addEventListener('scroll', kijkKop, {passive:true});
  window.addEventListener('resize', kijkKop);
  /* Landen op de filterbalk, net onder de header. De headerhoogte meten we op het moment
     zelf, want die verschilt per schermbreedte. */
  function naarBalk(){
    var hdr = document.querySelector('.header');
    var hoog = hdr ? Math.round(hdr.getBoundingClientRect().height) : 0;
    var off = (window.pageYOffset || document.documentElement.scrollTop);
    /* Naar de kopregel en niet naar de sprekerbalk: die laatste klapt open en dicht, en
       een verborgen element heeft geen plek op de pagina. */
    var anker = (kopBar && kopBar.querySelector('button')) ? kopBar : bar;
    var y = Math.max(0, Math.round(anker.getBoundingClientRect().top + off - hoog - 8));
    // Oudere Safari kent het optie-object van scrollTo niet en leest het als
    // scrollTo(undefined, undefined): je belandt dan boven aan de pagina. Alleen de
    // vloeiende variant gebruiken als de browser scroll-behavior echt kent.
    if('scrollBehavior' in document.documentElement.style){
      window.scrollTo({ top:y, behavior:'smooth' });
    } else {
      window.scrollTo(0, y);
    }
  }
  miniNu.addEventListener('click', naarBalk);

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
    alleFilterKnoppen().forEach(function(x){ if(x.sleutel === start){ raak = x; } });
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
    /* Klikt iemand door voordat de vorige overgang klaar is, dan breekt de browser die af en
       wijst hij de beloftes van die overgang af. Wij wachten er niet op — het werk is in
       doe() al gedaan — maar zonder vangnet belandt zo'n afwijzing als fout in de console. */
    if(vt){
      if(vt.ready && vt.ready.catch){ vt.ready.catch(function(){}); }
      if(vt.finished && vt.finished.catch){ vt.finished.catch(function(){}); }
    }
    setTimeout(doe, 250);
  }

  /* Alle filterknoppen op een rij, in de volgorde van de balken op het scherm. Een
     meegestuurde stand (?filter=land-BA) zoekt hierin zijn knop op. */
  function alleFilterKnoppen(){
    return kopKnoppen.concat(groepKnoppen, jaarKnoppen, vlagKnoppen, docKnoppen);
  }

  function toon(groep){
    var fotos = {};
    actief = groep;
    /* De meelopende knop toont de actieve stand en staat er meteen, ook bij het laden:
       op mobiel begin je in de sleutelcitaten, dus er staat vanaf het begin een filter
       aan en de knop heeft iets te melden. Op de desktop wacht hij wel op een keuze. */
    var naam = opschriftVan(groep);
    var miniSjabloon = bar.getAttribute('data-mini') || '{x} {n}/{t}';
    /* Het scheidingsbolletje in een eigen span, zodat m/stylesheet-v86.css het een tikje
       groter kan zetten dan de tekst eromheen: op de maat van de knop is een middenpunt
       anders zo klein dat het bijna een spatie lijkt. Het taalbestand houdt gewoon zijn
       &middot; in data-mini; hier wordt de tekst er alleen omheen gesplitst. Staat er geen
       bolletje in het sjabloon, dan blijft het bij platte tekst. */
    var miniTekst = miniSjabloon.replace('{x}', naam)
                                .replace('{n}', aantal[groep])
                                .replace('{t}', aantal.all);
    /* Het hele opschrift in één omhulsel en niet los in de knop: de knop is een flexvak
       (dat centreert de tekst in zijn 24px) en dan wordt elk stuk tekst een eigen vakje met
       een eigen uitlijning. Het bolletje kwam daardoor los van de basislijn van de woorden
       ernaast en zakte weg. Binnen dit ene omhulsel staat alles weer op één regel. */
    var miniDeel = miniTekst.split('\u00B7');
    var miniWikkel = document.createElement('span');
    miniWikkel.className = 'mini-tekst';
    if (miniDeel.length === 2) {
      miniWikkel.appendChild(document.createTextNode(miniDeel[0]));
      var miniPunt = document.createElement('span');
      miniPunt.className = 'mini-punt';
      miniPunt.textContent = '\u00B7';
      miniWikkel.appendChild(miniPunt);
      miniWikkel.appendChild(document.createTextNode(miniDeel[1]));
    } else {
      miniWikkel.textContent = miniTekst;
    }
    miniNu.textContent = '';
    miniNu.appendChild(miniWikkel);
    mini.classList.add('zicht');
    var koppen = (groep === 'all');
    /* 1. bepalen wat er in beeld komt */
    var inBeeld = [];
    blokken.forEach(function(b){
      var zichtbaar = 0;
      b.kaarten.forEach(function(k){
        var aan = past(k, groep);
        k.nummer.style.display = aan ? '' : 'none';
        k.rij.style.display = aan ? '' : 'none';
        if(aan){ zichtbaar++; inBeeld.push(k); if(k.foto) fotos[k.foto] = true; }
      });
      b.kop.style.display = (koppen && zichtbaar) ? '' : 'none';
    });
    /* 2. de volgorde zetten: de gewone filters op datum; 'alle citaten' en de
       sleutelcitaten in de oorspronkelijke verhaalvolgorde (de sleutel is een
       curatie, geen tijdlijn) */
    if(groep === 'all' || groep === 'sleutel'){
      origVolgorde.forEach(function(tr){ romp.appendChild(tr); });
    } else {
      inBeeld.sort(opDatum);
      inBeeld.forEach(function(k){ romp.appendChild(k.nummer); romp.appendChild(k.rij); });
    }
    /* 3. hernummeren in de volgorde waarin ze nu werkelijk staan */
    inBeeld.forEach(function(k, i){ nummer(k, i + 1); });
    /* 3b. de afsluitende kaart krijgt sterk afgeronde onderhoeken (spiegel van de ronde
       bovenkant van de kopbalk): in 'alle citaten' de laatste kaart van elke sectie,
       in een filter de laatste kaart van de lijst. nummer() heeft className net
       herschreven, dus 'sectie-onder' zetten we daarná. */
    if(groep === 'all'){
      blokken.forEach(function(b){
        var laatste = b.kaarten[b.kaarten.length - 1];
        if(laatste && laatste.tabel) laatste.tabel.classList.add('sectie-onder');
      });
    } else if(inBeeld.length){
      var slot = inBeeld[inBeeld.length - 1];
      if(slot.tabel) slot.tabel.classList.add('sectie-onder');
    }
    if(filterRij){
      if(filterRij.parentNode){ filterRij.parentNode.removeChild(filterRij); }
      if(groep !== 'all' && blokken[0] && blokken[0].kop && blokken[0].kop.parentNode){
        var fh = filterRij.querySelector('.extkop'), fs = filterRij.querySelector('.extsub');
        if(fh){
          var opschrift = opschriftVan(groep);
          /* Een landnaam als kop zou lezen als 'stemmen uit Bosnie'; het gaat om de
             herkomst van de bron, en dat zegt het sjabloon erbij. */
          var kopVlag = vlagBar && vlagBar.getAttribute('data-kopvlag');
          if(groep.charAt(0)==='#' && kopVlag){ opschrift = kopVlag.replace('{x}', opschrift); }
          fh.textContent = opschrift;
        }
        if(fs){ var sj = (groep==='sleutel') ? kopSleutel
                        : ((aantal[groep]===1 && bar.getAttribute('data-kop1')) ? bar.getAttribute('data-kop1') : kopSjabloon);
                fs.textContent = sj.replace('{n}', aantal[groep]).replace('{t}', aantal.all); }
        filterRij.style.display = '';
        blokken[0].kop.parentNode.insertBefore(filterRij, blokken[0].kop);
      }
    }
    /* Bij de sleutelcitaten ontbreekt kaart 1 met de beoordeling &ldquo;sterk karakter&rdquo;,
       waardoor de verwijzing daarnaar in de lucht zou hangen. In elke andere weergave
       staat die kaart er wel en blijft de zin gewoon staan. */
    [].slice.call(lijst.querySelectorAll('.nietbijsleutel')).forEach(function(el){
      el.style.display = (groep === 'sleutel') ? 'none' : '';
    });
    /* De fotocredits in de voettekst volgen het filter: een credit hoort er alleen
       te staan als de foto waar hij bij hoort ook in beeld is. Een credit die drie
       Europarlementariers noemt telt mee zodra een van de drie te zien is; die drie
       dragen dezelfde groep en komen dus altijd samen. */
    [].slice.call(document.querySelectorAll('.fotocredit')).forEach(function(c){
      var bij = (c.getAttribute('data-foto')||'').split(/\s+/);
      c.style.display = bij.some(function(f){ return fotos[f]; }) ? '' : 'none';
    });
    /* De kopregel boven de lijst is een andere geworden; de meelopende knop kijkt naar
       die rij om te weten wanneer hij mag uitrollen. */
    volgKop();
  }

  /* De sleutelcitaten staan vooraan: dat is op een telefoon de ingang, en het is
     ook de stand waarin de pagina opent. */
  /* De volgorde waarin de stapknoppen door de filters lopen: eerst de sprekergroepen in
     de volgorde van de balk, en apart daarvan de jaren van de tijdlijn. */
  var kopKnoppen = [], groepKnoppen = [], vlagKnoppen = [], docKnoppen = [], jaarKnoppen = [];
  GROEPEN.forEach(function(g){
    if(!aantal[g]) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', g === 'sleutel' ? 'true' : 'false');
    b.setAttribute('data-groep', g);   /* zodat de zoekfunctie de knop kan aanwijzen */
    /* De twee knoppen in de kopregel krijgen hun opschrift in een omhulsel, net als de
       schakelaars ernaast: dan zakt het samen met de telling en staan ze op dezelfde
       basislijn. Een kale tekstknoop is niet te verschuiven en zou achterblijven. */
    var inKop = (kopBar && (g === 'sleutel' || g === 'all'));
    if(inKop){
      var op = document.createElement('span');
      op.className = 'paneel-tekst';
      op.textContent = bar.getAttribute('data-'+g) || g;
      b.appendChild(op);
    } else {
      b.appendChild(document.createTextNode((bar.getAttribute('data-'+g)||g) + ' '));
    }
    var telling = document.createElement('span');
    telling.className = 'mf-count'; telling.textContent = aantal[g];
    b.appendChild(telling);
    b.appendChild(document.createTextNode(' '));
    var stip = document.createElement('span');
    stip.className = 'mf-dot'; stip.setAttribute('aria-hidden','true');
    b.appendChild(stip);
    /* Tooltip uit de taalpagina: 'all' krijgt zijn eigen zin, de rest het sjabloon met
       het opschrift erin. Staat het sjabloon er niet, dan blijft de knop zonder tooltip. */
    var tipSjabloon = bar.getAttribute(g === 'all' ? 'data-tipall' : 'data-tip');
    if(tipSjabloon){
      b.title = tipSjabloon.replace('{x}', bar.getAttribute('data-'+g) || g).replace('{n}', aantal[g]);
    }
    /* De sleutelcitaten en 'alle citaten' horen bij de kopregel: die twee blijven altijd
       in beeld, de rollen zitten in een rij die open- en dichtklapt. Ze lopen ook in de
       stapreeks vooraan mee, los van de rollen. */
    (inKop ? kopKnoppen : groepKnoppen).push({ sleutel: g, knop: b });
    b.addEventListener('click', function(){ metOvergang(function(){ alleenAan(b); toon(g); }); });
    (inKop ? kopBar : bar).appendChild(b);
  });

  /* De herkomstbalk. Op een telefoon niet alle veertien landen maar de handvol dat meer
     dan één citaat levert; welke dat zijn staat als data-tonen op de balk, zodat de keuze
     in de taalbestanden ligt en niet hier. De andere landen blijven bereikbaar via 'alle
     citaten'. Er is bewust geen eigen 'alles'-knop: die staat in de balk erboven en zet
     ook deze balk weer uit, want alle drie de balken delen één selectie. */
  if(vlagBar){
    var tipVlag  = vlagBar.getAttribute('data-tipvlag') || '';
    var tipVlag1 = vlagBar.getAttribute('data-tipvlag1') || tipVlag;
    (vlagBar.getAttribute('data-tonen') || '').split(',')
      .map(function(x){ return x.trim(); })
      .filter(function(lc){ return lc && aantal['#'+lc]; })
      .forEach(function(lc){
        var n = aantal['#'+lc], naam = landNaam[lc] || lc;
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-pressed','false');
        // twee letters zeggen een schermlezer niets; die krijgt de volle landnaam
        b.setAttribute('aria-label', naam);
        var vv = document.createElement('span');
        vv.className = 'vlag'; vv.textContent = vlagVan[lc];
        b.appendChild(vv);
        var op = document.createElement('span');
        op.className = 'landcode'; op.textContent = landKort[lc] || lc;
        b.appendChild(op);
        /* Sinds de rij achter een schakelaar zit is er ruimte voor de telling, net als
           op de desktop: je ziet dan vooraf wat een tik oplevert. */
        var telling = document.createElement('span');
        telling.className = 'mf-count'; telling.textContent = n;
        b.appendChild(telling);
        var stip = document.createElement('span');
        stip.className = 'mf-dot'; stip.setAttribute('aria-hidden','true');
        b.appendChild(stip);
        b.title = (n === 1 ? tipVlag1 : tipVlag).replace('{x}', naam).replace('{n}', n);
        vlagKnoppen.push({ sleutel: '#'+lc, knop: b });
        b.addEventListener('click', function(){ metOvergang(function(){ alleenAan(b); toon('#'+lc); }); });
        vlagBar.appendChild(b);
      });
    /* En de landen zonder eigen knop samen in een restknop. */
    aantal['#*'] = Object.keys(aantal).filter(function(k){
      return k.charAt(0) === '#' && k !== '#*' && getoondeLanden.indexOf(k.slice(1)) === -1;
    }).reduce(function(som,k){ return som + aantal[k]; }, 0);
    if(aantal['#*']){
      var rb = document.createElement('button');
      rb.type = 'button';
      // eigen klasse: hij hoort niet in het raster van de vlagknoppen, hij vult de rest
      rb.className = 'landrest';
      rb.setAttribute('aria-pressed','false');
      var rt = document.createElement('span');
      rt.className = 'landcode'; rt.textContent = opschriftVan('#*');
      rb.appendChild(rt);
      var rtel = document.createElement('span');
      rtel.className = 'mf-count'; rtel.textContent = aantal['#*'];
      rb.appendChild(rtel);
      var rstip = document.createElement('span');
      rstip.className = 'mf-dot'; rstip.setAttribute('aria-hidden','true');
      rb.appendChild(rstip);
      vlagKnoppen.push({ sleutel: '#*', knop: rb });
      rb.addEventListener('click', function(){ metOvergang(function(){ alleenAan(rb); toon('#*'); }); });
      vlagBar.appendChild(rb);
    }
  }

  /* De brondocumenten, in dezelfde zeven groepen als op de desktop. */
  var DOCGROEPEN = ['gerecht','officieel','email','verklaring','publicatie','recensie','sociaal'];
  if(bronBar){
    DOCGROEPEN.forEach(function(d){
      if(!aantal['$'+d]) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed','false');
      b.appendChild(document.createTextNode((bronBar.getAttribute('data-'+d) || d) + ' '));
      var telling = document.createElement('span');
      telling.className = 'mf-count'; telling.textContent = aantal['$'+d];
      b.appendChild(telling);
      b.appendChild(document.createTextNode(' '));
      var stip = document.createElement('span');
      stip.className = 'mf-dot'; stip.setAttribute('aria-hidden','true');
      b.appendChild(stip);
      var tipS = bar.getAttribute('data-tip');
      if(tipS){ b.title = tipS.replace('{x}', bronBar.getAttribute('data-'+d) || d)
                             .replace('{n}', aantal['$'+d]); }
      docKnoppen.push({ sleutel: '$'+d, knop: b });
      b.addEventListener('click', function(){ metOvergang(function(){ alleenAan(b); toon('$'+d); }); });
      bronBar.appendChild(b);
    });
  }

  /* De knoppenregels uitvullen. De knoppen wisselen sterk in tekstlengte, en dan
     eindigt elke regel op een andere plek en oogt de balk rafelig. Per regel wordt de
     overgebleven ruimte gelijk over de knoppen verdeeld, links en rechts evenveel.
     De slotregel wordt niet uitgevuld — die is bijna nooit vol — maar krijgt wel de
     padding van de regel erboven, want knoppen met even lange tekst horen even breed
     te zijn, ongeacht op welke regel ze staan. */
  /* ookEenRegel: staan alle knoppen op één regel, vul die dan toch uit. Dat is de
     herkomstbalk: vijf knoppen van bijna gelijke breedte laten anders een gat rechts
     open, terwijl de regels van de sprekerbalk erboven wel tot in de kantlijn lopen. */
  function vulRegelsUit(balk, ookEenRegel, grens, sel){
    if(!balk) return;
    var alle = [].slice.call(balk.querySelectorAll(sel || 'button'));
    if(!alle.length) return;
    alle.forEach(function(b){ b.style.paddingLeft=''; b.style.paddingRight=''; });
    /* Alleen meten wat in beeld staat: sinds de rijen achter een schakelaar zitten,
       staan er ook dichtgeklapte knoppen in een balk, en die zouden met hun breedte
       van nul de regelindeling in de war sturen. */
    var knoppen = alle.filter(function(b){ return b.offsetParent; });
    if(!knoppen.length) return;
    var rijen=[], rij=[], vorige=null;
    knoppen.forEach(function(b){
      var top = Math.round(b.offsetTop);
      if(vorige !== null && top !== vorige){ rijen.push(rij); rij=[]; }
      rij.push(b); vorige = top;
    });
    if(rij.length) rijen.push(rij);
    if(rijen.length < 2 && !ookEenRegel) return;
    var stijl = getComputedStyle(balk);
    var gat = parseFloat(stijl.columnGap || stijl.gap) || 0;
    var binnen = balk.clientWidth - parseFloat(stijl.paddingLeft) - parseFloat(stijl.paddingRight);
    rijen.forEach(function(r, i){
      /* Ook een slotregel met één knop vullen we uit: een blok waarvan drie regels tot in
         de kantlijn lopen en de vierde halverwege ophoudt, oogt onaf. Die ene knop wordt
         dan breed, maar hij sluit het blok wel netjes af. */
      var som = 0;
      r.forEach(function(b){ som += b.getBoundingClientRect().width; });
      var over = binnen - som - gat*(r.length-1);
      if(over < 2) return;
      // een pixel marge laten staan, anders duwt afronding de laatste knop een regel omlaag
      /* De ruimte gaat naar de binnenranden en niet naar de buitenste: de eerste knop van
         een regel houdt links zijn gewone opvulling en de laatste rechts. Anders krijgt elke
         regel een andere inspringing — de kopregel heeft twee knoppen op de eerste regel en
         drie op de tweede, dus daar hield de tweede regel meer over — en begint de tekst in
         Sleutelcitaten op een andere kantlijn dan die in Spreker. Er zijn zo twee vakken
         minder om over te verdelen; een eenzame knop heeft geen binnenrand en houdt de
         oude verdeling over twee kanten. */
      var vakken = r.length > 1 ? (r.length*2 - 2) : 2;
      var erbij = Math.floor(((over-1)/vakken)*100)/100;
      /* De grens hieronder is een maat voor hoe ver een knop wordt opgerekt, en die maat
         verandert niet met de manier van verdelen: hij blijft dus op de oude rekensom. */
      var breedteToename = Math.floor(((over-1)/(r.length*2))*100)/100;
      /* Op een telefoon staan er soms maar twee knoppen op een regel, en dan zou het
         uitvullen ze tot banners oprekken: tientallen pixels padding om een woord van tien
         letters. Boven een bescheiden grens laten we de regel dus links staan; een rafelige
         rechterkant is daar het kleinere kwaad. */
      // een eenzame knop mag zover uitrekken als nodig; bij twee of meer houdt de grens
      if(r.length > 1 && breedteToename > (grens || 30)) return;
      var terug = r.map(function(b){ return [b.style.paddingLeft, b.style.paddingRight]; });
      r.forEach(function(b, j){
        /* Links en rechts apart uitlezen: sinds de knoppen links een halve pixel meer
           opvulling hebben dan rechts, zou één maat voor allebei er per knop een halve
           pixel bij optellen — en dan past de regel niet meer, valt hij om en draait de
           controle hieronder het hele uitvullen weer terug. */
        var cs = getComputedStyle(b);
        var pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
        var buitenLinks = (r.length > 1 && j === 0);
        var buitenRechts = (r.length > 1 && j === r.length-1);
        b.style.paddingLeft = (buitenLinks ? pl : pl+erbij)+'px';
        b.style.paddingRight = (buitenRechts ? pr : pr+erbij)+'px';
      });
      /* Duwt de afronding er toch een knop uit, dan draaien we deze regel terug: een
         eenzame knop op een eigen regel oogt slechter dan een iets krappere regel. */
      if(telRijen(knoppen) > rijen.length){
        r.forEach(function(b,j){
          b.style.paddingLeft = terug[j][0];
          b.style.paddingRight = terug[j][1];
        });
      }
    });
  }
  /* Knoppen van gelijke breedte, een vast aantal per regel. De sprekersrij gebruikt dit:
     acht knoppen in twee kolommen leest rustiger dan vier regels van wisselende lengte.
     Hoeveel er op een regel staan zegt data-perrij op de balk; daaruit volgt de breedte,
     zodat de regel precies vol is. Past dat aantal niet, dan zakt het tot het wel kan. */
  function gelijkeBreedte(balk, perRij, sel){
    if(!balk || !perRij) return;
    var knoppen = [].slice.call(balk.querySelectorAll(sel || 'button'));
    if(!knoppen.length) return;
    knoppen.forEach(function(b){ b.style.width=''; b.style.paddingLeft=''; b.style.paddingRight=''; });
    var inBeeld = knoppen.filter(function(b){ return b.offsetParent; });
    if(!inBeeld.length) return;
    var breedste = 0;
    inBeeld.forEach(function(b){
      var w = b.getBoundingClientRect().width;
      if(w > breedste) breedste = w;
    });
    var stijl = getComputedStyle(balk);
    var gat = parseFloat(stijl.columnGap || stijl.gap) || 0;
    var binnen = balk.clientWidth - parseFloat(stijl.paddingLeft) - parseFloat(stijl.paddingRight);
    var n = Math.min(perRij, knoppen.length), breed = 0;
    while(n > 1){
      breed = (binnen - gat*(n-1) - 1)/n;
      if(breed >= breedste) break;
      n--;
    }
    if(n < 2 || breed < breedste) return;
    breed = Math.floor(breed*100)/100;
    knoppen.forEach(function(b){ b.style.width = breed+'px'; });
    /* Controleren of het ook echt zo valt; bij een andere afronding halen we er nog een
       pixel af en kijken opnieuw. */
    for(var poging=0; poging<3; poging++){
      var eerste=0, top=Math.round(inBeeld[0].offsetTop);
      inBeeld.forEach(function(b){ if(Math.round(b.offsetTop)===top) eerste++; });
      if(eerste >= n || inBeeld.length < n) break;
      breed = Math.floor((breed-1)*100)/100;
      if(breed < breedste) break;
      knoppen.forEach(function(b){ b.style.width = breed+'px'; });
    }
    return { breed: breed, perRij: n, gat: gat, binnen: binnen, aantal: knoppen.length };
  }

  function telRijen(knoppen){
    var gezien={}, n=0;
    knoppen.forEach(function(b){
      var t = Math.round(b.offsetTop);
      if(!(t in gezien)){ gezien[t]=1; n++; }
    });
    return n;
  }
  /* De kopregel is een raster van twee gelijke helften: het opschrift en de pil met de
     huidige keuze boven, de schakelaar en 'alle citaten' eronder. Flexbox alleen kreeg dat
     niet gelijk — de pil naast het opschrift hield meer dan zijn helft, ook met een
     flex-basis van nul — dus de helften worden hier gemeten en vastgezet. Past de breedste
     pil niet in een halve regel, dan laten we de verdeling toch aan flexbox over: liever
     drie ongelijke pillen dan een opschrift dat uit zijn pil loopt. */
  function meetKopregel(){
    if(!kopBar) return;
    var pillen = [].slice.call(kopBar.querySelectorAll(':scope > button'));
    if(!pillen.length) return;
    var opschrift = kopBar.querySelector('.kies-label');
    var st = getComputedStyle(kopBar);
    var gat = parseFloat(st.columnGap || st.gap) || 0;
    var binnen = kopBar.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
    /* Een pixel eraf, anders duwt het afronden de tweede pil naar een eigen regel. */
    var breed = Math.floor(((binnen - gat - 1) / 2) * 100) / 100;
    /* De pillen even los van hun flexverdeling om hun eigen breedte te kunnen meten. */
    pillen.forEach(function(b){ b.style.flex = 'none'; b.style.width = 'max-content'; });
    var breedste = 0;
    pillen.forEach(function(b){
      var w = b.getBoundingClientRect().width;
      if(w > breedste) breedste = w;
    });
    var vast = (breed >= breedste) ? ('0 0 ' + breed + 'px') : '';
    pillen.forEach(function(b){ b.style.width = ''; b.style.flex = vast; });
    if(opschrift){ opschrift.style.flex = vast; }
  }
  function vulBalkenUit(){
    meetKopregel();
    meetOverig();
    /* Alleen het blokje schakelaars krijgt ronde buitenhoeken, zodat die drie samen als
       één ding lezen; de pillen in de kopregel staan los en zijn rondom rond. hoekenBij
       bepaalt zelf welke knop op welke hoek staat, dus het blijft kloppen als een taal de
       regels anders laat vallen. */
    hoekenBij(kopBar, '.kop-overig button');
    if(typeof openPaneel !== 'undefined' && openPaneel){ meetPaneel(openPaneel); }
    else { vulRegelsUit(bar); }
    bouwMediaSchakelaar();
    meetMedia();
  }
  vulBalkenUit();
  /* De mediafilter bouwt zijn knoppen vanuit een inline script dat op DOMContentLoaded
     draait; dit bestand staat met defer in de head en is dus eerder klaar. Daarom nog
     een ronde zodra die knoppen bestaan. Webletters die later binnenkomen veranderen
     de tekstbreedtes, vandaar ook de fonts-haak. */
  document.addEventListener('DOMContentLoaded', vulBalkenUit);
  window.addEventListener('resize', vulBalkenUit);
  if(document.fonts && document.fonts.ready && document.fonts.ready.then){
    document.fonts.ready.then(vulBalkenUit);
  }

  /* Jaarselectie: op een telefoon geen staafdiagram maar gewone filterpillen, vijf op een
     regel, met het jaartal, de telling en het bolletje — precies de vorm van de spreker- en
     landenrijen erboven. De staafjes stonden er mooi, maar op deze breedte werden ze zestien
     pixels smal en moesten ze het hebben van rechtopstaande cijfers, schuine streepjes naar
     drie ijkjaren en een asonderbreking voor de stille jaren: veel tekens om te ontcijferen
     op een klein scherm, en trefvlakken van zestien pixels breed. De stilte tussen 2000 en
     2014 is hier daardoor niet meer af te lezen; die blijft op de desktop staan, waar de
     balk er de ruimte voor heeft. */
  var tijdlijn = document.getElementById('stemTijdlijn');
  if(tijdlijn){
    var jaren = Object.keys(aantal).filter(function(k){ return k.charAt(0)==='@'; })
                      .map(function(k){ return parseInt(k.slice(1),10); })
                      .sort(function(a,b){ return a-b; });
    var jaarSjabloon = tijdlijn.getAttribute('data-titel') || '{n}';
    // Eén citaat vraagt om enkelvoud; staat die variant er niet, dan blijft het meervoud.
    var jaarSjabloonEen = tijdlijn.getAttribute('data-titel1') || jaarSjabloon;
    jaren.forEach(function(jr){
      var n = aantal['@' + jr];
      if(!n) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.title = (n === 1 ? jaarSjabloonEen : jaarSjabloon).replace('{j}', jr).replace('{n}', n);
      b.setAttribute('aria-label', b.title);
      b.appendChild(document.createTextNode(jr + ' '));
      var telling = document.createElement('span');
      telling.className = 'mf-count';
      telling.textContent = n;
      b.appendChild(telling);
      b.appendChild(document.createTextNode(' '));
      var stip = document.createElement('span');
      stip.className = 'mf-dot';
      stip.setAttribute('aria-hidden', 'true');
      b.appendChild(stip);
      jaarKnoppen.push({ sleutel: '@' + jr, knop: b });
      b.addEventListener('click', function(){
        metOvergang(function(){ alleenAan(b); toon('@' + jr); });
      });
      tijdlijn.appendChild(b);
    });
  }

  /* Vier rijen achter vier schakelaars in de kopregel, waarvan er hooguit een openstaat.
     Bij het laden staat er geen enkele open: de jaarstaven zijn wel een mooi plaatje van de
     stilte tussen 2000 en 2014, maar op een telefoon vullen ze een strook die het blok
     drukker maakt dan nodig. Wie ze wil zien, tikt op Jaar. */
  var OMLAAG = '4.5,6.5 10,13.5 15.5,6.5';
  /* Zelfde volgorde als op de desktop: spreker, jaar, land, brondocument. */
  var PANELEN = [
    /* De sprekerpillen staan in een raster van twee kolommen en de landen in een van drie;
       de lijntjes wijzen dus naar de kolommen en niet naar elke pil (eersteRij). */
    /* railBij -1: halverwege komt de rail door het afronden op halve pixels op 15,5px onder
       de schakelaar uit; deze pixel legt hem op 14,5px, dezelfde hoogte als bij de tijdlijn,
       zodat de rail niet verspringt als je van rij wisselt. Met de bovenpadding van 24px in
       de stylesheet zijn de stam boven de rail en de spaken eronder dan allebei 14,5px. */
    { el: bar,      attr: 'data-kopspreker', lijnen: true, eersteRij: true, railBij: -1,
      kolomlijnen: true },
    /* De jaarrij is nu net zo'n knoppenraster als de twee andere: vijf pillen op een regel,
       dus dezelfde lijntjes en dezelfde rail. */
    { el: tijdlijn, attr: 'data-kopjaar', lijnen: true, eersteRij: true, railBij: -1,
      kolomlijnen: true },
    { el: vlagBar,  attr: 'data-kopland',    lijnen: true, eersteRij: true, railBij: -1,
      kolomlijnen: true },
    { el: bronBar,  attr: 'data-kopdoc'     }
  ].filter(function(q){ return q.el && q.el.querySelector('button'); });
  var openPaneel = null;
  /* De pil 'Overige filters' met het vakje waarin de drie rijknoppen zitten; overigQ is
     de beschrijving waarmee tekenLijnen() de lijntjes ernaartoe trekt. */
  var overigVak = null, overigKnop = null, overigQ = null, overigOpen = false;

  /* Alle rijen vullen tot in de kantlijn uit, ook als er maar twee knoppen op staan: op
     een telefoon zijn de rijen kort en oogt een rafelige rechterkant slordiger dan een
     knop met wat extra lucht erin. De grens van 30px houdt het binnen de perken. */
  /* De vier buitenhoeken van een raster ronder maken, zodat de knoppen samen als één blok
     lezen. Welke knop op welke hoek staat hangt van de regelval af, dus dat bepalen we na
     het meten en niet met een vaste regel in de stylesheet. */
  function hoekenBij(balk, sel){
    /* Eerst bij álle knoppen weghalen en pas daarna binnen de selectie opnieuw zetten:
       een knop die deze ronde buiten de selectie valt — de pil met de huidige keuze — zou
       anders een ronding uit een eerdere ronde houden. */
    var alle = [].slice.call(balk.querySelectorAll('button'));
    alle.forEach(function(b){ b.classList.remove('hoek-lb','hoek-rb','hoek-lo','hoek-ro'); });
    var bs = sel ? alle.filter(function(b){ return b.matches(sel); }) : alle;
    var zicht = bs.filter(function(b){ return b.offsetParent; });
    if(!zicht.length) return;
    var rijen = {};
    zicht.forEach(function(b){ var k = Math.round(b.offsetTop); (rijen[k] = rijen[k] || []).push(b); });
    var sleutels = Object.keys(rijen).map(Number).sort(function(a,b){ return a-b; });
    var eerste = rijen[sleutels[0]], laatste = rijen[sleutels[sleutels.length-1]];
    eerste[0].classList.add('hoek-lb');
    eerste[eerste.length-1].classList.add('hoek-rb');
    laatste[0].classList.add('hoek-lo');
    laatste[laatste.length-1].classList.add('hoek-ro');
  }

  /* Dunne verbindingslijntjes van een schakelaar naar wat er bij het openklappen onder
     verschijnt, zoals op de desktop: recht omlaag uit de pil, dan een horizontale rail, en
     van die rail per doel een kort pootje. Op een telefoon is de strook lucht krapper, dus
     de maten zijn kleiner; de opbouw is dezelfde.
     De laag ligt in het paneel zelf en steekt met een negatieve top de kopregel in: die twee
     vakken sluiten naadloos op elkaar aan, dus de lijntjes lopen door een doorlopend grijs
     vlak. Ze vangen geen muis, dus tikken gaat er gewoon doorheen. Opnieuw tekenen hoort bij
     elke meting, want de knoppen verspringen met de schermbreedte. */
  function tekenLijnen(q){
    var laag = q.laag;
    if(!laag){
      laag = document.createElementNS('http://www.w3.org/2000/svg','svg');
      laag.setAttribute('class','paneel-lijnen');
      laag.setAttribute('aria-hidden','true');
      q.el.insertBefore(laag, q.el.firstChild);
      q.laag = laag;
    }
    while(laag.firstChild){ laag.removeChild(laag.firstChild); }
    laag.style.display = 'none';
    if(!q.knop) return;
    var doelen = [].slice.call(q.el.querySelectorAll(q.doelen || 'button'));
    if(!doelen.length) return;
    /* Alles wordt gemeten met getBoundingClientRect en omgerekend naar dezelfde nulhoek:
       de linkerbovenhoek van het binnenwerk van het paneel, waar de tekenlaag begint.
       Niet met offsetLeft/offsetTop, want die tellen vanaf de dichtstbijzijnde geplaatste
       voorouder en dat is voor de staafjes de balk eromheen. */
    var vak = q.el.getBoundingClientRect();
    var rand = getComputedStyle(q.el);
    var nulX = vak.left + (parseFloat(rand.borderLeftWidth) || 0);
    var nulY = vak.top + (parseFloat(rand.borderTopWidth) || 0);
    var punten = doelen.map(function(d){
      var r = d.getBoundingClientRect();
      return { x: r.left + r.width/2 - nulX, y: r.top - nulY,
               links: r.left - nulX, rechts: r.right - nulX, onder: r.bottom - nulY };
    });
    var alleP = punten;
    /* Op een telefoon staan de pillen in een raster van twee of drie kolommen. Dan wijst
       een lijn niet naar elke knop maar naar elke kolom: alleen de knoppen op de bovenste
       regel zijn doel, en dat zijn er precies zoveel als er kolommen zijn. De lijnen komen
       zo van boven het raster binnen en kruisen niets. */
    if(q.eersteRij){
      var bovenste = Math.round(punten[0].y);
      punten.forEach(function(p){ if(Math.round(p.y) < bovenste) bovenste = Math.round(p.y); });
      punten = punten.filter(function(p){ return Math.round(p.y) === bovenste; });
    }
    /* Een rij pillen hoort anders op één regel te staan: valt hij om, dan blijven de
       lijntjes weg, want een lijn naar de tweede regel zou dwars over de eerste lopen. De
       tijdlijn slaat die eis over (eenRij:false): daar staat alles per definitie naast
       elkaar. */
    if(q.eenRij !== false && !q.eersteRij){
      for(var i=1; i<punten.length; i++){
        if(Math.round(punten[i].y) !== Math.round(punten[0].y)) return;
      }
    }
    var kr = q.knop.getBoundingClientRect();
    var x0 = kr.left + kr.width/2 - nulX;
    var y0 = kr.bottom - nulY;
    function halve(v){ return Math.round(v) + 0.5; }
    /* De rail ligt halverwege tussen de schakelaar en de bovenkant van wat eronder staat.
       Bij een rij pillen is dat de rij zelf; bij de tijdlijn de balk met de staafjes
       (railVlak), en niet de langste staaf: dan zou de rail per telling verspringen. */
    var vlak = q.railVlak ? q.el.querySelector(q.railVlak) : null;
    var hoogste;
    if(vlak){ hoogste = vlak.getBoundingClientRect().top - nulY; }
    else {
      hoogste = punten[0].y;
      punten.forEach(function(p){ if(p.y < hoogste) hoogste = p.y; });
    }
    var rail = halve((hoogste - y0) / 2) + (q.railBij || 0);
    /* Staat de schakelaar niet vlak boven de rij, dan is de afstand veel groter dan de twee
       stroken padding ertussen en zou de lijn over andere knoppen lopen. Dan liever niets. */
    var diepst = 0;
    punten.forEach(function(p){ if(p.y > diepst) diepst = p.y; });
    if(diepst - y0 < 6 || diepst - y0 > (q.maxDiepte || 40)) return;
    /* Waar een pootje eindigt. Normaal op zijn doel: de bovenkant van de pil. De tijdlijn
       doet het anders (pootje): daar krijgt elk jaar een even lang, kort pootje onder de
       rail. Een lijn die tot op de staaf doorloopt is namelijk het langst waar de staaf het
       kortst is, en dan loopt de hoeveelheid grijs tegengesteld aan de waarde eronder. */
    function eind(p){ return (q.pootje ? rail + q.pootje : p.y - y0).toFixed(2); }
    laag.style.left = '0';
    laag.style.top = y0 + 'px';
    laag.style.width = q.el.clientWidth + 'px';
    var laagst = diepst;
    if(q.kolomlijnen){ alleP.forEach(function(p){ if(p.y > laagst) laagst = p.y; }); }
    laag.style.height = (q.pootje ? rail + q.pootje + 1 : laagst - y0) + 'px';
    laag.style.display = '';
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
    /* De straal van de twee buitenbochten. Stond op 2,5px (te blokkerig) en is in
       september 2026 eerst op 6 en daarna op 4,5px gezet. */
    var r = Math.min(4.5, (R.x - L.x) / 2);
    var tekening = [];
    if (R.x - L.x < 2) {
      /* Alle takken liggen op vrijwel dezelfde x: één doel, recht onder zijn schakelaar.
         Dan hoort er één rechte lijn te staan en geen rail. Met een rail legt het afronden
         op halve pixels de stam en het pootje soms een pixel uit elkaar, en dat zie je als
         een knikje halverwege de lijn. De x van de diepste tak wint, want de kolomlijntjes
         hieronder hangen daar ook aan. */
      var diep = takken[0], boven = takken[0].y, onder = takken[0].y;
      takken.forEach(function(t){
        if(t.y > diep.y) diep = t;
        if(t.y < boven) boven = t.y;
        if(t.y > onder) onder = t.y;
      });
      tekening.push('M' + diep.x + ' ' + boven + 'V' + onder);
    } else if (r >= 1) {
      tekening.push('M' + L.x + ' ' + L.y +
                    'V' + (rail + (L.y > rail ? r : -r)) +
                    'Q' + L.x + ' ' + rail + ' ' + (L.x + r) + ' ' + rail +
                    'H' + (R.x - r) +
                    'Q' + R.x + ' ' + rail + ' ' + R.x + ' ' + (rail + (R.y > rail ? r : -r)) +
                    'V' + R.y);
    } else {
      tekening.push('M' + L.x + ' ' + L.y + 'V' + rail + 'H' + R.x + 'V' + R.y);
    }
    takken.slice(1, -1).forEach(function(t){
      tekening.push('M' + t.x + ' ' + rail + 'V' + t.y);
    });
    /* In een raster loopt de boom door tussen de regels: boven elke pil een kort lijntje
       naar de regel erboven. Welke pil daar de aanhechting is bepaalt de linkerrand van de
       onderste: die valt binnen precies één pil van de regel erboven. Zo krijgt een brede
       pil die twee kolommen beslaat, zoals 'Overige landen', maar één lijn en niet uit elke
       kolom erboven een. Het lijntje staat op het midden van de ónderste pil: in een raster
       van gelijke breedtes is dat hetzelfde punt als het midden van de pil erboven, maar
       staat er een brede pil boven twee smalle, dan wijst het zo naar allebei die smalle in
       plaats van twee keer naar hetzelfde punt ertussenin. */
    if(q.kolomlijnen){
      var regels = {};
      alleP.forEach(function(p){ var k = Math.round(p.y); (regels[k] = regels[k] || []).push(p); });
      var keys = Object.keys(regels).map(Number).sort(function(a,b){ return a-b; });
      for(var ri=1; ri<keys.length; ri++){
        var boven = regels[keys[ri-1]];
        regels[keys[ri]].forEach(function(onder){
          for(var bi=0; bi<boven.length; bi++){
            var b = boven[bi];
            if(onder.links + 0.5 >= b.links && onder.links + 0.5 <= b.rechts){
              /* min y0: de tekenlaag begint bij de onderkant van de schakelaar en niet bij
                 de bovenkant van het paneel, dus alle y's moeten naar die hoek toe. */
              tekening.push('M' + halve(onder.x) + ' ' + (b.onder - y0).toFixed(2) +
                            'V' + (onder.y - y0).toFixed(2));
              return;
            }
          }
        });
      }
    }
    var pad = document.createElementNS('http://www.w3.org/2000/svg','path');
    pad.setAttribute('d', tekening.join(''));
    laag.appendChild(pad);
  }

  /* Eerst de breedtes, dan pas de lijnen: gelijkeBreedte en vulRegelsUit verzetten de
     knoppen nog, en tekende je de lijnen daarvoor, dan stonden ze op de posities van vóór
     het uitvullen — de spaken kwamen dan naast hun pil uit. */
  function meetPaneel(q){
    meetBreedtes(q);
    if(q.lijnen){ tekenLijnen(q); }
  }
  function meetBreedtes(q){
    var per = parseInt(q.el.getAttribute('data-perrij'), 10);
    if(!per){ vulRegelsUit(q.el, true); return; }
    if(q.el === vlagBar){
      /* De vlagknoppen vormen een raster van gelijke breedte; de restknop staat daar
         buiten, want zijn opschrift is een woord en geen landcode. Hij krijgt wat er op
         zijn regel overblijft, zodat die regel toch tot in de kantlijn loopt. */
      var rest = q.el.querySelector('button.landrest');
      var maat = gelijkeBreedte(q.el, per, 'button:not(.landrest)');
      if(rest && maat){
        var opLaatste = maat.aantal % maat.perRij;
        rest.style.width = ((opLaatste === 0 ? maat.binnen
                                             : maat.binnen - opLaatste*(maat.breed+maat.gat)) - 1) + 'px';
      }
      hoekenBij(q.el);
      return;
    }
    gelijkeBreedte(q.el, per);
    hoekenBij(q.el);
  }
  function zetPaneel(q){
    openPaneel = q;
    /* Staat er niets open, dan is de kopregel zelf de onderkant van het kader en moet hij
       dat kader ook sluiten: anders eindigt het grijze vlak in een rand die er niet is. */
    kopBar.classList.toggle('kop-dicht', !q);
    PANELEN.forEach(function(r){
      var aan = (r === q);
      r.el.style.display = aan ? '' : 'none';
      if(r.knop){
        r.knop.setAttribute('aria-expanded', aan ? 'true' : 'false');
        r.knop.title = kopBar.getAttribute(aan ? 'data-dicht' : 'data-open') || '';
        /* De chevron draait via aria-expanded in de stylesheet (.paneel-pijl). */
      }
    });
    /* Pas meten als élke rij op zijn nieuwe stand staat, en niet binnen de lus hierboven.
       De tijdlijn staat als laatste in de HTML: meet je hem terwijl de rij die net nog
       openstond nog zichtbaar is, dan staat hij op dat moment een rij te laag en valt de
       afstand tot zijn schakelaar buiten de marge, waarna de lijntjes wegvallen. */
    if(q){ meetPaneel(q); }
    /* Het blok is hoger of lager geworden zonder dat er gescrold is, dus de kopregel van
       de lijst staat ergens anders; opnieuw bepalen of de meelopende baan hoort uit te
       rollen. */
    kijkKop();
  }
  /* Staat er een filter aan dat in een dichte rij zit, dan gaat die rij open: anders
     toont de bediening geen enkele gekozen knop terwijl de lijst wel gefilterd is. */
  function paneelBijFilter(){
    var q = null;
    PANELEN.forEach(function(r){
      if(r.el.querySelector('button[aria-pressed="true"]')){ q = r; }
    });
    if(q && q !== openPaneel){
      /* De drie rijen zitten zelf ook achter een schakelaar; die moet dus eerst open. */
      if(!overigOpen){ zetOverig(true); }
      zetPaneel(q);
    }
  }

  /* De drie schakelaars staan sinds september 2026 niet meer los in de kopregel maar
     achter één pil, 'Overige filters'. Op een telefoon telde die regel anders vijf
     knoppen naast elkaar — de sleutelcitaten, alle citaten en drie schakelaars — en dat
     was meer bediening dan lijst. Nu staat er eerst wat je ziet, en pas daarachter wat
     je verder kunt kiezen. */
  function zetOverig(aan){
    overigOpen = !!aan;
    overigVak.style.display = overigOpen ? '' : 'none';
    overigKnop.setAttribute('aria-expanded', overigOpen ? 'true' : 'false');
    overigKnop.title = kopBar.getAttribute(overigOpen ? 'data-dicht' : 'data-open') || '';
    /* Gaat de pil dicht, dan verdwijnt ook de rij die eronder openstond: hij zou anders
       onder een schakelaar hangen die niet meer in beeld is. */
    if(!overigOpen){ zetPaneel(null); }
    else { meetOverig(); }
    /* De onderste regel van het blok is een andere geworden, dus de ronde buitenhoeken ook. */
    hoekenBij(kopBar, '.kop-overig button');
    kijkKop();
  }
  function meetOverig(){
    if(!overigOpen || !overigVak) return;
    vulRegelsUit(overigVak, true);
    tekenLijnen(overigQ);
  }

  if(kopBar && PANELEN.length){
    /* Boven de knoppen stond een zin van twee regels die uitlegde wat er allemaal te
       filteren viel. Daar is een kort opschrift voor in de plaats gekomen, vlak vóór de
       pil met de huidige keuze: 'Kies een filter:'. De alinea zelf blijft in de HTML
       staan met de oude zin erin, zodat een bezoeker zonder javascript — die geen enkele
       knop krijgt — nog wel leest waar de lijst over gaat; hier verhuist hij naar het
       grijze kader en krijgt hij het korte opschrift. */
    var uitleg = document.getElementById('stemUitleg');
    if(uitleg){
      uitleg.className = 'kies-label';
      uitleg.removeAttribute('style');
      var kies = kopBar.getAttribute('data-kies');
      if(kies){ uitleg.textContent = kies; }
      kopBar.insertBefore(uitleg, kopBar.firstChild);
    }
    /* De eerste regel toont wat je nú ziet: het opschrift met daarachter de pil van de
       sleutelcitaten. 'Alle citaten' en de schakelaar naar de overige filters horen op de
       regel daaronder; een onzichtbaar blokje over de volle breedte dwingt die overgang
       af. Het blokje komt dus vóór 'alle citaten' te staan en niet achter de twee. */
    var breek = document.createElement('span');
    breek.className = 'kop-breek';
    breek.setAttribute('aria-hidden', 'true');
    var alleKnop = null;
    kopKnoppen.forEach(function(x){ if(x.sleutel === 'all'){ alleKnop = x.knop; } });
    kopBar.insertBefore(breek, alleKnop || null);

    /* De schakelaar naar de overige filters, met daarachter het vakje waarin de drie
       rijknoppen zitten. Dat vakje is de 'rij' waar de lijntjes naartoe wijzen, precies
       zoals een paneel dat is voor zijn eigen schakelaar. */
    overigVak = document.createElement('div');
    overigVak.className = 'kop-overig';
    overigVak.id = 'stemOverig';
    overigQ = { el: overigVak, lijnen: true, eersteRij: true, kolomlijnen: true, railBij: -1 };
    overigKnop = document.createElement('button');
    overigKnop.type = 'button';
    overigKnop.className = 'paneel-knop';
    overigKnop.setAttribute('aria-expanded', 'false');
    overigKnop.setAttribute('aria-controls', 'stemOverig');
    var overigOp = document.createElement('span');
    overigOp.className = 'paneel-tekst';
    overigOp.textContent = kopBar.getAttribute('data-kopoverig') || '';
    overigKnop.appendChild(overigOp);
    overigKnop.insertAdjacentHTML('beforeend',
      '<svg class=paneel-pijl viewBox="0 0 20 20" aria-hidden="true">' +
      '<polyline points="' + OMLAAG + '"/></svg>');
    overigKnop.title = kopBar.getAttribute('data-open') || '';
    overigQ.knop = overigKnop;
    overigKnop.addEventListener('click', function(){
      metOvergang(function(){ zetOverig(!overigOpen); });
    });
    /* Vóór 'alle citaten' en niet erachter: de twee knoppen die zeggen wat je ziet — de
       sleutelcitaten en alle citaten — staan zo in één kolom onder elkaar, en de stam van
       de boom zakt linksonder uit de schakelaar in plaats van vanaf de rechterrand terug
       te lopen over de drie knoppen eronder. */
    kopBar.insertBefore(overigKnop, alleKnop || null);
    kopBar.appendChild(overigVak);

    PANELEN.forEach(function(q){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'paneel-knop';
      b.setAttribute('aria-expanded','false');
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
         kruist de oude en de nieuwe stand over elkaar heen. Alleen hier en niet in zetPaneel
         zelf: die wordt ook aangeroepen vanuit paneelBijFilter, en dat gebeurt al binnen een
         overgang — een overgang in een overgang laat de browser vallen. */
      b.addEventListener('click', function(){
        metOvergang(function(){ zetPaneel(openPaneel === q ? null : q); });
      });
      q.knop = b;
      overigVak.appendChild(b);
    });
    zetPaneel(null);
    zetOverig(false);
    naKeuze = paneelBijFilter;
  }

  /* De filterbalk boven de medialijst kreeg dezelfde behandeling: eerst één pil
     'Filter' met een chevron, en pas na het openklappen de vier keuzeknoppen, met
     dezelfde dunne lijntjes ertussen. De knoppen zelf komen uit een inline script in het
     taalbestand — de opschriften zijn taalgebonden — en dat draait op DOMContentLoaded,
     vóór de haak van vulBalkenUit(). Zolang er nog geen knoppen zijn gebeurt hier niets. */
  var mediaQ = null;
  function bouwMediaSchakelaar(){
    var mb = document.getElementById('mediaFilter');
    if(!mb || mediaQ || !mb.querySelector('button')) return;
    var vak = document.createElement('div');
    vak.className = 'media-keuze';
    vak.id = 'mediaKeuze';
    while(mb.firstChild){ vak.appendChild(mb.firstChild); }
    var knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'paneel-knop';
    knop.setAttribute('aria-expanded', 'false');
    knop.setAttribute('aria-controls', 'mediaKeuze');
    var op = document.createElement('span');
    op.className = 'paneel-tekst';
    op.textContent = mb.getAttribute('data-kopfilter') || '';
    knop.appendChild(op);
    knop.insertAdjacentHTML('beforeend',
      '<svg class=paneel-pijl viewBox="0 0 20 20" aria-hidden="true">' +
      '<polyline points="' + OMLAAG + '"/></svg>');
    knop.title = mb.getAttribute('data-open') || '';
    mb.appendChild(knop);
    mb.appendChild(vak);
    vak.style.display = 'none';
    mediaQ = { el: vak, knop: knop, lijnen: true, eersteRij: true, kolomlijnen: true, railBij: -1 };
    /* Het opschrift van de pil loopt mee met de keuze: staat er iets anders aan dan de hele
       selectie, dan noemt de pil die keuze. Anders staat er, zodra iemand de pil dichtklapt,
       een opschrift boven een tijdlijn die stilletjes is ingekort en zie je nergens meer
       waaróm. De namen van de keuzes komen uit het inline script in het taalbestand; die
       leggen we hier eenmalig vast, want de knop draagt naast zijn naam ook een telling en
       een bolletje. */
    var keuzes = [].slice.call(vak.querySelectorAll('button'));
    keuzes.forEach(function(b){
      if(b.hasAttribute('data-naam')) return;
      var eerste = b.firstChild;
      b.setAttribute('data-naam',
        ((eerste && eerste.nodeType === 3 ? eerste.textContent : b.textContent) || '').trim());
    });
    var gekozenSjabloon = mb.getAttribute('data-kopgekozen') || '';
    function werkOpschriftBij(){
      var aan = vak.querySelector('button[aria-pressed="true"]');
      if(!gekozenSjabloon || !aan || aan.getAttribute('data-mf') === 'all'){
        op.textContent = mb.getAttribute('data-kopfilter') || '';
      } else {
        op.textContent = gekozenSjabloon.replace('{x}', aan.getAttribute('data-naam') || '');
      }
    }
    /* Niet meeluisteren met de tik maar met het attribuut zelf: het inline script zet
       aria-pressed binnen een view-transition, dus op het moment van de klik staat de oude
       stand er nog. */
    if(gekozenSjabloon && window.MutationObserver){
      var kijker = new MutationObserver(werkOpschriftBij);
      keuzes.forEach(function(b){
        kijker.observe(b, { attributes: true, attributeFilter: ['aria-pressed'] });
      });
    }
    werkOpschriftBij();
    function zetMediaPaneel(aan){
      knop.setAttribute('aria-expanded', aan ? 'true' : 'false');
      knop.title = mb.getAttribute(aan ? 'data-dicht' : 'data-open') || '';
      vak.style.display = aan ? '' : 'none';
      if(aan){ meetMedia(); }
      /* De hele medialijst zit in een blok dat met een maximumhoogte open- en dichtklapt.
         Die maat is gezet toen de vier knoppen nog verborgen waren, dus na het uitklappen
         moet hij opnieuw: anders valt de onderkant van de lijst weg. */
      var pl = document.getElementById('publicationsList');
      if(pl && pl.classList.contains('open')){ pl.style.maxHeight = pl.scrollHeight + 'px'; }
    }
    knop.addEventListener('click', function(){
      metOvergang(function(){
        zetMediaPaneel(knop.getAttribute('aria-expanded') !== 'true');
      });
    });
    /* Komt iemand binnen op een gedeelde link met een selectie erin (?media=balkan), dan
       heeft het inline script die keuze al aangezet. De pil gaat dan open, want anders is
       de lijst ingekort zonder dat er iets te zien is waaróm. */
    var gekozen = vak.querySelector('button[aria-pressed="true"]');
    if(gekozen && gekozen.getAttribute('data-mf') !== 'all'){ zetMediaPaneel(true); }
  }
  function meetMedia(){
    if(!mediaQ || mediaQ.knop.getAttribute('aria-expanded') !== 'true') return;
    meetMediaBreedtes();
    /* De vier buitenhoeken ronder, zodat de knoppen samen als één blok lezen — net als de
       rasters bij de citaten. Welke knop op welke hoek staat hangt van de regelval af. */
    hoekenBij(mediaQ.el);
    tekenLijnen(mediaQ);
  }
  /* Twee even brede knoppen per regel, als het kan. Dat lukt alleen als de breedste van de
     vier in een halve regel past, en dat verschilt per taal: 'Filter media by origin' heeft
     korte opschriften en haalt het, 'Niederländische Medien' is in zijn eentje al breder dan
     een halve regel. Haalt een taal het niet, dan blijft het aan flexbox: de knoppen rekken
     dan uit tot de regel vol is, elk naar eigen behoefte (zie de stylesheet). In beide
     gevallen blijven de kantlijnen staan, want er wordt niets aan de opvulling gesleuteld. */
  function meetMediaBreedtes(){
    var knoppen = [].slice.call(mediaQ.el.querySelectorAll('button'));
    if(!knoppen.length) return;
    var st = getComputedStyle(mediaQ.el);
    var gat = parseFloat(st.columnGap || st.gap) || 0;
    /* Een pixel eraf, anders duwt het afronden de tweede knop naar een eigen regel. */
    var breed = Math.floor(((mediaQ.el.clientWidth - gat - 1) / 2) * 100) / 100;
    /* Even los van hun flexverdeling om hun eigen breedte te kunnen meten. */
    knoppen.forEach(function(b){ b.style.flex = 'none'; b.style.width = 'max-content'; });
    var breedste = 0;
    knoppen.forEach(function(b){
      var w = b.getBoundingClientRect().width;
      if(w > breedste) breedste = w;
    });
    var vast = (breed >= breedste) ? ('0 0 ' + breed + 'px') : '';
    knoppen.forEach(function(b){ b.style.width = ''; b.style.flex = vast; });
  }

  toon('sleutel');
  pasURLFilterToe();
  /* De voettekst is nog niet ingelezen wanneer dit script draait; zodra dat wel zo
     is, de fotocredits alsnog op de openingsstand zetten. */
  document.addEventListener('DOMContentLoaded', function(){ toon(actief); });
})();

/* -------------------------------------------------------------------------- */

function moreC16() {
 var jojo = document.getElementById('C16jojo');
 /* eerst de inhoud tonen, dan pas meten: dichtgeklapt is scrollHeight nul */
 document.getElementById('C16a').style.display = 'none';
 document.getElementById('C16b').style.display = 'inline';
 document.getElementById('C16link').classList.add('open');   /* chevron draait om */
 document.getElementById('C16c').style.display = 'inline';
 jojo.style.setProperty('--durOpen', klapDuur('synopsis', false) + 'ms');
 jojo.classList.add("langerC");
}

function lessC16() {
 var jojo = document.getElementById('C16jojo');
 var ms = klapDuur('synopsis', true);
 document.getElementById('C16link').classList.remove('open');   /* chevron draait meteen terug, de tekst wisselt pas na het inklappen */
 jojo.style.setProperty('--durDicht', ms + 'ms');
 jojo.classList.remove("langerC");
 jojo.classList.add("korterC");
 setTimeout(function(){
   document.getElementById('C16b').style.display = 'none';
   document.getElementById('C16a').style.display = 'inline';
   document.getElementById('C16c').style.display = 'none';
   jojo.classList.remove("korterC");
 }, ms);
}

/* -------------------------------------------------------------------------- */

(function() {
    var mt = document.querySelector('details.mtoc');
    var ml = mt.querySelector('ol');
    mt.querySelector('summary').addEventListener('click', function(e) {
        e.preventDefault();
        if (ml.style.maxHeight === '0px' || ml.style.maxHeight === '') {
            mt.classList.remove('closing');
            if (!mt.open) {
                mt.open = true;
                ml.style.maxHeight = '0px';
                ml.getBoundingClientRect();
            }
            ml.style.transition = 'max-height ' + klapDuur('mtoc', false) + 'ms ease-out';
            mt.style.setProperty('--dur', klapDuur('mtoc', false) + 'ms');
            ml.style.maxHeight = ml.scrollHeight + 'px';
        } else {
            mt.classList.add('closing');
            ml.style.transition = 'max-height ' + klapDuur('mtoc', true) + 'ms ease-in';
            mt.style.setProperty('--dur', klapDuur('mtoc', true) + 'ms');
            ml.style.maxHeight = '0px';
        }
    });
    ml.addEventListener('transitionend', function(e) {
        if (e.propertyName !== 'max-height') return;
        if (mt.classList.contains('closing')) {
            mt.classList.remove('closing');
            mt.open = false;
        }
    });
})();

/* -------------------------------------------------------------------------- */

/* Taalmenu in de kopregel. Het openklappen doet <details> zelf, dus zonder javascript
   werkt de taalkeuze ook; dit script voegt de beweging toe en laat het menu dichtgaan bij
   een tik ernaast of op Escape.
   Het uitklappen loopt langs dezelfde twee klassen als het hamburgermenu hierboven, met
   hetzelfde ritme van 400 milliseconden: bij het sluiten eerst de omgekeerde animatie en
   pas daarna <details> echt dicht, anders knipt de browser het paneel weg voordat je de
   beweging hebt gezien. De klasse 'closing' laat het pijltje in dezelfde tijd terugdraaien. */
(function(){
  var tm = document.querySelector('details.taalmenu');
  if (!tm) return;
  var tl = tm.querySelector('.taallijst');
  var knop = tm.querySelector('summary');
  if (!tl || !knop) return;
  var DUUR = 400;   /* gelijk aan de 0,4s van oplichten2 en oplichten2R in de stylesheet */
  var klok = null;

  /* Niet 'open' genoemd: dat zou binnen deze functie window.open overschaduwen. */
  function openklappen() {
    clearTimeout(klok);
    klok = null;
    tm.classList.remove('closing');
    tl.classList.remove('oplichten2R');
    tl.classList.add('oplichten2');
    tm.open = true;
  }

  function dicht() {
    if (!tm.open || tm.classList.contains('closing')) return;
    tm.classList.add('closing');
    tl.classList.remove('oplichten2');
    tl.classList.add('oplichten2R');
    klok = setTimeout(function(){
      tm.open = false;
      tm.classList.remove('closing');
      tl.classList.remove('oplichten2R');
      tl.classList.add('oplichten2');
      klok = null;
    }, DUUR);
  }

  knop.addEventListener('click', function(e){
    e.preventDefault();
    if (tm.open && !tm.classList.contains('closing')) { dicht(); return; }
    openklappen();
    /* Het hamburgermenu aan de andere kant van de kopregel gaat vanzelf dicht: deze klik
       valt buiten dat menu, en de regel hierboven vangt dat af. */
  });

  /* Een tik naast het menu sluit het, ook als die tik op de hamburger valt. */
  document.addEventListener('click', function(e){
    if (!tm.open) return;
    if (e.target && e.target.closest && e.target.closest('details.taalmenu')) return;
    dicht();
  });
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape' || !tm.open) return;
    dicht();
    knop.focus();
  });
})();

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
   waardoor het getal nauwelijks nog stuurt. De inhoudstabel past wel op één scherm
   en houdt daarom ease-out bij openen en ease-in bij sluiten.
   Bij 'beperk bewegingen' in de systeeminstellingen wordt er niet geanimeerd. */
var KLAPTIJD = {
  bronnenLijst:     [ 690,  370],   /* lijst met 63 bronnen             - linear */
  publicationsList: [ 900,  460],   /* selectie van de media-aandacht   - linear */
  mtoc:             [ 550,  380],   /* inhoudstabel van het essay       - ease   */
  synopsis:         [ 610,  410],   /* uitgebreide synopsis             - linear */
};
function klapDuur(blok, sluiten) {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  var t = KLAPTIJD[blok] || [800, 550];
  return t[sluiten ? 1 : 0];
}

/* -------------------------------------------------------------------------- */

/* Header "tilt op": subtiele schaduw zodra de pagina gescrold is (klasse .elevated). */
(function(){ var hdr=document.querySelector('.header'); if(!hdr) return;
  function onScroll(){ hdr.classList.toggle('elevated', window.scrollY>4); }
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
})();

/* -------------------------------------------------------------------------- */

/* Europakaart reveal (#europeanim): eenmalig afspelen zodra het blokje in beeld scrollt. */
(function(){
  var m=document.getElementById('europeanim');
  if(!m) return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!('IntersectionObserver' in window)) return;
  m.classList.add('arm');
  var io=new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting){ requestAnimationFrame(function(){ m.classList.add('play'); }); io.disconnect(); } }); },{threshold:0.35});
  io.observe(m);
})();

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

/* De personen- en iconensprite worden pas opgehaald als de bezoeker in de buurt van
   de citaten komt. Samen zijn ze 261 KB, en de lijst begint pas ruim 2300 px onder de
   vouw; ze eerder halen kost bandbreedte die de bovenkant van de pagina beter kan
   gebruiken. De marge van 800 px zorgt dat ze er staan voordat de eerste kaart in
   beeld schuift. Kent de browser IntersectionObserver niet, dan gaan ze meteen aan;
   zonder JavaScript doet de noscript-regel in de pagina hetzelfde. */
(function(){
  var lijst = document.getElementById('citExtended');
  if(!lijst) return;
  function aan(){ lijst.classList.add('loaded'); }
  if(!('IntersectionObserver' in window)){ aan(); return; }
  var kijker = new IntersectionObserver(function(waarnemingen){
    waarnemingen.forEach(function(w){
      // isIntersecting dekt het naderen van bovenaf; boundingClientRect.top < 0 dekt het
      // herladen ónder de lijst, waar die al voorbij is gescrold en dus nooit meer
      // intersect: dan staan de iconen anders nooit aan.
      if(w.isIntersecting || w.boundingClientRect.top < 0){ aan(); kijker.disconnect(); }
    });
  }, { rootMargin: '800px 0px' });
  kijker.observe(lijst);
})();


/* -------------------------------------------------------------------------- */

/* Chevron naast de boekcover (.coverchevron, CSS bij .coverwrap). Tik = naar de andere
   kant van het boek scrollen. De pijl draait om zodra de achterkant in beeld is, en dat
   gaat via het scroll-event, dus ook als de bezoeker zelf swipet blijft hij kloppen.
   Het opschrift (title/aria-label) komt per taal uit data-t-achter en data-t-voor. */
(function(){
  var knop = document.querySelector('.coverchevron');
  var bak = knop && knop.parentNode.querySelector('.container12');
  if(!knop || !bak) return;
  var rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function achter(){ return bak.scrollLeft > bak.clientWidth / 2; }
  function bijwerken(){
    var open = achter();
    knop.classList.toggle('open', open);
    var t = knop.getAttribute(open ? 'data-t-voor' : 'data-t-achter');
    knop.title = t; knop.setAttribute('aria-label', t);
  }
  knop.addEventListener('click', function(){
    // Klasse eraf en er weer op, met een reflow ertussen, anders speelt de animatie
    // bij een tweede tik niet opnieuw.
    knop.classList.remove('tik'); void knop.offsetWidth; knop.classList.add('tik');
    bak.scrollTo({ left: achter() ? 0 : bak.clientWidth, behavior: rustig ? 'auto' : 'smooth' });
  });
  knop.addEventListener('animationend', function(){ knop.classList.remove('tik'); });
  // Geen rAF-throttle: bijwerken() is één classList-toggle en twee attributen, en het
  // scroll-event komt toch al hooguit één keer per frame.
  bak.addEventListener('scroll', bijwerken, { passive: true });
  bijwerken();
})();
