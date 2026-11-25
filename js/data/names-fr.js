// Noms français des cartes.
// L'API ne fournit que les noms anglais : on traduit l'espèce et on remet en
// ordre les préfixes/suffixes à la française (« Cynthia's Garchomp ex » ->
// « Carchacrok ex de Cynthia »). Un nom inconnu est laissé tel quel.

/** Espèces dont le nom diffère entre l'anglais et le français : « Anglais=Français ». */
const DIFFERENT = `
Bulbasaur=Bulbizarre;Ivysaur=Herbizarre;Venusaur=Florizarre;Charmander=Salamèche;Charmeleon=Reptincel;Charizard=Dracaufeu;
Squirtle=Carapuce;Wartortle=Carabaffe;Blastoise=Tortank;Caterpie=Chenipan;Metapod=Chrysacier;Butterfree=Papilusion;
Weedle=Aspicot;Kakuna=Coconfort;Beedrill=Dardargnan;Pidgey=Roucool;Pidgeotto=Roucoups;Pidgeot=Roucarnage;Raticate=Rattatac;
Spearow=Piafabec;Fearow=Rapasdepic;Ekans=Abo;Sandshrew=Sabelette;Sandslash=Sablaireau;Clefairy=Mélofée;Clefable=Mélodelfe;
Vulpix=Goupix;Ninetales=Feunard;Jigglypuff=Rondoudou;Wigglytuff=Grodoudou;Zubat=Nosferapti;Golbat=Nosferalto;Oddish=Mystherbe;
Gloom=Ortide;Vileplume=Rafflesia;Venonat=Mimitoss;Venomoth=Aéromite;Diglett=Taupiqueur;Dugtrio=Triopikeur;Meowth=Miaouss;
Psyduck=Psykokwak;Golduck=Akwakwak;Mankey=Férosinge;Primeape=Colossinge;Growlithe=Caninos;Arcanine=Arcanin;Poliwag=Ptitard;
Poliwhirl=Têtarte;Poliwrath=Tartard;Machop=Machoc;Machoke=Machopeur;Machamp=Mackogneur;Bellsprout=Chétiflor;
Weepinbell=Boustiflor;Victreebel=Empiflor;Geodude=Racaillou;Graveler=Gravalanch;Golem=Grolem;Rapidash=Galopa;
Slowpoke=Ramoloss;Slowbro=Flagadoss;Magnemite=Magnéti;Magneton=Magnéton;Farfetch'd=Canarticho;Seel=Otaria;Dewgong=Lamantine;
Grimer=Tadmorv;Muk=Grotadmorv;Shellder=Kokiyas;Cloyster=Crustabri;Gastly=Fantominus;Haunter=Spectrum;Gengar=Ectoplasma;
Drowzee=Soporifik;Hypno=Hypnomade;Kingler=Krabboss;Voltorb=Voltorbe;Electrode=Électrode;Exeggcute=Noeunoeuf;
Exeggutor=Noadkoko;Cubone=Osselait;Marowak=Ossatueur;Hitmonlee=Kicklee;Hitmonchan=Tygnon;Lickitung=Excelangue;
Koffing=Smogo;Weezing=Smogogo;Rhyhorn=Rhinocorne;Rhydon=Rhinoféros;Chansey=Leveinard;Tangela=Saquedeneu;
Kangaskhan=Kangourex;Horsea=Hypotrempe;Seadra=Hypocéan;Goldeen=Poissirène;Seaking=Poissoroy;Staryu=Stari;Starmie=Staross;
Mr. Mime=M. Mime;Scyther=Insécateur;Jynx=Lippoutou;Electabuzz=Élektek;Pinsir=Scarabrute;Magikarp=Magicarpe;
Gyarados=Léviator;Lapras=Lokhlass;Ditto=Métamorph;Eevee=Évoli;Vaporeon=Aquali;Jolteon=Voltali;Flareon=Pyroli;
Omanyte=Amonita;Omastar=Amonistar;Aerodactyl=Ptéra;Snorlax=Ronflex;Articuno=Artikodin;Zapdos=Électhor;Moltres=Sulfura;
Dratini=Minidraco;Dragonair=Draco;Dragonite=Dracolosse;
Chikorita=Germignon;Bayleef=Macronium;Meganium=Méganium;Cyndaquil=Héricendre;Quilava=Feurisson;Totodile=Kaiminus;
Croconaw=Crocrodil;Feraligatr=Aligatueur;Sentret=Fouinette;Furret=Fouinar;Noctowl=Noarfang;Ledyba=Coxy;Ledian=Coxyclaque;
Spinarak=Mimigal;Ariados=Migalos;Crobat=Nostenfer;Chinchou=Loupio;Cleffa=Mélo;Igglybuff=Toudoudou;Mareep=Wattouat;
Flaaffy=Lainergie;Ampharos=Pharamp;Bellossom=Joliflor;Sudowoodo=Simularbre;Politoed=Tarpaud;Hoppip=Granivol;
Skiploom=Floravol;Jumpluff=Cotovol;Aipom=Capumain;Sunkern=Tournegrin;Sunflora=Héliatronc;Wooper=Axoloto;
Quagsire=Maraiste;Espeon=Mentali;Umbreon=Noctali;Murkrow=Cornèbre;Slowking=Roigada;Misdreavus=Feuforêve;Unown=Zarbi;
Wobbuffet=Qulbutoké;Pineco=Pomdepik;Forretress=Foretress;Dunsparce=Insolourdo;Gligar=Scorplane;Scizor=Cizayox;
Shuckle=Caratroc;Heracross=Scarhino;Sneasel=Farfuret;Slugma=Limagma;Magcargo=Volcaropod;Swinub=Marcacrin;
Piloswine=Cochignon;Corsola=Corayon;Remoraid=Rémoraid;Delibird=Cadoizo;Mantine=Démanta;Skarmory=Airmure;
Houndour=Malosse;Houndoom=Démolosse;Kingdra=Hyporoi;Stantler=Cerfrousse;Smeargle=Queulorior;Tyrogue=Debugant;
Hitmontop=Kapoera;Smoochum=Lippouti;Elekid=Élekid;Miltank=Écrémeuh;Blissey=Leuphorie;Larvitar=Embrylex;
Pupitar=Ymphect;Tyranitar=Tyranocif;
Treecko=Arcko;Grovyle=Massko;Sceptile=Jungko;Torchic=Poussifeu;Combusken=Galifeu;Blaziken=Braségali;Mudkip=Gobou;
Marshtomp=Flobio;Swampert=Laggron;Poochyena=Medhyèna;Mightyena=Grahyèna;Zigzagoon=Zigzaton;Linoone=Linéon;
Lotad=Nénupiot;Seedot=Grainipiot;Nuzleaf=Pifeuil;Shiftry=Tengalice;Taillow=Nirondelle;Swellow=Hélédelle;
Wingull=Goélise;Pelipper=Bekipan;Ralts=Tarsal;Shroomish=Balignon;Breloom=Chapignon;Slakoth=Parecool;
Slaking=Monaflèmit;Nincada=Ningale;Shedinja=Munja;Whismur=Chuchmur;Loudred=Ramboum;Exploud=Brouhabam;
Nosepass=Tarinor;Sableye=Ténéfix;Mawile=Mysdibule;Aron=Galekid;Lairon=Galegon;Aggron=Galeking;Meditite=Méditikka;
Medicham=Charmina;Electrike=Dynavolt;Manectric=Élecsprint;Plusle=Posipi;Minun=Négapi;Volbeat=Muciole;
Illumise=Lumivole;Roselia=Rosélia;Gulpin=Gloupti;Swalot=Avaltout;Numel=Chamallot;Camerupt=Camérupt;Torkoal=Chartor;
Grumpig=Groret;Trapinch=Kraknoix;Vibrava=Vibraninf;Flygon=Libégon;Swablu=Tylton;Zangoose=Mangriff;Seviper=Séviper;
Lunatone=Séléroc;Solrock=Solaroc;Barboach=Barloche;Whiscash=Barbicha;Corphish=Écrapince;Crawdaunt=Colhomard;
Baltoy=Balbuto;Claydol=Kaorine;Lileep=Lilia;Cradily=Vacilys;Feebas=Barpau;Milotic=Milobellus;Castform=Morphéo;
Shuppet=Polichombr;Banette=Branette;Duskull=Skelénox;Dusclops=Téraclope;Chimecho=Éoko;Wynaut=Okéoké;
Snorunt=Stalgamin;Glalie=Oniglali;Spheal=Obalie;Sealeo=Phogleur;Walrein=Kaimorse;Clamperl=Coquiperl;
Huntail=Serpang;Gorebyss=Rosabyss;Luvdisc=Lovdisc;Bagon=Draby;Shelgon=Drackhaus;Salamence=Drattak;Beldum=Terhal;
Metang=Métang;Metagross=Métalosse;
Turtwig=Tortipouss;Grotle=Boskara;Chimchar=Ouisticram;Monferno=Chimpenfeu;Infernape=Simiabraz;Piplup=Tiplouf;
Prinplup=Prinplouf;Empoleon=Pingoléon;Starly=Étourmi;Staravia=Étourvol;Staraptor=Étouraptor;Bidoof=Keunotor;
Bibarel=Castorno;Shinx=Lixy;Budew=Rozbouton;Cranidos=Kranidos;Rampardos=Charkos;Shieldon=Dinoclier;
Combee=Apitrini;Vespiquen=Apireine;Buizel=Mustébouée;Floatzel=Mustéflott;Cherubi=Ceribou;Cherrim=Ceriflor;
Shellos=Sancoki;Gastrodon=Tritosor;Ambipom=Capidextre;Drifloon=Baudrive;Drifblim=Grodrive;Buneary=Laporeille;
Lopunny=Lockpin;Mismagius=Magirêve;Honchkrow=Corboss;Glameow=Chaglam;Purugly=Chaffreux;Stunky=Moufouette;
Skuntank=Moufflair;Bronzor=Archéomire;Bronzong=Archéodong;Bonsly=Manzaï;Happiny=Ptiravi;Chatot=Pijako;
Gible=Griknot;Gabite=Carmache;Garchomp=Carchacrok;Munchlax=Goinfrex;Hippowdon=Hippodocus;Skorupi=Rapion;
Drapion=Drascore;Croagunk=Cradopaud;Toxicroak=Coatox;Carnivine=Vortente;Finneon=Écayon;Lumineon=Luminéon;
Mantyke=Babimanta;Snover=Blizzi;Abomasnow=Blizzaroi;Weavile=Dimoret;Magnezone=Magnézone;Lickilicky=Coudlangue;
Rhyperior=Rhinastoc;Tangrowth=Bouldeneu;Electivire=Élekable;Magmortar=Maganon;Leafeon=Phyllali;Glaceon=Givrali;
Gliscor=Scorvol;Mamoswine=Mammochon;Gallade=Gallame;Probopass=Tarinorme;Dusknoir=Noctunoir;Froslass=Momartik;
Rotom=Motisma;Uxie=Créhelf;Mesprit=Créfollet;Azelf=Créfadet;
Snivy=Vipélierre;Servine=Lianaja;Serperior=Majaspic;Tepig=Gruikui;Pignite=Grotichon;Emboar=Roitiflam;
Oshawott=Moustillon;Dewott=Mateloutre;Samurott=Clamiral;Minccino=Chinchidou;Cinccino=Pashmilla;
Simisage=Feuiloutan;Simisear=Flamoutan;Simipour=Flotoutan;Pansage=Feuillajou;Pansear=Flamajou;Panpour=Flotajou;
Unfezant=Déflaisan;Scolipede=Brutapode;Seismitoad=Crapustule;Dwebble=Crabicoque;Crustle=Crabaraque;
Deerling=Vivaldaim;Sawsbuck=Haydaim;Petilil=Chlorobule;Lilligant=Fragilady;Whimsicott=Farfaduvet;
Gothita=Scrutella;Gothorita=Mesmérella;Gothitelle=Sidérella;Reuniclus=Symbios;Ducklett=Couaneton;
Swanna=Lakmécygne;Vanillite=Sorbébé;Chandelure=Lugulabre;Litwick=Funécire;Lampent=Mélancolux;Axew=Coupenotte;
Fraxure=Incisache;Haxorus=Tranchodon;Cubchoo=Polarhume;Beartic=Polagriffe;Cryogonal=Hexagel;Mienfoo=Kungfouine;
Mienshao=Shaofouine;Druddigon=Drakkarmin;Golett=Gringolem;Golurk=Golemastoc;Pawniard=Scalpion;Bisharp=Scalproie;
Bouffalant=Frison;Rufflet=Furaiglon;Braviary=Gueriaigle;Vullaby=Vostourno;Mandibuzz=Vaututrice;Heatmor=Aflamanoir;
Durant=Fermite;Deino=Solochi;Zweilous=Diamat;Hydreigon=Trioxhydre;Larvesta=Pyronille;Volcarona=Pyrax;
Cobalion=Cobaltium;Terrakion=Terrakium;Virizion=Viridium;Tornadus=Boréas;Thundurus=Fulguris;Landorus=Démétéros;
Excadrill=Minotaupe;Audino=Nanméouïe;Conkeldurr=Bétochef;Darmanitan=Darumacho;Darumaka=Darumarond;
Krookodile=Crocorible;Scrafty=Baggaïd;Sigilyph=Cryptéro;Archeops=Aéroptéryx;Garbodor=Miasmax;Galvantula=Mygavolt;
Ferrothorn=Noacier;Klinklang=Cliticlic;Eelektross=Ohmassacre;Elgyem=Lewsor;Beheeyem=Neitram;Basculin=Bargantua;
Amoonguss=Gaulet;Jellicent=Moyade;Alomomola=Mamanbo;Stunfisk=Limonde;Accelgor=Limaspeed;Escavalier=Lançargot;
Chespin=Marisson;Quilladin=Boguérisse;Chesnaught=Blindépique;Fennekin=Feunnec;Braixen=Roussil;Delphox=Goupelin;
Froakie=Grenousse;Frogadier=Croâporal;Greninja=Amphinobi;Fletchling=Passerouge;Talonflame=Flambusard;
Vivillon=Prismillon;Pyroar=Némélios;Pancham=Pandespiègle;Pangoro=Pandarbare;Meowstic=Mistigrix;Aegislash=Exagide;
Honedge=Monorpale;Doublade=Dimoclès;Aromatisse=Cocotine;Slurpuff=Cupcanaille;Malamar=Sepiatroce;
Dragalge=Kravarech;Clawitzer=Gamblast;Heliolisk=Iguolta;Tyrantrum=Rexillius;Sylveon=Nymphali;Hawlucha=Brutalibré;
Carbink=Strassie;Goomy=Mucuscule;Sliggoo=Colimucus;Goodra=Muplodocus;Klefki=Trousselin;Trevenant=Desséliande;
Phantump=Brocélôme;Gourgeist=Banshitrouye;Pumpkaboo=Pitrouille;Avalugg=Séracrawl;Noibat=Sonistrelle;
Noivern=Bruyverne;
Rowlet=Brindibou;Dartrix=Efflèche;Decidueye=Archéduc;Litten=Flamiaou;Torracat=Matoufeu;Incineroar=Félinferno;
Popplio=Otaquin;Brionne=Otarlette;Primarina=Oratoria;Toucannon=Bazoucan;Gumshoos=Argouste;Vikavolt=Lucanon;
Oricorio=Plumeline;Ribombee=Rubombelle;Lycanroc=Lougaroc;Rockruff=Rocabot;Wishiwashi=Froussardine;
Toxapex=Prédastérie;Mudsdale=Bourrinos;Araquanid=Tarenbulle;Lurantis=Floramantis;Salazzle=Malamandre;
Salandit=Tritox;Bewear=Chelours;Tsareena=Sucreine;Comfey=Guérilande;Oranguru=Gouroutan;Passimian=Quartermac;
Golisopod=Sarmuraï;Palossand=Trépassable;Pyukumuku=Concombaffe;Silvally=Silvallié;Minior=Météno;Komala=Dodoala;
Turtonator=Boumata;Mimikyu=Mimiqui;Bruxish=Denticrisse;Drampa=Draïeul;Dhelmise=Sinistrail;Jangmo-o=Bébécaille;
Hakamo-o=Écaïd;Kommo-o=Ékaïser;Tapu Koko=Tokorico;Tapu Lele=Tokopiyon;Tapu Bulu=Tokotoro;Tapu Fini=Tokopisco;
Cosmoem=Cosmovum;Nihilego=Zéroïd;Buzzwole=Mouscoto;Pheromosa=Cancrelove;Xurkitree=Câblifère;
Celesteela=Bamboiselle;Kartana=Katagami;Guzzlord=Engloutyran;Poipole=Vémini;Naganadel=Mandrillon;
Stakataka=Ama-Ama;Blacephalon=Pierroteknik;
Grookey=Ouistempo;Thwackey=Badabouin;Rillaboom=Gorythmic;Scorbunny=Flambino;Raboot=Lapyro;Cinderace=Pyrobut;
Sobble=Larméléon;Drizzile=Arrozard;Inteleon=Lézargus;Skwovet=Rongourmand;Greedent=Rongrigou;Rookidee=Minisange;
Corvisquire=Bleuseille;Corviknight=Corvaillus;Dottler=Coléodôme;Orbeetle=Astronelle;Nickit=Goupilou;
Thievul=Roublenard;Gossifleur=Tournicoton;Eldegoss=Blancoton;Wooloo=Moumouton;Dubwool=Moumouflon;
Chewtle=Khélocrok;Drednaw=Torgamord;Yamper=Voltoutou;Boltund=Fulgudog;Rolycoly=Charbi;Carkol=Wagomine;
Coalossal=Monthracite;Applin=Verpom;Flapple=Pomdrapi;Appletun=Dratatin;Silicobra=Dunaja;Sandaconda=Dunaconda;
Cramorant=Nigosier;Arrokuda=Embrochet;Barraskewda=Hastacuda;Toxel=Toxizap;Toxtricity=Salarsen;
Sizzlipede=Grillepattes;Centiskorch=Scolocendre;Clobbopus=Poulpaf;Grapploct=Krakos;Sinistea=Théffroi;
Polteageist=Polthégeist;Hatenna=Bibichut;Hattrem=Chapotus;Hatterene=Sorcilence;Impidimp=Grimalin;
Morgrem=Fourbelin;Grimmsnarl=Angoliath;Obstagoon=Ixon;Perrserker=Berserkatt;Cursola=Corayôme;
Sirfetch'd=Palarticho;Mr. Rime=M. Glaquette;Runerigus=Tutétékri;Milcery=Crèmy;Alcremie=Charmilly;
Falinks=Hexadron;Pincurchin=Wattapik;Snom=Frissonille;Frosmoth=Beldeneige;Stonjourner=Dolman;Eiscue=Bekaglaçon;
Indeedee=Wimessir;Cufant=Charibari;Copperajah=Pachyradjah;Dracozolt=Galvagon;Arctozolt=Galvagla;
Dracovish=Hydragon;Arctovish=Hydragla;Duraludon=Duralugon;Dreepy=Fantyrm;Drakloak=Dispareptil;
Dragapult=Lanssorien;Eternatus=Éthernatos;Kubfu=Wushours;Urshifu=Shifours;Glastrier=Blizzeval;
Spectrier=Spectreval;Calyrex=Sylveroy;Wyrdeer=Cerbyllin;Kleavor=Hachécateur;Ursaluna=Ursaking;
Basculegion=Paragruel;Sneasler=Farfurex;Overqwil=Qwilpik;Enamorus=Amovénus;
Sprigatito=Poussacha;Floragato=Matourgeon;Meowscarada=Miascarade;Fuecoco=Chochodile;Crocalor=Crocogril;
Skeledirge=Flâmigator;Quaxly=Coiffeton;Quaxwell=Canarbello;Quaquaval=Palmaval;Lechonk=Gourmelet;
Oinkologne=Fragroin;Pawmi=Pohm;Pawmo=Pohmotte;Pawmot=Pohmarmotte;Tandemaus=Compagnol;Maushold=Famignol;
Fidough=Pâtachiot;Dachsbun=Briochien;Smoliv=Olivini;Dolliv=Olivado;Nacli=Selutin;Naclstack=Amassel;
Garganacl=Gigansel;Charcadet=Charbambin;Armarouge=Carmadura;Ceruledge=Malvalame;Tadbulb=Têtampoule;
Bellibolt=Ampibidou;Wattrel=Zapétrel;Kilowattrel=Fulgulairo;Maschiff=Grondogue;Mabosstiff=Dogrino;
Tinkatink=Forgerette;Tinkatuff=Forgella;Tinkaton=Forgelina;Wiglett=Taupikeau;Wugtrio=Triopikeau;
Finizen=Dofin;Palafin=Superdofin;Varoom=Vrombi;Revavroom=Vrombotor;Cyclizar=Motorizard;Glimmet=Germéclat;
Glimmora=Floréclat;Greavard=Toutombe;Houndstone=Tomberro;Cetoddle=Piétacé;Cetitan=Balbalèze;Dondozo=Oyacata;
Tatsugiri=Nigirigon;Annihilape=Courrousinge;Clodsire=Terraiste;Dudunsparce=Deusolourdo;Kingambit=Scalpereur;
Great Tusk=Fort-Ivoire;Scream Tail=Hurle-Queue;Brute Bonnet=Fongus-Furie;Flutter Mane=Flotte-Mèche;
Slither Wing=Rampe-Ailes;Sandy Shocks=Pelage-Sablé;Iron Treads=Roue-de-Fer;Iron Bundle=Hotte-de-Fer;
Iron Hands=Paume-de-Fer;Iron Jugulis=Têtes-de-Fer;Iron Moth=Mite-de-Fer;Iron Thorns=Épine-de-Fer;
Frigibax=Frigodo;Arctibax=Cryodo;Baxcalibur=Glaivodo;Gimmighoul=Mordudor;Gholdengo=Gromago;
Wo-Chien=Chongjian;Chien-Pao=Baojian;Ting-Lu=Dinglu;Chi-Yu=Yuyu;Roaring Moon=Rugit-Lune;
Iron Valiant=Garde-de-Fer;Walking Wake=Serpente-Eau;Iron Leaves=Vert-de-Fer;Dipplin=Pomdramour;
Sinistcha=Théffroyable;Archaludon=Pondralugon;Hydrapple=Pomdorochi;Gouging Fire=Feu-Perçant;
Raging Bolt=Ire-Foudre;Iron Boulder=Roc-de-Fer;Iron Crown=Chef-de-Fer;Pecharunt=Pêchaminus;
Okidogi=Félicanis;Munkidori=Fortusimia;Fezandipiti=Favianos
`;

/** Espèces au nom identique dans les deux langues. */
const SAME = `
Rattata Arbok Pikachu Raichu Nidorina Nidoqueen Nidorino Nidoking Paras Parasect Persian Abra Kadabra Alakazam
Tentacool Tentacruel Ponyta Doduo Dodrio Onix Krabby Magmar Tauros Porygon Kabuto Kabutops Mewtwo Mew
Typhlosion Hoothoot Lanturn Pichu Togepi Togetic Natu Xatu Marill Azumarill Yanma Girafarig Steelix Snubbull
Granbull Qwilfish Teddiursa Ursaring Octillery Phanpy Donphan Porygon2 Magby Raikou Entei Suicune Lugia Ho-Oh Celebi
Lombre Ludicolo Kirlia Gardevoir Vigoroth Ninjask Makuhita Hariyama Azurill Skitty Delcatty Carvanha Sharpedo
Wailmer Wailord Spoink Spinda Cacnea Cacturne Altaria Anorith Armaldo Kecleon Tropius Absol Relicanth Regirock
Regice Registeel Latias Latios Kyogre Groudon Rayquaza Jirachi Deoxys
Torterra Luxio Luxray Roserade Bastiodon Pachirisu Spiritomb Riolu Lucario Hippopotas Togekiss Yanmega Porygon-Z
Dialga Palkia Heatran Regigigas Giratina Cresselia Phione Manaphy Darkrai Shaymin Arceus
Victini Zorua Zoroark Emolga Reshiram Zekrom Kyurem Keldeo Meloetta Genesect
Florges Aurorus Dedenne Xerneas Yveltal Zygarde Diancie Hoopa Volcanion
Crabominable Togedemaru Cosmog Solgaleo Lunala Necrozma Magearna Marshadow Zeraora Meltan Melmetal
Morpeko Zacian Zamazenta Zarude Regieleki Regidrago
Arboliva Farigiraf Koraidon Miraidon Poltchageist Ogerpon Terapagos
`;

/** Complément pour le catalogue complet : espèces des générations 3 à 8 absentes du fonds de démonstration. */
const MORE = `
Wurmple=Chenipotte;Silcoon=Armulys;Beautifly=Charmillon;Cascoon=Blindalys;Dustox=Papinox;Surskit=Arakdo;Masquerain=Maskadra;
Kricketot=Crikzik;Kricketune=Mélokrik;Burmy=Cheniti;Wormadam=Cheniselle;Mothim=Papilord;Chingling=Korillon;Mime Jr.=Mime Jr.;
Carnivine=Vortente;Probopass=Tarinorme;Froslass=Momartik;Drapion=Drascore;Mamoswine=Mammochon;Rhyperior=Rhinastoc;
Hippowdon=Hippodocus;Gliscor=Scorvol;Dusknoir=Noctunoir;Lickilicky=Coudlangue;Weavile=Dimoret;Electivire=Élekable;
Toxicroak=Coatox;Gallade=Gallame;
Patrat=Ratentif;Watchog=Miradar;Lillipup=Ponchiot;Herdier=Ponchien;Stoutland=Mastouffe;Purrloin=Chacripan;Liepard=Léopardus;
Pidove=Poichigeon;Tranquill=Colombeau;Blitzle=Zébibron;Zebstrika=Zéblitz;Roggenrola=Nodulithe;Boldore=Géolithe;
Gigalith=Gigalithe;Woobat=Chovsourir;Swoobat=Rhinolove;Drilbur=Rototaupe;Timburr=Charpenti;Gurdurr=Ouvrifier;
Tympole=Tritonde;Palpitoad=Batracné;Throh=Judokrak;Sawk=Karaclée;Sewaddle=Larveyette;Swadloon=Couverdure;
Leavanny=Manternel;Venipede=Venipatte;Whirlipede=Scobolide;Cottonee=Doudouvet;Sandile=Mascaïman;Krokorok=Escroco;
Maractus=Maracachi;Scraggy=Baggiguane;Yamask=Tutafeh;Cofagrigus=Tutankafer;Tirtouga=Carapagos;Carracosta=Mégapagos;
Archen=Arkéapti;Trubbish=Miamiasme;Solosis=Nucléos;Duosion=Méios;Vanillish=Sorboul;Vanilluxe=Sorbouboul;
Karrablast=Carabing;Foongus=Trompignon;Frillish=Viskuse;Joltik=Statitik;Ferroseed=Grindur;Klink=Tic;Klang=Clic;
Tynamo=Anchwatt;Eelektrik=Lampéroie;Shelmet=Escargaume;Musharna=Mushana;Hydreigon=Trioxhydre;
Bunnelby=Sapereau;Diggersby=Excavarenne;Fletchinder=Braisillon;Scatterbug=Lépidonille;Spewpa=Pérégrain;Litleo=Hélionceau;
Skiddo=Cabriolaine;Gogoat=Chevroum;Furfrou=Couafarel;Espurr=Psystigri;Spritzee=Fluvetin;Swirlix=Sucroquin;Inkay=Sepiatop;
Binacle=Opermine;Barbaracle=Golgopathe;Skrelp=Venalgue;Clauncher=Flingouste;Helioptile=Galvaran;Tyrunt=Ptyranidur;
Amaura=Amagara;Bergmite=Grelaçon;
Pikipek=Picassaut;Trumbeak=Piclairon;Yungoos=Manglouton;Grubbin=Larvibule;Charjabug=Chrysapile;Crabrawler=Crabagarre;
Cutiefly=Bombydou;Mareanie=Vorastérie;Mudbray=Tiboudet;Dewpider=Araqua;Fomantis=Mimantis;Morelull=Spododo;
Shiinotic=Lampignon;Stufful=Nounourson;Bounsweet=Croquine;Steenee=Candine;Wimpod=Sovkipou;Sandygast=Bacabouh;
Type: Null=Type:0;Blipbug=Larvadar
`;

/** Espèces de ce complément dont le nom ne change pas. */
const MORE_SAME = 'Munna Flabébé Floette Nidoran Bastiodon';

const SPECIES = new Map([['Ho-oh', 'Ho-Oh'], ['Nidoran ♂', 'Nidoran♂'], ['Nidoran ♀', 'Nidoran♀'], ['Nidoran♀', 'Nidoran♀'], ['Nidoran♂', 'Nidoran♂']]);
`${DIFFERENT};${MORE}`.split(';').forEach((pair) => {
  const [en, fr] = pair.trim().split('=');
  if (en && fr) SPECIES.set(en, fr);
});
`${SAME} ${MORE_SAME}`.split(/\s+/).filter(Boolean).forEach((n) => SPECIES.set(n, n));

/** Possessifs : « Cynthia's X » -> « X de Cynthia ». */
const OWNERS = [
  ["Team Rocket's", 'de la Team Rocket'],
  ["Team Aqua's", 'de la Team Aqua'],
  ["Team Magma's", 'de la Team Magma'],
  ["Rocket's", 'de Rocket'],
  ["Holon's", 'de Holon'],
  ["Ash's", 'de Sacha'],
  ["Lance's", 'de Peter'],
  ["Rocket's", 'de Rocket'],
  ["Ethan's", 'de Luth'],
  ["Cynthia's", 'de Cynthia'],
  ["Misty's", "d'Ondine"],
  ["Brock's", 'de Pierre'],
  ["Lt. Surge's", 'du Major Bob'],
  ["Erika's", "d'Erika"],
  ["Sabrina's", 'de Morgane'],
  ["Blaine's", "d'Auguste"],
  ["Koga's", 'de Koga'],
  ["Giovanni's", 'de Giovanni'],
  ["Hop's", 'de Nabil'],
  ["Lillie's", 'de Lilie'],
  ["Iono's", 'de Mashynn'],
  ["Marnie's", 'de Rosemary'],
  ["Steven's", 'de Pierre Rochard'],
  ["Arven's", 'de Pepper'],
  ["N's", 'de N'],
];

/** Formes et variantes : motif anglais -> mise en forme française. */
const FORMS = [
  [/^Mega (.+?)( [XY])?$/, (m, sp) => `Méga-${sp(m[1])}${m[2] || ''}`],
  [/^M (.+)$/, (m, sp) => `M-${sp(m[1])}`],
  [/^Radiant (.+)$/, (m, sp) => `${sp(m[1])} Radieux`],
  [/^Shining (.+)$/, (m, sp) => `${sp(m[1])} Brillant`],
  [/^Dark (.+)$/, (m, sp) => `${sp(m[1])} Obscur`],
  [/^Light (.+)$/, (m, sp) => `${sp(m[1])} Lumineux`],
  [/^Galarian (.+)$/, (m, sp) => `${sp(m[1])} de Galar`],
  [/^Alolan (.+)$/, (m, sp) => `${sp(m[1])} d'Alola`],
  [/^Hisuian (.+)$/, (m, sp) => `${sp(m[1])} de Hisui`],
  [/^Paldean (.+)$/, (m, sp) => `${sp(m[1])} de Paldea`],
  [/^Origin Forme (.+)$/, (m, sp) => `${sp(m[1])} Forme Originelle`],
  [/^Flying (.+)$/, (m, sp) => `${sp(m[1])} Volant`],
  [/^Surfing (.+)$/, (m, sp) => `${sp(m[1])} Surfeur`],
  [/^Special Delivery (.+)$/, (m, sp) => `${sp(m[1])} Livraison Spéciale`],
  [/^Detective (.+)$/, (m, sp) => `Détective ${sp(m[1])}`],
  [/^Primal (.+)$/, (m, sp) => `Primo-${sp(m[1])}`],
  [/^(Heat|Wash|Frost|Fan|Mow) Rotom$/, (m) => `Motisma ${{ Heat: 'Chaleur', Wash: 'Lavage', Frost: 'Froid', Fan: 'Hélice', Mow: 'Tonte' }[m[1]]}`],
  [/^Deoxys (Normal|Attack|Defense|Speed) Forme$/, (m) => `Deoxys Forme ${{ Normal: 'Normale', Attack: 'Attaque', Defense: 'Défense', Speed: 'Vitesse' }[m[1]]}`],
  [/^(Burmy|Wormadam) (Plant|Sandy|Trash) Cloak$/, (m, sp) => `${sp(m[1])} Cape ${{ Plant: 'Plante', Sandy: 'Sable', Trash: 'Déchet' }[m[2]]}`],
  [/^(Shellos|Gastrodon) (East|West) Sea$/, (m, sp) => `${sp(m[1])} Mer ${m[2] === 'East' ? 'Orient' : 'Occident'}`],
  [/^Armored (Mewtwo)$/, (m, sp) => `${sp(m[1])} Armure`],
  [/^Ultra (Necrozma)$/, (m, sp) => `Ultra-${sp(m[1])}`],
  [/^Dusk Mane (Necrozma)$/, (m, sp) => `${sp(m[1])} Crinière du Couchant`],
  [/^Dawn Wings (Necrozma)$/, (m, sp) => `${sp(m[1])} Ailes de l'Aurore`],
  [/^(White|Black) (Kyurem)$/, (m, sp) => `${sp(m[2])} ${m[1] === 'White' ? 'Blanc' : 'Noir'}`],
  [/^Shadow Rider (Calyrex)$/, (m, sp) => `${sp(m[1])} Cavalier d'Effroi`],
  [/^Ice Rider (Calyrex)$/, (m, sp) => `${sp(m[1])} Cavalier du Froid`],
  [/^Rapid Strike (Urshifu)$/, (m, sp) => `${sp(m[1])} Mille Poings`],
  [/^Single Strike (Urshifu)$/, (m, sp) => `${sp(m[1])} Poing Final`],
  [/^Bloodmoon (Ursaluna)$/, (m, sp) => `${sp(m[1])} Lune Vermeille`],
  [/^Teal Mask (Ogerpon)$/, (m, sp) => `${sp(m[1])} Masque Turquoise`],
  [/^Hearthflame Mask (Ogerpon)$/, (m, sp) => `${sp(m[1])} Masque du Fourneau`],
  [/^Wellspring Mask (Ogerpon)$/, (m, sp) => `${sp(m[1])} Masque du Puits`],
  [/^Cornerstone Mask (Ogerpon)$/, (m, sp) => `${sp(m[1])} Masque de la Pierre`],
  [/^(.+) with Grey Felt Hat$/, (m, sp) => `${sp(m[1])} au chapeau de feutre gris`],
  [/^(.+) \[([A-Z?!])\]$/, (m, sp) => `${sp(m[1])} [${m[2]}]`],
];

const SUFFIX = /^(.*?)(-GX|-EX| ex| EX| GX| V-UNION| VMAX| VSTAR| V| BREAK| LV\.X| ★| δ| ◇| E4| GL| FB| G| C| 4| LEGEND)$/;

/** Découpe un nom anglais et traduit ; `known` passe à false si une espèce manque. */
function translate(en) {
  let known = true;
  const sp = (name) => {
    const fr = SPECIES.get(name);
    if (fr === undefined) known = false;
    return fr ?? name;
  };
  let base = String(en);
  let suffix = '';
  let owner = '';
  // Un nom peut porter plusieurs suffixes (« Charizard ★ δ ») : on les retire un à un.
  for (let i = 0; i < 3; i++) {
    const withSuffix = base.match(SUFFIX);
    if (!withSuffix || !withSuffix[1]) break;
    base = withSuffix[1];
    suffix = withSuffix[2] + suffix;
  }
  for (const [prefix, fr] of OWNERS) {
    if (base.startsWith(`${prefix} `)) {
      base = base.slice(prefix.length + 1);
      owner = ` ${fr}`;
      break;
    }
  }
  const one = (part) => {
    for (const [re, format] of FORMS) {
      const m = part.match(re);
      if (m) return format(m, sp);
    }
    return sp(part);
  };
  const name = base.split(' & ').map(one).join(' et ');
  return { name: `${name}${suffix}${owner}`, known };
}

/** Nom français d'une carte à partir de son nom anglais. */
export const nameFr = (en) => translate(en).name;

/** Vrai si toutes les espèces du nom ont une traduction connue. */
export const isTranslated = (en) => translate(en).known;
