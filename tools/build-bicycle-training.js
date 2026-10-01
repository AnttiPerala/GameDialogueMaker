// Finnish interview-training example. Run to create downloads outside the repo.
const fs = require('node:fs');
const path = require('node:path');
const {validateDialogueProject, createExportZip} = require('../js/exportCommon');
const choice = (text, to, gated = false) => ({text,to,gated});
const question = (key,text,...choices) => ({key,text,choices});
const ending = (key,text,outcome) => ({key,text,outcome});

function buildBicycleTraining() {
    const gate = [{variableName:'bikeIdentityVerified',comparisonOperator:'=',variableValue:1}];
    function character(id,name,color,stages,x) {
        let next = 1;
        const nodes = [], keys = new Map();
        const make = (type,text,px,py,role) => {
            const node = {dialogueID:next++,dialogueType:type,dialogueText:text,dialogueSpeakers:[role],
                dialogueNodeX:px,dialogueNodeY:py,outgoingSockets:type==='question'?3:1,
                hideChildren:false,bgColor:type==='answer'?'#37536d':color,outgoingLines:[],nextNode:-1};
            nodes.push(node);return node;
        };
        const edge = (from,to,slot=0,conditions=[]) => ({fromNode:from,fromSocket:slot,toNode:to,transitionConditions:structuredClone(conditions)});
        stages.forEach((stage,i)=>{
            const n=make(stage.choices?'question':'line',stage.text,x+430,400+i*650,stage.choices?'npc':'scene');
            n.trainingKey=stage.key;
            if(stage.outcome)n.trainingOutcome=stage.outcome;
            keys.set(stage.key,n);
        });
        stages.forEach((stage,i)=>{
            if(!stage.choices)return;
            if(stage.choices.length!==3)throw Error('Three choices required: '+stage.key);
            stage.choices.forEach((c,j)=>{
                const a=make('answer',c.text,x+j*430,700+i*650,'player');
                a.siblings=3;a.siblingNumber=j+1;
                keys.get(stage.key).outgoingLines.push(edge(keys.get(stage.key).dialogueID,a.dialogueID,j));
                if(!keys.has(c.to))throw Error('Missing '+c.to);
                a.outgoingLines.push(edge(a.dialogueID,keys.get(c.to).dialogueID,0,c.gated?gate:[]));
            });
        });
        return {characterID:id,characterName:name,bgColor:color,characterNodeX:x+430,characterNodeY:100,
            outgoingLines:[edge(0,keys.get(stages[0].key).dialogueID)],dialogueNodes:nodes};
    }
    const colleague = [
        question('brief','Kerrostalon kellarikomeron ovi on murrettu ja sieltä on viety sähköpyörä. Omistaja näki pyörän viimeksi maanantaina kello 18. Tiistaina aamulla se oli poissa. Timo Laine myi samannäköistä pyörää verkossa. Sanna Niemi nähtiin kellarissa kantamuksen kanssa. Nämä ovat tutkintalinjoja, eivät vielä ratkaisu.',
            choice('Käydään ensin läpi, mikä on varmistettua ja mikä vasta oletusta.','facts'),
            choice('Mitä Timo ja Sanna tietävät siitä, missä asemassa heitä kuullaan?','rights'),
            choice('Mitä tässä harjoituksessa arvioidaan?','criteria')),
        question('facts','Omistajalta on ostokuitti, valokuvia ja runkonumero. Myynti-ilmoituksen perusteella löytynyt pyörä on otettu tutkinnassa haltuun, mutta yksilöinti on vielä tarkistamatta. Kellarin kamera näyttää Sannan käynnin maanantaina kello 17.20. Se ei kuvaa komeron ovea eikä koko käytävää.',
            choice('Sannan käynti on siis ennen omistajan viimeistä havaintoa. Selvitetään silti, mitä hän kantoi.','sanna_lead'),
            choice('En kutsu haltuun otettua pyörää varastetuksi ennen tunnistetietojen tarkistusta.','identity'),
            choice('Samannäköinen pyörä riittää varmaan jo osoittamaan, että Timo murtautui komeroon.','limits')),
        question('rights','Molemmille on ilmoitettu rikosepäilystä ja heidän asemastaan. Kuulustelun alussa varmistat vielä oikeuksien ymmärtämisen, avustajan tarpeen ja sen, että henkilö pystyy osallistumaan. Oikeutta vaieta pitää kunnioittaa myös kesken kuulustelun. Tässä harjoituksessa molemmat ovat täysi-ikäisiä.',
            choice('Selvitän ensin, haluaako henkilö avustajan ennen jatkamista.','criteria'),
            choice('Kerron myös, että hän voi jättää vastaamatta yksittäiseen kysymykseen.','criteria'),
            choice('Jos hän pyytää taukoa, sovitaan tauosta eikä käytetä pyyntöä häntä vastaan.','criteria')),
        question('criteria','Hyvä suoritus tarkoittaa huolellista työskentelyä: oikeudet kuntoon, oma kertomus ensin, tarkentavat kysymykset vasta sen jälkeen ja väitteiden tarkistaminen. Myös epäilyä vastaan puhuvat tiedot selvitetään. Tunnustus ei yksin ratkaise suoritusta. Vaikeneminen ei ole epäonnistuminen.',
            choice('Aloitan Timosta ja pyydän kertomaan kaupasta omin sanoin.','ready'),
            choice('Aloitan Sannasta ja tarkistan kellarikäynnin syyn.','ready'),
            choice('Mistä saan runkonumeron tarkistusraportin?','identity')),
        question('sanna_lead','Sanna kertoo hakeneensa omia tavaroitaan muuttoa varten. Omistajan viimeinen havainto on hänen käyntinsä jälkeen. Tarkista ajat erikseen ja selvitä kantamuksen sisältö ennen johtopäätöksiä. Hänen mahdollinen hermostuneisuutensa ei ole näyttöä teosta.',
            choice('Pyydän ensin vapaan kertomuksen ja vasta sitten tarkat ajat.','ready'),
            choice('Selvitän, kuka muu voisi vahvistaa tavaroiden noudon.','ready'),
            choice('Mitä kamerasta voidaan varmasti sanoa?','facts')),
        question('identity','Tarkistusraportissa verrataan haltuun otetun pyörän runkonumeroa omistajan kuittiin ja ennen varkautta otettuihin kuviin. Numeron pitää täsmätä kokonaan. Tunnistus kertoo, mikä pyörä on kyseessä. Se ei yksin kerro, kuka mursi oven tai tiesikö ostaja pyörän olevan varastettu.',
            choice('Kun tarkistus valmistuu, haluan nähdä havainnot ja niiden lähteet.','report',true),
            choice('Jatkan ensin kertomusten selvittämistä ilman väitettä varmasta tunnistuksesta.','ready'),
            choice('Miten tämä tarkistus tehdään harjoituspelissä?','inspection')),
        question('report','Raportti on tarkistettu: runkonumero täsmää kuittiin ja vanhoihin kuviin. Omistajan kuvaama korjausjälki täsmää myös. Kyseessä on sama pyörä. Runkonumeron täsmääminen ei yksin todista Timon tehneen murtoa.',
            choice('Esitän löydöksen täsmällisesti ja pyydän selityksen.','ready'),
            choice('Vertaan sitä ensin Timon omaan kertomukseen kaupasta.','ready'),
            choice('Pidän myös mahdollisen vilpittömän ostamisen tutkintalinjana.','ready')),
        ending('inspection','TARKISTUS KESKEN. Pelinkehittäjä toteuttaa raportin tutkimisen ja asettaa numeerisen bikeIdentityVerified-muuttujan arvoon 1 vasta tarkistuksen valmistuttua. Voit kokeilla samaa Test variables -paneelissa. Dialogi ei muuta muuttujaa itse. Palaa sitten keskusteluun.','inspection_required'),
        question('limits','Ei riitä. Väri ja malli voivat täsmätä monessa pyörässä. Tunnistetun varastetun tavaran hallussapitokin vaatii vielä selityksen ja lisätutkintaa. Pidä erillään tavaran tunnistus, hallussapito ja itse anastaminen.',
            choice('Korjaan oletuksen. Tarkistan ensin pyörän yksilöinnin.','identity'),
            choice('Pyydän Timolta tarkistettavan kertomuksen siitä, miten pyörä tuli hänelle.','ready'),
            choice('Käyn ensin läpi, mitä kamerat oikeasti näyttävät.','facts')),
        ending('ready','ALOITA KUULUSTELU. Keskustele Timon tai Sannan kanssa. Molemmilla on oma tutkintalinjansa. Arvioi tiedon luotettavuutta, älä henkilön miellyttävyyttä.','briefing_complete')
    ];
    const timo = [
        question('start','Ennen kuin aletaan: mistä mua tarkalleen epäillään? En ole ollut tällaisessa kuulustelussa ennen.',
            choice('Sinua epäillään kellarikomeroon murtautumiseen liittyvästä varkaudesta. Saat vaieta ja käyttää avustajaa. Käydään oikeudet läpi ennen kysymyksiä.','rights'),
            choice('Käydään ensin läpi epäily, oikeus olla vastaamatta ja avustajan käyttö. Onko jokin niistä jäänyt epäselväksi?','rights'),
            choice('Sinun ei tarvitse selvittää asiaa ilman avustajaa. Kerron epäilyn ja oikeudet, ja sovitaan sitten, voimmeko aloittaa.','rights')),
        question('rights','Ymmärsin, ettei mun ole pakko vastata. En halua avustajaa nyt, mutta voinko pyytää myöhemmin? Olo on ihan hyvä.',
            choice('Voit. Voit myös pyytää taukoa tai jättää vastaamatta. Kerro omin sanoin, miten myymäsi pyörä päätyi sulle.','account'),
            choice('Voit muuttaa mielesi. Varmistan vielä: mitä ymmärsit siitä, miten saat päättää vastaamisesta?','understanding'),
            choice('Voidaan myös keskeyttää nyt, jos haluat vielä harkita avustajaa.','offer_break')),
        question('understanding','Että voin olla vastaamatta ja pyytää avustajan myös myöhemmin. Ei mun tarvitse myöntää mitään vain siksi, että olen täällä. Haluan kuitenkin kertoa siitä kaupasta.',
            choice('Kerro kaupasta alusta asti omin sanoin. Kuuntelen ensin keskeyttämättä.','account'),
            choice('Miten päädyit hankkimaan juuri sen pyörän? Kerro koko tapahtumaketju.','account'),
            choice('Aloita siitä, kun kuulit pyörästä ensimmäisen kerran, ja jatka myynti-ilmoitukseen asti.','account')),
        question('offer_break','Ei tarvitse vielä. Haluan kertoa nyt. Jos alkaa tuntua siltä, että tarvitsen avustajan, sanon sitten.',
            choice('Sovitaan niin. Kerro omin sanoin, miten pyörä tuli sulle.','account'),
            choice('Hyvä. Kerro ensimmäisestä yhteydenotosta lähtien, mitä tapahtui.','account'),
            choice('Oikeudet ovat voimassa koko ajan. Aloita siitä kohdasta, jonka itse katsot olennaiseksi.','account')),
        question('account','Ostin sen yhdeltä tyypiltä tiistaina. Tapasin sen kaupan parkkipaikalla. Maksoin käteisellä. Ajattelin myydä vähän kalliimmalla, siksi laitoin ilmoituksen saman tien. En tiedä mitään kellarikomerosta.',
            choice('Kerro tarkemmin siitä, miten sovitte tapaamisen.','contact'),
            choice('Mitä tapahtui, kun saavuit parkkipaikalle?','meeting'),
            choice('Mitä muistat myyjästä ja siitä, miten keskustelu kaupasta alkoi?','seller')),
        question('contact','Se tuli juttelemaan mulle maanantaina kioskilla. En tiedä sen nimeä. Sovittiin suullisesti, että nähdään seuraavana päivänä. Ei mulla ole viestejä.',
            choice('Missä kioskilla olitte ja mihin aikaan? Mitkä asiat auttavat muistamaan sen?','seller'),
            choice('Kuka olisi voinut nähdä keskustelun tai muistaa sut sieltä?','seller'),
            choice('Kun viestejä ei ole, olet varmaan keksinyt koko myyjän.','assumption')),
        question('meeting','Se seisoi pyörän vieressä. Mä kokeilin jarruja ja vaihteita. Annoin kolmesataa euroa, sitten lähdin. Siinä ei oikein muuta ollut.',
            choice('Palataan ensin siihen, miten sovitte tapaamisen.','contact'),
            choice('Mitä myyjä kertoi pyörästä ja hinnasta?','seller'),
            choice('Kuka muu oli paikalla ja mitä heidän olisi ollut mahdollista nähdä?','seller')),
        question('assumption','En mä voi sille mitään, ettei ole viestejä. Oletko jo päättänyt, etten puhu totta?',
            choice('En. Viestien puuttuminen ei yksin osoita kertomusta vääräksi. Mistä muualta tapaamista voisi tarkistaa?','seller'),
            choice('Tein liian pitkän päätelmän. Kerro myyjästä ja tapaamispaikasta niin tarkasti kuin muistat.','seller'),
            choice('Jos haluat lopettaa vastaamisen, kunnioitan sitä. Haluan silti kirjata oman kantasi oikein.','silence')),
        question('seller','Noin mun ikäinen mies, tumma takki. Sanoi muuttavansa pois. Kioski oli aseman lähellä, maanantaina joskus iltapäivällä. En tiedä, näkikö joku. En tarkistanut henkilöllisyyttä.',
            choice('Mitkä noista tiedoista muistat varmasti, ja mitkä ovat arvioita?','purchase'),
            choice('Mitä pyörän omistuksesta tai alkuperästä puhuttiin?','purchase'),
            choice('Mikä sai sut pitämään myyjää pyörän omistajana?','purchase')),
        question('purchase','En mä tiedä, oliko se oikeasti muuttamassa. Niin se sanoi. Ei ollut kuittia. Kolmesataa kuulosti hyvältä hinnalta. Kelloa en katsonut. Myyjän ikäkin on arvio.',
            choice('Kuvaile pyörä ja kaikki, mitä sait sen mukana.','description'),
            choice('Mitä itse tarkistit ennen maksamista? Kerro myös varusteista.','description'),
            choice('Mihin perustit arviosi siitä, että kauppa oli tavallinen käytetyn tavaran kauppa?','description')),
        question('description','Harmaa sähköpyörä. Akku oli paikallaan, laturia ei ollut. Runkolukko oli auki. En kysynyt avainta. Siinä oli naarmuja. Ajattelin, että halvalla saa vähän huonompaakin.',
            choice('Kerro vielä aikajärjestyksessä, missä olit maanantai-illasta tiistain kauppaan.','timeline'),
            choice('Milloin näit pyörän ensimmäisen kerran ja missä säilytit sitä kaupan jälkeen?','timeline'),
            choice('Mikä osa tapahtumista voisi varmistua muista lähteistä?','timeline')),
        question('timeline','Maanantaina olin illan kotona yksin. Tiistaina tapasin sen miehen aamupäivällä. Vein pyörän omaan varastoon ja kuvasin ilmoituksen siellä. Tarkkaa kellonaikaa en osaa sanoa.',
            choice('Olen ymmärtänyt, että myyjä oli tuntematon, sovitte suullisesti ja maksoit käteisellä. Mitä korjaisit tai lisäisit?','summary'),
            choice('Mitkä ajat ovat arvioita ja mitä tietoja haluaisit meidän tarkistavan ennen johtopäätöksiä?','summary'),
            choice('Onko kertomuksessa jotain, jonka haluat täsmentää ennen kuin käsittelemme muuta aineistoa?','summary')),
        question('summary','Ne ajat ovat arvioita. Tapaaminen ja maksu menivät noin. En osaa nimetä ketään, joka olisi nähnyt. Mitä teillä sitten on siitä pyörästä?',
            choice('Tarkistettu runkonumero täsmää omistajan ennen varkautta tallentamiin tietoihin. Miten selität, että juuri tämä pyörä päätyi sulle?','evidence',true),
            choice('Yksilöinti on nyt vahvistettu. Se kertoo pyörästä, ei vielä tekijästä. Haluatko täydentää kertomustasi tämän tiedon perusteella?','evidence',true),
            choice('En esitä tunnistusta varmana ennen raportin tarkistusta. Keskeytetään tarvittaessa siksi aikaa.','inspection_pause')),
        question('evidence','No sitten se on kai ollut varastettu. Ei se vielä tarkoita, että mä sen varastin. En halua, että sä väität niin pelkän numeron takia.',
            choice('Ei tarkoitakaan. Mitä tietoja voimme tarkistaa siitä, miten sait pyörän?','reconsider'),
            choice('Olet oikeassa siitä, mitä numero osoittaa. Haluatko kertoa kaupasta jotain lisää tai korjata aiempaa?','reconsider'),
            choice('Voit jättää vastaamatta. Haluatko jatkaa, pyytää avustajan vai pitää tauon?','silence')),
        question('reconsider','Se kauppajuttu ei mennyt niin kuin kerroin. Haluaisin ensin avustajan. En halua selittää tätä enempää yksin.',
            choice('Keskeytetään. Järjestetään mahdollisuus avustajaan ennen jatkamista.','after_advice'),
            choice('Kirjaan pyynnön. Emme jatka asian kysymyksiä ennen kuin avustaja-asia on hoidettu.','after_advice'),
            choice('Kerro ensin, mistä hait pyörän, niin hoidetaan avustaja sen jälkeen.','rights_failure')),
        question('after_advice','Tauon jälkeen, avustajan kanssa: haluan kertoa. Otin pyörän kellarikomerosta maanantai-iltana. Käytin sorkkarautaa oveen. Vein pyörän mun varastoon. Se myyjä oli keksitty.',
            choice('Kerro tapahtumat omin sanoin. Mitä tapahtui ennen komeroa, siellä ja sen jälkeen?','account_act'),
            choice('Mitä haluat kertoa teosta ja siitä, mitä tavaroille tapahtui? En halua täydentää kertomusta sun puolesta.','account_act'),
            choice('En lupaa asiasta mitään seuraamusta. Jos haluat kertoa, aloita siitä, miten päädyit kellariin.','account_act')),
        question('account_act','Menin taloon, kun joku tuli ulos. Komeron ovi oli kiinni. Väänsin sen auki ja talutin pyörän pois. Mulla oli mukana kangaskassi. Laitoin rikotun riippulukon ja sorkkaraudan siihen. Ne ovat vielä samassa kassissa mun varastossa.',
            choice('Kuvaile tarkka paikka, kassi ja sisältö ennen kuin kukaan tarkistaa niitä.','location'),
            choice('Miten esineet voi erottaa muista samassa tilassa olevista tavaroista?','location'),
            choice('Mitä tietoja annat, joiden perusteella erillinen tutkija voi tarkistaa kertomuksen?','location')),
        question('location','Varasto on talon pihassa, numero neljä. Kassi on vasemman hyllyn alimmalla tasolla. Sininen kangaskassi, valkoiset kahvat. Sorkkaraudassa on punaista teippiä kahvan ympärillä. Lukon puolikkaat ovat pienessä sivutaskussa.',
            choice('Kirjaan kuvauksen ennen tarkistusta. Pyydän erillistä tutkijaa selvittämään sen lainmukaisesti.','verification'),
            choice('Varmistan, että paikka ja tuntomerkit kirjautuvat sun kertomina. Niitä verrataan erilliseen havaintoon.','verification'),
            choice('Kuvaus auttaa tarkistuksessa, mutta se ei vielä yksin vahvista tapahtumia. Selvitetään, mitä paikalta löytyy.','verification')),
        question('verification','Tarkistuksen jälkeen: avustaja kertoi, että kassi löytyi sieltä mistä sanoin. Se lukko oli siitä ovesta. En halua, että Sannaa vedetään tähän. En sopinut tästä sen kanssa mitään.',
            choice('Erillinen tarkistus vahvisti paikan ja etukäteen kuvaamasi esineet. Lukon osat sopivat omistajan talteen ottamaan vastakappaleeseen. Mitä korjaisit kertomuksessasi?','closing'),
            choice('Kirjaan myös sen, ettet kertomasi mukaan toiminut Sannan kanssa. Hänen osuutensa arvioidaan erikseen oman aineiston perusteella. Mitä haluat lisätä?','closing'),
            choice('Pidetään erillään sun kertomus, löydetyt esineet ja tutkijoiden havainnot. Käydään vielä läpi, että ne on kirjattu oikein.','closing')),
        question('closing','En halua muuttaa sitä, mitä kerroin ottamisesta. Kellonaika on silti arvio. Kertomuksessa pitää näkyä, että se myyjäjuttu oli ensin mun selitys ja korjasin sen vasta myöhemmin.',
            choice('Kirjaan molemmat kertomukset ja korjauksen ajankohdan. Tarkistat vielä kirjauksen ja saat esittää korjaukset.','pass'),
            choice('Merkitään kellonaika arvioksi. Käydään kirjaukset läpi ennen lopettamista.','pass'),
            choice('Lisätään täsmennys. Jatkosta ei tehdä tässä lupauksia; asia etenee kerätyn aineiston perusteella.','pass')),
        question('silence','En vastaa enää kysymyksiin. Haluan avustajan ennen kuin harkitsen jatkamista.',
            choice('Keskeytetään asian käsittely ja järjestetään avustaja. Kirjaan pyynnön ilman päätelmää syyllisyydestä.','silent_pass'),
            choice('Kunnioitan päätöstä. Jatkamme muuta tutkintaa ja selvitämme myös ostamista tukevat tiedot.','silent_pass'),
            choice('Jos et vastaa, kirjataan että myönnät ottaneesi pyörän.','rights_failure')),
        ending('inspection_pause','TARKISTUS KESKEN — EI HYLKÄYSTÄ. Et esittänyt keskeneräistä tunnistusta varmana. Tarkista runkonumeroraportti. Pelinkehittäjä vaihtaa bikeIdentityVerified-muuttujan arvoksi 1; testissä voit tehdä sen Test variables -paneelista. Tämän esimerkin keskustelu alkaa palatessa alusta.','inspection_required'),
        ending('rights_failure','HARJOITUS HYLÄTTY: oikeuksien kunnioittaminen. Avustajapyyntöä ei saa kiertää jatkokysymyksellä eikä vaikenemista kirjata tunnustukseksi. Keskeytä, korjaa menettely ja aloita harjoitus uudelleen. Mahdollinen tunnustus ei hyvitä tätä virhettä.','fail_rights'),
        ending('pass','HYVÄKSYTTY — TARKISTETTU LÄPIMURTO. Selvitit oikeudet, annoit tilaa omalle kertomukselle, tarkensit epävarmat kohdat ja käsittelit varmistetun pyörätunnistuksen rajoineen. Keskeytit avustajapyynnön vuoksi. Kirjasit uuden kuvauksen ennen erillistä tarkistusta ja annoit korjata kirjauksen. Esineiden löytyminen ja lukon osien sopivuus tukevat kertomusta. Tunnustus ei ollut yksin onnistumisen peruste eikä tämä ole tuomio. Sannan tutkintalinja on vielä käsiteltävä erikseen.','pass_corroborated'),
        ending('silent_pass','HYVÄKSYTTY OSASUORITUS — OIKEUS VAIETA. Kunnioitit vaikenemista ja avustajapyyntöä. Tässä haarassa tapaus ei ratkennut, eikä pelkkä pyörän hallussapito osoita murtoa. Jatka sekä syyllisyyttä tukevan että sitä vastaan puhuvan aineiston hankkimista. Lopputulos ei riipu siitä, suostuuko henkilö tunnustamaan.','pass_rights_case_open')
    ];
    const sanna = [
        question('start','Mulle sanottiin, että mua epäillään siitä kellarivarkaudesta. Kävin siellä kyllä, mutta hain omia tavaroita. En ottanut pyörää.',
            choice('Käydään ensin läpi epäily, oikeus vaieta ja avustajan käyttö. Varmistetaan myös, että voit osallistua nyt.','rights'),
            choice('En päättele kellarikäynnistä syyllisyyttä. Kerron oikeudet ja kysyn avustajasta ennen asian käsittelyä.','rights'),
            choice('Ennen kertomusta: saat olla vastaamatta ja käyttää avustajaa. Selvitetään, mitä tarvitset ennen aloittamista.','rights')),
        question('rights','Ymmärrän, että saan olla vastaamatta. En halua avustajaa nyt. Voin kertoa, olo on ihan hyvä. Saanhan pyytää taukoa, jos tarvitsen?',
            choice('Saat. Kerro omin sanoin koko kellarikäynnistä.','account'),
            choice('Saat, ja voit pyytää myös avustajan myöhemmin. Aloita siitä, miksi menit talolle.','account'),
            choice('Sovitaan niin. Kerro lähtötilanteesta siihen asti, kun poistuit talolta.','account')),
        question('account','Muutin viikonloppuna. Maanantaina hain loput tavarat mun omasta komerosta. Siellä oli sininen urheilukassi ja taitettava kuivausteline. Kävin siinä viiden jälkeen ja lähdin suoraan siskolle.',
            choice('Mihin kellonaika perustuu? Kerro erikseen se, minkä muistat, ja se, mitä arvioit.','time'),
            choice('Mitä teit juuri ennen käyntiä ja heti sen jälkeen?','time'),
            choice('Mikä auttaisi tarkistamaan käynnin ajankohdan?','time')),
        question('time','Sisko laittoi 16.58 viestin, että ruoka on kohta valmis. Kävin sen jälkeen kellarissa. En katsonut kelloa ovella. Kameran 17.20 kuulostaa mahdolliselta, mutta en itse muista minuuttia.',
            choice('Mitä kannoit ja miten tavarat voisi tunnistaa?','items'),
            choice('Kuvaile lähtö talosta ja se, mitä tapahtui tavaroille.','items'),
            choice('Pidän ajan omana arvionasi. Selvitän kantamuksen erikseen. Mitä kassissa oli?','items')),
        question('items','Vaatteita ja kengät. Kuivausteline oli kainalossa. Sisko tuli ulko-ovelle vastaan, ja jätin tavarat sen eteiseen. Ne ovat siellä vielä. Se näki, mitä kannoin.',
            choice('Miten saamme siskoon yhteyden, jotta hän voi kertoa omat havaintonsa erikseen?','check'),
            choice('Mitä muuta kuin siskon kertomus voisi auttaa varmistamaan tavarat ja ajankohdan?','check'),
            choice('Haluan tarkistaa myös sinua puoltavan selityksen. Annatko tiedot, joiden perusteella sitä voidaan selvittää?','check')),
        question('check','Voin antaa yhteystiedot. Mun viestit ovat puhelimessa. Sisko voi kertoa itse, mitä näki. En halua, että sanotte sille etukäteen, mitä sen pitäisi muistaa.',
            choice('Emme anna hänelle valmista kertomusta. Pyydän erillisen yhteydenoton ja tarkistamme viestien ajankohdat.','checked'),
            choice('Hyvä huomio. Vertaan erikseen saatua kertomusta kameraan ja muihin aikoihin.','checked'),
            choice('Tarkistamme myös omistajan viimeisen havainnon pyörästä, jotta käyntisi sijoittuu oikeaan ajanjaksoon.','checked')),
        question('checked','Tarkistusten jälkeen: sisko sanoi, että häneltä kysyttiin erikseen. Hän muisti kassin ja telineen. Kuulin myös, että pyörän omistaja oli nähnyt pyörän vielä mun käynnin jälkeen. Mitä se tarkoittaa mun kannalta?',
            choice('Erilliset tiedot tukevat tavaroiden noutoa. Omistajan kello 18 havainto on käyntisi jälkeen. Selvitän vielä, palasitko myöhemmin.','later'),
            choice('Kamera, viestit ja siskon oma kertomus sopivat yhteen. Onko samalta illalta muita käyntejä, joita emme ole käsitelleet?','later'),
            choice('Nämä ovat sinua puoltavia tietoja. Haluan varmistaa loppuillan ennen kuin teen yhteenvedon.','later')),
        question('later','En palannut. Söin siskolla ja jäin yöksi. Sillä on kuva meistä illallisella. Ei se kuva tietysti yksin todista koko yötä, mutta sisko voi kertoa, olinko siellä.',
            choice('Tarkistetaan hänen omat havaintonsa. Valokuvalle ei anneta enempää merkitystä kuin sillä on.','conclusion'),
            choice('Kirjaan tuon rajauksen. Vertaan kokonaisuutta muihin tietoihin enkä yhden kuvan kellonaikaan.','conclusion'),
            choice('Selvitän myös, onko mitään tietoa myöhemmästä paluusta. Pelkkä alkuperäinen epäily ei riitä pitämään asiaa avoinna.','conclusion')),
        question('conclusion','Kun nämä tarkistukset on tehty, jääkö se silti papereihin niin, että mua pidetään varkaana? Mä haluan, että oma selitys näkyy siinä myös.',
            choice('Kirjaan sekä alkuperäisen epäilyn että sen kumoavat tarkistukset. Tässä aineistossa ei ilmennyt tukea osallistumisellesi. Tarkistat oman kertomuksesi.','clear'),
            choice('Aineistoon kuuluvat myös sinua puoltavat tiedot ja niiden lähteet. Kerron tutkinnan tilanteen täsmällisesti, en lupaa päätöstä toisen puolesta.','clear'),
            choice('Käydään kirjaukset läpi ja korjataan virheet. Pelkkä kellarikäynti ei näiden tarkistusten jälkeen tue varkausselitystä.','clear')),
        ending('clear','HYVÄKSYTTY — EPÄILYÄ VASTAAN PUHUVA NÄYTTÖ SELVITETTY. Annoit vapaan kertomuksen, erotit muiston arviosta ja tarkistit selityksen erillisistä lähteistä. Sannan tavaroiden nouto varmistui, pyörä oli paikallaan käynnin jälkeen eikä lisätutkinnassa löytynyt tukea paluulle tai osallistumiselle. Kirjasit myös puoltavan aineiston. Sannan osalta epäilylle ei jää tässä skenaariossa tukea. Tämä ei yksin osoita Timoa tekijäksi.','pass_innocent')
    ];
    const project = {title:'Kellarikomeron sähköpyörä',description:'Suomenkielinen kuulusteluharjoitus: tietojen hankinta, oikeudet ja riippumaton varmistaminen. Pelaaja puhuu vain valinnoista. Fiktiivinen koulutusesimerkki, ei virallinen poliisin koulutusmateriaali.',settings:{},
        characters:[character(3,'Mikko Salmi – kollega','#405c85',colleague,100),character(1,'Timo Laine','#974b45',timo,1900),character(2,'Sanna Niemi','#38775c',sanna,3700)],
        gameIntegration:{firstInteractionCharacterID:3,variables:{bikeIdentityVerified:{type:'number',initialValue:0,requiredValue:1,setBy:'Pelinkehittäjä: runkonumeron ja omistajan asiakirjojen tarkistus. Dialogi ei muuta muuttujaa.'}}},
        training:{assessment:'Branch-based feedback at ending nodes; no hidden confession or trust score.',completion:'Timo: pass_corroborated plus Sanna: pass_innocent completes both investigation lines. pass_rights_case_open is a professional partial pass with the case unresolved.',
            stateChanges:'Only the engine sets bikeIdentityVerified. Rights, free account, clarification and corroboration are enforced by graph order. Outcomes are displayed in dialogue; trainingOutcome metadata is available for a developer to track across conversations.',
            timeSkips:'after_advice, verification, checked and conclusion represent completed off-screen procedural checks. The game does not claim to perform a real search or arrange counsel.',
            review:'Before operational training, have a Finnish police interviewing instructor review the scenario and assessment.',
            sources:['https://www.finlex.fi/fi/lainsaadanto/2011/805','https://poliisi.fi/rikoksen-tutkinta','https://poliisi.fi/-/polkupyoravarkauksien-maara-moninkertaistuu-kesaaikana']}};
    validateDialogueProject(project);
    return project;
}
module.exports = {buildBicycleTraining};
if (require.main === module) (async()=>{
    const project = buildBicycleTraining();
    const root = process.argv[2] || path.join(process.env.USERPROFILE,'Downloads');
    fs.mkdirSync(root,{recursive:true});
    const base=path.join(root,'Kellarikomeron_sahkopyora_kuulusteluharjoitus');
    fs.writeFileSync(base+'.json',JSON.stringify(project,null,2)+'\n');
    const runtime = require('../js/constructRuntime');
    const files=require('../js/exportConstruct').buildConstructProject(project,require('../js/constructTemplate'),runtime.createConstructDialogueSession,runtime.startConstructDialogueGame);
    fs.writeFileSync(base+'.c3p',Buffer.from(await createExportZip(files).arrayBuffer()));
    console.log(base); console.log(project.characters.map(c=>c.characterName+': '+c.dialogueNodes.length+' nodes').join('\n'));
})().catch(error=>{console.error(error);process.exitCode=1;});
